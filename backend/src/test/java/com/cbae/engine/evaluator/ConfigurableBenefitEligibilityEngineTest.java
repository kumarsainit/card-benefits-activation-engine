package com.cbae.engine.evaluator;

import com.cbae.engine.domain.*;
import com.cbae.engine.domain.enums.*;
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

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ConfigurableBenefitEligibilityEngineTest {

    @Autowired
    private ConfigurableBenefitEligibilityEngine engine;

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
    private Card card;
    private CardBenefit purchaseBenefit;
    private CardBenefit returnBenefit;

    @BeforeEach
    void setUp() {
        customer = customerRepository.save(Customer.builder()
                .email("engine.test." + UUID.randomUUID() + "@example.com")
                .fullName("Engine Tester")
                .passwordHash("pwd")
                .role(UserRole.ROLE_CUSTOMER)
                .build());

        card = cardRepository.save(Card.builder()
                .customer(customer)
                .cardNumberLast4("9911")
                .cardNetwork(CardNetwork.AMEX)
                .cardTier(CardTier.PLATINUM)
                .cardholderName("Engine Tester")
                .expiryMonth(11)
                .expiryYear(2028)
                .status(CardStatus.ACTIVE)
                .build());

        purchaseBenefit = cardBenefitRepository.save(CardBenefit.builder()
                .card(card)
                .benefitType(BenefitType.PURCHASE_PROTECTION)
                .maxCoverageAmount(new BigDecimal("10000.00"))
                .annualMaxLimit(new BigDecimal("50000.00"))
                .coverageWindowDays(90)
                .status(CardStatus.ACTIVE)
                .build());

        returnBenefit = cardBenefitRepository.save(CardBenefit.builder()
                .card(card)
                .benefitType(BenefitType.RETURN_PROTECTION)
                .maxCoverageAmount(new BigDecimal("300.00"))
                .annualMaxLimit(new BigDecimal("1000.00"))
                .coverageWindowDays(90)
                .status(CardStatus.ACTIVE)
                .build());
    }

    @Test
    @DisplayName("Should detect Purchase Protection and Return Protection opportunities and create customer notifications")
    void shouldDetectOpportunitiesAndNotifyCustomer() {
        Transaction tx = transactionRepository.save(Transaction.builder()
                .card(card)
                .transactionReference("TX-EVAL-001")
                .amount(new BigDecimal("899.00"))
                .currency("USD")
                .merchantName("Best Buy")
                .categoryClassification("ELECTRONICS")
                .mccCode("5732")
                .transactionTimestamp(Instant.now())
                .status(TransactionStatus.SETTLED)
                .build());

        List<BenefitOpportunity> detected = engine.evaluateTransaction(tx);

        assertThat(detected).isNotEmpty();

        List<BenefitOpportunity> customerOpps = opportunityRepository.findByCustomerIdOrderByCreatedAtDesc(customer.getId());
        assertThat(customerOpps).isNotEmpty();

        List<Notification> notifications = notificationRepository.findByCustomerIdOrderByCreatedAtDesc(customer.getId());
        assertThat(notifications).isNotEmpty();
        assertThat(notifications.get(0).getTitle()).contains("Opportunity Detected");
    }
}
