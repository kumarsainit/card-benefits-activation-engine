package com.cbae.engine.service;

import com.cbae.engine.domain.BenefitOpportunity;
import com.cbae.engine.domain.enums.BenefitType;
import com.cbae.engine.domain.enums.OpportunityStatus;
import com.cbae.engine.dto.opportunity.BenefitOpportunityDto;
import com.cbae.engine.exception.ResourceNotFoundException;
import com.cbae.engine.repository.BenefitOpportunityRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BenefitOpportunityService {

    private final BenefitOpportunityRepository opportunityRepository;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<BenefitOpportunityDto> getOpportunitiesForCustomer(UUID customerId, OpportunityStatus status) {
        List<BenefitOpportunity> list;
        if (status != null) {
            list = opportunityRepository.findByCustomerIdAndStatusOrderByCreatedAtDesc(customerId, status);
        } else {
            list = opportunityRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
        }
        return list.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public BenefitOpportunityDto getOpportunityById(UUID opportunityId, UUID customerId) {
        BenefitOpportunity opp = opportunityRepository.findById(opportunityId)
                .orElseThrow(() -> new ResourceNotFoundException("Benefit Opportunity not found with ID: " + opportunityId));

        if (!opp.getCustomer().getId().equals(customerId)) {
            throw new ResourceNotFoundException("Benefit Opportunity not found for user");
        }

        if (opp.getStatus() == OpportunityStatus.DETECTED) {
            opp.setStatus(OpportunityStatus.VIEWED);
            opp = opportunityRepository.save(opp);
        }

        return mapToDto(opp);
    }

    @Transactional
    public BenefitOpportunityDto dismissOpportunity(UUID opportunityId, UUID customerId) {
        BenefitOpportunity opp = opportunityRepository.findById(opportunityId)
                .orElseThrow(() -> new ResourceNotFoundException("Benefit Opportunity not found"));

        if (!opp.getCustomer().getId().equals(customerId)) {
            throw new ResourceNotFoundException("Opportunity not found for user");
        }

        opp.setStatus(OpportunityStatus.DISMISSED);
        BenefitOpportunity saved = opportunityRepository.save(opp);

        auditService.recordEvent(
                "OPPORTUNITY_DISMISSED",
                "BenefitOpportunity",
                saved.getId().toString(),
                customerId.toString(),
                "CUSTOMER",
                "DISMISS",
                "{\"opportunityId\": \"" + saved.getId() + "\"}"
        );

        return mapToDto(saved);
    }

    public BenefitOpportunityDto mapToDto(BenefitOpportunity opp) {
        List<String> reasons = parseJsonList(opp.getEligibilityReasons());
        List<String> evidence = parseJsonList(opp.getRequiredEvidenceList());
        Map<String, Object> prefill = parseJsonMap(opp.getPrefillDataJson());

        return BenefitOpportunityDto.builder()
                .id(opp.getId())
                .cardId(opp.getCard().getId())
                .cardNumberLast4(opp.getCard().getCardNumberLast4())
                .cardNetwork(opp.getCard().getCardNetwork().name())
                .cardTier(opp.getCard().getCardTier().name())
                .transactionId(opp.getTransaction().getId())
                .transactionReference(opp.getTransaction().getTransactionReference())
                .transactionAmount(opp.getTransaction().getAmount())
                .merchantName(opp.getTransaction().getMerchantName())
                .transactionTimestamp(opp.getTransaction().getTransactionTimestamp())
                .benefitType(opp.getBenefitType())
                .benefitName(formatBenefitName(opp.getBenefitType()))
                .potentialClaimAmount(opp.getPotentialClaimAmount())
                .confidenceScore(opp.getConfidenceScore())
                .eligibilityReasons(reasons)
                .requiredEvidence(evidence)
                .prefillData(prefill)
                .status(opp.getStatus())
                .expiryDate(opp.getExpiryDate())
                .createdAt(opp.getCreatedAt())
                .build();
    }

    private List<String> parseJsonList(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private Map<String, Object> parseJsonMap(String json) {
        if (json == null || json.isBlank()) return Collections.emptyMap();
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return Collections.emptyMap();
        }
    }

    private String formatBenefitName(BenefitType type) {
        switch (type) {
            case PURCHASE_PROTECTION: return "Purchase Protection";
            case RETURN_PROTECTION: return "Return Protection";
            case TRAVEL_DELAY: return "Travel Delay Insurance";
            default: return type.name();
        }
    }
}
