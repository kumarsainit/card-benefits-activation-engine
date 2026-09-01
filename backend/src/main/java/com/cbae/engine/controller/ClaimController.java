package com.cbae.engine.controller;

import com.cbae.engine.domain.enums.ClaimStatus;
import com.cbae.engine.dto.ApiResponse;
import com.cbae.engine.dto.claim.ClaimEvidenceDto;
import com.cbae.engine.dto.claim.ClaimResponseDto;
import com.cbae.engine.dto.claim.ClaimSubmissionRequest;
import com.cbae.engine.security.UserPrincipal;
import com.cbae.engine.service.ClaimService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/claims")
@RequiredArgsConstructor
@Tag(name = "Claims", description = "Endpoints for activating, pre-filling, submitting, and tracking insurance claims")
public class ClaimController {

    private final ClaimService claimService;

    @PostMapping
    @Operation(summary = "Submit a pre-filled or customized insurance benefit claim")
    public ResponseEntity<ApiResponse<ClaimResponseDto>> submitClaim(
            @Valid @RequestBody ClaimSubmissionRequest request,
            @Parameter(description = "Idempotency key to ensure single submission execution")
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ClaimResponseDto claim = claimService.submitClaim(principal.getId(), request, idempotencyKey);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Claim submitted successfully", claim));
    }

    @GetMapping
    @Operation(summary = "List all protection claims filed by current customer")
    public ResponseEntity<ApiResponse<List<ClaimResponseDto>>> getClaims(
            @RequestParam(required = false) ClaimStatus status,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<ClaimResponseDto> claims = claimService.getClaimsForCustomer(principal.getId(), status);
        return ResponseEntity.ok(ApiResponse.ok(claims));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get detailed claim status, timeline, and attached evidences")
    public ResponseEntity<ApiResponse<ClaimResponseDto>> getClaimById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ClaimResponseDto claim = claimService.getClaimById(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(claim));
    }

    @PostMapping("/{id}/evidence")
    @Operation(summary = "Attach supplementary evidence (receipt, damage photo, denial statement) to an active claim")
    public ResponseEntity<ApiResponse<ClaimEvidenceDto>> addEvidence(
            @PathVariable UUID id,
            @Valid @RequestBody ClaimEvidenceDto dto,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ClaimEvidenceDto saved = claimService.addEvidenceToClaim(id, principal.getId(), dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Evidence attached successfully", saved));
    }
}
