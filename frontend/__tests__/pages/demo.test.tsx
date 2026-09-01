import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import DemoRunnerPage from '@/app/demo/page';
import { AuthProvider } from '@/providers/auth-provider';
import { QueryProvider } from '@/providers/query-provider';
import { apiClient } from '@/services/api-client';

vi.mock('next/navigation', () => ({
  usePathname: () => '/demo',
  useRouter: () => ({ push: vi.fn() }),
}));

describe('DemoRunnerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all 4 deterministic scenarios and execution buttons', async () => {
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

    render(
      <AuthProvider>
        <QueryProvider>
          <DemoRunnerPage />
        </QueryProvider>
      </AuthProvider>
    );

    const title = await screen.findByText('End-to-End Scenario Runner');
    expect(title).toBeInTheDocument();

    expect(screen.getByText('Scenario A: Purchase Protection')).toBeInTheDocument();
    expect(screen.getByText('Scenario B: Return Protection')).toBeInTheDocument();
    expect(screen.getByText('Scenario C: Travel Delay Insurance')).toBeInTheDocument();
    expect(screen.getByText('Scenario D: Excluded Ineligible Transaction')).toBeInTheDocument();

    const runButtons = screen.getAllByRole('button', { name: /Run Scenario/i });
    expect(runButtons.length).toBe(4);
  });
});
