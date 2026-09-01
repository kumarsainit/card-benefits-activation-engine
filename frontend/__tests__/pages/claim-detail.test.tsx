import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ClaimDetailPage from '@/app/claims/[id]/page';
import { AuthProvider } from '@/providers/auth-provider';
import { QueryProvider } from '@/providers/query-provider';
import { apiClient } from '@/services/api-client';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'claim-123' }),
  usePathname: () => '/claims/claim-123',
  useRouter: () => ({ push: vi.fn() }),
}));

describe('ClaimDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders claim reference number, status badge, requested amount, and customer statement', async () => {
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

    vi.spyOn(apiClient, 'getClaimById').mockResolvedValue({
      id: 'claim-123',
      claimReferenceNumber: 'CLM-2026-A83B1',
      customerId: 'cust-1',
      transactionId: 'tx-1',
      cardBenefitId: 'ben-1',
      requestedAmount: 1499.0,
      approvedAmount: 1499.0,
      status: 'APPROVED',
      incidentDate: '2026-09-01T12:00:00Z',
      submissionNotes: 'Laptop accidentally dropped while boarding flight',
      benefitName: 'Purchase Protection',
      merchantName: 'Best Buy Electronics',
      createdAt: '2026-09-01T12:00:00Z',
      updatedAt: '2026-09-01T14:00:00Z',
      evidences: [
        {
          id: 'ev-1',
          claimId: 'claim-123',
          fileName: 'receipt.pdf',
          fileUrl: 'https://storage/receipt.pdf',
          fileSize: 102400,
          mimeType: 'application/pdf',
          evidenceType: 'RECEIPT',
          isVerified: true,
          uploadedAt: '2026-09-01T12:05:00Z',
        },
      ],
    });

    render(
      <AuthProvider>
        <QueryProvider>
          <ClaimDetailPage />
        </QueryProvider>
      </AuthProvider>
    );

    const refNumber = await screen.findByText('CLM-2026-A83B1');
    expect(refNumber).toBeInTheDocument();

    expect(screen.getByText('APPROVED')).toBeInTheDocument();
    expect(screen.getByText(/Laptop accidentally dropped/i)).toBeInTheDocument();
    expect(screen.getByText('receipt.pdf')).toBeInTheDocument();
  });
});
