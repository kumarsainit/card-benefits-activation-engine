package com.cbae.engine.controller;

import com.cbae.engine.domain.enums.OpportunityStatus;
import com.cbae.engine.dto.ApiResponse;
import com.cbae.engine.dto.opportunity.BenefitOpportunityDto;
import com.cbae.engine.security.UserPrincipal;
import com.cbae.engine.service.BenefitOpportunityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/opportunities")
@RequiredArgsConstructor
@Tag(name = "Benefit Opportunities", description = "Endpoints for inspecting, activating, and managing detected card benefit opportunities")
public class BenefitOpportunityController {

    private final BenefitOpportunityService opportunityService;

    @GetMapping
    @Operation(summary = "Get all detected benefit opportunities for the authenticated cardholder")
    public ResponseEntity<ApiResponse<List<BenefitOpportunityDto>>> getOpportunities(
            @RequestParam(required = false) OpportunityStatus status,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<BenefitOpportunityDto> list = opportunityService.getOpportunitiesForCustomer(principal.getId(), status);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get detailed eligibility breakdown, explainability reasons, and prefill data for an opportunity")
    public ResponseEntity<ApiResponse<BenefitOpportunityDto>> getOpportunityById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        BenefitOpportunityDto opp = opportunityService.getOpportunityById(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(opp));
    }

    @PostMapping("/{id}/dismiss")
    @Operation(summary = "Dismiss a detected opportunity")
    public ResponseEntity<ApiResponse<BenefitOpportunityDto>> dismissOpportunity(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        BenefitOpportunityDto opp = opportunityService.dismissOpportunity(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("Opportunity dismissed", opp));
    }
}
