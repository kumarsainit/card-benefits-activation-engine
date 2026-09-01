package com.cbae.engine.domain;

import com.cbae.engine.domain.enums.TransactionStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "card_id", nullable = false)
    @JsonIgnore
    private Card card;

    @Column(name = "transaction_reference", nullable = false, unique = true)
    private String transactionReference;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 10)
    @Builder.Default
    private String currency = "USD";

    @Column(name = "merchant_name", nullable = false)
    private String merchantName;

    @Column(name = "merchant_category")
    private String merchantCategory;

    @Column(name = "mcc_code", length = 10)
    private String mccCode;

    @Column(name = "transaction_timestamp", nullable = false)
    private Instant transactionTimestamp;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TransactionStatus status = TransactionStatus.SETTLED;

    @Column(name = "category_classification")
    private String categoryClassification;

    @Column(name = "travel_metadata_json", columnDefinition = "TEXT")
    private String travelMetadataJson;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
