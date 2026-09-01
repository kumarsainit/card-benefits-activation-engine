import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Navbar } from '@/components/layout/navbar';
import { AuthProvider } from '@/providers/auth-provider';
import { QueryProvider } from '@/providers/query-provider';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('Navbar Component', () => {
  it('renders brand logo and public navigation links for unauthenticated visitors', () => {
    render(
      <AuthProvider>
        <QueryProvider>
          <Navbar />
        </QueryProvider>
      </AuthProvider>
    );

    expect(screen.getByText(/Card Benefits/i)).toBeInTheDocument();
    expect(screen.getByText(/ACTIVATION ENGINE/i)).toBeInTheDocument();
    expect(screen.getByText(/How It Works/i)).toBeInTheDocument();
    expect(screen.getByText(/Protection Types/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });
});
