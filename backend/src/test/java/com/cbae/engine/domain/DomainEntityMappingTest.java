package com.cbae.engine.domain;

import com.cbae.engine.domain.enums.*;
import com.cbae.engine.repository.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class DomainEntityMappingTest {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private CardRepository cardRepository;

    @Autowired
    private CardBenefitRepository cardBenefitRepository;

    @Autowired
    private BenefitRuleRepository benefitRuleRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private BenefitOpportunityRepository benefitOpportunityRepository;

    @Autowired
    private ClaimRepository claimRepository;

    @Autowired
    private ClaimEvidenceRepository claimEvidenceRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Test
    @DisplayName("Should persist and retrieve complete Customer, Card, Benefit, and Transaction relationship hierarchy")
    void shouldPersistAndRetrieveCustomerCardBenefitHierarchy() {
        // 1. Customer
        Customer customer = Customer.builder()
                .email("alex.smith@example.com")
                .fullName("Alex Smith")
                .passwordHash("hashed_pwd_123")
                .role(UserRole.ROLE_CUSTOMER)
                .build();
        Customer savedCustomer = customerRepository.save(customer);
        assertThat(savedCustomer.getId()).isNotNull();

        // 2. Card
        Card card = Card.builder()
                .customer(savedCustomer)
                .cardNumberLast4("9012")
                .cardNetwork(CardNetwork.VISA)
                .cardTier(CardTier.PLATINUM)
                .cardholderName("Alex Smith")
                .expiryMonth(12)
                .expiryYear(2028)
                .status(CardStatus.ACTIVE)
                .build();
        Card savedCard = cardRepository.save(card);
        assertThat(savedCard.getId()).isNotNull();

        // 3. CardBenefit
        CardBenefit benefit = CardBenefit.builder()
                .card(savedCard)
                .benefitType(BenefitType.PURCHASE_PROTECTION)
                .maxCoverageAmount(new BigDecimal("10000.00"))
                .annualMaxLimit(new BigDecimal("50000.00"))
                .deductibleAmount(BigDecimal.ZERO)
                .coverageWindowDays(90)
                .status(CardStatus.ACTIVE)
                .build();
        CardBenefit savedBenefit = cardBenefitRepository.save(benefit);
        assertThat(savedBenefit.getId()).isNotNull();

        // 4. Transaction
        Transaction transaction = Transaction.builder()
                .card(savedCard)
                .transactionReference("TX-TEST-001")
                .amount(new BigDecimal("1299.99"))
                .currency("USD")
                .merchantName("Best Buy")
                .merchantCategory("Electronics")
                .mccCode("5732")
                .transactionTimestamp(Instant.now())
                .status(TransactionStatus.SETTLED)
                .categoryClassification("ELECTRONICS")
                .build();
        Transaction savedTx = transactionRepository.save(transaction);
        assertThat(savedTx.getId()).isNotNull();

        // 5. BenefitOpportunity
        BenefitOpportunity opportunity = BenefitOpportunity.builder()
                .customer(savedCustomer)
                .card(savedCard)
                .transaction(savedTx)
                .benefit(savedBenefit)
                .benefitType(BenefitType.PURCHASE_PROTECTION)
                .potentialClaimAmount(new BigDecimal("1299.99"))
                .confidenceScore(new BigDecimal("0.9800"))
                .eligibilityReasons("[\"Valid purchase within 90 days\", \"Eligible MCC 5732\"]")
                .requiredEvidenceList("[\"Receipt\", \"Damage photo\"]")
                .prefillDataJson("{\"merchant\": \"Best Buy\", \"amount\": 1299.99}")
                .status(OpportunityStatus.DETECTED)
                .expiryDate(Instant.now().plusSeconds(86400 * 90))
                .build();
        BenefitOpportunity savedOpp = benefitOpportunityRepository.save(opportunity);
        assertThat(savedOpp.getId()).isNotNull();

        // 6. Claim
        Claim claim = Claim.builder()
                .opportunity(savedOpp)
                .customer(savedCustomer)
                .transaction(savedTx)
                .cardBenefit(savedBenefit)
                .claimReferenceNumber("CLM-2026-0001")
                .requestedAmount(new BigDecimal("1299.99"))
                .status(ClaimStatus.SUBMITTED)
                .incidentDate(Instant.now())
                .submissionNotes("Display cracked due to accidental drop")
                .build();
        Claim savedClaim = claimRepository.save(claim);
        assertThat(savedClaim.getId()).isNotNull();

        // 7. Claim Evidence
        ClaimEvidence evidence = ClaimEvidence.builder()
                .claim(savedClaim)
                .evidenceType(EvidenceType.RECEIPT)
                .fileName("receipt_bestbuy.pdf")
                .fileUrl("https://storage.cbae.internal/receipt_bestbuy.pdf")
                .fileSize(102400L)
                .mimeType("application/pdf")
                .isVerified(false)
                .build();
        ClaimEvidence savedEvidence = claimEvidenceRepository.save(evidence);
        assertThat(savedEvidence.getId()).isNotNull();

        // 8. Notification
        Notification notification = Notification.builder()
                .customer(savedCustomer)
                .title("Benefit Opportunity Detected")
                .message("Your purchase of $1,299.99 qualifies for Purchase Protection")
                .notificationType(NotificationType.OPPORTUNITY_DETECTED)
                .priority(NotificationPriority.HIGH)
                .deepLink("/opportunities/" + savedOpp.getId())
                .isRead(false)
                .build();
        Notification savedNotification = notificationRepository.save(notification);
        assertThat(savedNotification.getId()).isNotNull();

        // Assert query checks
        assertThat(cardRepository.findByCustomerId(savedCustomer.getId())).hasSize(1);
        assertThat(cardBenefitRepository.findByCardId(savedCard.getId())).hasSize(1);
        assertThat(transactionRepository.findByCustomerIdOrderByTransactionTimestampDesc(savedCustomer.getId())).hasSize(1);
        assertThat(benefitOpportunityRepository.findByCustomerIdOrderByCreatedAtDesc(savedCustomer.getId())).hasSize(1);
        assertThat(claimRepository.findByCustomerIdOrderByCreatedAtDesc(savedCustomer.getId())).hasSize(1);
        assertThat(claimEvidenceRepository.findByClaimId(savedClaim.getId())).hasSize(1);
        assertThat(notificationRepository.countByCustomerIdAndIsReadFalse(savedCustomer.getId())).isEqualTo(1);
    }
}
