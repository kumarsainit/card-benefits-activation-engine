package com.cbae.engine.controller;

import com.cbae.engine.dto.ApiResponse;
import com.cbae.engine.dto.transaction.SimulationRequest;
import com.cbae.engine.dto.transaction.TransactionIngestRequest;
import com.cbae.engine.dto.transaction.TransactionResponseDto;
import com.cbae.engine.security.UserPrincipal;
import com.cbae.engine.service.TransactionService;
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
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
@Tag(name = "Transactions", description = "Endpoints for ingesting, simulating, and querying card transactions")
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping("/ingest")
    @Operation(summary = "Ingest a new card transaction with optional Idempotency-Key")
    public ResponseEntity<ApiResponse<TransactionResponseDto>> ingestTransaction(
            @Valid @RequestBody TransactionIngestRequest request,
            @Parameter(description = "Unique idempotency key to prevent duplicate processing")
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey
    ) {
        TransactionResponseDto response = transactionService.ingestTransaction(request, idempotencyKey);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Transaction processed successfully", response));
    }

    @PostMapping("/simulate")
    @Operation(summary = "Simulate a deterministic test transaction scenario (Purchase, Return, or Travel Delay)")
    public ResponseEntity<ApiResponse<TransactionResponseDto>> simulateScenario(
            @Valid @RequestBody SimulationRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (request.getCustomerId() == null && principal != null) {
            request.setCustomerId(principal.getId());
        }
        TransactionResponseDto response = transactionService.simulateScenario(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Simulation completed successfully", response));
    }

    @GetMapping
    @Operation(summary = "Get all transactions for the authenticated customer")
    public ResponseEntity<ApiResponse<List<TransactionResponseDto>>> getTransactions(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<TransactionResponseDto> transactions = transactionService.getTransactionsByCustomerId(principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(transactions));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get transaction details by ID")
    public ResponseEntity<ApiResponse<TransactionResponseDto>> getTransactionById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        TransactionResponseDto tx = transactionService.getTransactionById(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(tx));
    }
}
