import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminClaimDetailPage from '@/app/admin/claims/[id]/page';
import { AuthProvider } from '@/providers/auth-provider';
import { QueryProvider } from '@/providers/query-provider';
import { apiClient } from '@/services/api-client';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'claim-1' }),
  usePathname: () => '/admin/claims/claim-1',
  useRouter: () => ({ push: vi.fn() }),
}));

describe('AdminClaimDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders claim review facts and allows admin approval', async () => {
    const user = userEvent.setup();
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
        submissionNotes: 'Laptop screen cracked on drop',
        benefitName: 'Purchase Protection',
        merchantName: 'Best Buy Electronics',
        createdAt: '2026-09-01T12:00:00Z',
        updatedAt: '2026-09-01T12:00:00Z',
        evidences: [
          {
            id: 'ev-1',
            claimId: 'claim-1',
            fileName: 'receipt.pdf',
            fileUrl: 'https://storage/receipt.pdf',
            fileSize: 102400,
            mimeType: 'application/pdf',
            evidenceType: 'RECEIPT',
            isVerified: true,
            uploadedAt: '2026-09-01T12:05:00Z',
          },
        ],
      },
    ]);

    const reviewSpy = vi.spyOn(apiClient, 'reviewClaim').mockResolvedValue({
      id: 'claim-1',
      claimReferenceNumber: 'CLM-2026-A83B1',
      customerId: 'cust-1',
      transactionId: 'tx-1',
      cardBenefitId: 'ben-1',
      requestedAmount: 1499.0,
      approvedAmount: 1499.0,
      status: 'APPROVED',
      incidentDate: '2026-09-01T12:00:00Z',
      submissionNotes: 'Laptop screen cracked on drop',
      benefitName: 'Purchase Protection',
      merchantName: 'Best Buy Electronics',
      createdAt: '2026-09-01T12:00:00Z',
      updatedAt: '2026-09-01T14:00:00Z',
    });

    render(
      <AuthProvider>
        <QueryProvider>
          <AdminClaimDetailPage />
        </QueryProvider>
      </AuthProvider>
    );

    const refNumber = await screen.findByText('CLM-2026-A83B1');
    expect(refNumber).toBeInTheDocument();
    expect(screen.getByText('Best Buy Electronics')).toBeInTheDocument();
    expect(screen.getByText('receipt.pdf')).toBeInTheDocument();

    // Click Approve
    const approveBtn = screen.getByRole('button', { name: /Approve Claim/i });
    await user.click(approveBtn);

    // Confirm in Dialog
    const confirmBtn = await screen.findByRole('button', { name: /Confirm Approval/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(reviewSpy).toHaveBeenCalledWith('claim-1', expect.objectContaining({
        status: 'APPROVED',
        approvedAmount: 1499.0,
      }));
    });
  });
});
