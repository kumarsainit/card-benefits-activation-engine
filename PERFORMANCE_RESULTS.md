# Performance & Reliability Results — Card Benefits Activation Engine

Every number in this document comes from a command that was run on the machine described below. The raw output is
saved under [`perf/results/raw/`](perf/results/raw/), and each figure links to its evidence file. Nothing was
estimated or rounded up. If something was not measured, this document says so and explains why.

This is a portfolio project with **no real users**. Load figures are *simulated transactions in a test*.
Throughput figures are *capacity on a single laptop*, where the load generator, the app and the databases share the
same 10 cores.

Branch `perf/measured-metrics`, created from `feature/production-deployment` @ `58a4a76`. Nothing was pushed or
deployed.

---

## 1. Summary

The value column shows the **median across runs (min–max across runs)** unless it says otherwise. "Run" means a
fresh JVM and a reset perf database.

| Metric | Value (median, min–max) | Conditions | How measured | Evidence file |
|---|---|---|---|---|
| Backend tests | 55 passed, 0 failed / errored / skipped | `mvn test`, JDK 21, H2 test profile | Surefire | `raw/phase1_backend_mvn_test.log`, `raw/phase1_surefire/` |
| Backend line coverage | 83.6% (1105 / 1321 lines); branch coverage 52.5% (158 / 301) | same test run, commit `980c2ac` | JaCoCo 0.8.12 | `raw/phase1_jacoco/coverage_summary.txt` |
| Frontend unit tests | 40 / 40 passed in 23 files at Phase 1; 41 / 41 after the claim-key test was added | Vitest 2.1.9, jsdom | `npx vitest run` | `raw/phase1_vitest.log`, `raw/phase6_vitest_after_fix.log` |
| Eligibility engine time per evaluation (stubbed repositories) | 1.63–2.29 µs for eligible cases (PP 1719.5 ns, RP 1634.7 ns, TD 2285.3 ns) | JMH 1.37, 1 thread, 3 forks × 5 iterations after 5 warm-up iterations | JMH average time | `raw/phase2_jmh_engine_summary.txt` |
| Sequential ingest → opportunity, HTTP + Postgres | p50 8.71 ms (8.28–8.78), p95 13.28 ms (12.60–14.02); 0 errors | 1 virtual user, 1000 requests after 300 warm-up, 3 runs | k6 | `raw/phase2b_summary.txt`, `raw/phase2b_failure_metric_check.txt` |
| Max sustainable **ingest** rate | **800 req/s (600–800)** across 6 interleaved runs | stepped 60 s stages; errors < 1% and p95 < 500 ms | k6 constant-arrival-rate | `raw/capacity_ingest_and_sequential_sessions.txt` |
| Max sustainable **read** rate (4-endpoint dashboard mix) | before 300 req/s (300–300) → **after 800 req/s (800–800)** | interleaved A/B, 3 runs per build | k6 constant-arrival-rate | `raw/capacity_read_ab.txt` |
| `GET /opportunities` latency at a fixed 250 req/s (read mix) | p50 63.2 → **8.4 ms**; p95 74.8 → **9.6 ms** | interleaved A/B, 3 runs per build, 120 s at 250 req/s | k6, per-endpoint sub-metrics | `raw/phase4_ab_read250_per_endpoint.txt` |
| SQL statements per `GET /opportunities` (300 rows) | 154 → **2** | same dataset served by both builds | Hibernate SQL log | `raw/phase4_n1_summary.txt` |
| Kafka events lost (10,000 events; 5% injected transient failures, 0.5% malformed) | before 550 (500 valid + 50 malformed) → **after 0**, same in all 3 runs | fresh topic per run | DB row counts plus DLT contents | `raw/phase5_before_summary.txt`, `raw/phase5_after_summary.txt` |
| Kafka throughput, fault-free burst of 10,000 events | 248.23 events/s (239.19–255.06) after the fix; 250.01 (227.72–256.13) before | 1 listener thread, 3 partitions | first-to-last persist timestamp | `raw/phase5_after_summary.txt` |
| Kafka produce → opportunity created | p50 10.62 ms (10.57–10.69), p95 11.20 ms (11.11–11.23) | paced at 50 events/s for 60 s; 2,250 eligible events per run | producer send time → `benefit_opportunities.created_at` | `raw/phase5_after_summary.txt` |
| Idempotent ingest under replay | 0 new transactions, 0 new opportunities, 0 duplicate keys / refs / opportunities | 1,000 REST plus 1,000 Kafka replays of used keys, 6 runs | **DB row counts** before and after replay | `raw/report_derived_numbers.txt`, `raw/phase5_*_run*.json` |
| Claim workflow, 4 API calls (ingest → list → detail → submit) | p50 43.27 ms (43.24–44.22), p95 53.50 ms (52.75–56.74) | 1 virtual user, 99 iterations after 30 warm-up, 3 runs | k6 | `raw/phase6_after_summary.txt` |
| Claim submissions accepted | before **0 / 99** (all 400) → after **99 / 99**, in each of 3 runs | wizard request body | k6 status checks | `raw/phase6_before_summary.txt`, `raw/phase6_after_summary.txt` |
| Claim form prefill | prefills **4 of 7** fields (3 of 7 before the `benefitId` fix) | `ClaimSubmissionRequest` fields | count of fields filled from opportunity data | `raw/phase6_after_summary.txt` |
| Duplicate claims on retry (same key) | 50 of 50 opportunities duplicated → **0 of 50** | 3 runs | **`claims` table** counts | `raw/phase6_retry_before_run*_db_claims.json`, `raw/phase6_retry_after_run*_db_claims.json` |

### Not measured (and why)

- **Playwright end-to-end tests** were not run because the browser binaries are not installed
  (`raw/phase1_playwright_NOT_RUN.txt`). Install them with `cd frontend && npx playwright install chromium`.
- **Anything on Render or any other public deployment** was out of scope by rule.
- **Frontend rendering time and Web Vitals** were not part of the brief.
- **The "confidence" values (0.98 / 0.95 / 0.99)** are hard-coded constants in the strategies. They are not a model
  output, so no accuracy figure exists.
- **Time saved for a cardholder.** Prefill is reported as a field count only and is not converted to minutes.
- **Multi-instance, horizontal scaling and Redis** were not exercised.
- **Concurrent same-key requests** were not measured for either ingest or claims; see Limitations.

---

## 2. Environment

Full record: [`perf/results/ENVIRONMENT.md`](perf/results/ENVIRONMENT.md).

- **Machine:** MacBook Pro (MacBookPro18,1), Apple M1 Pro with 10 cores (8 performance + 2 efficiency), 16 GB RAM,
  macOS 27.2 (26B123).
- **Toolchain:** Oracle JDK 21.0.7, Maven 3.9.16, Node 25.5.0, k6 2.4.0.
- **Docker:** Docker Desktop, engine 29.8.0. The VM has 10 CPUs and 7.748 GiB (the defaults, left unchanged), with no
  per-container limits. Images were PostgreSQL 16.15, Kafka 3.7.0 (1 broker, 3 partitions) and Redis 7.2.
- **App:** the Spring Boot jar ran with default heap settings and the Hikari pool at its configured maximum of 10. It
  used an isolated database, `card_benefits_perf`, inside the same Postgres container.
- **Same machine:** k6, the JVM and the containers all ran on one laptop.
- **Other containers:** containers from an unrelated project were running through the ingest A/B and stopped for
  every run after that (details in ENVIRONMENT.md).

## 3. Methodology

- **Repetition:** every reported figure is the median of at least 3 runs, after a warm-up, with min–max across runs.
  Each run starts a fresh JVM against a freshly reset perf database. From the read A/B onward, row counts are saved
  before each run (`*_pre_db_counts.json`: 2 customers, 2 cards, 4 card benefits, 3 rules, 0 generated rows).
- **Load model:** k6 `constant-arrival-rate` (open model). Each stage lasts 60 s and follows a 30 s warm-up at
  25 req/s, with 10 s gaps between stages.
  - Ingest: `POST /transactions/ingest` with a unique `Idempotency-Key` per request, cycling through 4 payloads
    (electronics purchase, apparel return, delayed flight, excluded MCC).
  - Read: the **4 dashboard endpoints round-robin** (`/cards`, `/opportunities`, `/transactions`, `/claims`), which
    are the calls the dashboard makes. The dataset is 200 transactions and 300 opportunities.
- **Max sustainable rate:** the highest stage where that stage and every lower stage have **error rate < 1% and
  p95 < 500 ms**. Exploratory probe runs are kept in `raw/` for transparency but are not reported.
- **Before/after:** each change gets its own commit, and the pre-fix and post-fix jars are built from those commits.
  - For HTTP load, the two builds are **interleaved** (A, B, A, B, A, B) so that slow drift on the laptop affects both
    equally.
  - The primary latency comparison uses a **fixed rate (250 req/s)** that both builds sustain.
  - Percentages are computed from medians: (before − after) / before × 100.
- **Kafka (Phase 5):** a `@Tag("perf")` Spring Boot test against the local broker (`KafkaPipelinePerfTest`). Each run
  uses a fresh topic and consumer group. Faults come from a Mockito spy:
  - A one-time `TransientDataAccessResourceException` hits 5% of events (500).
  - 0.5% of events are malformed (25 invalid JSON + 25 with an unknown card id).
  - Outcomes are counted from Postgres rows and by reading back the dead-letter topic.
- **Idempotency and duplicates** are proved with **database row counts**, not HTTP status codes.

---

## 4. Before / after (real changes, measured under identical conditions)

| Change | Before commit | After commit | Metric | Before (median, min–max) | After (median, min–max) | Change |
|---|---|---|---|---|---|---|
| N+1 fix: `@EntityGraph` on opportunity list | `9d769bc` | `0e46318` | `GET /opportunities` p50 @ 250 req/s | 63.2 ms (54.9–63.8) | 8.4 ms (8.4–8.5) | −86.7% |
| ″ | ″ | ″ | `GET /opportunities` p95 @ 250 req/s | 74.8 ms (67.2–76.0) | 9.6 ms (9.6–11.0) | −87.2% |
| ″ | ″ | ″ | read mix p95 @ 250 req/s | 66.0 ms (59.6–67.1) | 8.9 ms (8.8–9.3) | −86.5% |
| ″ | ″ | ″ | max sustainable read rate (secondary) | 300 req/s (300–300) | 800 req/s (800–800) | 2.67× |
| ″ | ″ | ″ | SQL statements per request (300 rows) | 154 | 2 | −98.7% |
| ″ | ″ | ″ | max sustainable ingest rate (control: path unchanged) | 800 req/s (600–800) | 800 req/s (600–800) | no change |
| Kafka: retry with backoff + DLT, no swallowed exceptions | `e85dcad` | `f14cbd3` | events lost out of 10,000 | 550 (550–550) | 0 (0–0) | 550 → 0 |
| ″ | ″ | ″ | time to drain the faulty 10,000-event batch | 50.94 s (50.82–51.79) | 174.26 s (172.79–175.52) | **+242% (slower)** |
| ″ | ″ | ″ | fault-free throughput | 250.01 ev/s (227.72–256.13) | 248.23 ev/s (239.19–255.06) | within run spread |
| Opportunity DTO exposes `benefitId` | `85534bd` | `28a35b4` | claims accepted from the wizard body | 0 / 99 | 99 / 99 | bug fixed |
| ″ | ″ | ″ | claim fields prefilled from opportunity | 3 of 7 | 4 of 7 | +1 field |
| Claim `Idempotency-Key` honoured (V4 migration) + stable key in wizard | `28a35b4` | `617c2cf` | opportunities with >1 claim after a same-key retry | 50 / 50 | 0 / 50 | 50 → 0 |
| Actuator dependency added | `58a4a76` | `1fa8ef6` | `GET /actuator/health` | HTTP 500 | HTTP 200 `{"status":"UP"}` | bug fixed |

Precision: the `GET /opportunities` p50 reduction is 86.7% computed from medians. Comparing extreme runs instead
gives 84–87%, so "about 85%" is the safe phrasing.

### N+1 fix: the evidence in detail

- **How the problem was found.** Profiling (`raw/phase4_before_*`) at 400 req/s showed:
  - 189–190 of the 200 Tomcat worker threads were blocked in `HikariPool.getConnection` across 3 thread dumps.
  - All 10 connections were active, with 189 requests pending.
  - Mean connection-acquire wait was 259 ms (11,767.78 s total over 45,459 acquires) and the max was 1.213 s.

  After the fix, the same probe showed 0 pending and 0.854 s total wait over 34,124 acquires
  (`raw/phase4_*_hikari_metrics.txt`). These are single diagnostic runs, not reported results.
- **The root cause.** The SQL log shows the list query followed by one lazy `SELECT` per distinct transaction.
  `mapToDto` reads `card` and `transaction` for every row.
- **Exact statement counts** (`raw/phase4_n1_summary.txt`, from `phase4_n1_*_sql.txt`):
  - Before, **154** statements: 1 `customers` lookup by email (JWT authentication filter), 1 `benefit_opportunities`
    by customer, **150** `transactions` by id (one per distinct transaction behind the 300 opportunities) and 2
    `cards` by id.
  - After, **2** statements: the same `customers` lookup and one `benefit_opportunities JOIN cards JOIN transactions`
    query.
  - An earlier note said "153". That count started at the opportunities query and so excluded the auth lookup. 154 is
    the per-request figure.
- **Same output.** The same 300-opportunity dataset was served by both jars without a reset in between. The `data`
  arrays are identical. The full-body diff (`raw/phase4_n1_body.diff`) differs in exactly one line, the envelope
  `timestamp`, which records when the response was generated.
- **Indexes were not the problem.** `EXPLAIN ANALYZE` (`raw/phase4_before_explain_*.txt`) shows the unique indexes on
  `idempotency_key`, `transaction_reference` and `(transaction_id, benefit_type)` are already used as index scans. The
  list query executes in 0.6 ms (a sequential scan over 300 rows). No migration was added for indexes because none
  would have helped at this volume.
- **No pagination was added.** The fix returns the same data per call.
- **Re-checked after the `benefitId` change.** Reading `getBenefit().getId()` did not add a query: still 2 statements
  (`raw/phase6_benefitid_sql_summary.txt`).

### Kafka fix: evidence and cost

Baseline (`raw/phase5_before_summary.txt`): the consumer caught every exception, logged it and returned normally. The
container then committed the offset.
- All 500 events with a one-time transient failure were lost.
- All 50 malformed events disappeared without a trace: no row in Postgres and nothing in the DLT.

After `f14cbd3` (`raw/phase5_after_summary.txt`), in each of 3 runs:
- 9,450 / 9,450 normal events and **500 / 500 transient-failure events** were persisted (the latter after a retry).
- 500 injected failures were thrown.
- **50 / 50** malformed events were in `<topic>.DLT` (25 `badjson`, 25 `badcard`).
- `events_unaccounted_total = 0`.
- Opportunities matched the expected 15,000 exactly, and there were 0 duplicate references or opportunities.

The cost: the faulty batch took 3.4× longer to drain (51 s → 174 s), because a record in backoff blocks its partition.
There is a single listener thread for 3 partitions.

---

## 5. Bugs found during measurement

| # | Bug | Evidence | Before → after | Fix commit |
|---|---|---|---|---|
| 1 | **Health check path didn't exist.** `spring-boot-starter-actuator` was not a dependency, but `render.yaml` uses `healthCheckPath: /actuator/health`. The `NoResourceFoundException` was turned into a 500 by `GlobalExceptionHandler`. | `raw/phase0_actuator_before_after.txt` (both jars against the same DB) | `GET /actuator/health`: **HTTP 500** `INTERNAL_SERVER_ERROR` → **HTTP 200** `{"status":"UP"}` | `1fa8ef6` |
| 2 | **Claim submit sent `opportunity.benefitId`, a field the backend DTO didn't have.** `cardBenefitId` was therefore `undefined`, and every claim from the wizard failed validation. | `raw/phase6_before_run*.txt` (first response logged), `raw/phase6_*_summary.txt` | `POST /claims`: **400** `"Card Benefit ID is required"` for 99 / 99 → **201** for 99 / 99, in each of 3 runs | `28a35b4` |
| 3 | **The claim wizard generated a new `Idempotency-Key` on every submit attempt** (`idemp-claim-${id}-${Date.now()}` inside `handleSubmit`). The backend also ignored the header, so a retry created a duplicate claim even when the key was the same. The wizard's 409 "already submitted" message could never trigger. | `raw/phase6_retry_before_run*_db_claims.json`, `raw/phase6_wizard_key_test_on_OLD_wizard.log` | Same-key retry: **50 / 50** opportunities got 2 claims (201 + 201) → **0 / 50** (the retry returns the original claim). The new Vitest case **fails on the old wizard** (two different keys) and passes now. | `617c2cf` |
| 4 | **Kafka consumer swallowed all exceptions,** so failed events were silently committed and lost. | `raw/phase5_before_summary.txt` | 550 lost → 0 lost | `f14cbd3` |
| 5 | **N+1 queries on `GET /opportunities`.** | §4 | 154 → 2 statements | `0e46318` |

About bug 3's evidence: in the after run, the group that sends a new key per attempt still duplicates, as designed.
That group reproduces the *old* wizard, and the backend can't tell two different keys apart. The fix is the
combination of a backend that honours the key and a wizard that keeps one key per claim.

Observed but **not fixed and not measured** (noted for honesty):
- `GlobalExceptionHandler` maps unknown paths (`NoResourceFoundException`) to 500 instead of 404.
- `POST /transactions/ingest` does not check that the card belongs to the caller.
- The frontend type reads `requiredEvidenceList`, but the DTO field is `requiredEvidence`.
- The wizard UI shows a hard-coded "pre-populated 85%" text that nothing computes.

---

## 6. Limitations

- **Tests don't exercise PostgreSQL or the migrations.** Backend tests run on **H2 with Flyway disabled**
  (`ddl-auto: create-drop`). The 55 tests and the 83.6% line coverage therefore exercise neither PostgreSQL nor the
  Flyway migrations. Postgres behaviour was exercised only by the perf runs. Coverage was measured once, at `980c2ac`, and was not
  re-measured after the fixes (the suite still passes 55 / 55).
- **One laptop.** The load generator, the JVM and every container share 10 cores. Absolute numbers are a ceiling for
  this setup, not a prediction for a deployed service. The 1-minute load average logged after stepped runs ranged from about 6 to 25.
- **Ingest capacity varies between sessions.** Measured sequentially in separate sessions, the same pre-fix code
  reached a max sustainable ingest stage of **1000 req/s** (runs 1000 / 1000 / 800) in the first session, while the
  post-fix sequential session reached **600 req/s** (600 / 600 / 800). The fix doesn't touch the ingest path, so
  both builds were re-run **interleaved**, and both gave 800 req/s (600–800) (`raw/capacity_*.txt`).
  - The spread comes from session-level machine state near saturation: macOS background activity, thermal and
    scheduling state, Docker VM state, and growth of Postgres WAL and checkpoints over hundreds of thousands of rows.
  - The other project's containers were running during both of those sessions, so they don't explain the
    difference.
  - Only interleaved A/B results are used for before/after claims.
- **Small, single-customer read dataset.** 200 transactions and 300 opportunities. `/opportunities` is unpaginated,
  so its latency grows with each customer's history.
- **Kafka numbers come from one setup.** One consumer thread, a single-broker KRaft setup, and the consumer running
  inside the test JVM with a Mockito spy for fault injection. Latency uses the same JVM's wall clock on both ends.
- **Retry stalls partitions.** In-place retry blocks the partition during backoff (see the drain-time cost). A
  non-blocking retry-topic design was not measured.
- **Concurrent same-key requests were not tested.** Ingest and claim idempotency are check-then-insert. A unique
  index guarantees no duplicate row, but the losing request would get an error rather than the original response.
- **Phase 2b failure metric.** The run that looked inconsistent (`http_req_failed rate=0` next to `fails=1001`) is
  k6's `Rate` naming: `fails` counts requests that did **not** fail. All 3 reported runs had 1001 HTTP requests
  (1000 ingest + 1 login), a 0% error rate, and the 201 check passed 1000 / 1000
  (`raw/phase2b_failure_metric_check.txt`).

---

## 7. Resume bullets (each backed by evidence)

1. **Found and fixed an N+1 query** in the opportunities API, cutting it from 154 to 2 SQL statements per request.
   In an interleaved A/B load test on one laptop at a fixed 250 req/s, p95 latency fell **74.8 → 9.6 ms**, and the max
   sustainable rate of a 4-endpoint dashboard read mix rose **from 300 to 800 req/s**, with identical response data.
   *(`raw/phase4_ab_read250_per_endpoint.txt`, `raw/capacity_read_ab.txt`, `raw/phase4_n1_summary.txt`)*
2. **Made Kafka ingestion lossless under injected faults.** I replaced a catch-all consumer with bounded
   exponential-backoff retries and a dead-letter topic. Across 3 runs of 10,000 simulated events (5% transient
   failures, 0.5% malformed), lost events fell **from 550 to 0**: 500 were recovered by retry and 50 were routed to the
   DLT. *(`raw/phase5_before_summary.txt`, `raw/phase5_after_summary.txt`)*
3. **Verified idempotency with database row counts.** Replaying 1,000 used keys via REST and 1,000 via Kafka created
   **0** new rows and **0** duplicates in 6 runs. I also fixed claim submission to honour `Idempotency-Key`, so a
   retried submit created 0 duplicate claims instead of 50 out of 50.
   *(`raw/report_derived_numbers.txt`, `raw/phase6_retry_*_db_claims.json`)*
4. **Workflow testing found two other bugs:**
   - Every claim submitted from the UI was rejected (a missing DTO field): **0 / 99 → 99 / 99** accepted, and the
     form now prefills 4 of 7 fields.
   - The production health-check endpoint returned HTTP 500; it now returns 200.

   *(`raw/phase6_*_summary.txt`, `raw/phase0_actuator_before_after.txt`)*
5. **Benchmarked the eligibility engine with JMH** at 1.6–2.3 µs per evaluation (single thread). Sequential
   ingest-to-opportunity over HTTP + PostgreSQL measured **p50 8.7 ms / p95 13.3 ms**, with 55 backend tests at
   83.6% line coverage. *(`raw/phase2_jmh_engine_summary.txt`, `raw/phase2b_summary.txt`,
   `raw/phase1_jacoco/coverage_summary.txt`)*

---

## 8. Interview defense notes

**Why p95, not average?** The average hides the tail. At 400 req/s before the fix, p50 was still 553 ms while p95
was 808 ms. At 300 req/s, p50 was 3.5 ms while p95 was 64.5 ms, because one endpoint in four (`/opportunities`) was
slow (Phase 3 baseline, `raw/phase3_read_summary.txt`). The average would mix those populations. The definition of "sustainable" uses p95 < 500 ms because SLOs are
written against tail latency. I also report p99 and max in the raw files.

**How do you know the DLT doesn't lose messages?**
- The test reads back the dead-letter topic with a fresh consumer group and counts records by key suffix. All 25
  bad-JSON and 25 unknown-card events are there in every run, and none appear in Postgres.
- `events_unaccounted_total` is `published − persisted − DLT` and was 0 in every run.
- On the design side, `DeadLetterPublishingRecoverer` waits for the broker's acknowledgement. If the DLT publish
  fails, the exception propagates and the record is redelivered rather than committed.
- What I didn't test is a DLT outage during the run. I'd add that next by stopping the DLT partition leader mid-run.

**Would this hold in production?**
- Not as absolute numbers: the load generator shared the laptop with the app and the databases, and capacity moved
  between 600 and 1000 req/s across sessions on the same code.
- What does transfer is the *relative* result from interleaved A/B (an 85%+ latency drop, and 154 → 2 queries, which
  doesn't depend on hardware) and the reliability behaviour, which is logic rather than speed.
- For production I'd re-measure on deployment-shaped hardware with the load generator on a separate machine, add
  pagination, raise consumer concurrency, and consider non-blocking retry topics so one bad record doesn't stall a
  partition.

**What was the bottleneck and how did you find it?**
1. The stepped test showed reads saturating (achieved rate stuck at about 355–410 req/s) while ingest went higher.
2. Per-endpoint sub-metrics isolated `/opportunities` (p50 37.6 ms at 100 req/s against 1.8–3.5 ms for the others).
3. Thread dumps under load showed about 190 / 200 Tomcat threads waiting in `HikariPool.getConnection`, and Hikari
   metrics showed 10 / 10 active with 189 pending.
4. The SQL log showed 154 statements per request, so each request held a pooled connection for 150+ round trips.
5. `EXPLAIN ANALYZE` ruled out indexes.
6. I fixed it with an `@EntityGraph`, confirmed the response data was identical (only the envelope timestamp differs), and re-measured with
   interleaved A/B so laptop drift couldn't flatter the result. A pool-size increase was deliberately not tried at the
   same time, so the measured effect is attributable to one change.

**Likely follow-ups:**
- *Why interleave?* Because my first sequential re-run showed ingest "regressing" from 1000 to 600 req/s on a code
  path the change didn't touch, and the interleaved run showed it was drift.
- *Why is the drain slower after the fix?* Blocking in-place backoff; it's the price of not losing 5% of events.
- *Why not count 400s as the duplicate-claim proof?* Status codes say what the API answered, not what was written.
  The `claims` table is the source of truth.
