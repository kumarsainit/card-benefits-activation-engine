package com.cbae.engine.repository;

import com.cbae.engine.domain.ClaimEvidence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClaimEvidenceRepository extends JpaRepository<ClaimEvidence, UUID> {
    List<ClaimEvidence> findByClaimId(UUID claimId);
}
