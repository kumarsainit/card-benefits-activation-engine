package com.cbae.engine.repository;

import com.cbae.engine.domain.Card;
import com.cbae.engine.domain.enums.CardStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CardRepository extends JpaRepository<Card, UUID> {
    List<Card> findByCustomerId(UUID customerId);
    List<Card> findByCustomerIdAndStatus(UUID customerId, CardStatus status);
    Optional<Card> findByIdAndCustomerId(UUID id, UUID customerId);
}
