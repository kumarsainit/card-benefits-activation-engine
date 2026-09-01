package com.cbae.engine.evaluator;

import com.cbae.engine.domain.BenefitOpportunity;
import com.cbae.engine.domain.Transaction;

import java.util.List;

public interface BenefitEligibilityEvaluator {
    List<BenefitOpportunity> evaluateTransaction(Transaction transaction);
}
