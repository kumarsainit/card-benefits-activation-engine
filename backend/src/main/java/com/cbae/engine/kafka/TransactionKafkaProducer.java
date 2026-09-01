package com.cbae.engine.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class TransactionKafkaProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;

    @Value("${app.kafka.topics.transactions-incoming:transactions.incoming}")
    private String transactionsTopic;

    public void publishTransaction(String idempotencyKey, String payloadJson) {
        try {
            kafkaTemplate.send(transactionsTopic, idempotencyKey, payloadJson);
            log.info("Published transaction event to Kafka topic {}: key={}", transactionsTopic, idempotencyKey);
        } catch (Exception e) {
            log.warn("Kafka publish omitted or broker unavailable (offline mode): {}", e.getMessage());
        }
    }
}
