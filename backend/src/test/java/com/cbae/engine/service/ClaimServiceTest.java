package com.cbae.engine.service;

import com.cbae.engine.domain.*;
import com.cbae.engine.domain.enums.*;
import com.cbae.engine.dto.claim.ClaimEvidenceDto;
import com.cbae.engine.dto.claim.ClaimResponseDto;
import com.cbae.engine.dto.claim.ClaimReviewRequest;
import com.cbae.engine.dto.claim.ClaimSubmissionRequest;
import com.cbae.engine.exception.BusinessValidationException;
import com.cbae.engine.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ClaimServiceTest {

    @Autowired
    private ClaimService claimService;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private CardRepository cardRepository;

    @Autowired
    private CardBenefitRepository cardBenefitRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private BenefitOpportunityRepository opportunityRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    private Customer customer;
    private Customer admin;
    private Card card;
    private CardBenefit benefit;
    private Transaction transaction;
    private BenefitOpportunity opportunity;

    @BeforeEach
    void setUp() {
        customer = customerRepository.save(Customer.builder()
                .email("claim.tester." + UUID.randomUUID() + "@example.com")
                .fullName("Claim Tester")
                .passwordHash("pwd")
                .role(UserRole.ROLE_CUSTOMER)
                .build());

        admin = customerRepository.save(Customer.builder()
                .email("admin.tester." + UUID.randomUUID() + "@cbae.internal")
                .fullName("Admin Tester")
                .passwordHash("pwd")
                .role(UserRole.ROLE_ADMIN)
                .build());

        card = cardRepository.save(Card.builder()
                .customer(customer)
                .cardNumberLast4("9988")
                .cardNetwork(CardNetwork.AMEX)
                .cardTier(CardTier.PLATINUM)
                .cardholderName("Claim Tester")
                .expiryMonth(10)
                .expiryYear(2028)
                .status(CardStatus.ACTIVE)
                .build());

        benefit = cardBenefitRepository.save(CardBenefit.builder()
                .card(card)
                .benefitType(BenefitType.PURCHASE_PROTECTION)
                .maxCoverageAmount(new BigDecimal("10000.00"))
                .annualMaxLimit(new BigDecimal("50000.00"))
                .coverageWindowDays(90)
                .status(CardStatus.ACTIVE)
                .build());

        transaction = transactionRepository.save(Transaction.builder()
                .card(card)
                .transactionReference("TX-CLM-SRV-01")
                .amount(new BigDecimal("1499.00"))
                .currency("USD")
                .merchantName("Best Buy")
                .transactionTimestamp(Instant.now())
                .status(TransactionStatus.SETTLED)
                .build());

        opportunity = opportunityRepository.save(BenefitOpportunity.builder()
                .customer(customer)
                .card(card)
                .transaction(transaction)
                .benefit(benefit)
                .benefitType(BenefitType.PURCHASE_PROTECTION)
                .potentialClaimAmount(new BigDecimal("1499.00"))
                .confidenceScore(new BigDecimal("0.9800"))
                .eligibilityReasons("[]")
                .requiredEvidenceList("[]")
                .prefillDataJson("{}")
                .status(OpportunityStatus.DETECTED)
                .build());
    }

    @Test
    @DisplayName("Should submit pre-filled claim, update opportunity status, and generate reference number")
    void shouldSubmitClaimSuccessfully() {
        ClaimSubmissionRequest request = ClaimSubmissionRequest.builder()
                .opportunityId(opportunity.getId())
                .transactionId(transaction.getId())
                .cardBenefitId(benefit.getId())
                .requestedAmount(new BigDecimal("1499.00"))
                .incidentDate(Instant.now())
                .submissionNotes("Laptop damaged accidentally")
                .initialEvidence(List.of(
                        ClaimEvidenceDto.builder()
                                .evidenceType(EvidenceType.RECEIPT)
                                .fileName("bestbuy_receipt.pdf")
                                .build()
                ))
                .build();

        ClaimResponseDto claim = claimService.submitClaim(customer.getId(), request, "IDEMP-CLM-01");

        assertThat(claim).isNotNull();
        assertThat(claim.getClaimReferenceNumber()).startsWith("CLM-");
        assertThat(claim.getStatus()).isEqualTo(ClaimStatus.SUBMITTED);
        assertThat(claim.getEvidences()).hasSize(1);

        // Verify opportunity transitioned to CLAIM_INITIATED
        BenefitOpportunity updatedOpp = opportunityRepository.findById(opportunity.getId()).orElseThrow();
        assertThat(updatedOpp.getStatus()).isEqualTo(OpportunityStatus.CLAIM_INITIATED);

        // Verify notification sent
        List<Notification> notifications = notificationRepository.findByCustomerIdOrderByCreatedAtDesc(customer.getId());
        assertThat(notifications).isNotEmpty();
        assertThat(notifications.get(0).getTitle()).contains("Claim Submitted");
    }

    @Test
    @DisplayName("Should reject claim if requested amount exceeds max policy limit")
    void shouldRejectClaimExceedingLimit() {
        ClaimSubmissionRequest request = ClaimSubmissionRequest.builder()
                .transactionId(transaction.getId())
                .cardBenefitId(benefit.getId())
                .requestedAmount(new BigDecimal("15000.00")) // Exceeds 10,000 limit
                .incidentDate(Instant.now())
                .build();

        assertThatThrownBy(() -> claimService.submitClaim(customer.getId(), request, null))
                .isInstanceOf(BusinessValidationException.class)
                .hasMessageContaining("exceeds maximum benefit limit");
    }

    @Test
    @DisplayName("Should allow admin to review and approve claim with adjudication notes")
    void shouldAllowAdminToApproveClaim() {
        ClaimSubmissionRequest request = ClaimSubmissionRequest.builder()
                .transactionId(transaction.getId())
                .cardBenefitId(benefit.getId())
                .requestedAmount(new BigDecimal("500.00"))
                .incidentDate(Instant.now())
                .build();

        ClaimResponseDto submitted = claimService.submitClaim(customer.getId(), request, null);

        ClaimReviewRequest reviewRequest = ClaimReviewRequest.builder()
                .status(ClaimStatus.APPROVED)
                .approvedAmount(new BigDecimal("500.00"))
                .adjudicationNotes("Verified repair receipt. Approved full amount.")
                .build();

        ClaimResponseDto reviewed = claimService.reviewClaim(submitted.getId(), admin.getId(), reviewRequest);

        assertThat(reviewed.getStatus()).isEqualTo(ClaimStatus.APPROVED);
        assertThat(reviewed.getApprovedAmount()).isEqualByComparingTo(new BigDecimal("500.00"));
        assertThat(reviewed.getAdjudicationNotes()).contains("Approved full amount");
    }
}
