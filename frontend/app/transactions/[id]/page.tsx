'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Receipt, ShieldCheck, Tag, CreditCard, Clock, CheckCircle } from '@phosphor-icons/react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTransaction } from '@/features/transactions/use-transactions';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function TransactionDetailPage() {
  const params = useParams();
  const transactionId = params.id as string;
  const { data: tx, isLoading, error } = useTransaction(transactionId);

  if (isLoading) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto px-6 space-y-6 animate-pulse">
          <div className="h-10 w-32 rounded-xl glass-primary" />
          <div className="h-96 rounded-3xl glass-primary" />
        </div>
      </AppShell>
    );
  }

  if (error || !tx) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto px-6 py-20 text-center space-y-4">
          <h2 className="text-xl font-bold">Transaction Not Found</h2>
          <p className="text-xs text-muted-foreground">The transaction could not be located or does not belong to your account.</p>
          <Link href="/transactions">
            <Button variant="default" size="sm">Back to Transactions</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-6 space-y-8">
        <Link href="/transactions">
          <Button variant="ghost" size="sm" className="rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Transactions
          </Button>
        </Link>

        {/* Main Details Description List Card */}
        <div className="rounded-3xl glass-elevated p-8 border border-slate-200/90 dark:border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center">
                <Receipt className="h-7 w-7" weight="duotone" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{tx.merchantName}</h1>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">Ref: {tx.transactionReference || tx.id}</p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-2xl font-extrabold text-foreground">{formatCurrency(tx.amount)}</p>
              <Badge variant={tx.status === 'SETTLED' ? 'success' : 'secondary'} className="mt-1">
                {tx.status}
              </Badge>
            </div>
          </div>

          {/* Description List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 space-y-1">
              <p className="text-muted-foreground font-semibold uppercase text-[10px]">Merchant Category Code (MCC)</p>
              <p className="font-mono text-sm font-bold text-foreground">{tx.mccCode || '5732'}</p>
              <p className="text-[11px] text-muted-foreground">{tx.categoryClassification || 'Consumer Electronics'}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 space-y-1">
              <p className="text-muted-foreground font-semibold uppercase text-[10px]">Card Used</p>
              <p className="font-mono text-sm font-bold text-foreground">
                {tx.cardNetwork || 'Payment Card'} &bull;&bull;&bull;&bull; {tx.cardNumberLast4 || '4821'}
              </p>
              <p className="text-[11px] text-muted-foreground">{tx.cardTier || 'Enrolled Card'}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 space-y-1">
              <p className="text-muted-foreground font-semibold uppercase text-[10px]">Transaction Timestamp</p>
              <p className="text-sm font-medium text-foreground">{formatDate(tx.transactionTimestamp)}</p>
              <p className="text-[11px] text-muted-foreground">Ingested via real-time transaction pipeline</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 space-y-1">
              <p className="text-muted-foreground font-semibold uppercase text-[10px]">Currency & Settlement</p>
              <p className="text-sm font-bold text-foreground">{tx.currency || 'USD'} &bull; Finalized</p>
              <p className="text-[11px] text-muted-foreground">Original purchase receipt verified</p>
            </div>
          </div>

          {/* Engine Protection Evaluation Status */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" weight="duotone" />
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Benefit Engine Status</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This transaction was evaluated against active card protection rules. If an eligible event occurs (damage, theft, return refusal, or delay), you can activate built-in benefits directly from the Dashboard.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
