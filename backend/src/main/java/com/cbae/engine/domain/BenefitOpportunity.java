package com.cbae.engine.domain;

import com.cbae.engine.domain.enums.BenefitType;
import com.cbae.engine.domain.enums.OpportunityStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "benefit_opportunities", uniqueConstraints = {
    @UniqueConstraint(name = "uk_transaction_benefit", columnNames = {"transaction_id", "benefit_type"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BenefitOpportunity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    @JsonIgnore
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "card_id", nullable = false)
    @JsonIgnore
    private Card card;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id", nullable = false)
    @JsonIgnore
    private Transaction transaction;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "benefit_id", nullable = false)
    @JsonIgnore
    private CardBenefit benefit;

    @Enumerated(EnumType.STRING)
    @Column(name = "benefit_type", nullable = false)
    private BenefitType benefitType;

    @Column(name = "potential_claim_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal potentialClaimAmount;

    @Column(name = "confidence_score", nullable = false, precision = 5, scale = 4)
    private BigDecimal confidenceScore;

    @Column(name = "eligibility_reasons", nullable = false, columnDefinition = "TEXT")
    private String eligibilityReasons;

    @Column(name = "required_evidence_list", nullable = false, columnDefinition = "TEXT")
    private String requiredEvidenceList;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private OpportunityStatus status = OpportunityStatus.DETECTED;

    @Column(name = "prefill_data_json", nullable = false, columnDefinition = "TEXT")
    private String prefillDataJson;

    @Column(name = "expiry_date")
    private Instant expiryDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
