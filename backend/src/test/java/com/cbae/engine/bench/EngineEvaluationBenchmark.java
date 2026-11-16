package com.cbae.engine.bench;

import com.cbae.engine.domain.*;
import com.cbae.engine.domain.enums.*;
import com.cbae.engine.dto.transaction.TravelMetadataDto;
import com.cbae.engine.evaluator.ConfigurableBenefitEligibilityEngine;
import com.cbae.engine.evaluator.EligibilityEvaluationResult;
import com.cbae.engine.evaluator.TransactionContext;
import com.cbae.engine.evaluator.strategy.BenefitRuleStrategy;
import com.cbae.engine.evaluator.strategy.PurchaseProtectionRuleStrategy;
import com.cbae.engine.evaluator.strategy.ReturnProtectionRuleStrategy;
import com.cbae.engine.evaluator.strategy.TravelDelayRuleStrategy;
import com.cbae.engine.repository.*;
import com.cbae.engine.service.AuditService;
import com.cbae.engine.service.NotificationService;
import com.cbae.engine.service.TransactionNormalizerService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;
import org.openjdk.jmh.annotations.*;
import org.slf4j.LoggerFactory;

import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.function.BiFunction;

/**
 * Phase 2 microbenchmark: time spent in benefit rule evaluation per transaction, with NO database.
 *
 * Two levels are measured for each scenario:
 *  - strategy_*: only BenefitRuleStrategy.evaluate() (pure rule logic).
 *  - engine_*:   ConfigurableBenefitEligibilityEngine.evaluateTransaction() — rule lookup, travel-metadata parsing,
 *                rule evaluation, JSON serialization of reasons/evidence/prefill, entity building, notification and
 *                audit object creation. Repositories are replaced by in-memory java.lang.reflect.Proxy stubs
 *                (constant return values, no I/O), so only application CPU work is timed.
 *
 * Logging is set to OFF so console I/O is not measured. Single-threaded.
 */
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.NANOSECONDS)
@Warmup(iterations = 5, time = 1)
@Measurement(iterations = 5, time = 1)
@Fork(value = 3, jvmArgsAppend = {"-Xms1g", "-Xmx1g"})
@State(Scope.Thread)
public class EngineEvaluationBenchmark {

    private final ObjectMapper mapper = JsonMapper.builder().findAndAddModules().build();

    private PurchaseProtectionRuleStrategy purchase;
    private ReturnProtectionRuleStrategy returns;
    private TravelDelayRuleStrategy travel;

    private CardBenefit ppBenefit, rpBenefit, tdBenefit;
    private TransactionContext ctxPurchase, ctxReturn, ctxTravel, ctxExcludedMcc;

    private ConfigurableBenefitEligibilityEngine enginePP, engineRP, engineTD;
    private Transaction txPurchase, txReturn, txTravel, txExcludedMcc;

    @Setup(Level.Trial)
    public void setUp() throws Exception {
        ((ch.qos.logback.classic.Logger) LoggerFactory.getLogger(org.slf4j.Logger.ROOT_LOGGER_NAME)).setLevel(ch.qos.logback.classic.Level.OFF);

        purchase = new PurchaseProtectionRuleStrategy(mapper);
        returns = new ReturnProtectionRuleStrategy(mapper);
        travel = new TravelDelayRuleStrategy();

        Customer customer = Customer.builder().id(UUID.randomUUID()).email("bench@example.com")
                .fullName("Bench").passwordHash("x").role(UserRole.ROLE_CUSTOMER).build();
        Card card = Card.builder().id(UUID.randomUUID()).customer(customer).cardNumberLast4("8842")
                .cardNetwork(CardNetwork.AMEX).cardTier(CardTier.PLATINUM).cardholderName("Bench")
                .expiryMonth(11).expiryYear(2028).status(CardStatus.ACTIVE).build();

        // Same coverage values as V2 seed data.
        ppBenefit = benefit(card, BenefitType.PURCHASE_PROTECTION, "10000.00", 90, null);
        rpBenefit = benefit(card, BenefitType.RETURN_PROTECTION, "300.00", 90, null);
        tdBenefit = benefit(card, BenefitType.TRAVEL_DELAY, "500.00", null, 6);

        String travelJson = "{\"carrierName\":\"Delta Air Lines\",\"carrierCode\":\"DL\",\"flightNumber\":\"DL 1492\","
                + "\"departureAirport\":\"JFK\",\"arrivalAirport\":\"SFO\",\"delayDurationHours\":7,\"delayReason\":\"WEATHER\"}";

        txPurchase = tx(card, "1499.00", "Best Buy", "5732", "ELECTRONICS", 5, null);
        txReturn = tx(card, "280.00", "Zara", "5651", "FAMILY_CLOTHING", 20, null);
        txTravel = tx(card, "450.00", "Delta Air Lines", "3000", "AIRLINE_TRAVEL", 2, travelJson);
        txExcludedMcc = tx(card, "900.00", "Atm Withdrawal", "6011", "GENERAL_RETAIL", 3, null);

        TravelMetadataDto travelMeta = mapper.readValue(travelJson, TravelMetadataDto.class);
        ctxPurchase = ctx(txPurchase, card, customer, ppBenefit, null);
        ctxReturn = ctx(txReturn, card, customer, rpBenefit, null);
        ctxTravel = ctx(txTravel, card, customer, tdBenefit, travelMeta);
        ctxExcludedMcc = ctx(txExcludedMcc, card, customer, ppBenefit, null);

        enginePP = engine(ppBenefit);
        engineRP = engine(rpBenefit);
        engineTD = engine(tdBenefit);

        // Sanity: scenarios must produce the expected eligibility, otherwise the benchmark is meaningless.
        check(purchase.evaluate(ctxPurchase, ppBenefit, null).isEligible(), "PP eligible");
        check(returns.evaluate(ctxReturn, rpBenefit, null).isEligible(), "RP eligible");
        check(travel.evaluate(ctxTravel, tdBenefit, null).isEligible(), "TD eligible");
        check(!purchase.evaluate(ctxExcludedMcc, ppBenefit, null).isEligible(), "PP excluded MCC ineligible");
        check(enginePP.evaluateTransaction(txPurchase).size() == 1, "engine PP 1 opp");
        check(engineRP.evaluateTransaction(txReturn).size() == 1, "engine RP 1 opp");
        check(engineTD.evaluateTransaction(txTravel).size() == 1, "engine TD 1 opp");
        check(enginePP.evaluateTransaction(txExcludedMcc).isEmpty(), "engine excluded MCC 0 opp");
    }

    // ---------- strategy only ----------
    @Benchmark public EligibilityEvaluationResult strategy_purchaseProtection_eligible() { return purchase.evaluate(ctxPurchase, ppBenefit, null); }
    @Benchmark public EligibilityEvaluationResult strategy_returnProtection_eligible() { return returns.evaluate(ctxReturn, rpBenefit, null); }
    @Benchmark public EligibilityEvaluationResult strategy_travelDelay_eligible() { return travel.evaluate(ctxTravel, tdBenefit, null); }
    @Benchmark public EligibilityEvaluationResult strategy_purchaseProtection_ineligibleExcludedMcc() { return purchase.evaluate(ctxExcludedMcc, ppBenefit, null); }

    // ---------- full engine, repositories stubbed in memory ----------
    @Benchmark public List<BenefitOpportunity> engine_purchaseProtection_eligible() { return enginePP.evaluateTransaction(txPurchase); }
    @Benchmark public List<BenefitOpportunity> engine_returnProtection_eligible() { return engineRP.evaluateTransaction(txReturn); }
    @Benchmark public List<BenefitOpportunity> engine_travelDelay_eligible() { return engineTD.evaluateTransaction(txTravel); }
    @Benchmark public List<BenefitOpportunity> engine_purchaseProtection_ineligibleExcludedMcc() { return enginePP.evaluateTransaction(txExcludedMcc); }

    // ---------- helpers ----------
    private ConfigurableBenefitEligibilityEngine engine(CardBenefit onlyBenefit) {
        List<BenefitRuleStrategy> strategies = List.of(purchase, returns, travel);
        BenefitRule rule = BenefitRule.builder().id(UUID.randomUUID()).benefitType(onlyBenefit.getBenefitType())
                .ruleCode("R").ruleName("R").parametersJson("{}").isActive(true).priority(10).build();

        CardBenefitRepository cardBenefitRepo = stub(CardBenefitRepository.class, (m, a) ->
                m.equals("findByCardIdAndStatus") ? List.of(onlyBenefit) : null);
        BenefitRuleRepository ruleRepo = stub(BenefitRuleRepository.class, (m, a) ->
                m.equals("findByBenefitTypeAndIsActiveOrderByPriorityAsc") ? List.of(rule) : null);
        BenefitOpportunityRepository oppRepo = stub(BenefitOpportunityRepository.class, (m, a) -> switch (m) {
            case "existsByTransactionIdAndBenefitType" -> false;
            case "save" -> { BenefitOpportunity o = (BenefitOpportunity) a[0]; o.setId(UUID.randomUUID()); yield o; }
            default -> null;
        });
        ClaimRepository claimRepo = stub(ClaimRepository.class, (m, a) -> null);
        NotificationRepository notifRepo = stub(NotificationRepository.class, (m, a) -> m.equals("save") ? a[0] : null);
        AuditEventRepository auditRepo = stub(AuditEventRepository.class, (m, a) -> m.equals("save") ? a[0] : null);

        return new ConfigurableBenefitEligibilityEngine(strategies, ruleRepo, oppRepo, cardBenefitRepo, claimRepo,
                new TransactionNormalizerService(mapper), new NotificationService(notifRepo),
                new AuditService(auditRepo), mapper);
    }

    @SuppressWarnings("unchecked")
    private static <T> T stub(Class<T> type, BiFunction<String, Object[], Object> impl) {
        return (T) Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[]{type}, (proxy, method, args) -> {
            switch (method.getName()) {
                case "toString": return "stub:" + type.getSimpleName();
                case "hashCode": return System.identityHashCode(proxy);
                case "equals": return proxy == args[0];
                default: return impl.apply(method.getName(), args);
            }
        });
    }

    private static CardBenefit benefit(Card card, BenefitType type, String max, Integer windowDays, Integer minDelay) {
        return CardBenefit.builder().id(UUID.randomUUID()).card(card).benefitType(type)
                .maxCoverageAmount(new BigDecimal(max)).annualMaxLimit(new BigDecimal("50000.00"))
                .coverageWindowDays(windowDays).minDelayHours(minDelay).status(CardStatus.ACTIVE).build();
    }

    private static Transaction tx(Card card, String amount, String merchant, String mcc, String category,
                                  int daysAgo, String travelJson) {
        return Transaction.builder().id(UUID.randomUUID()).card(card).transactionReference("BENCH-" + mcc)
                .amount(new BigDecimal(amount)).currency("USD").merchantName(merchant).mccCode(mcc)
                .categoryClassification(category).transactionTimestamp(Instant.now().minus(daysAgo, ChronoUnit.DAYS))
                .status(TransactionStatus.SETTLED).travelMetadataJson(travelJson).build();
    }

    private static TransactionContext ctx(Transaction t, Card c, Customer cu, CardBenefit b, TravelMetadataDto tm) {
        return TransactionContext.builder().transaction(t).card(c).customer(cu).activeBenefits(List.of(b))
                .travelMetadata(tm).previousClaimsCount(0L).build();
    }

    private static void check(boolean ok, String what) {
        if (!ok) throw new IllegalStateException("Benchmark scenario sanity check failed: " + what);
    }
}
