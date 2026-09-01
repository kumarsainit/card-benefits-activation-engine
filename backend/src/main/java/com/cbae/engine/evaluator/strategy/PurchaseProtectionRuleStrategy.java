package com.cbae.engine.evaluator.strategy;

import com.cbae.engine.domain.BenefitRule;
import com.cbae.engine.domain.CardBenefit;
import com.cbae.engine.domain.Transaction;
import com.cbae.engine.domain.enums.BenefitType;
import com.cbae.engine.domain.enums.TransactionStatus;
import com.cbae.engine.evaluator.EligibilityEvaluationResult;
import com.cbae.engine.evaluator.TransactionContext;
import com.fasterxml.jackson.databind.JsonNode;
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
public class PurchaseProtectionRuleStrategy implements BenefitRuleStrategy {

    private final ObjectMapper objectMapper;

    private static final Set<String> EXCLUDED_MCCS = Set.of("5511", "5521", "6011", "6051", "7995", "4829");

    @Override
    public BenefitType getSupportedBenefitType() {
        return BenefitType.PURCHASE_PROTECTION;
    }

    @Override
    public EligibilityEvaluationResult evaluate(TransactionContext context, CardBenefit benefit, BenefitRule rule) {
        Transaction tx = context.getTransaction();

        // 1. Transaction Status Check
        if (tx.getStatus() != TransactionStatus.SETTLED) {
            return EligibilityEvaluationResult.notEligible(
                    BenefitType.PURCHASE_PROTECTION,
                    "Transaction is not in SETTLED status"
            );
        }

        // 2. Minimum purchase amount
        BigDecimal minAmount = new BigDecimal("20.00");
        if (tx.getAmount().compareTo(minAmount) < 0) {
            return EligibilityEvaluationResult.notEligible(
                    BenefitType.PURCHASE_PROTECTION,
                    "Purchase amount is below minimum protection threshold of $20.00"
            );
        }

        // 3. Excluded MCC check (motor vehicles, wire transfers, gambling)
        if (tx.getMccCode() != null && EXCLUDED_MCCS.contains(tx.getMccCode().trim())) {
            return EligibilityEvaluationResult.notEligible(
                    BenefitType.PURCHASE_PROTECTION,
                    "Merchant category (" + tx.getMccCode() + ") is excluded from Purchase Protection (e.g. vehicles, cash equivalents)"
            );
        }

        // 4. Coverage Window Check (e.g., within 90 or 120 days)
        int coverageDays = benefit.getCoverageWindowDays() != null ? benefit.getCoverageWindowDays() : 90;
        long daysSincePurchase = Duration.between(tx.getTransactionTimestamp(), Instant.now()).toDays();
        if (daysSincePurchase > coverageDays) {
            return EligibilityEvaluationResult.notEligible(
                    BenefitType.PURCHASE_PROTECTION,
                    "Purchase date was " + daysSincePurchase + " days ago, which exceeds the " + coverageDays + "-day protection window"
            );
        }

        // 5. Calculate potential claim amount (capped by per-incident max coverage)
        BigDecimal maxCoverage = benefit.getMaxCoverageAmount() != null ? benefit.getMaxCoverageAmount() : new BigDecimal("10000.00");
        BigDecimal potentialAmount = tx.getAmount().min(maxCoverage);

        // 6. Build Reasons
        List<String> reasons = new ArrayList<>();
        reasons.add("Purchase charged to enrolled " + context.getCard().getCardTier().name() + " Card");
        reasons.add("Transaction occurred " + daysSincePurchase + " days ago (within " + coverageDays + "-day coverage window)");
        reasons.add("Merchant '" + tx.getMerchantName() + "' qualifies under " + tx.getCategoryClassification() + " category");
        reasons.add("Full purchase amount of $" + tx.getAmount() + " is within the per-incident limit of $" + maxCoverage);

        // 7. Required Evidence
        List<String> requiredEvidence = List.of(
                "Original Purchase Receipt or Merchant Order Invoice",
                "Photo evidence of damaged item OR Official Police Theft Report (if stolen)",
                "Repair estimate or statement (if applicable)"
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
        prefillData.put("benefitType", BenefitType.PURCHASE_PROTECTION.name());
        prefillData.put("coverageWindowDays", coverageDays);
        prefillData.put("maxCoverageAmount", maxCoverage);
        prefillData.put("deductibleAmount", benefit.getDeductibleAmount());

        return EligibilityEvaluationResult.builder()
                .benefitType(BenefitType.PURCHASE_PROTECTION)
                .eligible(true)
                .potentialClaimAmount(potentialAmount)
                .confidenceScore(new BigDecimal("0.9800"))
                .reasons(reasons)
                .requiredEvidence(requiredEvidence)
                .prefillData(prefillData)
                .build();
    }
}
