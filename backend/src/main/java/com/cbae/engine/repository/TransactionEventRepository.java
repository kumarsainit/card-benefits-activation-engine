package com.cbae.engine.repository;

import com.cbae.engine.domain.TransactionEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransactionEventRepository extends JpaRepository<TransactionEvent, UUID> {
    Optional<TransactionEvent> findByIdempotencyKey(String idempotencyKey);
    boolean existsByIdempotencyKey(String idempotencyKey);
}
