import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VirtualGlassCard } from '@/components/cards/virtual-glass-card';
import { Card } from '@/types';

const mockCard: Card = {
  id: 'card-1',
  customerId: 'cust-1',
  cardNumberLast4: '4821',
  cardNetwork: 'AMEX',
  cardTier: 'PLATINUM',
  cardholderName: 'Alex Carter',
  expiryMonth: 12,
  expiryYear: 2028,
  status: 'ACTIVE',
  createdAt: '2026-09-01T12:00:00Z',
};

describe('Virtual Glass Card Component', () => {
  it('renders cardholder name, tier, last 4 digits, and active status badge', () => {
    render(<VirtualGlassCard card={mockCard} />);

    expect(screen.getByText(/Platinum Card/i)).toBeInTheDocument();
    expect(screen.getByText(/4821/i)).toBeInTheDocument();
    expect(screen.getByText(/Alex Carter/i)).toBeInTheDocument();
    expect(screen.getByText(/12\/28/i)).toBeInTheDocument();
    expect(screen.getByText(/ACTIVE/i)).toBeInTheDocument();
  });
});
