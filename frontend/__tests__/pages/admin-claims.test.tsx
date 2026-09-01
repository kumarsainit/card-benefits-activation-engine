import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminClaimsQueuePage from '@/app/admin/claims/page';
import { AuthProvider } from '@/providers/auth-provider';
import { QueryProvider } from '@/providers/query-provider';
import { apiClient } from '@/services/api-client';

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/claims',
  useRouter: () => ({ push: vi.fn() }),
}));

describe('AdminClaimsQueuePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders claims queue table and search input for ROLE_ADMIN', async () => {
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

    vi.spyOn(apiClient, 'getAdminClaims').mockResolvedValue([
      {
        id: 'claim-1',
        claimReferenceNumber: 'CLM-2026-A83B1',
        customerId: 'cust-1',
        transactionId: 'tx-1',
        cardBenefitId: 'ben-1',
        requestedAmount: 1499.0,
        status: 'SUBMITTED',
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
          <AdminClaimsQueuePage />
        </QueryProvider>
      </AuthProvider>
    );

    const title = await screen.findByText('Claims Adjudication Queue');
    expect(title).toBeInTheDocument();

    expect(screen.getByPlaceholderText(/Search reference, merchant, customer/i)).toBeInTheDocument();
    expect(screen.getByText('CLM-2026-A83B1')).toBeInTheDocument();
    expect(screen.getByText('Best Buy Electronics')).toBeInTheDocument();
  });
});
