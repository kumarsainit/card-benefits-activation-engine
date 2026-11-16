package com.cbae.engine.perf;

import com.cbae.engine.service.TransactionNormalizerService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.clients.admin.AdminClientConfig;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.admin.OffsetSpec;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.clients.consumer.OffsetAndMetadata;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.dao.TransientDataAccessResourceException;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicInteger;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;

/**
 * Phase 5: Kafka pipeline reliability, idempotency, throughput and latency.
 * Requires the docker-compose Kafka (localhost:9092) and Postgres with the isolated card_benefits_perf database.
 * Excluded from the normal build (@Tag("perf")); run via perf/scripts/phase5.sh.
 *
 * Each run uses a brand-new topic and consumer group, so runs do not see each other's records.
 */
@Tag("perf")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class KafkaPipelinePerfTest {

    static final String RUN = Long.toString(System.currentTimeMillis(), 36);
    static final String TOPIC = "perf.transactions.incoming." + RUN;
    static final String DLT = TOPIC + ".DLT";
    static final String GROUP = "perf-group-" + RUN;
    static final String BOOTSTRAP = "localhost:9092";
    static final String CARD_PLATINUM = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    static final String CARD_SAPPHIRE = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", () -> "jdbc:postgresql://localhost:5432/card_benefits_perf");
        r.add("spring.kafka.bootstrap-servers", () -> BOOTSTRAP);
        r.add("spring.kafka.consumer.group-id", () -> GROUP);
        r.add("app.kafka.enabled", () -> "true");
        r.add("app.kafka.topics.transactions-incoming", () -> TOPIC);
        createTopics();
    }

    @Autowired JdbcTemplate jdbc;
    @Autowired ObjectMapper mapper;
    @Autowired TestRestTemplate rest;
    @LocalServerPort int port;
    @SpyBean TransactionNormalizerService normalizer;

    /** Merchant names that must fail exactly once (first attempt) with a transient exception. */
    final Set<String> failOnce = ConcurrentHashMap.newKeySet();
    final AtomicInteger injectedFailures = new AtomicInteger();

    @Test
    void pipelineReliabilityIdempotencyThroughputLatency() throws Exception {
        String label = System.getProperty("perf.label", "adhoc");
        Path out = Path.of(System.getProperty("perf.out", "../perf/results/raw"));
        resetDb();

        doAnswer(inv -> {
            String name = inv.getArgument(0);
            if (name != null && failOnce.remove(name)) {
                injectedFailures.incrementAndGet();
                throw new TransientDataAccessResourceException("injected transient failure for " + name);
            }
            return inv.callRealMethod();
        }).when(normalizer).normalizeMerchantName(anyString());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("label", label);
        result.put("run_id", RUN);
        result.put("topic", TOPIC);
        result.put("reliability", reliability(10_000));
        result.put("throughput", throughput(10_000));
        result.put("latency", latency(50, 60));
        result.put("idempotency", idempotency(1_000));
        result.put("final_db", dbCounts("%"));

        Files.createDirectories(out);
        Path file = out.resolve(label + ".json");
        Files.writeString(file, mapper.writerWithDefaultPrettyPrinter().writeValueAsString(result));
        System.out.println("PERF RESULT written to " + file.toAbsolutePath());
    }

    // ------------------------------------------------------------------ reliability
    Map<String, Object> reliability(int n) throws Exception {
        String p = "REL-" + RUN + "-";
        int transient_ = 0, badJson = 0, badCard = 0, ok = 0;
        List<ProducerRecord<String, String>> records = new ArrayList<>(n);
        for (int i = 0; i < n; i++) {
            String key = "rel-" + RUN + "-" + i;
            if (i % 200 == 7) { // 0.5% malformed: alternate invalid JSON / unknown card id
                if ((i / 200) % 2 == 0) { badJson++; records.add(new ProducerRecord<>(TOPIC, key + "-badjson", "{\"cardId\": not-json")); }
                else { badCard++; records.add(new ProducerRecord<>(TOPIC, key + "-badcard",
                        payload(i, p + "badcard-" + i, UUID.randomUUID().toString(), null))); }
            } else if (i % 20 == 0) { // 5% transient failure once
                transient_++;
                String merchant = "BEST BUY TRANSIENT-" + RUN + "-" + i;
                failOnce.add(merchant);
                records.add(new ProducerRecord<>(TOPIC, key + "-transient", payload(i, p + "transient-" + i, null, merchant)));
            } else {
                ok++;
                records.add(new ProducerRecord<>(TOPIC, key + "-ok", payload(i, p + "ok-" + i, null, null)));
            }
        }
        long t0 = System.nanoTime();
        send(records);
        long drainMs = awaitDrained(Duration.ofMinutes(20));
        double wallS = (System.nanoTime() - t0) / 1e9;

        Map<String, Integer> dlt = readDlt();
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("published", n);
        m.put("published_ok", ok);
        m.put("published_transient_fail_once", transient_);
        m.put("published_malformed_invalid_json", badJson);
        m.put("published_malformed_unknown_card", badCard);
        long persistedOk = count("select count(*) from transactions where transaction_reference like ?", p + "ok-%");
        long persistedTransient = count("select count(*) from transactions where transaction_reference like ?", p + "transient-%");
        long persistedBadCard = count("select count(*) from transactions where transaction_reference like ?", p + "badcard-%");
        m.put("persisted_ok", persistedOk);
        m.put("persisted_transient_recovered", persistedTransient);
        m.put("persisted_unknown_card", persistedBadCard);
        m.put("injected_transient_failures_thrown", injectedFailures.get());
        m.put("dlt_records_total", dlt.values().stream().mapToInt(Integer::intValue).sum());
        m.put("dlt_records_by_kind", dlt);
        long validPublished = ok + transient_;
        long validPersisted = persistedOk + persistedTransient;
        long malformedAccounted = dlt.getOrDefault("badjson", 0) + dlt.getOrDefault("badcard", 0);
        m.put("valid_events_lost", validPublished - validPersisted);
        m.put("malformed_events_lost_without_trace", (badJson + badCard) - malformedAccounted);
        m.put("events_unaccounted_total", n - validPersisted - dlt.values().stream().mapToInt(Integer::intValue).sum());
        m.put("db", dbCounts(p + "%"));
        m.put("expected_opportunities_for_persisted", expectedOpps(p));
        m.put("wall_clock_seconds_publish_to_drained", round(wallS));
        m.put("drain_detect_ms", drainMs);
        return m;
    }

    // ------------------------------------------------------------------ throughput (burst, no injected faults)
    Map<String, Object> throughput(int n) throws Exception {
        String p = "THR-" + RUN + "-";
        List<ProducerRecord<String, String>> records = new ArrayList<>(n);
        for (int i = 0; i < n; i++) records.add(new ProducerRecord<>(TOPIC, "thr-" + RUN + "-" + i, payload(i, p + i, null, null)));
        long t0 = System.nanoTime();
        send(records);
        awaitDrained(Duration.ofMinutes(20));
        double wallS = (System.nanoTime() - t0) / 1e9;
        Map<String, Object> span = jdbc.queryForMap(
                "select count(*) c, extract(epoch from (max(created_at) - min(created_at))) s from transactions where transaction_reference like ?", p + "%");
        long c = ((Number) span.get("c")).longValue();
        double s = ((Number) span.get("s")).doubleValue();
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("published", n);
        m.put("persisted", c);
        m.put("first_to_last_persist_seconds", round(s));
        m.put("events_per_second_first_to_last_persist", round(c / s));
        m.put("events_per_second_publish_to_drained_wall_clock", round(c / wallS));
        m.put("db", dbCounts(p + "%"));
        return m;
    }

    // ------------------------------------------------------------------ latency (paced, below capacity)
    Map<String, Object> latency(int perSecond, int seconds) throws Exception {
        String p = "LAT-" + RUN + "-";
        Map<String, Long> sentAtMs = new HashMap<>();
        try (KafkaProducer<String, String> prod = producer()) {
            int total = perSecond * seconds;
            long start = System.nanoTime();
            for (int i = 0; i < total; i++) {
                long due = start + (long) (i * (1e9 / perSecond));
                while (System.nanoTime() < due) Thread.onSpinWait();
                String ref = p + i;
                long now = System.currentTimeMillis();
                sentAtMs.put(ref, now);
                prod.send(new ProducerRecord<>(TOPIC, null, now, "lat-" + RUN + "-" + i, payload(i, ref, null, null)));
            }
            prod.flush();
        }
        awaitDrained(Duration.ofMinutes(10));
        List<Map<String, Object>> rows = jdbc.queryForList(
                "select t.transaction_reference ref, extract(epoch from min(o.created_at)) * 1000 opp_ms " +
                "from transactions t join benefit_opportunities o on o.transaction_id = t.id " +
                "where t.transaction_reference like ? group by t.transaction_reference", p + "%");
        List<Double> lat = new ArrayList<>();
        for (Map<String, Object> r : rows) lat.add(((Number) r.get("opp_ms")).doubleValue() - sentAtMs.get((String) r.get("ref")));
        Collections.sort(lat);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("rate_per_second", perSecond);
        m.put("duration_seconds", seconds);
        m.put("published", perSecond * seconds);
        m.put("eligible_events_measured", lat.size());
        m.put("p50_ms", round(pct(lat, 50)));
        m.put("p95_ms", round(pct(lat, 95)));
        m.put("p99_ms", round(pct(lat, 99)));
        m.put("max_ms", round(lat.get(lat.size() - 1)));
        m.put("note", "producer send time (wall clock) -> earliest benefit_opportunities.created_at for that transaction (set by Hibernate at insert, same JVM clock)");
        return m;
    }

    // ------------------------------------------------------------------ idempotency (replay 1000 used keys via REST and Kafka)
    Map<String, Object> idempotency(int n) throws Exception {
        String p = "THR-" + RUN + "-"; // replay events already persisted by the throughput step
        Map<String, Object> before = dbCounts("%");
        String token = login();
        int rest2xx = 0, restOther = 0;
        for (int i = 0; i < n; i++) {
            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.APPLICATION_JSON);
            h.setBearerAuth(token);
            h.set("Idempotency-Key", "thr-" + RUN + "-" + i);
            ResponseEntity<String> r = rest.exchange("http://localhost:" + port + "/api/v1/transactions/ingest",
                    HttpMethod.POST, new HttpEntity<>(payload(i, p + i, null, null), h), String.class);
            if (r.getStatusCode().is2xxSuccessful()) rest2xx++; else restOther++;
        }
        Map<String, Object> afterRest = dbCounts("%");
        List<ProducerRecord<String, String>> records = new ArrayList<>(n);
        for (int i = 0; i < n; i++) records.add(new ProducerRecord<>(TOPIC, "thr-" + RUN + "-" + i, payload(i, p + i, null, null)));
        send(records);
        awaitDrained(Duration.ofMinutes(10));
        Map<String, Object> afterKafka = dbCounts("%");
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("replayed_via_rest", n);
        m.put("rest_2xx", rest2xx);
        m.put("rest_non_2xx", restOther);
        m.put("replayed_via_kafka", n);
        m.put("db_before", before);
        m.put("db_after_rest_replay", afterRest);
        m.put("db_after_kafka_replay", afterKafka);
        m.put("new_transactions_created", ((Number) afterKafka.get("transactions")).longValue() - ((Number) before.get("transactions")).longValue());
        m.put("new_opportunities_created", ((Number) afterKafka.get("opportunities")).longValue() - ((Number) before.get("opportunities")).longValue());
        return m;
    }

    // ------------------------------------------------------------------ helpers
    String payload(int i, String ref, String cardOverride, String merchantOverride) throws Exception {
        Map<String, Object> b = new LinkedHashMap<>();
        Instant now = Instant.now();
        switch (i % 4) {
            case 0 -> { b.put("cardId", CARD_PLATINUM); b.put("amount", 1499.00); b.put("merchantName", "BEST BUY #1024 SAN FRANCISCO CA");
                        b.put("mccCode", "5732"); b.put("transactionTimestamp", now.minus(5, ChronoUnit.DAYS).toString()); }
            case 1 -> { b.put("cardId", CARD_PLATINUM); b.put("amount", 280.00); b.put("merchantName", "ZARA BOUTIQUE #44 NEW YORK NY");
                        b.put("mccCode", "5651"); b.put("transactionTimestamp", now.minus(20, ChronoUnit.DAYS).toString()); }
            case 2 -> { b.put("cardId", CARD_SAPPHIRE); b.put("amount", 450.00); b.put("merchantName", "DELTA AIR 0062341234 ATLANTA GA");
                        b.put("mccCode", "3000"); b.put("transactionTimestamp", now.minus(2, ChronoUnit.DAYS).toString());
                        b.put("travelMetadataJson", "{\"carrierName\":\"Delta Air Lines\",\"flightNumber\":\"DL 1492\",\"delayDurationHours\":7,\"delayReason\":\"WEATHER\"}"); }
            default -> { b.put("cardId", CARD_SAPPHIRE); b.put("amount", 900.00); b.put("merchantName", "CASH WITHDRAWAL 4471");
                         b.put("mccCode", "6011"); b.put("transactionTimestamp", now.minus(3, ChronoUnit.DAYS).toString()); }
        }
        if (cardOverride != null) b.put("cardId", cardOverride);
        if (merchantOverride != null) b.put("merchantName", merchantOverride);
        b.put("transactionReference", ref);
        b.put("currency", "USD");
        return mapper.writeValueAsString(b);
    }

    /** Opportunities the engine must create for the persisted transactions under a prefix (2 per eligible scenario). */
    long expectedOpps(String prefix) {
        return 2 * count("select count(*) from transactions where transaction_reference like ? and mcc_code <> '6011'", prefix + "%");
    }

    static void createTopics() {
        try (AdminClient admin = AdminClient.create(Map.of(AdminClientConfig.BOOTSTRAP_SERVERS_CONFIG, BOOTSTRAP))) {
            admin.createTopics(List.of(new NewTopic(TOPIC, 3, (short) 1), new NewTopic(DLT, 3, (short) 1))).all().get();
        } catch (Exception e) {
            throw new IllegalStateException("could not create perf topics", e);
        }
    }

    KafkaProducer<String, String> producer() {
        return new KafkaProducer<>(Map.of(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, BOOTSTRAP,
                ProducerConfig.ACKS_CONFIG, "all", ProducerConfig.LINGER_MS_CONFIG, 5,
                ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class,
                ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class));
    }

    void send(List<ProducerRecord<String, String>> records) throws Exception {
        try (KafkaProducer<String, String> prod = producer()) {
            List<Future<?>> fs = new ArrayList<>(records.size());
            for (ProducerRecord<String, String> r : records) fs.add(prod.send(r));
            for (Future<?> f : fs) f.get(); // every record acknowledged by the broker
        }
    }

    /** Wait until the consumer group's committed offsets equal the topic end offsets, stable for 3 s. */
    long awaitDrained(Duration timeout) throws Exception {
        long start = System.currentTimeMillis();
        long stableSince = -1;
        try (AdminClient admin = AdminClient.create(Map.of(AdminClientConfig.BOOTSTRAP_SERVERS_CONFIG, BOOTSTRAP))) {
            while (System.currentTimeMillis() - start < timeout.toMillis()) {
                Map<TopicPartition, OffsetAndMetadata> committed = admin.listConsumerGroupOffsets(GROUP).partitionsToOffsetAndMetadata().get();
                Map<TopicPartition, OffsetSpec> req = new HashMap<>();
                for (int p = 0; p < 3; p++) req.put(new TopicPartition(TOPIC, p), OffsetSpec.latest());
                var ends = admin.listOffsets(req).all().get();
                long lag = 0;
                for (var e : ends.entrySet()) {
                    OffsetAndMetadata c = committed.get(e.getKey());
                    lag += e.getValue().offset() - (c == null ? 0 : c.offset());
                }
                if (lag == 0) {
                    if (stableSince < 0) stableSince = System.currentTimeMillis();
                    if (System.currentTimeMillis() - stableSince >= 3000) return System.currentTimeMillis() - start;
                } else stableSince = -1;
                Thread.sleep(200);
            }
        }
        throw new IllegalStateException("consumer did not drain within " + timeout);
    }

    Map<String, Integer> readDlt() {
        Map<String, Integer> kinds = new TreeMap<>();
        try (KafkaConsumer<String, String> c = new KafkaConsumer<>(Map.of(
                ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, BOOTSTRAP, ConsumerConfig.GROUP_ID_CONFIG, "perf-dlt-reader-" + UUID.randomUUID(),
                ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest", ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false,
                ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class,
                ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class))) {
            c.subscribe(List.of(DLT));
            long idleSince = System.currentTimeMillis();
            while (System.currentTimeMillis() - idleSince < 8000) {
                var recs = c.poll(Duration.ofMillis(500));
                for (ConsumerRecord<String, String> r : recs) {
                    String k = r.key() == null ? "null" : r.key().substring(r.key().lastIndexOf('-') + 1);
                    kinds.merge(k, 1, Integer::sum);
                    idleSince = System.currentTimeMillis();
                }
            }
        }
        return kinds;
    }

    Map<String, Object> dbCounts(String refLike) {
        return jdbc.queryForMap("""
            select (select count(*) from transactions where transaction_reference like ?) transactions,
                   (select count(*) from transaction_events e join transactions t on t.id = e.transaction_id where t.transaction_reference like ?) transaction_events,
                   (select count(*) from benefit_opportunities o join transactions t on t.id = o.transaction_id where t.transaction_reference like ?) opportunities,
                   (select count(*) from (select transaction_reference from transactions where transaction_reference like ? group by 1 having count(*) > 1) d) dup_transaction_refs,
                   (select count(*) from (select idempotency_key from transaction_events group by 1 having count(*) > 1) d) dup_idempotency_keys,
                   (select count(*) from (select transaction_id, benefit_type from benefit_opportunities group by 1, 2 having count(*) > 1) d) dup_opportunities
            """, refLike, refLike, refLike, refLike);
    }

    long count(String sql, Object... args) { return jdbc.queryForObject(sql, Long.class, args); }

    void resetDb() {
        String db = jdbc.queryForObject("select current_database()", String.class);
        if (!"card_benefits_perf".equals(db)) throw new IllegalStateException("refusing to reset " + db);
        jdbc.execute("TRUNCATE claim_evidences, claims, benefit_opportunities, transaction_events, transactions, notifications, audit_events");
    }

    String login() throws Exception {
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        ResponseEntity<String> r = rest.postForEntity("http://localhost:" + port + "/api/v1/auth/login",
                new HttpEntity<>("{\"email\":\"customer@example.com\",\"password\":\"Password123!\"}", h), String.class);
        var data = mapper.readTree(r.getBody()).get("data");
        return data.has("accessToken") ? data.get("accessToken").asText() : data.get("token").asText();
    }

    static double pct(List<Double> sorted, double p) {
        int idx = (int) Math.ceil(p / 100.0 * sorted.size()) - 1;
        return sorted.get(Math.max(0, Math.min(idx, sorted.size() - 1)));
    }

    static double round(double v) { return Math.round(v * 100.0) / 100.0; }
}
