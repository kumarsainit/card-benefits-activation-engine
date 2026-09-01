package com.cbae.engine.controller;

import com.cbae.engine.domain.Card;
import com.cbae.engine.domain.Customer;
import com.cbae.engine.domain.enums.CardNetwork;
import com.cbae.engine.domain.enums.CardStatus;
import com.cbae.engine.domain.enums.CardTier;
import com.cbae.engine.domain.enums.UserRole;
import com.cbae.engine.dto.transaction.SimulationRequest;
import com.cbae.engine.dto.transaction.TransactionIngestRequest;
import com.cbae.engine.repository.CardRepository;
import com.cbae.engine.repository.CustomerRepository;
import com.cbae.engine.repository.TransactionRepository;
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
@org.springframework.transaction.annotation.Transactional
class TransactionControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private CardRepository cardRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private JwtService jwtService;

    private Customer customer;
    private Card card;
    private String jwtToken;

    @BeforeEach
    void setUp() {
        customer = customerRepository.save(Customer.builder()
                .email("tx.controller." + UUID.randomUUID() + "@example.com")
                .fullName("Tx Controller Tester")
                .passwordHash("pwd")
                .role(UserRole.ROLE_CUSTOMER)
                .build());

        card = cardRepository.save(Card.builder()
                .customer(customer)
                .cardNumberLast4("1122")
                .cardNetwork(CardNetwork.AMEX)
                .cardTier(CardTier.PLATINUM)
                .cardholderName("Tx Controller Tester")
                .expiryMonth(12)
                .expiryYear(2027)
                .status(CardStatus.ACTIVE)
                .build());

        jwtToken = jwtService.generateToken(UserPrincipal.fromCustomer(customer));
    }

    @Test
    @DisplayName("POST /api/v1/transactions/ingest should ingest transaction and return 201")
    void shouldIngestTransactionViaRest() throws Exception {
        TransactionIngestRequest request = TransactionIngestRequest.builder()
                .cardId(card.getId())
                .transactionReference("TX-REST-001")
                .amount(new BigDecimal("499.00"))
                .currency("USD")
                .merchantName("APPLE STORE #299 NEW YORK NY")
                .mccCode("5732")
                .transactionTimestamp(Instant.now())
                .build();

        mockMvc.perform(post("/api/v1/transactions/ingest")
                        .header("Authorization", "Bearer " + jwtToken)
                        .header("Idempotency-Key", "IDEMP-REST-001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.merchantName", is("Apple")))
                .andExpect(jsonPath("$.data.categoryClassification", is("ELECTRONICS")));
    }

    @Test
    @DisplayName("POST /api/v1/transactions/simulate should run deterministic scenario")
    void shouldSimulateScenarioViaRest() throws Exception {
        SimulationRequest request = SimulationRequest.builder()
                .scenario("PURCHASE_PROTECTION_LAPTOP")
                .cardId(card.getId())
                .build();

        mockMvc.perform(post("/api/v1/transactions/simulate")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.amount", is(1499.0)))
                .andExpect(jsonPath("$.data.merchantName", is("Best Buy")));
    }

    @Test
    @DisplayName("GET /api/v1/transactions should return list of customer transactions")
    void shouldListCustomerTransactions() throws Exception {
        TransactionIngestRequest request = TransactionIngestRequest.builder()
                .cardId(card.getId())
                .transactionReference("TX-LIST-001")
                .amount(new BigDecimal("100.00"))
                .merchantName("Target")
                .transactionTimestamp(Instant.now())
                .build();

        mockMvc.perform(post("/api/v1/transactions/ingest")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/transactions")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)));
    }
}
