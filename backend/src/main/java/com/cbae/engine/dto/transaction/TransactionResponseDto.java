package com.cbae.engine.dto.transaction;

import com.cbae.engine.domain.enums.TransactionStatus;
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
public class TransactionResponseDto {

    private UUID id;
    private UUID cardId;
    private String cardNumberLast4;
    private String cardNetwork;
    private String cardTier;
    private String transactionReference;
    private BigDecimal amount;
    private String currency;
    private String merchantName;
    private String rawMerchantName;
    private String merchantCategory;
    private String mccCode;
    private String categoryClassification;
    private Instant transactionTimestamp;
    private TransactionStatus status;
    private String travelMetadataJson;
    private Instant createdAt;
}
