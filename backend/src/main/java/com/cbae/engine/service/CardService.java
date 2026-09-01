package com.cbae.engine.service;

import com.cbae.engine.domain.Card;
import com.cbae.engine.domain.CardBenefit;
import com.cbae.engine.domain.Customer;
import com.cbae.engine.domain.enums.BenefitType;
import com.cbae.engine.domain.enums.CardStatus;
import com.cbae.engine.domain.enums.CardTier;
import com.cbae.engine.dto.card.CardBenefitDto;
import com.cbae.engine.dto.card.CardCreateRequest;
import com.cbae.engine.dto.card.CardDto;
import com.cbae.engine.exception.ResourceNotFoundException;
import com.cbae.engine.repository.CardBenefitRepository;
import com.cbae.engine.repository.CardRepository;
import com.cbae.engine.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CardService {

    private final CardRepository cardRepository;
    private final CardBenefitRepository cardBenefitRepository;
    private final CustomerRepository customerRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<CardDto> getCardsForCustomer(UUID customerId) {
        return cardRepository.findByCustomerIdAndStatus(customerId, CardStatus.ACTIVE).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CardDto getCardById(UUID cardId, UUID customerId) {
        Card card = cardRepository.findByIdAndCustomerId(cardId, customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found with ID: " + cardId));
        return mapToDto(card);
    }

    @Transactional
    public CardDto createCard(UUID customerId, CardCreateRequest request) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        Card card = Card.builder()
                .customer(customer)
                .cardNumberLast4(request.getCardNumberLast4())
                .cardNetwork(request.getCardNetwork())
                .cardTier(request.getCardTier())
                .cardholderName(request.getCardholderName())
                .expiryMonth(request.getExpiryMonth())
                .expiryYear(request.getExpiryYear())
                .status(CardStatus.ACTIVE)
                .build();

        Card savedCard = cardRepository.save(card);

        // Attach default protections based on card tier
        List<CardBenefit> benefits = generateDefaultBenefitsForTier(savedCard, request.getCardTier());
        cardBenefitRepository.saveAll(benefits);
        savedCard.setBenefits(benefits);

        auditService.recordEvent(
                "CARD_ENROLLED",
                "Card",
                savedCard.getId().toString(),
                customerId.toString(),
                "CUSTOMER",
                "ENROLL_CARD",
                "{\"network\": \"" + savedCard.getCardNetwork() + "\", \"tier\": \"" + savedCard.getCardTier() + "\"}"
        );

        return mapToDto(savedCard);
    }

    private List<CardBenefit> generateDefaultBenefitsForTier(Card card, CardTier tier) {
        List<CardBenefit> benefits = new ArrayList<>();

        switch (tier) {
            case PLATINUM:
                benefits.add(CardBenefit.builder()
                        .card(card)
                        .benefitType(BenefitType.PURCHASE_PROTECTION)
                        .maxCoverageAmount(new BigDecimal("10000.00"))
                        .annualMaxLimit(new BigDecimal("50000.00"))
                        .coverageWindowDays(90)
                        .termsAndConditions("Covers accidental damage or theft within 90 days. Up to $10,000 per incident.")
                        .status(CardStatus.ACTIVE)
                        .build());
                benefits.add(CardBenefit.builder()
                        .card(card)
                        .benefitType(BenefitType.RETURN_PROTECTION)
                        .maxCoverageAmount(new BigDecimal("300.00"))
                        .annualMaxLimit(new BigDecimal("1000.00"))
                        .coverageWindowDays(90)
                        .termsAndConditions("Reimburses purchase when merchant denies return within 90 days. Up to $300 per item.")
                        .status(CardStatus.ACTIVE)
                        .build());
                break;

            case SAPPHIRE_RESERVE:
                benefits.add(CardBenefit.builder()
                        .card(card)
                        .benefitType(BenefitType.TRAVEL_DELAY)
                        .maxCoverageAmount(new BigDecimal("500.00"))
                        .annualMaxLimit(new BigDecimal("2500.00"))
                        .minDelayHours(6)
                        .termsAndConditions("Reimburses lodging and meals for travel delays of 6+ hours.")
                        .status(CardStatus.ACTIVE)
                        .build());
                benefits.add(CardBenefit.builder()
                        .card(card)
                        .benefitType(BenefitType.PURCHASE_PROTECTION)
                        .maxCoverageAmount(new BigDecimal("500.00"))
                        .annualMaxLimit(new BigDecimal("10000.00"))
                        .coverageWindowDays(120)
                        .termsAndConditions("Covers damage or theft within 120 days up to $500 per incident.")
                        .status(CardStatus.ACTIVE)
                        .build());
                break;

            default:
                benefits.add(CardBenefit.builder()
                        .card(card)
                        .benefitType(BenefitType.PURCHASE_PROTECTION)
                        .maxCoverageAmount(new BigDecimal("500.00"))
                        .annualMaxLimit(new BigDecimal("5000.00"))
                        .coverageWindowDays(90)
                        .termsAndConditions("Standard purchase protection up to $500 per claim.")
                        .status(CardStatus.ACTIVE)
                        .build());
                break;
        }

        return benefits;
    }

    public CardDto mapToDto(Card card) {
        List<CardBenefitDto> benefitDtos = card.getBenefits() != null ?
                card.getBenefits().stream().map(this::mapBenefitToDto).collect(Collectors.toList()) :
                new ArrayList<>();

        return CardDto.builder()
                .id(card.getId())
                .cardNumberLast4(card.getCardNumberLast4())
                .cardNetwork(card.getCardNetwork())
                .cardTier(card.getCardTier())
                .cardholderName(card.getCardholderName())
                .expiryMonth(card.getExpiryMonth())
                .expiryYear(card.getExpiryYear())
                .status(card.getStatus())
                .benefits(benefitDtos)
                .createdAt(card.getCreatedAt())
                .build();
    }

    private CardBenefitDto mapBenefitToDto(CardBenefit benefit) {
        return CardBenefitDto.builder()
                .id(benefit.getId())
                .benefitType(benefit.getBenefitType())
                .benefitName(formatBenefitName(benefit.getBenefitType()))
                .maxCoverageAmount(benefit.getMaxCoverageAmount())
                .annualMaxLimit(benefit.getAnnualMaxLimit())
                .deductibleAmount(benefit.getDeductibleAmount())
                .coverageWindowDays(benefit.getCoverageWindowDays())
                .minDelayHours(benefit.getMinDelayHours())
                .termsAndConditions(benefit.getTermsAndConditions())
                .status(benefit.getStatus())
                .build();
    }

    private String formatBenefitName(BenefitType type) {
        switch (type) {
            case PURCHASE_PROTECTION: return "Purchase Protection";
            case RETURN_PROTECTION: return "Return Protection";
            case TRAVEL_DELAY: return "Travel Delay Insurance";
            default: return type.name();
        }
    }
}
