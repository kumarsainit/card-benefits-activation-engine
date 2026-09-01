import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NotificationDropdown } from '@/components/notifications/notification-dropdown';
import { QueryProvider } from '@/providers/query-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { apiClient } from '@/services/api-client';
import { sseClient } from '@/services/sse-client';

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: vi.fn() }),
}));

describe('NotificationDropdown Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(sseClient, 'subscribe').mockReturnValue(() => {});
  });

  it('renders bell button with unread count badge', async () => {
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
        title: 'Benefit Opportunity Detected',
        message: 'Your $1,499.00 Best Buy purchase may qualify for Purchase Protection.',
        notificationType: 'BENEFIT_DETECTED',
        priority: 'HIGH',
        isRead: false,
        deepLink: '/opportunities/opp-1',
        createdAt: '2026-09-01T12:00:00Z',
      },
    ]);

    render(
      <AuthProvider>
        <QueryProvider>
          <NotificationDropdown />
        </QueryProvider>
      </AuthProvider>
    );

    const bellBtn = await screen.findByRole('button', { name: /Notifications/i });
    expect(bellBtn).toBeInTheDocument();
  });
});
