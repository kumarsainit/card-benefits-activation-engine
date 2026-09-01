'use client';

import * as React from 'react';
import Link from 'next/link';
import { FileText, Plus, ShieldCheck, ArrowRight, Clock, CheckCircle } from '@phosphor-icons/react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useClaims } from '@/features/claims/use-claims';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function ClaimsPage() {
  const { data: claims = [], isLoading } = useClaims();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'PAID':
        return <Badge variant="success">{status}</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">{status}</Badge>;
      case 'ADDITIONAL_INFORMATION_REQUIRED':
        return <Badge variant="warning">ACTION REQUIRED</Badge>;
      case 'UNDER_REVIEW':
      case 'SUBMITTED':
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-6 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl glass-primary border border-slate-200/80 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Badge variant="default">Claims Portal</Badge>
              <span className="text-xs text-muted-foreground">&bull; Tracking & Adjudication</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Filed Protection Claims</h1>
            <p className="text-xs text-muted-foreground">
              Monitor the adjudication status, uploaded evidence, and payouts for your active insurance claims.
            </p>
          </div>

          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="rounded-xl text-xs font-semibold">
              Find New Opportunities
            </Button>
          </Link>
        </div>

        {/* Claims Table / List */}
        {isLoading ? (
          <div className="h-64 rounded-2xl glass-primary animate-pulse" />
        ) : claims.length > 0 ? (
          <div className="overflow-x-auto rounded-3xl glass-primary border border-slate-200/80 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-muted-foreground uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Claim Ref</th>
                  <th className="py-3 px-4">Benefit</th>
                  <th className="py-3 px-4">Merchant</th>
                  <th className="py-3 px-4 text-right">Requested</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Filing Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 font-medium">
                {claims.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                      {c.claimReferenceNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-foreground">
                      {c.benefitName || c.benefitType || 'Protection Policy'}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground truncate max-w-[160px]">
                      {c.merchantName || 'Enrolled Merchant'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-foreground">
                      {formatCurrency(c.requestedAmount)}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(c.status)}</td>
                    <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                      {formatDate(c.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/claims/${c.id}`}
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
        ) : (
          <div className="text-center py-16 px-6 rounded-3xl glass-secondary border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto opacity-40" weight="duotone" />
            <h3 className="text-sm font-semibold text-foreground">No Claims Filed Yet</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              When eligible purchase, return, or travel events occur, activate the benefit from your Dashboard to submit a prefilled claim.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
