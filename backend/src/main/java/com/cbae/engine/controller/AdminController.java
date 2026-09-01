package com.cbae.engine.controller;

import com.cbae.engine.domain.enums.ClaimStatus;
import com.cbae.engine.dto.ApiResponse;
import com.cbae.engine.dto.analytics.AdminAnalyticsDto;
import com.cbae.engine.dto.claim.ClaimResponseDto;
import com.cbae.engine.dto.claim.ClaimReviewRequest;
import com.cbae.engine.security.UserPrincipal;
import com.cbae.engine.service.AnalyticsService;
import com.cbae.engine.service.ClaimService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin & Operations", description = "Endpoints for claim adjudication, operational audit, and value analytics")
public class AdminController {

    private final ClaimService claimService;
    private final AnalyticsService analyticsService;

    @GetMapping("/claims")
    @Operation(summary = "Get all customer claims across the platform (filterable by status)")
    public ResponseEntity<ApiResponse<List<ClaimResponseDto>>> getAllClaims(
            @RequestParam(required = false) ClaimStatus status
    ) {
        List<ClaimResponseDto> claims = claimService.getAllClaims(status);
        return ResponseEntity.ok(ApiResponse.ok(claims));
    }

    @PostMapping("/claims/{id}/review")
    @Operation(summary = "Adjudicate and review a claim (Approve or Reject with notes)")
    public ResponseEntity<ApiResponse<ClaimResponseDto>> reviewClaim(
            @PathVariable UUID id,
            @Valid @RequestBody ClaimReviewRequest request,
            @AuthenticationPrincipal UserPrincipal admin
    ) {
        ClaimResponseDto reviewed = claimService.reviewClaim(id, admin.getId(), request);
        return ResponseEntity.ok(ApiResponse.ok("Claim reviewed successfully", reviewed));
    }

    @GetMapping("/analytics")
    @Operation(summary = "Get aggregate value realization and benefit utilization metrics")
    public ResponseEntity<ApiResponse<AdminAnalyticsDto>> getAnalytics() {
        AdminAnalyticsDto analytics = analyticsService.getAdminAnalytics();
        return ResponseEntity.ok(ApiResponse.ok(analytics));
    }
}
