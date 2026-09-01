package com.cbae.engine.service;

import com.cbae.engine.domain.Card;
import com.cbae.engine.domain.Customer;
import com.cbae.engine.domain.Transaction;
import com.cbae.engine.domain.enums.CardNetwork;
import com.cbae.engine.domain.enums.CardStatus;
import com.cbae.engine.domain.enums.CardTier;
import com.cbae.engine.domain.enums.UserRole;
import com.cbae.engine.dto.transaction.SimulationRequest;
import com.cbae.engine.dto.transaction.TransactionIngestRequest;
import com.cbae.engine.dto.transaction.TransactionResponseDto;
import com.cbae.engine.repository.CardRepository;
import com.cbae.engine.repository.CustomerRepository;
import com.cbae.engine.repository.TransactionEventRepository;
import com.cbae.engine.repository.TransactionRepository;
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

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class TransactionProcessingServiceTest {

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private CardRepository cardRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private TransactionEventRepository transactionEventRepository;

    private Customer customer;
    private Card card;

    @BeforeEach
    void setUp() {
        customer = customerRepository.save(Customer.builder()
                .email("tx.test@example.com")
                .fullName("Transaction Tester")
                .passwordHash("pwd")
                .role(UserRole.ROLE_CUSTOMER)
                .build());

        card = cardRepository.save(Card.builder()
                .customer(customer)
                .cardNumberLast4("5544")
                .cardNetwork(CardNetwork.VISA)
                .cardTier(CardTier.PLATINUM)
                .cardholderName("Transaction Tester")
                .expiryMonth(9)
                .expiryYear(2028)
                .status(CardStatus.ACTIVE)
                .build());
    }

    @Test
    @DisplayName("Should ingest transaction and prevent duplicates via Idempotency-Key")
    void shouldIngestTransactionWithIdempotency() {
        TransactionIngestRequest request = TransactionIngestRequest.builder()
                .cardId(card.getId())
                .transactionReference("TX-INGEST-100")
                .amount(new BigDecimal("899.99"))
                .currency("USD")
                .merchantName("BEST BUY #502 CHICAGO IL")
                .mccCode("5732")
                .transactionTimestamp(Instant.now())
                .build();

        String idempotencyKey = "IDEMP-KEY-999";

        // First attempt
        TransactionResponseDto firstResponse = transactionService.ingestTransaction(request, idempotencyKey);
        assertThat(firstResponse).isNotNull();
        assertThat(firstResponse.getMerchantName()).isEqualTo("Best Buy");
        assertThat(firstResponse.getCategoryClassification()).isEqualTo("ELECTRONICS");

        // Second attempt with same idempotency key
        TransactionResponseDto secondResponse = transactionService.ingestTransaction(request, idempotencyKey);
        assertThat(secondResponse.getId()).isEqualTo(firstResponse.getId());

        // Assert database only contains 1 transaction and 1 event
        List<Transaction> transactions = transactionRepository.findByCardIdOrderByTransactionTimestampDesc(card.getId());
        assertThat(transactions).hasSize(1);
        assertThat(transactionEventRepository.findByIdempotencyKey(idempotencyKey)).isPresent();
    }

    @Test
    @DisplayName("Should simulate Purchase Protection, Return Protection, and Travel Delay scenarios")
    void shouldSimulateDeterministicScenarios() {
        // 1. Purchase scenario
        TransactionResponseDto purchaseTx = transactionService.simulateScenario(SimulationRequest.builder()
                .scenario("PURCHASE_PROTECTION_LAPTOP")
                .cardId(card.getId())
                .build());
        assertThat(purchaseTx.getAmount()).isEqualByComparingTo(new BigDecimal("1499.00"));
        assertThat(purchaseTx.getMerchantName()).isEqualTo("Best Buy");

        // 2. Return scenario
        TransactionResponseDto returnTx = transactionService.simulateScenario(SimulationRequest.builder()
                .scenario("RETURN_PROTECTION_APPAREL")
                .cardId(card.getId())
                .build());
        assertThat(returnTx.getAmount()).isEqualByComparingTo(new BigDecimal("280.00"));
        assertThat(returnTx.getMerchantName()).isEqualTo("Zara");

        // 3. Travel scenario
        TransactionResponseDto travelTx = transactionService.simulateScenario(SimulationRequest.builder()
                .scenario("TRAVEL_DELAY_FLIGHT")
                .cardId(card.getId())
                .build());
        assertThat(travelTx.getAmount()).isEqualByComparingTo(new BigDecimal("450.00"));
        assertThat(travelTx.getMerchantName()).isEqualTo("Delta Air Lines");
        assertThat(travelTx.getTravelMetadataJson()).contains("DL 1492");
    }
}
