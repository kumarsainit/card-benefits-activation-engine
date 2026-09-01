package com.cbae.engine.controller;

import com.cbae.engine.domain.*;
import com.cbae.engine.domain.enums.*;
import com.cbae.engine.repository.*;
import com.cbae.engine.security.JwtService;
import com.cbae.engine.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BenefitOpportunityControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

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
    private JwtService jwtService;

    private Customer customer;
    private BenefitOpportunity opportunity;
    private String jwtToken;

    @BeforeEach
    void setUp() {
        customer = customerRepository.save(Customer.builder()
                .email("opp.tester." + UUID.randomUUID() + "@example.com")
                .fullName("Opportunity Tester")
                .passwordHash("pwd")
                .role(UserRole.ROLE_CUSTOMER)
                .build());

        Card card = cardRepository.save(Card.builder()
                .customer(customer)
                .cardNumberLast4("1234")
                .cardNetwork(CardNetwork.AMEX)
                .cardTier(CardTier.PLATINUM)
                .cardholderName("Opportunity Tester")
                .expiryMonth(10)
                .expiryYear(2028)
                .status(CardStatus.ACTIVE)
                .build());

        CardBenefit benefit = cardBenefitRepository.save(CardBenefit.builder()
                .card(card)
                .benefitType(BenefitType.PURCHASE_PROTECTION)
                .maxCoverageAmount(new BigDecimal("10000.00"))
                .annualMaxLimit(new BigDecimal("50000.00"))
                .coverageWindowDays(90)
                .status(CardStatus.ACTIVE)
                .build());

        Transaction tx = transactionRepository.save(Transaction.builder()
                .card(card)
                .transactionReference("TX-OPP-TEST")
                .amount(new BigDecimal("1200.00"))
                .currency("USD")
                .merchantName("Best Buy")
                .categoryClassification("ELECTRONICS")
                .transactionTimestamp(Instant.now())
                .status(TransactionStatus.SETTLED)
                .build());

        opportunity = opportunityRepository.save(BenefitOpportunity.builder()
                .customer(customer)
                .card(card)
                .transaction(tx)
                .benefit(benefit)
                .benefitType(BenefitType.PURCHASE_PROTECTION)
                .potentialClaimAmount(new BigDecimal("1200.00"))
                .confidenceScore(new BigDecimal("0.9800"))
                .eligibilityReasons("[\"Eligible Electronics Purchase\"]")
                .requiredEvidenceList("[\"Receipt\"]")
                .prefillDataJson("{\"merchantName\": \"Best Buy\", \"purchaseAmount\": 1200.00}")
                .status(OpportunityStatus.DETECTED)
                .build());

        jwtToken = jwtService.generateToken(UserPrincipal.fromCustomer(customer));
    }

    @Test
    @DisplayName("GET /api/v1/opportunities should return list of opportunities")
    void shouldListOpportunities() throws Exception {
        mockMvc.perform(get("/api/v1/opportunities")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].merchantName", is("Best Buy")))
                .andExpect(jsonPath("$.data[0].benefitName", is("Purchase Protection")));
    }

    @Test
    @DisplayName("GET /api/v1/opportunities/{id} should return detail and transition status to VIEWED")
    void shouldGetOpportunityDetail() throws Exception {
        mockMvc.perform(get("/api/v1/opportunities/" + opportunity.getId())
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.potentialClaimAmount", is(1200.00)))
                .andExpect(jsonPath("$.data.eligibilityReasons[0]", is("Eligible Electronics Purchase")));
    }

    @Test
    @DisplayName("POST /api/v1/opportunities/{id}/dismiss should dismiss opportunity")
    void shouldDismissOpportunity() throws Exception {
        mockMvc.perform(post("/api/v1/opportunities/" + opportunity.getId() + "/dismiss")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("DISMISSED")));
    }
}
