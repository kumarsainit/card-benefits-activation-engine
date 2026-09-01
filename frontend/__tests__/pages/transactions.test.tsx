import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TransactionTable } from '@/components/transactions/transaction-table';
import { Transaction } from '@/types';

const mockTransactions: Transaction[] = [
  {
    id: 'tx-1',
    cardId: 'card-1',
    transactionReference: 'REF-123',
    merchantName: 'Apple Store Regent St',
    merchantCategory: 'RETAIL',
    categoryClassification: 'ELECTRONICS',
    mccCode: '5732',
    amount: 1299.0,
    currency: 'USD',
    transactionTimestamp: '2026-09-01T12:00:00Z',
    status: 'SETTLED',
    createdAt: '2026-09-01T12:00:00Z',
  },
];

describe('Transactions Components', () => {
  it('renders transactions list with merchant, amount, category, and status', () => {
    render(<TransactionTable transactions={mockTransactions} />);

    expect(screen.getAllByText(/Apple Store Regent St/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\$1,299.00/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ELECTRONICS/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/SETTLED/i).length).toBeGreaterThan(0);
  });

  it('renders empty state when transaction array is empty', () => {
    render(<TransactionTable transactions={[]} />);

    expect(screen.getByText(/No Transactions Recorded/i)).toBeInTheDocument();
  });
});
