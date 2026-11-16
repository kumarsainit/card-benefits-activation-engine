package com.cbae.engine.config;

import com.cbae.engine.exception.BusinessValidationException;
import com.cbae.engine.exception.ResourceNotFoundException;
import com.fasterxml.jackson.core.JsonProcessingException;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.common.TopicPartition;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.support.ExponentialBackOffWithMaxRetries;

/**
 * Error handling for the transaction ingest consumer (only active when app.kafka.enabled=true).
 *
 * - Transient failures (anything not listed as non-retryable) are retried in-place with bounded exponential backoff.
 * - Records that still fail, and records that can never succeed (malformed JSON, failed validation, unknown card,
 *   constraint violations), are published to "<topic>.DLT" on the same partition. The recoverer waits for the broker
 *   acknowledgement; if the DLT publish fails, the exception propagates and the record is redelivered, so it is not
 *   committed and not lost.
 * - Offsets are committed by the listener container only after the listener returns normally or the record has been
 *   recovered to the DLT (the consumer no longer swallows exceptions).
 */
@Slf4j
@Configuration
@ConditionalOnProperty(name = "app.kafka.enabled", havingValue = "true")
public class KafkaErrorHandlingConfig {

    @Bean
    public DefaultErrorHandler kafkaErrorHandler(
            KafkaTemplate<String, String> kafkaTemplate,
            @Value("${app.kafka.retry.initial-interval-ms:200}") long initialIntervalMs,
            @Value("${app.kafka.retry.multiplier:2.0}") double multiplier,
            @Value("${app.kafka.retry.max-interval-ms:2000}") long maxIntervalMs,
            @Value("${app.kafka.retry.max-retries:4}") int maxRetries) {

        DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(kafkaTemplate,
                (record, ex) -> new TopicPartition(record.topic() + ".DLT", record.partition()));

        ExponentialBackOffWithMaxRetries backOff = new ExponentialBackOffWithMaxRetries(maxRetries);
        backOff.setInitialInterval(initialIntervalMs);
        backOff.setMultiplier(multiplier);
        backOff.setMaxInterval(maxIntervalMs);

        DefaultErrorHandler handler = new DefaultErrorHandler(recoverer, backOff);
        handler.addNotRetryableExceptions(
                JsonProcessingException.class,          // malformed JSON
                ConstraintViolationException.class,     // payload fails bean validation
                ResourceNotFoundException.class,        // e.g. unknown card id
                BusinessValidationException.class,
                IllegalArgumentException.class,
                DataIntegrityViolationException.class); // e.g. same transactionReference under a different key
        handler.setRetryListeners((record, ex, attempt) ->
                log.warn("Kafka record {}-{}@{} failed (attempt {}): {}", record.topic(), record.partition(),
                        record.offset(), attempt, ex.getMessage()));
        return handler;
    }

    @Bean
    public NewTopic transactionsDeadLetterTopic(
            @Value("${app.kafka.topics.transactions-incoming:transactions.incoming}") String topic,
            @Value("${app.kafka.topics.partitions:3}") int partitions) {
        // DLT must have at least as many partitions as the source topic (same-partition routing).
        return TopicBuilder.name(topic + ".DLT").partitions(partitions).replicas(1).build();
    }
}
