import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ClaimTrackingTimeline } from '@/components/claims/claim-tracking-timeline';

describe('ClaimTrackingTimeline Component', () => {
  it('renders submission, policy verification, and approved steps', () => {
    render(
      <ClaimTrackingTimeline
        status="APPROVED"
        createdAt="2026-09-01T12:00:00Z"
        adjudicationNotes="Claim verified against Platinum Purchase Protection policy."
      />
    );

    expect(screen.getByText('Claim Lifecycle Timeline')).toBeInTheDocument();
    expect(screen.getByText('Claim Submitted')).toBeInTheDocument();
    expect(screen.getByText('Policy & Evidence Verification')).toBeInTheDocument();
    expect(screen.getByText(/Claim verified against Platinum/i)).toBeInTheDocument();
  });

  it('renders Action Required state when additional information requested', () => {
    render(
      <ClaimTrackingTimeline
        status="ADDITIONAL_INFORMATION_REQUIRED"
        createdAt="2026-09-01T12:00:00Z"
        adjudicationNotes="Please upload an itemized purchase receipt showing sales tax."
      />
    );

    expect(screen.getByText('Additional Information Requested')).toBeInTheDocument();
    expect(screen.getByText(/Please upload an itemized purchase receipt/i)).toBeInTheDocument();
  });
});
