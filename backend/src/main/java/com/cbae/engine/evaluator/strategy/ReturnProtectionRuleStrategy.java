package com.cbae.engine.evaluator.strategy;

import com.cbae.engine.domain.BenefitRule;
import com.cbae.engine.domain.CardBenefit;
import com.cbae.engine.domain.Transaction;
import com.cbae.engine.domain.enums.BenefitType;
import com.cbae.engine.domain.enums.TransactionStatus;
import com.cbae.engine.evaluator.EligibilityEvaluationResult;
import com.cbae.engine.evaluator.TransactionContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReturnProtectionRuleStrategy implements BenefitRuleStrategy {

    private final ObjectMapper objectMapper;

    private static final Set<String> INELIGIBLE_CATEGORIES = Set.of("AIRLINE_TRAVEL", "HOTEL_LODGING", "RESTAURANT_DINING", "GAS_FUEL");

    @Override
    public BenefitType getSupportedBenefitType() {
        return BenefitType.RETURN_PROTECTION;
    }

    @Override
    public EligibilityEvaluationResult evaluate(TransactionContext context, CardBenefit benefit, BenefitRule rule) {
        Transaction tx = context.getTransaction();

        // 1. Transaction Status Check
        if (tx.getStatus() != TransactionStatus.SETTLED) {
            return EligibilityEvaluationResult.notEligible(
                    BenefitType.RETURN_PROTECTION,
                    "Transaction is not in SETTLED status"
            );
        }

        // 2. Minimum amount
        BigDecimal minAmount = new BigDecimal("20.00");
        if (tx.getAmount().compareTo(minAmount) < 0) {
            return EligibilityEvaluationResult.notEligible(
                    BenefitType.RETURN_PROTECTION,
                    "Purchase amount is below the $20.00 minimum threshold for Return Protection"
            );
        }

        // 3. Category Check: Only tangible physical retail goods qualify
        if (tx.getCategoryClassification() != null && INELIGIBLE_CATEGORIES.contains(tx.getCategoryClassification())) {
            return EligibilityEvaluationResult.notEligible(
                    BenefitType.RETURN_PROTECTION,
                    "Intangible services, travel, dining, or fuel purchases do not qualify for Return Protection"
            );
        }

        // 4. Return Window Check (within 60-90 days from purchase)
        int coverageDays = benefit.getCoverageWindowDays() != null ? benefit.getCoverageWindowDays() : 90;
        long daysSincePurchase = Duration.between(tx.getTransactionTimestamp(), Instant.now()).toDays();
        if (daysSincePurchase > coverageDays) {
            return EligibilityEvaluationResult.notEligible(
                    BenefitType.RETURN_PROTECTION,
                    "Purchase date was " + daysSincePurchase + " days ago, exceeding the " + coverageDays + "-day return protection limit"
            );
        }

        // 5. Capped per-item benefit amount (e.g. $300.00)
        BigDecimal maxCoverage = benefit.getMaxCoverageAmount() != null ? benefit.getMaxCoverageAmount() : new BigDecimal("300.00");
        BigDecimal potentialAmount = tx.getAmount().min(maxCoverage);

        // 6. Reasons
        List<String> reasons = new ArrayList<>();
        reasons.add("Eligible tangible merchandise purchased on " + context.getCard().getCardTier().name() + " Card");
        reasons.add("Purchase occurred " + daysSincePurchase + " days ago (within " + coverageDays + "-day window)");
        reasons.add("Qualifies for return reimbursement up to $" + maxCoverage + " per item if merchant refuses return");
        if (tx.getAmount().compareTo(maxCoverage) > 0) {
            reasons.add("Note: Item purchase price ($" + tx.getAmount() + ") is capped at maximum benefit of $" + maxCoverage);
        }

        // 7. Required Evidence
        List<String> requiredEvidence = List.of(
                "Original Itemized Store Receipt / Sales Invoice",
                "Merchant Return Denial Proof (Store return policy screenshot or written refusal)",
                "Photo of the item in brand-new / original working condition"
        );

        // 8. Prefill Data
        Map<String, Object> prefillData = new HashMap<>();
        prefillData.put("merchantName", tx.getMerchantName());
        prefillData.put("purchaseAmount", tx.getAmount());
        prefillData.put("potentialClaimAmount", potentialAmount);
        prefillData.put("purchaseDate", tx.getTransactionTimestamp().toString());
        prefillData.put("cardLast4", context.getCard().getCardNumberLast4());
        prefillData.put("cardTier", context.getCard().getCardTier().name());
        prefillData.put("transactionReference", tx.getTransactionReference());
        prefillData.put("benefitType", BenefitType.RETURN_PROTECTION.name());
        prefillData.put("coverageWindowDays", coverageDays);
        prefillData.put("maxCoverageAmount", maxCoverage);
        prefillData.put("deductibleAmount", benefit.getDeductibleAmount());

        return EligibilityEvaluationResult.builder()
                .benefitType(BenefitType.RETURN_PROTECTION)
                .eligible(true)
                .potentialClaimAmount(potentialAmount)
                .confidenceScore(new BigDecimal("0.9500"))
                .reasons(reasons)
                .requiredEvidence(requiredEvidence)
                .prefillData(prefillData)
                .build();
    }
}
