package com.cbae.engine.service;

import com.cbae.engine.domain.*;
import com.cbae.engine.domain.enums.TransactionEventType;
import com.cbae.engine.domain.enums.TransactionStatus;
import com.cbae.engine.dto.transaction.SimulationRequest;
import com.cbae.engine.dto.transaction.TransactionIngestRequest;
import com.cbae.engine.dto.transaction.TransactionResponseDto;
import com.cbae.engine.evaluator.BenefitEligibilityEvaluator;
import com.cbae.engine.exception.ResourceNotFoundException;
import com.cbae.engine.repository.CardRepository;
import com.cbae.engine.repository.TransactionEventRepository;
import com.cbae.engine.repository.TransactionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final TransactionEventRepository transactionEventRepository;
    private final CardRepository cardRepository;
    private final TransactionNormalizerService normalizerService;
    private final BenefitEligibilityEvaluator eligibilityEvaluator;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    @Transactional
    public TransactionResponseDto ingestTransaction(TransactionIngestRequest request, String idempotencyKey) {
        String key = StringUtils.hasText(idempotencyKey) ? idempotencyKey : UUID.randomUUID().toString();

        // 1. Idempotency check
        Optional<TransactionEvent> existingEvent = transactionEventRepository.findByIdempotencyKey(key);
        if (existingEvent.isPresent() && existingEvent.get().getTransaction() != null) {
            log.info("Idempotent request detected for key: {}", key);
            return mapToDto(existingEvent.get().getTransaction());
        }

        // 2. Fetch Card
        Card card = cardRepository.findById(request.getCardId())
                .orElseThrow(() -> new ResourceNotFoundException("Card not found with ID: " + request.getCardId()));

        // 3. Normalize
        String normalizedMerchant = normalizerService.normalizeMerchantName(request.getMerchantName());
        String category = normalizerService.classifyCategory(request.getMccCode(), normalizedMerchant);

        // 4. Create Transaction
        Transaction transaction = Transaction.builder()
                .card(card)
                .transactionReference(request.getTransactionReference())
                .amount(request.getAmount())
                .currency(StringUtils.hasText(request.getCurrency()) ? request.getCurrency().toUpperCase() : "USD")
                .merchantName(normalizedMerchant)
                .merchantCategory(request.getMerchantCategory())
                .mccCode(request.getMccCode())
                .transactionTimestamp(request.getTransactionTimestamp())
                .status(TransactionStatus.SETTLED)
                .categoryClassification(category)
                .travelMetadataJson(request.getTravelMetadataJson())
                .build();

        Transaction savedTx = transactionRepository.save(transaction);

        // 5. Record TransactionEvent
        try {
            String payloadJson = objectMapper.writeValueAsString(request);
            TransactionEvent event = TransactionEvent.builder()
                    .transaction(savedTx)
                    .idempotencyKey(key)
                    .eventType(TransactionEventType.TRANSACTION_SETTLED)
                    .payloadJson(payloadJson)
                    .processed(true)
                    .eventTimestamp(Instant.now())
                    .build();
            transactionEventRepository.save(event);
        } catch (Exception e) {
            log.error("Failed to serialize transaction payload: {}", e.getMessage());
        }

        // 6. Trigger Benefit Eligibility Engine
        eligibilityEvaluator.evaluateTransaction(savedTx);

        // 7. Audit log
        auditService.recordEvent(
                "TRANSACTION_INGESTED",
                "Transaction",
                savedTx.getId().toString(),
                card.getCustomer().getId().toString(),
                "CUSTOMER",
                "INGEST_SUCCESS",
                "{\"ref\": \"" + savedTx.getTransactionReference() + "\", \"amount\": " + savedTx.getAmount() + "}"
        );

        return mapToDto(savedTx);
    }

    @Transactional
    public TransactionResponseDto simulateScenario(SimulationRequest request) {
        Card card;
        if (request.getCardId() != null) {
            card = cardRepository.findById(request.getCardId())
                    .orElseThrow(() -> new ResourceNotFoundException("Card not found"));
        } else if (request.getCustomerId() != null) {
            List<Card> cards = cardRepository.findByCustomerId(request.getCustomerId());
            if (cards.isEmpty()) {
                throw new ResourceNotFoundException("No cards found for customer");
            }
            card = cards.get(0);
        } else {
            List<Card> allCards = cardRepository.findAll();
            if (allCards.isEmpty()) {
                throw new ResourceNotFoundException("No cards exist in system to simulate");
            }
            card = allCards.get(0);
        }

        String scenario = request.getScenario().toUpperCase();
        TransactionIngestRequest ingestRequest;

        switch (scenario) {
            case "PURCHASE_PROTECTION_LAPTOP":
                ingestRequest = TransactionIngestRequest.builder()
                        .cardId(card.getId())
                        .transactionReference("SIM-PURCH-" + System.currentTimeMillis())
                        .amount(new BigDecimal("1499.00"))
                        .currency("USD")
                        .merchantName("BEST BUY #1024 SAN FRANCISCO CA")
                        .mccCode("5732")
                        .merchantCategory("Electronics Store")
                        .transactionTimestamp(Instant.now().minus(5, ChronoUnit.DAYS))
                        .productCategory("ELECTRONICS")
                        .build();
                break;

            case "RETURN_PROTECTION_APPAREL":
                ingestRequest = TransactionIngestRequest.builder()
                        .cardId(card.getId())
                        .transactionReference("SIM-RET-" + System.currentTimeMillis())
                        .amount(new BigDecimal("280.00"))
                        .currency("USD")
                        .merchantName("ZARA BOUTIQUE #44 NEW YORK NY")
                        .mccCode("5651")
                        .merchantCategory("Family Clothing Store")
                        .transactionTimestamp(Instant.now().minus(20, ChronoUnit.DAYS))
                        .productCategory("APPAREL")
                        .build();
                break;

            case "TRAVEL_DELAY_FLIGHT":
                String travelJson = "{\"carrierName\": \"Delta Air Lines\", \"carrierCode\": \"DL\", \"flightNumber\": \"DL 1492\", \"departureAirport\": \"JFK\", \"arrivalAirport\": \"SFO\", \"delayDurationHours\": 7, \"delayReason\": \"WEATHER\"}";
                ingestRequest = TransactionIngestRequest.builder()
                        .cardId(card.getId())
                        .transactionReference("SIM-TRV-" + System.currentTimeMillis())
                        .amount(new BigDecimal("450.00"))
                        .currency("USD")
                        .merchantName("DELTA AIR 0062341234 ATLANTA GA")
                        .mccCode("3000")
                        .merchantCategory("Airlines")
                        .transactionTimestamp(Instant.now().minus(2, ChronoUnit.DAYS))
                        .travelMetadataJson(travelJson)
                        .productCategory("AIRLINE_TRAVEL")
                        .build();
                break;

            default:
                throw new IllegalArgumentException("Unknown simulation scenario: " + scenario);
        }

        return ingestTransaction(ingestRequest, "SIM-KEY-" + System.currentTimeMillis());
    }

    @Transactional(readOnly = true)
    public List<TransactionResponseDto> getTransactionsByCustomerId(UUID customerId) {
        return transactionRepository.findByCustomerIdOrderByTransactionTimestampDesc(customerId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TransactionResponseDto getTransactionById(UUID transactionId, UUID customerId) {
        Transaction tx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));
        if (!tx.getCard().getCustomer().getId().equals(customerId)) {
            throw new ResourceNotFoundException("Transaction not found for user");
        }
        return mapToDto(tx);
    }

    private TransactionResponseDto mapToDto(Transaction tx) {
        return TransactionResponseDto.builder()
                .id(tx.getId())
                .cardId(tx.getCard().getId())
                .cardNumberLast4(tx.getCard().getCardNumberLast4())
                .cardNetwork(tx.getCard().getCardNetwork().name())
                .cardTier(tx.getCard().getCardTier().name())
                .transactionReference(tx.getTransactionReference())
                .amount(tx.getAmount())
                .currency(tx.getCurrency())
                .merchantName(tx.getMerchantName())
                .merchantCategory(tx.getMerchantCategory())
                .mccCode(tx.getMccCode())
                .categoryClassification(tx.getCategoryClassification())
                .transactionTimestamp(tx.getTransactionTimestamp())
                .status(tx.getStatus())
                .travelMetadataJson(tx.getTravelMetadataJson())
                .createdAt(tx.getCreatedAt())
                .build();
    }
}
