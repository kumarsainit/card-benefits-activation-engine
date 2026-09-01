package com.cbae.engine.kafka;

import com.cbae.engine.dto.transaction.TransactionIngestRequest;
import com.cbae.engine.service.TransactionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class TransactionKafkaConsumer {

    private final TransactionService transactionService;
    private final ObjectMapper objectMapper;

    @KafkaListener(
            topics = "${app.kafka.topics.transactions-incoming:transactions.incoming}",
            groupId = "${spring.kafka.consumer.group-id:cbae-consumer-group}",
            autoStartup = "${app.kafka.enabled:false}"
    )
    public void consumeTransactionEvent(
            @Payload String messagePayload,
            @Header(value = KafkaHeaders.RECEIVED_KEY, required = false) String idempotencyKey
    ) {
        log.info("Received Kafka transaction event with key: {}", idempotencyKey);
        try {
            TransactionIngestRequest request = objectMapper.readValue(messagePayload, TransactionIngestRequest.class);
            transactionService.ingestTransaction(request, idempotencyKey);
        } catch (Exception e) {
            log.error("Failed to process incoming transaction event from Kafka: {}", e.getMessage(), e);
        }
    }
}
