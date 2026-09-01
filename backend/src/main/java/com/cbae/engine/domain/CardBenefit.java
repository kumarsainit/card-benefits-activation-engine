package com.cbae.engine.domain;

import com.cbae.engine.domain.enums.BenefitType;
import com.cbae.engine.domain.enums.CardStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "card_benefits", uniqueConstraints = {
    @UniqueConstraint(name = "uk_card_benefit", columnNames = {"card_id", "benefit_type"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CardBenefit {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "card_id", nullable = false)
    @JsonIgnore
    private Card card;

    @Enumerated(EnumType.STRING)
    @Column(name = "benefit_type", nullable = false)
    private BenefitType benefitType;

    @Column(name = "max_coverage_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal maxCoverageAmount;

    @Column(name = "annual_max_limit", nullable = false, precision = 12, scale = 2)
    private BigDecimal annualMaxLimit;

    @Column(name = "deductible_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal deductibleAmount = BigDecimal.ZERO;

    @Column(name = "coverage_window_days")
    private Integer coverageWindowDays;

    @Column(name = "min_delay_hours")
    private Integer minDelayHours;

    @Column(name = "terms_and_conditions", columnDefinition = "TEXT")
    private String termsAndConditions;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private CardStatus status = CardStatus.ACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
