package com.cbae.engine.dto.card;

import com.cbae.engine.domain.enums.BenefitType;
import com.cbae.engine.domain.enums.CardStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CardBenefitDto {
    private UUID id;
    private BenefitType benefitType;
    private String benefitName;
    private BigDecimal maxCoverageAmount;
    private BigDecimal annualMaxLimit;
    private BigDecimal deductibleAmount;
    private Integer coverageWindowDays;
    private Integer minDelayHours;
    private String termsAndConditions;
    private CardStatus status;
}
