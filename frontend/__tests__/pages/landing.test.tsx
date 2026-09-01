import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LandingPage from '@/app/page';
import { AuthProvider } from '@/providers/auth-provider';
import { QueryProvider } from '@/providers/query-provider';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('Landing Page', () => {
  it('renders hero headline, protection pillars, and trust disclosures', () => {
    render(
      <AuthProvider>
        <QueryProvider>
          <LandingPage />
        </QueryProvider>
      </AuthProvider>
    );

    // Hero check
    expect(screen.getByText(/Your card may already/i)).toBeInTheDocument();
    expect(screen.getByText(/protect more than you think/i)).toBeInTheDocument();

    // 3 Benefit Pillars check
    expect(screen.getByRole('heading', { name: /Purchase Protection/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Return Protection/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Travel Delay Insurance/i })).toBeInTheDocument();

    // Trust & Process
    expect(screen.getByText(/How the Engine Activates Benefits/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Zero Auto-Submissions/i).length).toBeGreaterThan(0);
  });
});
