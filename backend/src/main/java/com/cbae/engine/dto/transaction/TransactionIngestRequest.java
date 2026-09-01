package com.cbae.engine.dto.transaction;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionIngestRequest {

    @NotNull(message = "Card ID is required")
    private UUID cardId;

    @NotBlank(message = "Transaction reference is required")
    private String transactionReference;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amount;

    @Builder.Default
    private String currency = "USD";

    @NotBlank(message = "Merchant name is required")
    private String merchantName;

    private String mccCode;

    private String merchantCategory;

    @NotNull(message = "Transaction timestamp is required")
    private Instant transactionTimestamp;

    private String travelMetadataJson;

    private String productCategory;
}
