package com.cbae.engine.controller;

import com.cbae.engine.domain.Customer;
import com.cbae.engine.domain.enums.CardNetwork;
import com.cbae.engine.domain.enums.CardTier;
import com.cbae.engine.domain.enums.UserRole;
import com.cbae.engine.dto.card.CardCreateRequest;
import com.cbae.engine.repository.CardRepository;
import com.cbae.engine.repository.CustomerRepository;
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
class CardControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private CardRepository cardRepository;

    @Autowired
    private JwtService jwtService;

    private Customer customer;
    private String jwtToken;

    @BeforeEach
    void setUp() {
        customer = customerRepository.save(Customer.builder()
                .email("card.tester." + UUID.randomUUID() + "@example.com")
                .fullName("Card Tester")
                .passwordHash("pwd")
                .role(UserRole.ROLE_CUSTOMER)
                .build());

        jwtToken = jwtService.generateToken(UserPrincipal.fromCustomer(customer));
    }

    @Test
    @DisplayName("POST /api/v1/cards should enroll a card with automatic default protections")
    void shouldEnrollNewCard() throws Exception {
        CardCreateRequest request = CardCreateRequest.builder()
                .cardNumberLast4("7788")
                .cardNetwork(CardNetwork.VISA)
                .cardTier(CardTier.SAPPHIRE_RESERVE)
                .cardholderName("Card Tester")
                .expiryMonth(9)
                .expiryYear(2029)
                .build();

        mockMvc.perform(post("/api/v1/cards")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.cardNumberLast4", is("7788")))
                .andExpect(jsonPath("$.data.cardTier", is("SAPPHIRE_RESERVE")))
                .andExpect(jsonPath("$.data.benefits", hasSize(2)));
    }

    @Test
    @DisplayName("GET /api/v1/cards should list customer cards")
    void shouldListCustomerCards() throws Exception {
        CardCreateRequest request = CardCreateRequest.builder()
                .cardNumberLast4("1234")
                .cardNetwork(CardNetwork.AMEX)
                .cardTier(CardTier.PLATINUM)
                .cardholderName("Card Tester")
                .expiryMonth(11)
                .expiryYear(2028)
                .build();

        mockMvc.perform(post("/api/v1/cards")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/cards")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)));
    }
}
