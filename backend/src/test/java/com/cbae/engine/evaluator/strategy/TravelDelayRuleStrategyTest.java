package com.cbae.engine.evaluator.strategy;

import com.cbae.engine.domain.Card;
import com.cbae.engine.domain.CardBenefit;
import com.cbae.engine.domain.Transaction;
import com.cbae.engine.domain.enums.BenefitType;
import com.cbae.engine.domain.enums.CardNetwork;
import com.cbae.engine.domain.enums.CardTier;
import com.cbae.engine.domain.enums.TransactionStatus;
import com.cbae.engine.dto.transaction.TravelMetadataDto;
import com.cbae.engine.evaluator.EligibilityEvaluationResult;
import com.cbae.engine.evaluator.TransactionContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class TravelDelayRuleStrategyTest {

    private TravelDelayRuleStrategy strategy;
    private Card testCard;
    private CardBenefit testBenefit;

    @BeforeEach
    void setUp() {
        strategy = new TravelDelayRuleStrategy();

        testCard = Card.builder()
                .cardNetwork(CardNetwork.VISA)
                .cardTier(CardTier.SAPPHIRE_RESERVE)
                .cardNumberLast4("4321")
                .build();

        testBenefit = CardBenefit.builder()
                .benefitType(BenefitType.TRAVEL_DELAY)
                .maxCoverageAmount(new BigDecimal("500.00"))
                .minDelayHours(6)
                .deductibleAmount(BigDecimal.ZERO)
                .build();
    }

    @Test
    @DisplayName("Should qualify common carrier travel delay exceeding 6 hours for weather")
    void shouldQualifyValidTravelDelay() {
        Transaction tx = Transaction.builder()
                .transactionReference("TX-TRV-01")
                .amount(new BigDecimal("450.00"))
                .merchantName("Delta Air Lines")
                .categoryClassification("AIRLINE_TRAVEL")
                .mccCode("3000")
                .transactionTimestamp(Instant.now())
                .status(TransactionStatus.SETTLED)
                .build();

        TravelMetadataDto travel = TravelMetadataDto.builder()
                .carrierName("Delta Air Lines")
                .flightNumber("DL 1492")
                .delayDurationHours(7)
                .delayReason("WEATHER")
                .departureAirport("JFK")
                .arrivalAirport("SFO")
                .build();

        TransactionContext context = TransactionContext.builder()
                .transaction(tx)
                .card(testCard)
                .travelMetadata(travel)
                .activeBenefits(List.of(testBenefit))
                .build();

        EligibilityEvaluationResult result = strategy.evaluate(context, testBenefit, null);

        assertThat(result.isEligible()).isTrue();
        assertThat(result.getPotentialClaimAmount()).isEqualByComparingTo(new BigDecimal("500.00"));
        assertThat(result.getConfidenceScore()).isEqualByComparingTo(new BigDecimal("0.9900"));
        assertThat(result.getPrefillData()).containsEntry("flightNumber", "DL 1492");
    }

    @Test
    @DisplayName("Should reject travel delay below the 6-hour minimum threshold (e.g. 3 hours)")
    void shouldRejectShortDelay() {
        Transaction tx = Transaction.builder()
                .transactionReference("TX-TRV-SHORT")
                .amount(new BigDecimal("450.00"))
                .merchantName("Delta Air Lines")
                .categoryClassification("AIRLINE_TRAVEL")
                .transactionTimestamp(Instant.now())
                .status(TransactionStatus.SETTLED)
                .build();

        TravelMetadataDto travel = TravelMetadataDto.builder()
                .carrierName("Delta Air Lines")
                .flightNumber("DL 1492")
                .delayDurationHours(3)
                .delayReason("WEATHER")
                .build();

        TransactionContext context = TransactionContext.builder()
                .transaction(tx)
                .card(testCard)
                .travelMetadata(travel)
                .activeBenefits(List.of(testBenefit))
                .build();

        EligibilityEvaluationResult result = strategy.evaluate(context, testBenefit, null);

        assertThat(result.isEligible()).isFalse();
        assertThat(result.getReasons().get(0)).contains("below required minimum threshold of 6 hours");
    }
}
