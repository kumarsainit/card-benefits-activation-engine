package com.cbae.engine.evaluator;

import com.cbae.engine.domain.*;
import com.cbae.engine.domain.enums.BenefitType;
import com.cbae.engine.domain.enums.CardStatus;
import com.cbae.engine.domain.enums.NotificationPriority;
import com.cbae.engine.domain.enums.NotificationType;
import com.cbae.engine.domain.enums.OpportunityStatus;
import com.cbae.engine.dto.transaction.TravelMetadataDto;
import com.cbae.engine.evaluator.strategy.BenefitRuleStrategy;
import com.cbae.engine.repository.*;
import com.cbae.engine.service.AuditService;
import com.cbae.engine.service.NotificationService;
import com.cbae.engine.service.TransactionNormalizerService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Slf4j
@Service
@Primary
@RequiredArgsConstructor
public class ConfigurableBenefitEligibilityEngine implements BenefitEligibilityEvaluator {

    private final List<BenefitRuleStrategy> strategies;
    private final BenefitRuleRepository benefitRuleRepository;
    private final BenefitOpportunityRepository opportunityRepository;
    private final CardBenefitRepository cardBenefitRepository;
    private final ClaimRepository claimRepository;
    private final TransactionNormalizerService normalizerService;
    private final NotificationService notificationService;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public List<BenefitOpportunity> evaluateTransaction(Transaction transaction) {
        log.info("Starting benefit eligibility evaluation for transaction: {} (${} at {})",
                transaction.getTransactionReference(), transaction.getAmount(), transaction.getMerchantName());

        Card card = transaction.getCard();
        Customer customer = card.getCustomer();

        // 1. Fetch active card benefits for this card
        List<CardBenefit> activeBenefits = cardBenefitRepository.findByCardIdAndStatus(card.getId(), CardStatus.ACTIVE);
        if (activeBenefits.isEmpty()) {
            log.info("No active benefits found for card: {}", card.getCardNumberLast4());
            return Collections.emptyList();
        }

        // 2. Parse travel metadata if present
        TravelMetadataDto travelMetadata = normalizerService.parseTravelMetadata(transaction.getTravelMetadataJson());

        // 3. Assemble enriched TransactionContext
        TransactionContext context = TransactionContext.builder()
                .transaction(transaction)
                .card(card)
                .customer(customer)
                .activeBenefits(activeBenefits)
                .travelMetadata(travelMetadata)
                .previousClaimsCount(0L)
                .build();

        List<BenefitOpportunity> detectedOpportunities = new ArrayList<>();

        // 4. Iterate over each enrolled benefit and evaluate
        for (CardBenefit benefit : activeBenefits) {
            BenefitType benefitType = benefit.getBenefitType();

            // Anti-duplication check: Skip if opportunity or claim already exists
            if (opportunityRepository.existsByTransactionIdAndBenefitType(transaction.getId(), benefitType)) {
                log.info("Opportunity already exists for transaction {} and benefit {}, skipping",
                        transaction.getId(), benefitType);
                continue;
            }

            // Find matching rule strategy
            BenefitRuleStrategy strategy = strategies.stream()
                    .filter(s -> s.getSupportedBenefitType() == benefitType)
                    .findFirst()
                    .orElse(null);

            if (strategy == null) {
                log.warn("No rule strategy found for benefit type: {}", benefitType);
                continue;
            }

            // Retrieve active parameterized rule from repository (if configured)
            BenefitRule rule = benefitRuleRepository.findByBenefitTypeAndIsActiveOrderByPriorityAsc(benefitType, true)
                    .stream()
                    .findFirst()
                    .orElse(null);

            // Execute evaluation
            EligibilityEvaluationResult result = strategy.evaluate(context, benefit, rule);

            if (result.isEligible()) {
                log.info("QUALIFIED: Transaction {} qualifies for {} with confidence {} and potential value ${}",
                        transaction.getTransactionReference(), benefitType, result.getConfidenceScore(), result.getPotentialClaimAmount());

                try {
                    String reasonsJson = objectMapper.writeValueAsString(result.getReasons());
                    String evidenceJson = objectMapper.writeValueAsString(result.getRequiredEvidence());
                    String prefillJson = objectMapper.writeValueAsString(result.getPrefillData());

                    Instant expiryDate = transaction.getTransactionTimestamp().plus(
                            benefit.getCoverageWindowDays() != null ? benefit.getCoverageWindowDays() : 90,
                            ChronoUnit.DAYS
                    );

                    BenefitOpportunity opportunity = BenefitOpportunity.builder()
                            .customer(customer)
                            .card(card)
                            .transaction(transaction)
                            .benefit(benefit)
                            .benefitType(benefitType)
                            .potentialClaimAmount(result.getPotentialClaimAmount())
                            .confidenceScore(result.getConfidenceScore())
                            .eligibilityReasons(reasonsJson)
                            .requiredEvidenceList(evidenceJson)
                            .prefillDataJson(prefillJson)
                            .status(OpportunityStatus.DETECTED)
                            .expiryDate(expiryDate)
                            .build();

                    BenefitOpportunity savedOpp = opportunityRepository.save(opportunity);
                    detectedOpportunities.add(savedOpp);

                    // Send proactive customer notification
                    String benefitName = formatBenefitName(benefitType);
                    notificationService.sendNotification(
                            customer,
                            benefitName + " Opportunity Detected",
                            "Your purchase of $" + transaction.getAmount() + " at " + transaction.getMerchantName() +
                                    " qualifies for up to $" + result.getPotentialClaimAmount() + " in " + benefitName + ".",
                            NotificationType.OPPORTUNITY_DETECTED,
                            NotificationPriority.HIGH,
                            "/opportunities/" + savedOpp.getId()
                    );

                    // Record audit event
                    auditService.recordEvent(
                            "BENEFIT_OPPORTUNITY_DETECTED",
                            "BenefitOpportunity",
                            savedOpp.getId().toString(),
                            "ENGINE",
                            "SYSTEM",
                            "DETECT_OPPORTUNITY",
                            "{\"benefitType\": \"" + benefitType + "\", \"amount\": " + result.getPotentialClaimAmount() + "}"
                    );

                } catch (Exception e) {
                    log.error("Failed to persist benefit opportunity: {}", e.getMessage(), e);
                }
            } else {
                log.debug("Transaction {} not eligible for {}: {}",
                        transaction.getTransactionReference(), benefitType, result.getReasons());
            }
        }

        return detectedOpportunities;
    }

    private String formatBenefitName(BenefitType type) {
        switch (type) {
            case PURCHASE_PROTECTION:
                return "Purchase Protection";
            case RETURN_PROTECTION:
                return "Return Protection";
            case TRAVEL_DELAY:
                return "Travel Delay Insurance";
            default:
                return type.name();
        }
    }
}
