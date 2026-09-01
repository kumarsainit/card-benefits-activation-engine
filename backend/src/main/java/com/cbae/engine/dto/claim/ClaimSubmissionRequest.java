package com.cbae.engine.dto.claim;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
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
public class ClaimSubmissionRequest {

    private UUID opportunityId;

    @NotNull(message = "Transaction ID is required")
    private UUID transactionId;

    @NotNull(message = "Card Benefit ID is required")
    private UUID cardBenefitId;

    @NotNull(message = "Requested amount is required")
    @DecimalMin(value = "0.01", message = "Requested amount must be greater than 0")
    private BigDecimal requestedAmount;

    @NotNull(message = "Incident date is required")
    private Instant incidentDate;

    private String submissionNotes;

    private List<ClaimEvidenceDto> initialEvidence;
}
