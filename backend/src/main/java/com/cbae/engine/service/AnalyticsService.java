package com.cbae.engine.service;

import com.cbae.engine.domain.enums.ClaimStatus;
import com.cbae.engine.dto.analytics.AdminAnalyticsDto;
import com.cbae.engine.repository.BenefitOpportunityRepository;
import com.cbae.engine.repository.CardRepository;
import com.cbae.engine.repository.ClaimRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final BenefitOpportunityRepository opportunityRepository;
    private final ClaimRepository claimRepository;
    private final CardRepository cardRepository;

    @Transactional(readOnly = true)
    public AdminAnalyticsDto getAdminAnalytics() {
        long totalOpportunities = opportunityRepository.count();
        long totalSubmitted = claimRepository.countByStatus(ClaimStatus.SUBMITTED);
        long totalUnderReview = claimRepository.countByStatus(ClaimStatus.UNDER_REVIEW);
        long totalApproved = claimRepository.countByStatus(ClaimStatus.APPROVED) + claimRepository.countByStatus(ClaimStatus.PAID);
        long totalCards = cardRepository.count();

        BigDecimal totalApprovedDollars = claimRepository.sumAllApprovedClaimAmount();

        double utilizationRate = 0.0;
        if (totalOpportunities > 0) {
            long totalActivated = claimRepository.count();
            utilizationRate = BigDecimal.valueOf((double) totalActivated / totalOpportunities * 100)
                    .setScale(1, RoundingMode.HALF_UP)
                    .doubleValue();
        }

        return AdminAnalyticsDto.builder()
                .totalOpportunitiesDetected(totalOpportunities)
                .totalClaimsSubmitted(totalSubmitted)
                .totalClaimsUnderReview(totalUnderReview)
                .totalClaimsApproved(totalApproved)
                .totalValueUnlockedDollars(totalApprovedDollars)
                .benefitUtilizationRatePercent(utilizationRate)
                .totalEnrolledCards(totalCards)
                .build();
    }
}
