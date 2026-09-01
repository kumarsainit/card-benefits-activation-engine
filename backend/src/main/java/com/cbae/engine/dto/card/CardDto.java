package com.cbae.engine.dto.card;

import com.cbae.engine.domain.enums.CardNetwork;
import com.cbae.engine.domain.enums.CardStatus;
import com.cbae.engine.domain.enums.CardTier;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CardDto {
    private UUID id;
    private String cardNumberLast4;
    private CardNetwork cardNetwork;
    private CardTier cardTier;
    private String cardholderName;
    private Integer expiryMonth;
    private Integer expiryYear;
    private CardStatus status;
    private List<CardBenefitDto> benefits;
    private Instant createdAt;
}
