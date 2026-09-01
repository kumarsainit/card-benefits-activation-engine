'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Queue,
  MagnifyingGlass,
  ArrowRight,
  CheckCircle,
  Clock,
  WarningCircle,
  XCircle,
  FileText,
} from '@phosphor-icons/react';
import { AdminShell } from '@/components/layout/admin-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAdminClaims } from '@/features/admin/use-admin-claims';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Claim } from '@/types';

export default function AdminClaimsQueuePage() {
  const { data: claims = [], isLoading } = useAdminClaims();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');

  const filteredClaims = claims.filter((claim) => {
    // 1. Status Tab filter
    if (statusFilter === 'PENDING') {
      if (claim.status !== 'SUBMITTED' && claim.status !== 'UNDER_REVIEW') return false;
    } else if (statusFilter === 'ACTION_REQUIRED') {
      if (claim.status !== 'ADDITIONAL_INFORMATION_REQUIRED') return false;
    } else if (statusFilter === 'APPROVED') {
      if (claim.status !== 'APPROVED' && claim.status !== 'PAID') return false;
    } else if (statusFilter === 'REJECTED') {
      if (claim.status !== 'REJECTED') return false;
    }

    // 2. Search Query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRef = claim.claimReferenceNumber?.toLowerCase().includes(q);
      const matchMerchant = claim.merchantName?.toLowerCase().includes(q);
      const matchBenefit = (claim.benefitName || claim.benefitType)?.toLowerCase().includes(q);
      const matchCustomer = claim.customerId?.toLowerCase().includes(q);
      if (!matchRef && !matchMerchant && !matchBenefit && !matchCustomer) return false;
    }

    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'PAID':
        return <Badge variant="success">{status}</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">{status}</Badge>;
      case 'ADDITIONAL_INFORMATION_REQUIRED':
        return <Badge variant="warning">ACTION REQUIRED</Badge>;
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Claims Adjudication Queue</h1>
            <p className="text-xs text-muted-foreground">
              Evaluate, verify, approve, or reject customer protection claims across all enrolled cards.
            </p>
          </div>

          <div className="w-full sm:w-72 relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search reference, merchant, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl"
            />
          </div>
        </div>

        {/* Tab Filters */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="ALL">All ({claims.length})</TabsTrigger>
            <TabsTrigger value="PENDING">
              Pending ({claims.filter((c) => c.status === 'SUBMITTED' || c.status === 'UNDER_REVIEW').length})
            </TabsTrigger>
            <TabsTrigger value="ACTION_REQUIRED">
              Action Required ({claims.filter((c) => c.status === 'ADDITIONAL_INFORMATION_REQUIRED').length})
            </TabsTrigger>
            <TabsTrigger value="APPROVED">
              Approved ({claims.filter((c) => c.status === 'APPROVED' || c.status === 'PAID').length})
            </TabsTrigger>
            <TabsTrigger value="REJECTED">
              Rejected ({claims.filter((c) => c.status === 'REJECTED').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={statusFilter} className="pt-4">
            {isLoading ? (
              <div className="h-64 rounded-2xl glass-primary animate-pulse" />
            ) : filteredClaims.length > 0 ? (
              <div className="overflow-x-auto rounded-3xl glass-primary border border-slate-200/80 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-muted-foreground uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Claim Ref</th>
                      <th className="py-3 px-4">Benefit</th>
                      <th className="py-3 px-4">Merchant</th>
                      <th className="py-3 px-4 text-right">Requested</th>
                      <th className="py-3 px-4 text-right">Approved</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Filing Date</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 font-medium">
                    {filteredClaims.map((claim) => (
                      <tr key={claim.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                          {claim.claimReferenceNumber}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-foreground">
                          {claim.benefitName || claim.benefitType}
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground truncate max-w-[160px]">
                          {claim.merchantName || 'Enrolled Merchant'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-foreground">
                          {formatCurrency(claim.requestedAmount)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {claim.approvedAmount != null ? formatCurrency(claim.approvedAmount) : '—'}
                        </td>
                        <td className="py-3.5 px-4">{getStatusBadge(claim.status)}</td>
                        <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                          {formatDate(claim.createdAt)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/admin/claims/${claim.id}`}
                            className="inline-flex items-center text-xs font-semibold text-primary hover:underline"
                          >
                            Adjudicate <ArrowRight className="ml-1 h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16 px-6 rounded-3xl glass-secondary border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto opacity-50" weight="duotone" />
                <h3 className="text-sm font-semibold text-foreground">No Claims Match Criteria</h3>
                <p className="text-xs text-muted-foreground">Adjust your search query or tab filter to view other claims.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminShell>
  );
}
