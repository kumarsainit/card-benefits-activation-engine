package com.cbae.engine.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAnalyticsDto {

    private BigDecimal totalPotentialValueDetected;
    private long totalOpportunitiesDetected;
    private long totalClaimsSubmitted;
    private long totalClaimsApproved;
    private long totalClaimsUnderReview;
    private BigDecimal totalValueUnlockedDollars;
    private Double benefitUtilizationRatePercent;
    private long totalEnrolledCards;
}
