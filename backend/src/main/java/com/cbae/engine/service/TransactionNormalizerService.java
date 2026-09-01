package com.cbae.engine.service;

import com.cbae.engine.dto.transaction.TravelMetadataDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class TransactionNormalizerService {

    private final ObjectMapper objectMapper;

    private static final Map<String, String> MCC_CATEGORY_MAP = new HashMap<>();
    private static final Map<String, String> KNOWN_MERCHANT_MAP = new HashMap<>();

    static {
        // Electronics
        MCC_CATEGORY_MAP.put("5732", "ELECTRONICS");
        MCC_CATEGORY_MAP.put("5734", "SOFTWARE_ELECTRONICS");
        MCC_CATEGORY_MAP.put("5045", "COMPUTERS_PERIPHERALS");
        MCC_CATEGORY_MAP.put("5722", "HOUSEHOLD_APPLIANCES");

        // Department Stores & General Retail
        MCC_CATEGORY_MAP.put("5311", "DEPARTMENT_STORE");
        MCC_CATEGORY_MAP.put("5999", "RETAIL_MISCELLANEOUS");
        MCC_CATEGORY_MAP.put("5310", "DISCOUNT_STORE");

        // Apparel & Fashion
        MCC_CATEGORY_MAP.put("5651", "FAMILY_CLOTHING");
        MCC_CATEGORY_MAP.put("5691", "MEN_WOMEN_CLOTHING");
        MCC_CATEGORY_MAP.put("5621", "WOMENS_READY_TO_WEAR");
        MCC_CATEGORY_MAP.put("5944", "JEWELRY_WATCHES");

        // Travel / Common Carrier
        MCC_CATEGORY_MAP.put("3000", "AIRLINE_TRAVEL");
        MCC_CATEGORY_MAP.put("3001", "AIRLINE_TRAVEL");
        MCC_CATEGORY_MAP.put("3005", "AIRLINE_TRAVEL");
        MCC_CATEGORY_MAP.put("4511", "AIRLINE_TRAVEL");
        MCC_CATEGORY_MAP.put("4112", "RAIL_PASSENGER");
        MCC_CATEGORY_MAP.put("4131", "BUS_TRANSIT");

        // Dining & Lodging
        MCC_CATEGORY_MAP.put("5812", "RESTAURANT_DINING");
        MCC_CATEGORY_MAP.put("5814", "FAST_FOOD");
        MCC_CATEGORY_MAP.put("7011", "HOTEL_LODGING");

        // Known merchant name normalizations
        KNOWN_MERCHANT_MAP.put("BEST BUY", "Best Buy");
        KNOWN_MERCHANT_MAP.put("AMAZON", "Amazon");
        KNOWN_MERCHANT_MAP.put("AMZN", "Amazon");
        KNOWN_MERCHANT_MAP.put("APPLE", "Apple");
        KNOWN_MERCHANT_MAP.put("DELTA", "Delta Air Lines");
        KNOWN_MERCHANT_MAP.put("UNITED AIR", "United Airlines");
        KNOWN_MERCHANT_MAP.put("AMERICAN AIR", "American Airlines");
        KNOWN_MERCHANT_MAP.put("NORDSTROM", "Nordstrom");
        KNOWN_MERCHANT_MAP.put("ZARA", "Zara");
        KNOWN_MERCHANT_MAP.put("TARGET", "Target");
        KNOWN_MERCHANT_MAP.put("WALMART", "Walmart");
    }

    public String normalizeMerchantName(String rawMerchantName) {
        if (!StringUtils.hasText(rawMerchantName)) {
            return "Unknown Merchant";
        }

        String cleaned = rawMerchantName.trim().toUpperCase();

        // Check for known prefix matches
        for (Map.Entry<String, String> entry : KNOWN_MERCHANT_MAP.entrySet()) {
            if (cleaned.contains(entry.getKey())) {
                return entry.getValue();
            }
        }

        // Clean up common point-of-sale store numbers like #1234, *9988, SFO, CA, etc.
        cleaned = cleaned.replaceAll("#\\d+", "")
                .replaceAll("\\*\\w+", "")
                .replaceAll("\\b(STORE|LOC|BRANCH)\\s*\\d+\\b", "")
                .replaceAll("\\s{2,}", " ")
                .trim();

        // Convert to Title Case
        return toTitleCase(cleaned);
    }

    public String classifyCategory(String mccCode, String merchantName) {
        if (StringUtils.hasText(mccCode) && MCC_CATEGORY_MAP.containsKey(mccCode.trim())) {
            return MCC_CATEGORY_MAP.get(mccCode.trim());
        }

        String upperName = (merchantName != null ? merchantName.toUpperCase() : "");
        if (upperName.contains("AIR") || upperName.contains("AIRLINES") || upperName.contains("FLIGHT")) {
            return "AIRLINE_TRAVEL";
        }
        if (upperName.contains("ELECTRONICS") || upperName.contains("BEST BUY") || upperName.contains("APPLE")) {
            return "ELECTRONICS";
        }
        if (upperName.contains("APPAREL") || upperName.contains("CLOTHING") || upperName.contains("ZARA")) {
            return "FAMILY_CLOTHING";
        }

        return "GENERAL_RETAIL";
    }

    public TravelMetadataDto parseTravelMetadata(String metadataJson) {
        if (!StringUtils.hasText(metadataJson)) {
            return null;
        }
        try {
            return objectMapper.readValue(metadataJson, TravelMetadataDto.class);
        } catch (Exception e) {
            log.warn("Failed to parse travel metadata JSON: {}", e.getMessage());
            return null;
        }
    }

    private String toTitleCase(String input) {
        if (!StringUtils.hasText(input)) {
            return input;
        }
        String[] words = input.toLowerCase().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String word : words) {
            if (!word.isEmpty()) {
                sb.append(Character.toUpperCase(word.charAt(0)))
                  .append(word.substring(1))
                  .append(" ");
            }
        }
        return sb.toString().trim();
    }
}
