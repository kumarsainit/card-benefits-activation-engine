package com.cbae.engine.dto.opportunity;

import com.cbae.engine.domain.enums.BenefitType;
import com.cbae.engine.domain.enums.OpportunityStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BenefitOpportunityDto {

    private UUID id;
    private UUID cardId;
    private String cardNumberLast4;
    private String cardNetwork;
    private String cardTier;
    private UUID transactionId;
    private String transactionReference;
    private BigDecimal transactionAmount;
    private String merchantName;
    private Instant transactionTimestamp;
    private BenefitType benefitType;
    private String benefitName;
    private BigDecimal potentialClaimAmount;
    private BigDecimal confidenceScore;
    private List<String> eligibilityReasons;
    private List<String> requiredEvidence;
    private Map<String, Object> prefillData;
    private OpportunityStatus status;
    private Instant expiryDate;
    private Instant createdAt;
}
