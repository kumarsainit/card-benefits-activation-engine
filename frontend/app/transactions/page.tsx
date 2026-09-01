'use client';

import * as React from 'react';
import { Receipt, Funnel, MagnifyingGlass, Sparkle } from '@phosphor-icons/react';
import { AppShell } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { TransactionTable } from '@/components/transactions/transaction-table';
import { DeterministicSimulatorDrawer } from '@/components/simulator/deterministic-simulator-drawer';
import { useTransactions } from '@/features/transactions/use-transactions';

export default function TransactionsPage() {
  const { data: transactions = [], isLoading } = useTransactions();
  const [search, setSearch] = React.useState('');

  const filteredTransactions = transactions.filter((t) =>
    t.merchantName.toLowerCase().includes(search.toLowerCase()) ||
    t.categoryClassification?.toLowerCase().includes(search.toLowerCase()) ||
    t.mccCode?.includes(search)
  );

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-6 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl glass-primary border border-slate-200/80 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Badge variant="default">Card Activity</Badge>
              <span className="text-xs text-muted-foreground">&bull; Real-time Monitoring</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Card Transactions</h1>
            <p className="text-xs text-muted-foreground">
              All payment swipes ingested across your enrolled cards and evaluated for protection benefits.
            </p>
          </div>

          <DeterministicSimulatorDrawer />
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Input
              placeholder="Search merchant, category, or MCC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<MagnifyingGlass className="h-4 w-4" />}
            />
          </div>
        </div>

        {/* Transaction Table */}
        {isLoading ? (
          <div className="h-64 rounded-2xl glass-primary animate-pulse" />
        ) : (
          <TransactionTable transactions={filteredTransactions} />
        )}
      </div>
    </AppShell>
  );
}
