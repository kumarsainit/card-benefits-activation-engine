package com.cbae.engine.service;

import com.cbae.engine.dto.transaction.TravelMetadataDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TransactionNormalizerTest {

    private TransactionNormalizerService normalizerService;

    @BeforeEach
    void setUp() {
        normalizerService = new TransactionNormalizerService(new ObjectMapper());
    }

    @Test
    @DisplayName("Should normalize merchant names cleanly from raw POS strings")
    void shouldNormalizeMerchantNames() {
        assertThat(normalizerService.normalizeMerchantName("BEST BUY #1024 SAN FRANCISCO CA"))
                .isEqualTo("Best Buy");
        assertThat(normalizerService.normalizeMerchantName("AMZN MKTP US*2J4K829 SEATTLE WA"))
                .isEqualTo("Amazon");
        assertThat(normalizerService.normalizeMerchantName("DELTA AIR 0062341234 ATLANTA GA"))
                .isEqualTo("Delta Air Lines");
        assertThat(normalizerService.normalizeMerchantName("ZARA BOUTIQUE #44 NEW YORK NY"))
                .isEqualTo("Zara");
        assertThat(normalizerService.normalizeMerchantName("LOCAL BAKERY #01"))
                .isEqualTo("Local Bakery");
    }

    @Test
    @DisplayName("Should classify categories based on MCC code")
    void shouldClassifyCategoriesBasedOnMcc() {
        assertThat(normalizerService.classifyCategory("5732", "Best Buy")).isEqualTo("ELECTRONICS");
        assertThat(normalizerService.classifyCategory("5651", "Zara")).isEqualTo("FAMILY_CLOTHING");
        assertThat(normalizerService.classifyCategory("3000", "Delta")).isEqualTo("AIRLINE_TRAVEL");
        assertThat(normalizerService.classifyCategory("5311", "Nordstrom")).isEqualTo("DEPARTMENT_STORE");
        assertThat(normalizerService.classifyCategory("5812", "The French Bistro")).isEqualTo("RESTAURANT_DINING");
    }

    @Test
    @DisplayName("Should parse travel metadata JSON into TravelMetadataDto")
    void shouldParseTravelMetadata() {
        String json = "{\"carrierName\": \"Delta Air Lines\", \"flightNumber\": \"DL 1492\", \"delayDurationHours\": 6, \"delayReason\": \"WEATHER\"}";
        TravelMetadataDto dto = normalizerService.parseTravelMetadata(json);

        assertThat(dto).isNotNull();
        assertThat(dto.getCarrierName()).isEqualTo("Delta Air Lines");
        assertThat(dto.getFlightNumber()).isEqualTo("DL 1492");
        assertThat(dto.getDelayDurationHours()).isEqualTo(6);
        assertThat(dto.getDelayReason()).isEqualTo("WEATHER");
    }
}
