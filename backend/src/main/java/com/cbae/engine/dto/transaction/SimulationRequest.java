package com.cbae.engine.dto.transaction;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimulationRequest {

    @NotBlank(message = "Scenario is required")
    private String scenario; // PURCHASE_PROTECTION_LAPTOP, RETURN_PROTECTION_APPAREL, TRAVEL_DELAY_FLIGHT

    private UUID cardId;
    private UUID customerId;
}
