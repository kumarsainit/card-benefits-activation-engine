package com.cbae.engine.repository;

import com.cbae.engine.domain.Claim;
import com.cbae.engine.domain.enums.ClaimStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClaimRepository extends JpaRepository<Claim, UUID> {
    List<Claim> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);
    List<Claim> findByCustomerIdAndStatusOrderByCreatedAtDesc(UUID customerId, ClaimStatus status);
    Optional<Claim> findByClaimReferenceNumber(String claimReferenceNumber);
    boolean existsByClaimReferenceNumber(String claimReferenceNumber);
    List<Claim> findAllByOrderByCreatedAtDesc();

    @Query("SELECT COALESCE(SUM(c.requestedAmount), 0) FROM Claim c WHERE c.customer.id = :customerId AND c.status IN ('SUBMITTED', 'UNDER_REVIEW')")
    BigDecimal sumActiveClaimAmountByCustomerId(@Param("customerId") UUID customerId);

    @Query("SELECT COALESCE(SUM(c.approvedAmount), 0) FROM Claim c WHERE c.customer.id = :customerId AND c.status IN ('APPROVED', 'PAID')")
    BigDecimal sumApprovedClaimAmountByCustomerId(@Param("customerId") UUID customerId);

    @Query("SELECT COALESCE(SUM(c.approvedAmount), 0) FROM Claim c WHERE c.status IN ('APPROVED', 'PAID')")
    BigDecimal sumAllApprovedClaimAmount();

    @Query("SELECT COUNT(c) FROM Claim c WHERE c.status = :status")
    long countByStatus(@Param("status") ClaimStatus status);
}
