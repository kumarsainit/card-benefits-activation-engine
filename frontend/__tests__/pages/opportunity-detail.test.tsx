import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import OpportunityDetailPage from '@/app/opportunities/[id]/page';
import { AuthProvider } from '@/providers/auth-provider';
import { QueryProvider } from '@/providers/query-provider';
import { apiClient } from '@/services/api-client';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'opp-123' }),
  usePathname: () => '/opportunities/opp-123',
  useRouter: () => ({ push: vi.fn() }),
}));

describe('OpportunityDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders opportunity details, explainability reasons, and activation CTA', async () => {
    vi.spyOn(apiClient, 'getToken').mockReturnValue('mock.jwt.token');
    vi.spyOn(apiClient, 'getStoredUser').mockReturnValue({
      id: 'cust-1',
      email: 'customer@example.com',
      fullName: 'Alex Carter',
      role: 'ROLE_CUSTOMER',
      createdAt: new Date().toISOString(),
    });
    vi.spyOn(apiClient, 'getMe').mockResolvedValue({
      id: 'cust-1',
      email: 'customer@example.com',
      fullName: 'Alex Carter',
      role: 'ROLE_CUSTOMER',
      createdAt: new Date().toISOString(),
    });

    vi.spyOn(apiClient, 'getOpportunityById').mockResolvedValue({
      id: 'opp-123',
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
        'Purchase within 90-day protection window',
        'MCC 5732 classified as eligible retail electronics',
      ],
      requiredEvidenceList: ['Purchase Receipt', 'Damage Photo'],
      status: 'DETECTED',
      cardNetwork: 'AMEX',
      cardNumberLast4: '4821',
      createdAt: '2026-09-01T12:00:00Z',
    });

    render(
      <AuthProvider>
        <QueryProvider>
          <OpportunityDetailPage />
        </QueryProvider>
      </AuthProvider>
    );

    const merchant = await screen.findByText('Best Buy Electronics');
    expect(merchant).toBeInTheDocument();

    expect(screen.getByText('98% Rule Match')).toBeInTheDocument();
    expect(screen.getByText(/Purchase within 90-day protection window/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Activate Benefit & Start Claim/i })).toBeInTheDocument();
  });
});
