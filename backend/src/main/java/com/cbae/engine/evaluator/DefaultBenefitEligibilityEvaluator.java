package com.cbae.engine.evaluator;

import com.cbae.engine.domain.BenefitOpportunity;
import com.cbae.engine.domain.Transaction;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Slf4j
@Component
@Primary
public class DefaultBenefitEligibilityEvaluator implements BenefitEligibilityEvaluator {

    @Override
    public List<BenefitOpportunity> evaluateTransaction(Transaction transaction) {
        log.info("Eligibility evaluation triggered for transaction: {}", transaction.getTransactionReference());
        return Collections.emptyList();
    }
}
