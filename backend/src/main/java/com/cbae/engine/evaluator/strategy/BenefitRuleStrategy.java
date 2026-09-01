package com.cbae.engine.evaluator.strategy;

import com.cbae.engine.domain.BenefitRule;
import com.cbae.engine.domain.CardBenefit;
import com.cbae.engine.domain.enums.BenefitType;
import com.cbae.engine.evaluator.EligibilityEvaluationResult;
import com.cbae.engine.evaluator.TransactionContext;

public interface BenefitRuleStrategy {
    BenefitType getSupportedBenefitType();
    EligibilityEvaluationResult evaluate(TransactionContext context, CardBenefit benefit, BenefitRule rule);
}
