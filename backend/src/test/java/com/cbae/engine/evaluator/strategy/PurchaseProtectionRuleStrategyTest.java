package com.cbae.engine.evaluator.strategy;

import com.cbae.engine.domain.Card;
import com.cbae.engine.domain.CardBenefit;
import com.cbae.engine.domain.Customer;
import com.cbae.engine.domain.Transaction;
import com.cbae.engine.domain.enums.BenefitType;
import com.cbae.engine.domain.enums.CardNetwork;
import com.cbae.engine.domain.enums.CardTier;
import com.cbae.engine.domain.enums.TransactionStatus;
import com.cbae.engine.evaluator.EligibilityEvaluationResult;
import com.cbae.engine.evaluator.TransactionContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class PurchaseProtectionRuleStrategyTest {

    private PurchaseProtectionRuleStrategy strategy;
    private Card testCard;
    private CardBenefit testBenefit;

    @BeforeEach
    void setUp() {
        strategy = new PurchaseProtectionRuleStrategy(new ObjectMapper());

        testCard = Card.builder()
                .cardNetwork(CardNetwork.AMEX)
                .cardTier(CardTier.PLATINUM)
                .cardNumberLast4("8842")
                .build();

        testBenefit = CardBenefit.builder()
                .benefitType(BenefitType.PURCHASE_PROTECTION)
                .maxCoverageAmount(new BigDecimal("10000.00"))
                .coverageWindowDays(90)
                .deductibleAmount(BigDecimal.ZERO)
                .build();
    }

    @Test
    @DisplayName("Should qualify recent electronics purchase within coverage window")
    void shouldQualifyValidPurchase() {
        Transaction tx = Transaction.builder()
                .transactionReference("TX-LAPTOP-01")
                .amount(new BigDecimal("1499.00"))
                .merchantName("Best Buy")
                .categoryClassification("ELECTRONICS")
                .mccCode("5732")
                .transactionTimestamp(Instant.now().minus(10, ChronoUnit.DAYS))
                .status(TransactionStatus.SETTLED)
                .build();

        TransactionContext context = TransactionContext.builder()
                .transaction(tx)
                .card(testCard)
                .activeBenefits(List.of(testBenefit))
                .build();

        EligibilityEvaluationResult result = strategy.evaluate(context, testBenefit, null);

        assertThat(result.isEligible()).isTrue();
        assertThat(result.getPotentialClaimAmount()).isEqualByComparingTo(new BigDecimal("1499.00"));
        assertThat(result.getConfidenceScore()).isEqualByComparingTo(new BigDecimal("0.9800"));
        assertThat(result.getReasons()).isNotEmpty();
        assertThat(result.getPrefillData()).containsKey("merchantName");
    }

    @Test
    @DisplayName("Should reject purchase older than coverage window (e.g. 100 days ago for 90-day policy)")
    void shouldRejectExpiredPurchase() {
        Transaction tx = Transaction.builder()
                .transactionReference("TX-LAPTOP-OLD")
                .amount(new BigDecimal("1499.00"))
                .merchantName("Best Buy")
                .categoryClassification("ELECTRONICS")
                .mccCode("5732")
                .transactionTimestamp(Instant.now().minus(100, ChronoUnit.DAYS))
                .status(TransactionStatus.SETTLED)
                .build();

        TransactionContext context = TransactionContext.builder()
                .transaction(tx)
                .card(testCard)
                .activeBenefits(List.of(testBenefit))
                .build();

        EligibilityEvaluationResult result = strategy.evaluate(context, testBenefit, null);

        assertThat(result.isEligible()).isFalse();
        assertThat(result.getReasons().get(0)).contains("exceeds the 90-day protection window");
    }

    @Test
    @DisplayName("Should reject ineligible MCC (e.g. 5511 motor vehicles)")
    void shouldRejectIneligibleMcc() {
        Transaction tx = Transaction.builder()
                .transactionReference("TX-CAR-01")
                .amount(new BigDecimal("4500.00"))
                .merchantName("Car Dealership")
                .categoryClassification("AUTOMOTIVE")
                .mccCode("5511")
                .transactionTimestamp(Instant.now().minus(5, ChronoUnit.DAYS))
                .status(TransactionStatus.SETTLED)
                .build();

        TransactionContext context = TransactionContext.builder()
                .transaction(tx)
                .card(testCard)
                .activeBenefits(List.of(testBenefit))
                .build();

        EligibilityEvaluationResult result = strategy.evaluate(context, testBenefit, null);

        assertThat(result.isEligible()).isFalse();
        assertThat(result.getReasons().get(0)).contains("excluded from Purchase Protection");
    }
}
