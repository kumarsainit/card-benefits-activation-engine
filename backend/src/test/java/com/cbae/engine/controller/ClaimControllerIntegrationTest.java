package com.cbae.engine.controller;

import com.cbae.engine.domain.*;
import com.cbae.engine.domain.enums.*;
import com.cbae.engine.dto.claim.ClaimEvidenceDto;
import com.cbae.engine.dto.claim.ClaimSubmissionRequest;
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
class ClaimControllerIntegrationTest {

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
    private JwtService jwtService;

    private Customer customer;
    private Card card;
    private CardBenefit benefit;
    private Transaction transaction;
    private String jwtToken;

    @BeforeEach
    void setUp() {
        customer = customerRepository.save(Customer.builder()
                .email("claim.ctrl." + UUID.randomUUID() + "@example.com")
                .fullName("Claim Ctrl Tester")
                .passwordHash("pwd")
                .role(UserRole.ROLE_CUSTOMER)
                .build());

        card = cardRepository.save(Card.builder()
                .customer(customer)
                .cardNumberLast4("3322")
                .cardNetwork(CardNetwork.VISA)
                .cardTier(CardTier.SAPPHIRE_RESERVE)
                .cardholderName("Claim Ctrl Tester")
                .expiryMonth(6)
                .expiryYear(2028)
                .status(CardStatus.ACTIVE)
                .build());

        benefit = cardBenefitRepository.save(CardBenefit.builder()
                .card(card)
                .benefitType(BenefitType.TRAVEL_DELAY)
                .maxCoverageAmount(new BigDecimal("500.00"))
                .annualMaxLimit(new BigDecimal("2500.00"))
                .minDelayHours(6)
                .status(CardStatus.ACTIVE)
                .build());

        transaction = transactionRepository.save(Transaction.builder()
                .card(card)
                .transactionReference("TX-TRV-CLM-01")
                .amount(new BigDecimal("450.00"))
                .currency("USD")
                .merchantName("Delta Air Lines")
                .categoryClassification("AIRLINE_TRAVEL")
                .transactionTimestamp(Instant.now())
                .status(TransactionStatus.SETTLED)
                .build());

        jwtToken = jwtService.generateToken(UserPrincipal.fromCustomer(customer));
    }

    @Test
    @DisplayName("POST /api/v1/claims should submit claim and return 201")
    void shouldSubmitClaimViaRest() throws Exception {
        ClaimSubmissionRequest request = ClaimSubmissionRequest.builder()
                .transactionId(transaction.getId())
                .cardBenefitId(benefit.getId())
                .requestedAmount(new BigDecimal("450.00"))
                .incidentDate(Instant.now())
                .submissionNotes("Flight delayed by 7 hours due to storm")
                .build();

        mockMvc.perform(post("/api/v1/claims")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.requestedAmount", is(450.0)))
                .andExpect(jsonPath("$.data.benefitName", is("Travel Delay Insurance")))
                .andExpect(jsonPath("$.data.status", is("SUBMITTED")));
    }

    @Test
    @DisplayName("GET /api/v1/claims should list customer claims")
    void shouldListClaims() throws Exception {
        ClaimSubmissionRequest request = ClaimSubmissionRequest.builder()
                .transactionId(transaction.getId())
                .cardBenefitId(benefit.getId())
                .requestedAmount(new BigDecimal("350.00"))
                .incidentDate(Instant.now())
                .build();

        mockMvc.perform(post("/api/v1/claims")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/claims")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)));
    }
}
