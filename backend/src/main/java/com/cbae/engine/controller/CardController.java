package com.cbae.engine.controller;

import com.cbae.engine.dto.ApiResponse;
import com.cbae.engine.dto.card.CardCreateRequest;
import com.cbae.engine.dto.card.CardDto;
import com.cbae.engine.security.UserPrincipal;
import com.cbae.engine.service.CardService;
import io.swagger.v3.oas.annotations.Operation;
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
@RequestMapping("/api/v1/cards")
@RequiredArgsConstructor
@Tag(name = "Cards & Protection Benefits", description = "Endpoints for viewing cards, enrolled insurance coverages, and benefit limits")
public class CardController {

    private final CardService cardService;

    @GetMapping
    @Operation(summary = "List all active payment cards and enrolled protections for current user")
    public ResponseEntity<ApiResponse<List<CardDto>>> getCards(@AuthenticationPrincipal UserPrincipal principal) {
        List<CardDto> cards = cardService.getCardsForCustomer(principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(cards));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get detailed card policy terms and benefit limits by card ID")
    public ResponseEntity<ApiResponse<CardDto>> getCardById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        CardDto card = cardService.getCardById(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(card));
    }

    @PostMapping
    @Operation(summary = "Enroll a new card into the protection benefit engine")
    public ResponseEntity<ApiResponse<CardDto>> createCard(
            @Valid @RequestBody CardCreateRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        CardDto card = cardService.createCard(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Card enrolled successfully with active protections", card));
    }
}
