package com.cbae.engine.service;

import com.cbae.engine.domain.*;
import com.cbae.engine.domain.enums.*;
import com.cbae.engine.dto.claim.ClaimEvidenceDto;
import com.cbae.engine.dto.claim.ClaimResponseDto;
import com.cbae.engine.dto.claim.ClaimReviewRequest;
import com.cbae.engine.dto.claim.ClaimSubmissionRequest;
import com.cbae.engine.exception.BusinessValidationException;
import com.cbae.engine.exception.ResourceNotFoundException;
import com.cbae.engine.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClaimService {

    private final ClaimRepository claimRepository;
    private final ClaimEvidenceRepository evidenceRepository;
    private final BenefitOpportunityRepository opportunityRepository;
    private final TransactionRepository transactionRepository;
    private final CardBenefitRepository cardBenefitRepository;
    private final CustomerRepository customerRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;

    @Transactional
    public ClaimResponseDto submitClaim(UUID customerId, ClaimSubmissionRequest request, String idempotencyKey) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        Transaction transaction = transactionRepository.findById(request.getTransactionId())
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with ID: " + request.getTransactionId()));

        if (!transaction.getCard().getCustomer().getId().equals(customerId)) {
            throw new BusinessValidationException("Transaction does not belong to the authenticated customer");
        }

        CardBenefit benefit = cardBenefitRepository.findById(request.getCardBenefitId())
                .orElseThrow(() -> new ResourceNotFoundException("Card benefit not found"));

        // Validate requested amount does not exceed policy limit
        if (request.getRequestedAmount().compareTo(benefit.getMaxCoverageAmount()) > 0) {
            throw new BusinessValidationException("Requested amount ($" + request.getRequestedAmount() +
                    ") exceeds maximum benefit limit ($" + benefit.getMaxCoverageAmount() + ")");
        }

        // Generate unique reference number (e.g. CLM-2026-A83B1)
        String refNumber = generateClaimReferenceNumber();

        // Check if linked to an opportunity
        BenefitOpportunity opportunity = null;
        if (request.getOpportunityId() != null) {
            opportunity = opportunityRepository.findById(request.getOpportunityId()).orElse(null);
            if (opportunity != null) {
                opportunity.setStatus(OpportunityStatus.CLAIM_INITIATED);
                opportunityRepository.save(opportunity);
            }
        }

        Claim claim = Claim.builder()
                .opportunity(opportunity)
                .customer(customer)
                .transaction(transaction)
                .cardBenefit(benefit)
                .claimReferenceNumber(refNumber)
                .requestedAmount(request.getRequestedAmount())
                .status(ClaimStatus.SUBMITTED)
                .incidentDate(request.getIncidentDate() != null ? request.getIncidentDate() : Instant.now())
                .submissionNotes(request.getSubmissionNotes())
                .build();

        Claim savedClaim = claimRepository.save(claim);

        // Add initial evidence if provided
        if (request.getInitialEvidence() != null && !request.getInitialEvidence().isEmpty()) {
            List<ClaimEvidence> evidences = request.getInitialEvidence().stream().map(dto -> ClaimEvidence.builder()
                    .claim(savedClaim)
                    .evidenceType(dto.getEvidenceType() != null ? dto.getEvidenceType() : EvidenceType.RECEIPT)
                    .fileName(dto.getFileName())
                    .fileUrl(dto.getFileUrl() != null ? dto.getFileUrl() : "https://storage.cbae.internal/evidence/" + dto.getFileName())
                    .fileSize(dto.getFileSize() != null ? dto.getFileSize() : 204800L)
                    .mimeType(dto.getMimeType() != null ? dto.getMimeType() : "application/pdf")
                    .isVerified(false)
                    .build()
            ).collect(Collectors.toList());

            evidenceRepository.saveAll(evidences);
            savedClaim.setEvidences(evidences);
        }

        // Push Notification
        notificationService.sendNotification(
                customer,
                "Claim Submitted: #" + refNumber,
                "Your " + formatBenefitName(benefit.getBenefitType()) + " claim for $" + request.getRequestedAmount() +
                        " has been received and is under review.",
                NotificationType.CLAIM_STATUS_UPDATED,
                NotificationPriority.HIGH,
                "/claims/" + savedClaim.getId()
        );

        // Audit Log
        auditService.recordEvent(
                "CLAIM_SUBMITTED",
                "Claim",
                savedClaim.getId().toString(),
                customerId.toString(),
                "CUSTOMER",
                "SUBMIT_CLAIM",
                "{\"ref\": \"" + refNumber + "\", \"amount\": " + request.getRequestedAmount() + "}"
        );

        return mapToDto(savedClaim);
    }

    @Transactional
    public ClaimEvidenceDto addEvidenceToClaim(UUID claimId, UUID customerId, ClaimEvidenceDto dto) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found"));

        if (!claim.getCustomer().getId().equals(customerId)) {
            throw new ResourceNotFoundException("Claim not found for customer");
        }

        ClaimEvidence evidence = ClaimEvidence.builder()
                .claim(claim)
                .evidenceType(dto.getEvidenceType() != null ? dto.getEvidenceType() : EvidenceType.RECEIPT)
                .fileName(dto.getFileName())
                .fileUrl(dto.getFileUrl() != null ? dto.getFileUrl() : "https://storage.cbae.internal/evidence/" + dto.getFileName())
                .fileSize(dto.getFileSize() != null ? dto.getFileSize() : 102400L)
                .mimeType(dto.getMimeType() != null ? dto.getMimeType() : "application/pdf")
                .isVerified(true)
                .build();

        ClaimEvidence saved = evidenceRepository.save(evidence);

        auditService.recordEvent(
                "CLAIM_EVIDENCE_ATTACHED",
                "ClaimEvidence",
                saved.getId().toString(),
                customerId.toString(),
                "CUSTOMER",
                "ATTACH_EVIDENCE",
                "{\"claimId\": \"" + claimId + "\", \"fileName\": \"" + saved.getFileName() + "\"}"
        );

        return mapEvidenceToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<ClaimResponseDto> getClaimsForCustomer(UUID customerId, ClaimStatus status) {
        List<Claim> list;
        if (status != null) {
            list = claimRepository.findByCustomerIdAndStatusOrderByCreatedAtDesc(customerId, status);
        } else {
            list = claimRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
        }
        return list.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ClaimResponseDto getClaimById(UUID claimId, UUID customerId) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found"));

        if (customerId != null && !claim.getCustomer().getId().equals(customerId)) {
            throw new ResourceNotFoundException("Claim not found for user");
        }

        return mapToDto(claim);
    }

    @Transactional(readOnly = true)
    public List<ClaimResponseDto> getAllClaims(ClaimStatus status) {
        List<Claim> list = claimRepository.findAllByOrderByCreatedAtDesc();
        if (status != null) {
            list = list.stream().filter(c -> c.getStatus() == status).collect(Collectors.toList());
        }
        return list.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public ClaimResponseDto reviewClaim(UUID claimId, UUID adminId, ClaimReviewRequest request) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found"));

        ClaimStatus newStatus = request.getStatus();
        if (!claim.getStatus().canTransitionTo(newStatus)) {
            throw new BusinessValidationException("Illegal claim state transition from " + claim.getStatus() + " to " + newStatus);
        }

        claim.setStatus(newStatus);
        claim.setAdjudicationNotes(request.getAdjudicationNotes());

        if (newStatus == ClaimStatus.APPROVED || newStatus == ClaimStatus.PARTIALLY_APPROVED) {
            claim.setApprovedAmount(request.getApprovedAmount() != null ? request.getApprovedAmount() : claim.getRequestedAmount());
        }

        Claim saved = claimRepository.save(claim);

        // Notify customer
        String statusText = newStatus == ClaimStatus.APPROVED ? "APPROVED" : "REJECTED";
        notificationService.sendNotification(
                saved.getCustomer(),
                "Claim #" + saved.getClaimReferenceNumber() + " " + statusText,
                "Your claim has been " + statusText.toLowerCase() + ". " + (saved.getAdjudicationNotes() != null ? saved.getAdjudicationNotes() : ""),
                NotificationType.CLAIM_STATUS_UPDATED,
                NotificationPriority.HIGH,
                "/claims/" + saved.getId()
        );

        auditService.recordEvent(
                "CLAIM_REVIEWED",
                "Claim",
                saved.getId().toString(),
                adminId.toString(),
                "ADMIN",
                "ADJUDICATE_CLAIM",
                "{\"decision\": \"" + newStatus + "\", \"approvedAmount\": " + saved.getApprovedAmount() + "}"
        );

        return mapToDto(saved);
    }

    private String generateClaimReferenceNumber() {
        int year = Year.now().getValue();
        String randomSuffix = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        return "CLM-" + year + "-" + randomSuffix;
    }

    public ClaimResponseDto mapToDto(Claim claim) {
        List<ClaimEvidenceDto> evidenceDtos = claim.getEvidences() != null ?
                claim.getEvidences().stream().map(this::mapEvidenceToDto).collect(Collectors.toList()) :
                new ArrayList<>();

        return ClaimResponseDto.builder()
                .id(claim.getId())
                .claimReferenceNumber(claim.getClaimReferenceNumber())
                .opportunityId(claim.getOpportunity() != null ? claim.getOpportunity().getId() : null)
                .customerId(claim.getCustomer().getId())
                .customerName(claim.getCustomer().getFullName())
                .customerEmail(claim.getCustomer().getEmail())
                .transactionId(claim.getTransaction().getId())
                .transactionReference(claim.getTransaction().getTransactionReference())
                .transactionAmount(claim.getTransaction().getAmount())
                .merchantName(claim.getTransaction().getMerchantName())
                .cardId(claim.getCardBenefit().getCard().getId())
                .cardNumberLast4(claim.getCardBenefit().getCard().getCardNumberLast4())
                .cardTier(claim.getCardBenefit().getCard().getCardTier().name())
                .benefitType(claim.getCardBenefit().getBenefitType())
                .benefitName(formatBenefitName(claim.getCardBenefit().getBenefitType()))
                .requestedAmount(claim.getRequestedAmount())
                .approvedAmount(claim.getApprovedAmount())
                .status(claim.getStatus())
                .incidentDate(claim.getIncidentDate())
                .submissionNotes(claim.getSubmissionNotes())
                .adjudicationNotes(claim.getAdjudicationNotes())
                .evidences(evidenceDtos)
                .createdAt(claim.getCreatedAt())
                .updatedAt(claim.getUpdatedAt())
                .build();
    }

    private ClaimEvidenceDto mapEvidenceToDto(ClaimEvidence e) {
        return ClaimEvidenceDto.builder()
                .id(e.getId())
                .evidenceType(e.getEvidenceType())
                .fileName(e.getFileName())
                .fileUrl(e.getFileUrl())
                .fileSize(e.getFileSize())
                .mimeType(e.getMimeType())
                .isVerified(e.getIsVerified())
                .createdAt(e.getCreatedAt())
                .build();
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
