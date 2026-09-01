package com.cbae.engine.evaluator.strategy;

import com.cbae.engine.domain.BenefitRule;
import com.cbae.engine.domain.CardBenefit;
import com.cbae.engine.domain.Transaction;
import com.cbae.engine.domain.enums.BenefitType;
import com.cbae.engine.domain.enums.TransactionStatus;
import com.cbae.engine.dto.transaction.TravelMetadataDto;
import com.cbae.engine.evaluator.EligibilityEvaluationResult;
import com.cbae.engine.evaluator.TransactionContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class TravelDelayRuleStrategy implements BenefitRuleStrategy {

    private static final Set<String> COVERED_HAZARDS = Set.of(
            "WEATHER",
            "MECHANICAL_EQUIPMENT_FAILURE",
            "AIR_TRAFFIC_CONTROL",
            "STRIKE",
            "CARRIER_OPERATION_DISRUPTION"
    );

    @Override
    public BenefitType getSupportedBenefitType() {
        return BenefitType.TRAVEL_DELAY;
    }

    @Override
    public EligibilityEvaluationResult evaluate(TransactionContext context, CardBenefit benefit, BenefitRule rule) {
        Transaction tx = context.getTransaction();
        TravelMetadataDto travel = context.getTravelMetadata();

        // 1. Transaction Status Check
        if (tx.getStatus() != TransactionStatus.SETTLED) {
            return EligibilityEvaluationResult.notEligible(
                    BenefitType.TRAVEL_DELAY,
                    "Transaction is not in SETTLED status"
            );
        }

        // 2. Common carrier travel category check
        boolean isTravelCategory = "AIRLINE_TRAVEL".equalsIgnoreCase(tx.getCategoryClassification())
                || "RAIL_PASSENGER".equalsIgnoreCase(tx.getCategoryClassification());
        if (!isTravelCategory && travel == null) {
            return EligibilityEvaluationResult.notEligible(
                    BenefitType.TRAVEL_DELAY,
                    "Transaction is not a common carrier travel purchase"
            );
        }

        // 3. Minimum delay threshold check (e.g. >= 6 hours)
        int minDelayHours = benefit.getMinDelayHours() != null ? benefit.getMinDelayHours() : 6;
        int actualDelayHours = travel != null && travel.getDelayDurationHours() != null ? travel.getDelayDurationHours() : 0;

        if (actualDelayHours < minDelayHours) {
            return EligibilityEvaluationResult.notEligible(
                    BenefitType.TRAVEL_DELAY,
                    "Delay duration of " + actualDelayHours + " hours is below required minimum threshold of " + minDelayHours + " hours"
            );
        }

        // 4. Covered Hazard Check
        String delayReason = travel != null && travel.getDelayReason() != null ? travel.getDelayReason().toUpperCase() : "WEATHER";
        if (!COVERED_HAZARDS.contains(delayReason)) {
            return EligibilityEvaluationResult.notEligible(
                    BenefitType.TRAVEL_DELAY,
                    "Delay reason '" + delayReason + "' is not a covered hazard under policy terms"
            );
        }

        // 5. Max coverage calculation ($500.00 max reimbursement for meals, hotel, transport)
        BigDecimal maxCoverage = benefit.getMaxCoverageAmount() != null ? benefit.getMaxCoverageAmount() : new BigDecimal("500.00");

        // 6. Reasons
        List<String> reasons = new ArrayList<>();
        reasons.add("Common carrier ticket (" + (travel != null ? travel.getFlightNumber() : tx.getMerchantName()) + ") paid with " + context.getCard().getCardTier().name() + " Card");
        reasons.add("Verified trip delay of " + actualDelayHours + " hours exceeds policy requirement of " + minDelayHours + " hours");
        reasons.add("Delay caused by covered event: " + delayReason.replace("_", " "));
        reasons.add("Eligible for up to $" + maxCoverage + " reimbursement for meals, lodging, and essential transit");

        // 7. Required Evidence
        List<String> requiredEvidence = List.of(
                "Airline / Common Carrier Delay Verification Statement",
                "Original Passenger Boarding Pass / Ticket Receipt",
                "Itemized Receipts for unreimbursed Meals, Hotel Lodging, or Ground Transit"
        );

        // 8. Prefill Data
        Map<String, Object> prefillData = new HashMap<>();
        prefillData.put("carrierName", travel != null ? travel.getCarrierName() : tx.getMerchantName());
        prefillData.put("flightNumber", travel != null ? travel.getFlightNumber() : "");
        prefillData.put("delayDurationHours", actualDelayHours);
        prefillData.put("delayReason", delayReason);
        prefillData.put("departureAirport", travel != null ? travel.getDepartureAirport() : "");
        prefillData.put("arrivalAirport", travel != null ? travel.getArrivalAirport() : "");
        prefillData.put("ticketAmount", tx.getAmount());
        prefillData.put("potentialClaimAmount", maxCoverage);
        prefillData.put("cardLast4", context.getCard().getCardNumberLast4());
        prefillData.put("cardTier", context.getCard().getCardTier().name());
        prefillData.put("transactionReference", tx.getTransactionReference());
        prefillData.put("benefitType", BenefitType.TRAVEL_DELAY.name());
        prefillData.put("minDelayHours", minDelayHours);
        prefillData.put("maxCoverageAmount", maxCoverage);

        return EligibilityEvaluationResult.builder()
                .benefitType(BenefitType.TRAVEL_DELAY)
                .eligible(true)
                .potentialClaimAmount(maxCoverage)
                .confidenceScore(new BigDecimal("0.9900"))
                .reasons(reasons)
                .requiredEvidence(requiredEvidence)
                .prefillData(prefillData)
                .build();
    }
}
