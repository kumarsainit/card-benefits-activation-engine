'use client';

import * as React from 'react';
import Link from 'next/link';
import { Transaction } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Receipt, Tag, Clock } from '@phosphor-icons/react';

interface TransactionTableProps {
  transactions: Transaction[];
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-12 px-4 rounded-2xl glass-secondary border border-dashed border-slate-300 dark:border-slate-700">
        <Receipt className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
        <h4 className="text-sm font-semibold text-foreground">No Transactions Recorded</h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
          Swipe your enrolled card or use the Scenario Simulator in the top-right to test transaction ingestion.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto rounded-2xl glass-primary border border-slate-200/80 dark:border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-muted-foreground uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Merchant</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 font-medium">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">{formatDate(tx.transactionTimestamp)}</td>
                <td className="py-3.5 px-4 font-semibold text-foreground truncate max-w-[200px]">
                  {tx.merchantName}
                </td>
                <td className="py-3.5 px-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-muted-foreground">
                    {tx.categoryClassification || 'RETAIL'}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right font-bold text-foreground">
                  {formatCurrency(tx.amount)}
                </td>
                <td className="py-3.5 px-4">
                  <Badge variant={tx.status === 'SETTLED' ? 'success' : 'secondary'} className="text-[10px]">
                    {tx.status}
                  </Badge>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <Link
                    href={`/transactions/${tx.id}`}
                    className="inline-flex items-center text-xs font-semibold text-primary hover:underline"
                  >
                    Details <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Cards */}
      <div className="md:hidden space-y-3">
        {transactions.map((tx) => (
          <Link key={tx.id} href={`/transactions/${tx.id}`} className="block">
            <div className="p-4 rounded-2xl glass-primary border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-sm text-foreground">{tx.merchantName}</p>
                  <p className="text-[10px] text-muted-foreground">{formatDate(tx.transactionTimestamp)}</p>
                </div>
                <p className="font-bold text-sm text-foreground">{formatCurrency(tx.amount)}</p>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-800/50 text-xs">
                <span className="text-[11px] text-muted-foreground">{tx.categoryClassification || 'RETAIL'}</span>
                <Badge variant={tx.status === 'SETTLED' ? 'success' : 'secondary'} className="text-[10px]">
                  {tx.status}
                </Badge>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
