'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Queue,
  Clock,
  CheckCircle,
  XCircle,
  WarningCircle,
  ArrowRight,
  ShieldCheck,
  FileText,
  User,
} from '@phosphor-icons/react';
import { AdminShell } from '@/components/layout/admin-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAdminClaims } from '@/features/admin/use-admin-claims';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function AdminDashboardPage() {
  const { data: claims = [], isLoading } = useAdminClaims();

  const pendingClaims = claims.filter(
    (c) => c.status === 'SUBMITTED' || c.status === 'UNDER_REVIEW'
  );
  const actionRequiredClaims = claims.filter(
    (c) => c.status === 'ADDITIONAL_INFORMATION_REQUIRED'
  );
  const approvedClaims = claims.filter(
    (c) => c.status === 'APPROVED' || c.status === 'PAID'
  );
  const rejectedClaims = claims.filter((c) => c.status === 'REJECTED');

  const totalApprovedAmount = approvedClaims.reduce(
    (sum, c) => sum + (c.approvedAmount || c.requestedAmount || 0),
    0
  );

  return (
    <AdminShell>
      <div className="space-y-8">
        {/* Operations Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl glass-primary border border-slate-200/80 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Badge variant="default">Operations Center</Badge>
              <span className="text-xs text-muted-foreground">&bull; Adjudication Console</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Claims Review & Operations</h1>
            <p className="text-xs text-muted-foreground">
              Review pre-filled protection claims, evaluate supporting receipts and delay statements, and finalize adjudication decisions.
            </p>
          </div>

          <Link href="/admin/claims">
            <Button variant="default" size="sm" className="rounded-xl font-semibold shadow-md shadow-primary/20">
              <Queue className="mr-1.5 h-4 w-4" /> Open Full Claims Queue ({pendingClaims.length})
            </Button>
          </Link>
        </div>

        {/* Operations Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl glass-primary border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Active Queue
              </span>
              <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Clock className="h-4 w-4" weight="bold" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-foreground">{pendingClaims.length}</p>
            <p className="text-[11px] text-muted-foreground">Pending adjudicator review</p>
          </div>

          <div className="p-5 rounded-3xl glass-primary border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Action Required
              </span>
              <div className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <WarningCircle className="h-4 w-4" weight="bold" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-foreground">{actionRequiredClaims.length}</p>
            <p className="text-[11px] text-muted-foreground">Awaiting customer evidence</p>
          </div>

          <div className="p-5 rounded-3xl glass-primary border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Approved Payouts
              </span>
              <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <CheckCircle className="h-4 w-4" weight="bold" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalApprovedAmount)}
            </p>
            <p className="text-[11px] text-muted-foreground">{approvedClaims.length} claims approved</p>
          </div>

          <div className="p-5 rounded-3xl glass-primary border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-destructive">
                Rejected Claims
              </span>
              <div className="h-7 w-7 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
                <XCircle className="h-4 w-4" weight="bold" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-foreground">{rejectedClaims.length}</p>
            <p className="text-[11px] text-muted-foreground">Denied policy claims</p>
          </div>
        </div>

        {/* Priority Adjudication Queue */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">Priority Review Queue</h2>
              <p className="text-xs text-muted-foreground">Claims currently awaiting operational review and determination.</p>
            </div>

            <Link href="/admin/claims">
              <Button variant="ghost" size="sm" className="text-xs font-semibold">
                View All Claims <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="h-48 rounded-2xl glass-primary animate-pulse" />
          ) : pendingClaims.length > 0 ? (
            <div className="overflow-x-auto rounded-3xl glass-primary border border-slate-200/80 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-muted-foreground uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Claim Ref</th>
                    <th className="py-3 px-4">Benefit Type</th>
                    <th className="py-3 px-4">Merchant</th>
                    <th className="py-3 px-4 text-right">Requested</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Filing Date</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 font-medium">
                  {pendingClaims.slice(0, 5).map((claim) => (
                    <tr key={claim.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-foreground">
                        {claim.claimReferenceNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-foreground">
                        {claim.benefitName || claim.benefitType}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground truncate max-w-[160px]">
                        {claim.merchantName || 'Enrolled Merchant'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-foreground">
                        {formatCurrency(claim.requestedAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="warning">{claim.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                        {formatDate(claim.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/claims/${claim.id}`}
                          className="inline-flex items-center text-xs font-semibold text-primary hover:underline"
                        >
                          Review <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 px-6 rounded-3xl glass-secondary border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
              <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto opacity-70" weight="duotone" />
              <h3 className="text-sm font-semibold text-foreground">All Caught Up</h3>
              <p className="text-xs text-muted-foreground">There are no pending claims in the active adjudication queue.</p>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
