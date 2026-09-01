package com.cbae.engine.repository;

import com.cbae.engine.domain.BenefitRule;
import com.cbae.engine.domain.enums.BenefitType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BenefitRuleRepository extends JpaRepository<BenefitRule, UUID> {
    List<BenefitRule> findByBenefitTypeAndIsActiveOrderByPriorityAsc(BenefitType benefitType, Boolean isActive);
    List<BenefitRule> findByIsActiveOrderByPriorityAsc(Boolean isActive);
    Optional<BenefitRule> findByRuleCode(String ruleCode);
}
