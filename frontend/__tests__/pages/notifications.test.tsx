import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import NotificationCenterPage from '@/app/notifications/page';
import { AuthProvider } from '@/providers/auth-provider';
import { QueryProvider } from '@/providers/query-provider';
import { apiClient } from '@/services/api-client';

vi.mock('next/navigation', () => ({
  usePathname: () => '/notifications',
  useRouter: () => ({ push: vi.fn() }),
}));

describe('NotificationCenterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders notification center header, tabs, and notification alerts', async () => {
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

    vi.spyOn(apiClient, 'getNotifications').mockResolvedValue([
      {
        id: 'notif-1',
        customerId: 'cust-1',
        title: 'Return Protection Opportunity',
        message: 'Your $280.00 Zara clothing purchase is eligible for Return Protection.',
        notificationType: 'BENEFIT_DETECTED',
        priority: 'MEDIUM',
        isRead: false,
        deepLink: '/opportunities/opp-2',
        createdAt: '2026-09-01T12:00:00Z',
      },
      {
        id: 'notif-2',
        customerId: 'cust-1',
        title: 'Claim Approved: CLM-2026-A83B1',
        message: 'Your Purchase Protection claim for $1,499.00 has been approved.',
        notificationType: 'CLAIM_STATUS_UPDATE',
        priority: 'HIGH',
        isRead: true,
        deepLink: '/claims/claim-1',
        createdAt: '2026-09-01T13:00:00Z',
      },
    ]);

    render(
      <AuthProvider>
        <QueryProvider>
          <NotificationCenterPage />
        </QueryProvider>
      </AuthProvider>
    );

    const title = await screen.findByText('Alerts & Protection Updates');
    expect(title).toBeInTheDocument();

    const returnNotif = await screen.findByText('Return Protection Opportunity');
    expect(returnNotif).toBeInTheDocument();

    const claimNotif = await screen.findByText('Claim Approved: CLM-2026-A83B1');
    expect(claimNotif).toBeInTheDocument();
  });
});
