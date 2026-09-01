package com.cbae.engine.evaluator;

import com.cbae.engine.domain.enums.BenefitType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EligibilityEvaluationResult {

    private BenefitType benefitType;
    private boolean eligible;
    private BigDecimal potentialClaimAmount;
    private BigDecimal confidenceScore;

    @Builder.Default
    private List<String> reasons = new ArrayList<>();

    @Builder.Default
    private List<String> requiredEvidence = new ArrayList<>();

    @Builder.Default
    private Map<String, Object> prefillData = new HashMap<>();

    public static EligibilityEvaluationResult notEligible(BenefitType type, String reason) {
        EligibilityEvaluationResult result = EligibilityEvaluationResult.builder()
                .benefitType(type)
                .eligible(false)
                .potentialClaimAmount(BigDecimal.ZERO)
                .confidenceScore(BigDecimal.ZERO)
                .build();
        result.getReasons().add(reason);
        return result;
    }
}
