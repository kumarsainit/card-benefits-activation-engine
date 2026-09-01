package com.cbae.engine.domain.enums;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

public enum ClaimStatus {
    DRAFT,
    READY_FOR_REVIEW,
    SUBMITTED,
    UNDER_REVIEW,
    ADDITIONAL_INFORMATION_REQUIRED,
    APPROVED,
    PARTIALLY_APPROVED,
    REJECTED,
    PAID,
    CLOSED;

    private static final Map<ClaimStatus, Set<ClaimStatus>> VALID_TRANSITIONS = Map.of(
            DRAFT, EnumSet.of(READY_FOR_REVIEW, SUBMITTED, CLOSED),
            READY_FOR_REVIEW, EnumSet.of(SUBMITTED, DRAFT, CLOSED),
            SUBMITTED, EnumSet.of(UNDER_REVIEW, APPROVED, REJECTED, ADDITIONAL_INFORMATION_REQUIRED, CLOSED),
            UNDER_REVIEW, EnumSet.of(APPROVED, PARTIALLY_APPROVED, REJECTED, ADDITIONAL_INFORMATION_REQUIRED, CLOSED),
            ADDITIONAL_INFORMATION_REQUIRED, EnumSet.of(SUBMITTED, UNDER_REVIEW, REJECTED, CLOSED),
            APPROVED, EnumSet.of(PAID, CLOSED),
            PARTIALLY_APPROVED, EnumSet.of(PAID, CLOSED),
            REJECTED, EnumSet.of(CLOSED),
            PAID, EnumSet.of(CLOSED),
            CLOSED, EnumSet.noneOf(ClaimStatus.class)
    );

    public boolean canTransitionTo(ClaimStatus target) {
        if (this == target) {
            return true;
        }
        Set<ClaimStatus> allowed = VALID_TRANSITIONS.get(this);
        return allowed != null && allowed.contains(target);
    }
}
