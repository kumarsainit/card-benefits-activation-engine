import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BenefitOpportunityCard } from '@/components/opportunities/benefit-opportunity-card';
import { QueryProvider } from '@/providers/query-provider';
import { BenefitOpportunity } from '@/types';

const mockOpportunity: BenefitOpportunity = {
  id: 'opp-1',
  customerId: 'cust-1',
  transactionId: 'tx-1',
  cardId: 'card-1',
  benefitId: 'ben-1',
  benefitType: 'PURCHASE_PROTECTION',
  benefitName: 'Purchase Protection',
  merchantName: 'Best Buy Electronics',
  transactionAmount: 1499.0,
  potentialClaimAmount: 1499.0,
  confidenceScore: 0.98,
  eligibilityReasons: [
    'Transaction within 90-day coverage window',
    'MCC 5732 classified as eligible retail electronics',
  ],
  requiredEvidenceList: ['Purchase Receipt', 'Item Photo'],
  status: 'DETECTED',
  cardNetwork: 'AMEX',
  cardNumberLast4: '4821',
  createdAt: new Date().toISOString(),
};

describe('BenefitOpportunityCard Component', () => {
  it('renders benefit type, merchant name, potential coverage, and match percent', () => {
    render(
      <QueryProvider>
        <BenefitOpportunityCard opportunity={mockOpportunity} />
      </QueryProvider>
    );

    expect(screen.getByText('Purchase Protection')).toBeInTheDocument();
    expect(screen.getByText('Best Buy Electronics')).toBeInTheDocument();
    expect(screen.getByText('98% Match')).toBeInTheDocument();
    expect(screen.getAllByText('$1,499.00').length).toBeGreaterThan(0);
    expect(screen.getByText(/Transaction within 90-day coverage window/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Review Benefit/i })).toBeInTheDocument();
  });
});
