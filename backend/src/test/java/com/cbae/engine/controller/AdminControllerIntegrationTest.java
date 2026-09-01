package com.cbae.engine.controller;

import com.cbae.engine.domain.*;
import com.cbae.engine.domain.enums.*;
import com.cbae.engine.dto.claim.ClaimReviewRequest;
import com.cbae.engine.repository.*;
import com.cbae.engine.security.JwtService;
import com.cbae.engine.security.UserPrincipal;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AdminControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private CardRepository cardRepository;

    @Autowired
    private CardBenefitRepository cardBenefitRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private ClaimRepository claimRepository;

    @Autowired
    private JwtService jwtService;

    private Customer adminUser;
    private Customer normalCustomer;
    private Claim submittedClaim;
    private String adminToken;
    private String customerToken;

    @BeforeEach
    void setUp() {
        adminUser = customerRepository.save(Customer.builder()
                .email("admin." + UUID.randomUUID() + "@cbae.internal")
                .fullName("Admin User")
                .passwordHash("pwd")
                .role(UserRole.ROLE_ADMIN)
                .build());

        normalCustomer = customerRepository.save(Customer.builder()
                .email("cust." + UUID.randomUUID() + "@example.com")
                .fullName("Normal Customer")
                .passwordHash("pwd")
                .role(UserRole.ROLE_CUSTOMER)
                .build());

        Card card = cardRepository.save(Card.builder()
                .customer(normalCustomer)
                .cardNumberLast4("5555")
                .cardNetwork(CardNetwork.VISA)
                .cardTier(CardTier.PLATINUM)
                .cardholderName("Normal Customer")
                .expiryMonth(12)
                .expiryYear(2028)
                .status(CardStatus.ACTIVE)
                .build());

        CardBenefit benefit = cardBenefitRepository.save(CardBenefit.builder()
                .card(card)
                .benefitType(BenefitType.PURCHASE_PROTECTION)
                .maxCoverageAmount(new BigDecimal("10000.00"))
                .annualMaxLimit(new BigDecimal("50000.00"))
                .status(CardStatus.ACTIVE)
                .build());

        Transaction tx = transactionRepository.save(Transaction.builder()
                .card(card)
                .transactionReference("TX-ADM-01")
                .amount(new BigDecimal("1200.00"))
                .merchantName("Best Buy")
                .transactionTimestamp(Instant.now())
                .status(TransactionStatus.SETTLED)
                .build());

        submittedClaim = claimRepository.save(Claim.builder()
                .customer(normalCustomer)
                .transaction(tx)
                .cardBenefit(benefit)
                .claimReferenceNumber("CLM-2026-TEST1")
                .requestedAmount(new BigDecimal("1200.00"))
                .status(ClaimStatus.SUBMITTED)
                .incidentDate(Instant.now())
                .build());

        adminToken = jwtService.generateToken(UserPrincipal.fromCustomer(adminUser));
        customerToken = jwtService.generateToken(UserPrincipal.fromCustomer(normalCustomer));
    }

    @Test
    @DisplayName("GET /api/v1/admin/claims should return claims queue for admin")
    void shouldReturnClaimsQueueForAdmin() throws Exception {
        mockMvc.perform(get("/api/v1/admin/claims")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    @DisplayName("POST /api/v1/admin/claims/{id}/review should approve claim")
    void shouldApproveClaimAsAdmin() throws Exception {
        ClaimReviewRequest request = ClaimReviewRequest.builder()
                .status(ClaimStatus.APPROVED)
                .approvedAmount(new BigDecimal("1200.00"))
                .adjudicationNotes("Approved after document verification.")
                .build();

        mockMvc.perform(post("/api/v1/admin/claims/" + submittedClaim.getId() + "/review")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("APPROVED")))
                .andExpect(jsonPath("$.data.approvedAmount", is(1200.0)));
    }

    @Test
    @DisplayName("GET /api/v1/admin/analytics should return aggregate metrics")
    void shouldReturnAdminAnalytics() throws Exception {
        mockMvc.perform(get("/api/v1/admin/analytics")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.totalClaimsSubmitted", notNullValue()));
    }

    @Test
    @DisplayName("GET /api/v1/admin/claims should reject non-admin customer with 403 Forbidden")
    void shouldRejectCustomerFromAdminApi() throws Exception {
        mockMvc.perform(get("/api/v1/admin/claims")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }
}
