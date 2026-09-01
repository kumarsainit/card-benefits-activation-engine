package com.cbae.engine.evaluator;

import com.cbae.engine.domain.Card;
import com.cbae.engine.domain.CardBenefit;
import com.cbae.engine.domain.Customer;
import com.cbae.engine.domain.Transaction;
import com.cbae.engine.dto.transaction.TravelMetadataDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionContext {
    private Transaction transaction;
    private Card card;
    private Customer customer;
    private List<CardBenefit> activeBenefits;
    private TravelMetadataDto travelMetadata;
    private long previousClaimsCount;
}
