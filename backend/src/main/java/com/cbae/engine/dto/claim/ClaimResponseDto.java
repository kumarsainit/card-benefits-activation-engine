package com.cbae.engine.dto.claim;

import com.cbae.engine.domain.enums.BenefitType;
import com.cbae.engine.domain.enums.ClaimStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClaimResponseDto {

    private UUID id;
    private String claimReferenceNumber;
    private UUID opportunityId;
    private UUID customerId;
    private String customerName;
    private String customerEmail;
    private UUID transactionId;
    private String transactionReference;
    private BigDecimal transactionAmount;
    private String merchantName;
    private UUID cardId;
    private String cardNumberLast4;
    private String cardTier;
    private BenefitType benefitType;
    private String benefitName;
    private BigDecimal requestedAmount;
    private BigDecimal approvedAmount;
    private ClaimStatus status;
    private Instant incidentDate;
    private String submissionNotes;
    private String adjudicationNotes;
    private List<ClaimEvidenceDto> evidences;
    private Instant createdAt;
    private Instant updatedAt;
}
