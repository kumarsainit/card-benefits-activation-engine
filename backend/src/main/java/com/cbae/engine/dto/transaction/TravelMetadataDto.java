package com.cbae.engine.dto.transaction;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TravelMetadataDto {

    private String carrierName; // e.g. Delta Airlines, United, Amtrak
    private String carrierCode; // e.g. DL, UA
    private String flightNumber; // e.g. DL 1492
    private String departureAirport; // e.g. JFK
    private String arrivalAirport; // e.g. SFO
    private Instant scheduledDepartureTime;
    private Instant actualDepartureTime;
    private Integer delayDurationHours;
    private String delayReason; // WEATHER, MECHANICAL_EQUIPMENT_FAILURE, AIR_TRAFFIC_CONTROL, STRIKE
    private String ticketConfirmationNumber;
}
