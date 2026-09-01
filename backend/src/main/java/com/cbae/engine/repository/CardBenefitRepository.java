package com.cbae.engine.repository;

import com.cbae.engine.domain.CardBenefit;
import com.cbae.engine.domain.enums.BenefitType;
import com.cbae.engine.domain.enums.CardStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CardBenefitRepository extends JpaRepository<CardBenefit, UUID> {
    List<CardBenefit> findByCardId(UUID cardId);
    List<CardBenefit> findByCardIdAndStatus(UUID cardId, CardStatus status);
    Optional<CardBenefit> findByCardIdAndBenefitType(UUID cardId, BenefitType benefitType);
}
