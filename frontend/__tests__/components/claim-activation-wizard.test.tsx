import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClaimActivationWizard } from '@/components/claims/claim-activation-wizard';
import { QueryProvider } from '@/providers/query-provider';
import { apiClient } from '@/services/api-client';
import { BenefitOpportunity } from '@/types';

vi.mock('next/navigation', () => ({
  usePathname: () => '/opportunities/opp-1',
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

const mockOpportunity: BenefitOpportunity = {
  id: 'opp-1',
  customerId: 'cust-1',
  transactionId: '123e4567-e89b-12d3-a456-426614174000',
  cardId: 'card-1',
  benefitId: '123e4567-e89b-12d3-a456-426614174001',
  benefitType: 'PURCHASE_PROTECTION',
  benefitName: 'Purchase Protection',
  merchantName: 'Best Buy Electronics',
  transactionAmount: 1499.0,
  potentialClaimAmount: 1499.0,
  confidenceScore: 0.98,
  eligibilityReasons: ['Within 90 days of purchase', 'MCC 5732 eligible electronics'],
  requiredEvidenceList: ['Purchase Receipt', 'Damage Photo'],
  status: 'DETECTED',
  cardNetwork: 'AMEX',
  cardNumberLast4: '4821',
  createdAt: new Date().toISOString(),
};

describe('ClaimActivationWizard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Step 1 with prefilled verified transaction facts', () => {
    render(
      <QueryProvider>
        <ClaimActivationWizard opportunity={mockOpportunity} />
      </QueryProvider>
    );

    expect(screen.getByText(/Verified Pre-filled Details/i)).toBeInTheDocument();
    expect(screen.getByText('Best Buy Electronics')).toBeInTheDocument();
    expect(screen.getAllByText('$1,499.00').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Continue to Incident Details/i })).toBeInTheDocument();
  });

  it('navigates through stepper, fills incident details, confirms, and submits claim successfully', async () => {
    const user = userEvent.setup();
    const submitSpy = vi.spyOn(apiClient, 'submitClaim').mockResolvedValue({
      id: 'claim-1',
      claimReferenceNumber: 'CLM-2026-A83B1',
      customerId: 'cust-1',
      transactionId: mockOpportunity.transactionId,
      cardBenefitId: mockOpportunity.benefitId,
      requestedAmount: 1499.0,
      status: 'SUBMITTED',
      incidentDate: '2026-09-01T12:00:00Z',
      submissionNotes: 'Laptop dropped on sidewalk, screen cracked',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    render(
      <QueryProvider>
        <ClaimActivationWizard opportunity={mockOpportunity} />
      </QueryProvider>
    );

    // Step 1 -> Step 2
    await user.click(screen.getByRole('button', { name: /Continue to Incident Details/i }));
    expect(screen.getByText(/Incident Details & Claim Amount/i)).toBeInTheDocument();

    // Fill notes in Step 2
    const notesArea = screen.getByPlaceholderText(/describe how the item was accidentally damaged/i);
    await user.type(notesArea, 'Laptop dropped on sidewalk, screen cracked');

    // Step 2 -> Step 3
    await user.click(screen.getByRole('button', { name: /Continue to Evidence/i }));
    expect(screen.getByText(/Attach Supporting Evidence/i)).toBeInTheDocument();

    // Step 3 -> Step 4
    await user.click(screen.getByRole('button', { name: /Continue to Review/i }));
    expect(screen.getByText(/Review & Submit Claim/i)).toBeInTheDocument();

    // Confirm checkbox
    const confirmBox = screen.getByRole('checkbox');
    await user.click(confirmBox);

    // Click Submit
    const submitBtn = screen.getByRole('button', { name: /Submit Claim/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalled();
      expect(screen.getByText(/Claim #CLM-2026-A83B1/i)).toBeInTheDocument();
    });
  });
});
