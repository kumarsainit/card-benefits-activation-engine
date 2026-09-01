import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminAnalyticsPage from '@/app/admin/analytics/page';
import { AuthProvider } from '@/providers/auth-provider';
import { QueryProvider } from '@/providers/query-provider';
import { apiClient } from '@/services/api-client';

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/analytics',
  useRouter: () => ({ push: vi.fn() }),
}));

describe('AdminAnalyticsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders analytics metrics and funnel breakdown for ROLE_ADMIN', async () => {
    vi.spyOn(apiClient, 'getToken').mockReturnValue('mock.jwt.token');
    vi.spyOn(apiClient, 'getStoredUser').mockReturnValue({
      id: 'admin-1',
      email: 'admin@cbae.internal',
      fullName: 'Sarah Admin',
      role: 'ROLE_ADMIN',
      createdAt: new Date().toISOString(),
    });
    vi.spyOn(apiClient, 'getMe').mockResolvedValue({
      id: 'admin-1',
      email: 'admin@cbae.internal',
      fullName: 'Sarah Admin',
      role: 'ROLE_ADMIN',
      createdAt: new Date().toISOString(),
    });

    vi.spyOn(apiClient, 'getAdminAnalytics').mockResolvedValue({
      totalPotentialValueDetected: 1499.0,
      totalOpportunitiesDetected: 3,
      totalClaimsSubmitted: 2,
      totalClaimsApproved: 1,
      totalClaimsUnderReview: 1,
      totalValueUnlockedDollars: 1499.0,
      benefitUtilizationRatePercent: 66.7,
      totalEnrolledCards: 3,
    });

    vi.spyOn(apiClient, 'getAdminClaims').mockResolvedValue([
      {
        id: 'claim-1',
        claimReferenceNumber: 'CLM-2026-A83B1',
        customerId: 'cust-1',
        transactionId: 'tx-1',
        cardBenefitId: 'ben-1',
        requestedAmount: 1499.0,
        status: 'APPROVED',
        incidentDate: '2026-09-01T12:00:00Z',
        benefitName: 'Purchase Protection',
        merchantName: 'Best Buy Electronics',
        createdAt: '2026-09-01T12:00:00Z',
        updatedAt: '2026-09-01T12:00:00Z',
      },
    ]);

    render(
      <AuthProvider>
        <QueryProvider>
          <AdminAnalyticsPage />
        </QueryProvider>
      </AuthProvider>
    );

    const title = await screen.findByText('Protection Activation Metrics');
    expect(title).toBeInTheDocument();

    expect(screen.getByText('Potential Value Detected')).toBeInTheDocument();
    expect(screen.getByText('Realized Approved Value')).toBeInTheDocument();
    expect(screen.getByText('Activation Rate')).toBeInTheDocument();
    expect(screen.getByText('Benefit Activation Funnel')).toBeInTheDocument();
    expect(screen.getByText('Purchase Protection')).toBeInTheDocument();
  });
});
