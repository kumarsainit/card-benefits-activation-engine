import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GlassCard, GlassCardTitle, GlassCardDescription } from '@/components/ui/glass-card';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

describe('Design System UI Primitives', () => {
  it('renders Button with text and handles glass variant', () => {
    render(<Button variant="glass">Activate Protection</Button>);
    const button = screen.getByRole('button', { name: /activate protection/i });
    expect(button).toBeInTheDocument();
    expect(button.className).toContain('backdrop-blur-md');
  });

  it('renders Badge with correct benefit variant styling', () => {
    render(<Badge variant="purchase">Purchase Protection</Badge>);
    const badge = screen.getByText(/purchase protection/i);
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-indigo-500/15');
  });

  it('renders GlassCard with title and description', () => {
    render(
      <GlassCard variant="purchase">
        <GlassCardTitle>Laptop Protection</GlassCardTitle>
        <GlassCardDescription>Coverage up to $10,000</GlassCardDescription>
      </GlassCard>
    );
    expect(screen.getByText(/laptop protection/i)).toBeInTheDocument();
    expect(screen.getByText(/coverage up to \$10,000/i)).toBeInTheDocument();
  });

  it('renders accessible Spinner with loading role', () => {
    render(<Spinner size="lg" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading');
  });

  it('renders Alert component with title and message', () => {
    render(
      <Alert variant="success">
        <AlertTitle>Claim Approved</AlertTitle>
        <AlertDescription>Your claim of $1,499.00 has been approved.</AlertDescription>
      </Alert>
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/claim approved/i)).toBeInTheDocument();
  });
});
