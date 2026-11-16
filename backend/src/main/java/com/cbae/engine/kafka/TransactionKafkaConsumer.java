package com.cbae.engine.kafka;

import com.cbae.engine.dto.transaction.TransactionIngestRequest;
import com.cbae.engine.service.TransactionService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

import java.util.Set;

/**
 * Consumes transaction events. Exceptions are NOT swallowed: they propagate to the container's
 * DefaultErrorHandler (see KafkaErrorHandlingConfig), which retries transient failures with backoff and
 * publishes records that cannot be processed to the dead-letter topic. The offset is committed only after
 * this method returns normally or the record has been recovered to the DLT.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TransactionKafkaConsumer {

    private final TransactionService transactionService;
    private final ObjectMapper objectMapper;
    private final Validator validator;

    @KafkaListener(
            topics = "${app.kafka.topics.transactions-incoming:transactions.incoming}",
            groupId = "${spring.kafka.consumer.group-id:cbae-consumer-group}",
            autoStartup = "${app.kafka.enabled:false}"
    )
    public void consumeTransactionEvent(
            @Payload String messagePayload,
            @Header(value = KafkaHeaders.RECEIVED_KEY, required = false) String idempotencyKey
    ) throws JsonProcessingException {
        log.info("Received Kafka transaction event with key: {}", idempotencyKey);
        TransactionIngestRequest request = objectMapper.readValue(messagePayload, TransactionIngestRequest.class);
        Set<ConstraintViolation<TransactionIngestRequest>> violations = validator.validate(request);
        if (!violations.isEmpty()) {
            throw new ConstraintViolationException(violations);
        }
        transactionService.ingestTransaction(request, idempotencyKey);
    }
}
