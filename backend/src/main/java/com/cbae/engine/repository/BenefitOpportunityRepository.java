package com.cbae.engine.repository;

import com.cbae.engine.domain.BenefitOpportunity;
import com.cbae.engine.domain.enums.BenefitType;
import com.cbae.engine.domain.enums.OpportunityStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BenefitOpportunityRepository extends JpaRepository<BenefitOpportunity, UUID> {
    List<BenefitOpportunity> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);
    List<BenefitOpportunity> findByCustomerIdAndStatusOrderByCreatedAtDesc(UUID customerId, OpportunityStatus status);
    Optional<BenefitOpportunity> findByTransactionIdAndBenefitType(UUID transactionId, BenefitType benefitType);
    boolean existsByTransactionIdAndBenefitType(UUID transactionId, BenefitType benefitType);

    @Query("SELECT COALESCE(SUM(o.potentialClaimAmount), 0) FROM BenefitOpportunity o WHERE o.customer.id = :customerId AND o.status = 'DETECTED'")
    BigDecimal sumPotentialValueByCustomerId(@Param("customerId") UUID customerId);

    @Query("SELECT COUNT(o) FROM BenefitOpportunity o WHERE o.customer.id = :customerId AND o.status = 'DETECTED'")
    long countActiveOpportunitiesByCustomerId(@Param("customerId") UUID customerId);
}
