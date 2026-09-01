package com.cbae.engine.dto.claim;

import com.cbae.engine.domain.enums.ClaimStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClaimReviewRequest {

    @NotNull(message = "Decision status is required (APPROVED or REJECTED)")
    private ClaimStatus status;

    private BigDecimal approvedAmount;

    private String adjudicationNotes;
}
