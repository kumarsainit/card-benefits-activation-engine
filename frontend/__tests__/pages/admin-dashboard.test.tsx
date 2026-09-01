import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminDashboardPage from '@/app/admin/page';
import { AuthProvider } from '@/providers/auth-provider';
import { QueryProvider } from '@/providers/query-provider';
import { apiClient } from '@/services/api-client';

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin',
  useRouter: () => ({ push: vi.fn() }),
}));

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders operational metrics and priority review queue for ROLE_ADMIN', async () => {
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
          <AdminDashboardPage />
        </QueryProvider>
      </AuthProvider>
    );

    const title = await screen.findByText('Claims Review & Operations');
    expect(title).toBeInTheDocument();

    expect(screen.getByText('Active Queue')).toBeInTheDocument();
    expect(screen.getByText('Action Required')).toBeInTheDocument();
    expect(screen.getByText('Approved Payouts')).toBeInTheDocument();
    expect(screen.getByText('CLM-2026-A83B1')).toBeInTheDocument();
  });

  it('blocks access and displays Access Restricted for ROLE_CUSTOMER', async () => {
    vi.spyOn(apiClient, 'getToken').mockReturnValue('mock.jwt.token');
    vi.spyOn(apiClient, 'getStoredUser').mockReturnValue({
      id: 'cust-1',
      email: 'customer@example.com',
      fullName: 'Alex Customer',
      role: 'ROLE_CUSTOMER',
      createdAt: new Date().toISOString(),
    });
    vi.spyOn(apiClient, 'getMe').mockResolvedValue({
      id: 'cust-1',
      email: 'customer@example.com',
      fullName: 'Alex Customer',
      role: 'ROLE_CUSTOMER',
      createdAt: new Date().toISOString(),
    });

    render(
      <AuthProvider>
        <QueryProvider>
          <AdminDashboardPage />
        </QueryProvider>
      </AuthProvider>
    );

    const restrictedText = await screen.findByText(/Access Restricted/i);
    expect(restrictedText).toBeInTheDocument();
    expect(screen.getByText(/restricted to authorized financial operations personnel with/i)).toBeInTheDocument();
  });
});
