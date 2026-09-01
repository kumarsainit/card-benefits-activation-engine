package com.cbae.engine.repository;

import com.cbae.engine.domain.Transaction;
import com.cbae.engine.domain.enums.TransactionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    Optional<Transaction> findByTransactionReference(String transactionReference);
    boolean existsByTransactionReference(String transactionReference);
    List<Transaction> findByCardIdOrderByTransactionTimestampDesc(UUID cardId);

    @Query("SELECT t FROM Transaction t WHERE t.card.customer.id = :customerId ORDER BY t.transactionTimestamp DESC")
    List<Transaction> findByCustomerIdOrderByTransactionTimestampDesc(@Param("customerId") UUID customerId);

    @Query("SELECT t FROM Transaction t WHERE t.card.id = :cardId AND t.transactionTimestamp >= :since AND t.status = :status")
    List<Transaction> findRecentByCardIdAndStatus(@Param("cardId") UUID cardId, @Param("since") Instant since, @Param("status") TransactionStatus status);
}
