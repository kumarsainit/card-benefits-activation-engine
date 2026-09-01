package com.cbae.engine.repository;

import com.cbae.engine.domain.*;
import com.cbae.engine.domain.enums.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class RepositoryIntegrationTest {

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
    private NotificationRepository notificationRepository;

    private Customer testCustomer;
    private Card testCard;
    private CardBenefit testBenefit;

    @BeforeEach
    void setUp() {
        testCustomer = customerRepository.save(Customer.builder()
                .email("test.user@cbae.internal")
                .fullName("Test User")
                .passwordHash("hashed_pwd")
                .role(UserRole.ROLE_CUSTOMER)
                .build());

        testCard = cardRepository.save(Card.builder()
                .customer(testCustomer)
                .cardNumberLast4("1234")
                .cardNetwork(CardNetwork.AMEX)
                .cardTier(CardTier.PLATINUM)
                .cardholderName("Test User")
                .expiryMonth(10)
                .expiryYear(2027)
                .status(CardStatus.ACTIVE)
                .build());

        testBenefit = cardBenefitRepository.save(CardBenefit.builder()
                .card(testCard)
                .benefitType(BenefitType.RETURN_PROTECTION)
                .maxCoverageAmount(new BigDecimal("300.00"))
                .annualMaxLimit(new BigDecimal("1000.00"))
                .deductibleAmount(BigDecimal.ZERO)
                .coverageWindowDays(90)
                .status(CardStatus.ACTIVE)
                .build());
    }

    @Test
    @DisplayName("Should find active benefit rules ordered by priority")
    void shouldFindActiveBenefitRulesOrderedByPriority() {
        BenefitRule rule1 = benefitRuleRepository.save(BenefitRule.builder()
                .benefitType(BenefitType.PURCHASE_PROTECTION)
                .ruleCode("RULE_1")
                .ruleName("Rule One")
                .parametersJson("{}")
                .isActive(true)
                .priority(50)
                .build());

        BenefitRule rule2 = benefitRuleRepository.save(BenefitRule.builder()
                .benefitType(BenefitType.PURCHASE_PROTECTION)
                .ruleCode("RULE_2")
                .ruleName("Rule Two")
                .parametersJson("{}")
                .isActive(true)
                .priority(10)
                .build());

        List<BenefitRule> rules = benefitRuleRepository.findByBenefitTypeAndIsActiveOrderByPriorityAsc(
                BenefitType.PURCHASE_PROTECTION, true);

        assertThat(rules).hasSize(2);
        assertThat(rules.get(0).getRuleCode()).isEqualTo("RULE_2");
        assertThat(rules.get(1).getRuleCode()).isEqualTo("RULE_1");
    }

    @Test
    @DisplayName("Should correctly aggregate potential claim value and count active opportunities")
    void shouldAggregateOpportunityMetrics() {
        Transaction tx1 = transactionRepository.save(Transaction.builder()
                .card(testCard)
                .transactionReference("TX-AGG-1")
                .amount(new BigDecimal("250.00"))
                .currency("USD")
                .merchantName("Store A")
                .transactionTimestamp(Instant.now())
                .status(TransactionStatus.SETTLED)
                .build());

        Transaction tx2 = transactionRepository.save(Transaction.builder()
                .card(testCard)
                .transactionReference("TX-AGG-2")
                .amount(new BigDecimal("150.00"))
                .currency("USD")
                .merchantName("Store B")
                .transactionTimestamp(Instant.now())
                .status(TransactionStatus.SETTLED)
                .build());

        benefitOpportunityRepository.save(BenefitOpportunity.builder()
                .customer(testCustomer)
                .card(testCard)
                .transaction(tx1)
                .benefit(testBenefit)
                .benefitType(BenefitType.RETURN_PROTECTION)
                .potentialClaimAmount(new BigDecimal("250.00"))
                .confidenceScore(new BigDecimal("0.9500"))
                .eligibilityReasons("[]")
                .requiredEvidenceList("[]")
                .prefillDataJson("{}")
                .status(OpportunityStatus.DETECTED)
                .build());

        benefitOpportunityRepository.save(BenefitOpportunity.builder()
                .customer(testCustomer)
                .card(testCard)
                .transaction(tx2)
                .benefit(testBenefit)
                .benefitType(BenefitType.RETURN_PROTECTION)
                .potentialClaimAmount(new BigDecimal("150.00"))
                .confidenceScore(new BigDecimal("0.9200"))
                .eligibilityReasons("[]")
                .requiredEvidenceList("[]")
                .prefillDataJson("{}")
                .status(OpportunityStatus.DETECTED)
                .build());

        BigDecimal sumPotential = benefitOpportunityRepository.sumPotentialValueByCustomerId(testCustomer.getId());
        long countActive = benefitOpportunityRepository.countActiveOpportunitiesByCustomerId(testCustomer.getId());

        assertThat(sumPotential).isEqualByComparingTo(new BigDecimal("400.00"));
        assertThat(countActive).isEqualTo(2);
    }

    @Test
    @DisplayName("Should correctly aggregate claim amounts by status")
    void shouldAggregateClaimAmountsByStatus() {
        Transaction tx = transactionRepository.save(Transaction.builder()
                .card(testCard)
                .transactionReference("TX-CLM-1")
                .amount(new BigDecimal("300.00"))
                .currency("USD")
                .merchantName("Store C")
                .transactionTimestamp(Instant.now())
                .status(TransactionStatus.SETTLED)
                .build());

        claimRepository.save(Claim.builder()
                .customer(testCustomer)
                .transaction(tx)
                .cardBenefit(testBenefit)
                .claimReferenceNumber("CLM-TEST-001")
                .requestedAmount(new BigDecimal("300.00"))
                .approvedAmount(new BigDecimal("300.00"))
                .status(ClaimStatus.APPROVED)
                .incidentDate(Instant.now())
                .build());

        BigDecimal approvedTotal = claimRepository.sumApprovedClaimAmountByCustomerId(testCustomer.getId());
        assertThat(approvedTotal).isEqualByComparingTo(new BigDecimal("300.00"));
    }
}
