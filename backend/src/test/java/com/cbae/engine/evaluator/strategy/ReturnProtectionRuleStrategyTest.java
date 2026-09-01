package com.cbae.engine.evaluator.strategy;

import com.cbae.engine.domain.Card;
import com.cbae.engine.domain.CardBenefit;
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

class ReturnProtectionRuleStrategyTest {

    private ReturnProtectionRuleStrategy strategy;
    private Card testCard;
    private CardBenefit testBenefit;

    @BeforeEach
    void setUp() {
        strategy = new ReturnProtectionRuleStrategy(new ObjectMapper());

        testCard = Card.builder()
                .cardNetwork(CardNetwork.AMEX)
                .cardTier(CardTier.PLATINUM)
                .cardNumberLast4("8842")
                .build();

        testBenefit = CardBenefit.builder()
                .benefitType(BenefitType.RETURN_PROTECTION)
                .maxCoverageAmount(new BigDecimal("300.00"))
                .coverageWindowDays(90)
                .deductibleAmount(BigDecimal.ZERO)
                .build();
    }

    @Test
    @DisplayName("Should qualify valid retail merchandise purchase within return window")
    void shouldQualifyValidReturnPurchase() {
        Transaction tx = Transaction.builder()
                .transactionReference("TX-RET-01")
                .amount(new BigDecimal("280.00"))
                .merchantName("Zara")
                .categoryClassification("FAMILY_CLOTHING")
                .mccCode("5651")
                .transactionTimestamp(Instant.now().minus(20, ChronoUnit.DAYS))
                .status(TransactionStatus.SETTLED)
                .build();

        TransactionContext context = TransactionContext.builder()
                .transaction(tx)
                .card(testCard)
                .activeBenefits(List.of(testBenefit))
                .build();

        EligibilityEvaluationResult result = strategy.evaluate(context, testBenefit, null);

        assertThat(result.isEligible()).isTrue();
        assertThat(result.getPotentialClaimAmount()).isEqualByComparingTo(new BigDecimal("280.00"));
        assertThat(result.getConfidenceScore()).isEqualByComparingTo(new BigDecimal("0.9500"));
        assertThat(result.getRequiredEvidence()).hasSize(3);
    }

    @Test
    @DisplayName("Should cap potential claim amount at maximum per-item limit ($300.00)")
    void shouldCapClaimAmountAtMaxCoverage() {
        Transaction tx = Transaction.builder()
                .transactionReference("TX-RET-HIGH")
                .amount(new BigDecimal("450.00"))
                .merchantName("Designer Boutique")
                .categoryClassification("FAMILY_CLOTHING")
                .transactionTimestamp(Instant.now().minus(15, ChronoUnit.DAYS))
                .status(TransactionStatus.SETTLED)
                .build();

        TransactionContext context = TransactionContext.builder()
                .transaction(tx)
                .card(testCard)
                .activeBenefits(List.of(testBenefit))
                .build();

        EligibilityEvaluationResult result = strategy.evaluate(context, testBenefit, null);

        assertThat(result.isEligible()).isTrue();
        assertThat(result.getPotentialClaimAmount()).isEqualByComparingTo(new BigDecimal("300.00"));
    }

    @Test
    @DisplayName("Should reject airline/travel categories for return protection")
    void shouldRejectTravelCategories() {
        Transaction tx = Transaction.builder()
                .transactionReference("TX-FLIGHT-RET")
                .amount(new BigDecimal("300.00"))
                .merchantName("United Airlines")
                .categoryClassification("AIRLINE_TRAVEL")
                .transactionTimestamp(Instant.now().minus(10, ChronoUnit.DAYS))
                .status(TransactionStatus.SETTLED)
                .build();

        TransactionContext context = TransactionContext.builder()
                .transaction(tx)
                .card(testCard)
                .activeBenefits(List.of(testBenefit))
                .build();

        EligibilityEvaluationResult result = strategy.evaluate(context, testBenefit, null);

        assertThat(result.isEligible()).isFalse();
        assertThat(result.getReasons().get(0)).contains("Intangible services, travel");
    }
}
