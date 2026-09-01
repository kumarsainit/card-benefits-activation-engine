package com.cbae.engine.dto.card;

import com.cbae.engine.domain.enums.CardNetwork;
import com.cbae.engine.domain.enums.CardTier;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CardCreateRequest {

    @NotBlank(message = "Last 4 digits are required")
    @Pattern(regexp = "^[0-9]{4}$", message = "Must be exactly 4 numeric digits")
    private String cardNumberLast4;

    @NotNull(message = "Card network is required")
    private CardNetwork cardNetwork;

    @NotNull(message = "Card tier is required")
    private CardTier cardTier;

    @NotBlank(message = "Cardholder name is required")
    private String cardholderName;

    @NotNull(message = "Expiry month is required")
    @Min(value = 1, message = "Month must be between 1 and 12")
    @Max(value = 12, message = "Month must be between 1 and 12")
    private Integer expiryMonth;

    @NotNull(message = "Expiry year is required")
    @Min(value = 2024, message = "Year must be current or future")
    private Integer expiryYear;
}
