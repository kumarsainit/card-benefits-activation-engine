'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ShieldCheck,
  FileText,
  CheckCircle,
  XCircle,
  WarningCircle,
  CurrencyDollar,
  Sparkle,
  Image as ImageIcon,
  Clock,
  ChatCircleText,
} from '@phosphor-icons/react';
import { AdminShell } from '@/components/layout/admin-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { ClaimTrackingTimeline } from '@/components/claims/claim-tracking-timeline';
import { useAdminClaim, useReviewClaim } from '@/features/admin/use-admin-claims';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ClaimStatus } from '@/types';
import { toast } from 'sonner';

export default function AdminClaimDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: claim, isLoading, error } = useAdminClaim(id);
  const reviewClaimMutation = useReviewClaim();

  // Dialog states
  const [activeDialog, setActiveDialog] = React.useState<'APPROVE' | 'PARTIAL' | 'REQUEST_INFO' | 'REJECT' | null>(null);
  const [approvedAmount, setApprovedAmount] = React.useState<number>(0);
  const [adjudicationNotes, setAdjudicationNotes] = React.useState<string>('');
  const [actionError, setActionError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (claim) {
      setApprovedAmount(claim.requestedAmount);
    }
  }, [claim]);

  if (isLoading) {
    return (
      <AdminShell>
        <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
          <div className="h-10 w-32 rounded-xl glass-primary" />
          <div className="h-48 rounded-3xl glass-primary" />
          <div className="h-64 rounded-2xl glass-primary" />
        </div>
      </AdminShell>
    );
  }

  if (error || !claim) {
    return (
      <AdminShell>
        <div className="max-w-md mx-auto py-20 text-center space-y-4">
          <h2 className="text-xl font-bold">Claim Not Found</h2>
          <p className="text-xs text-muted-foreground">The requested claim could not be located in the operations queue.</p>
          <Link href="/admin/claims">
            <Button variant="default" size="sm">Return to Claims Queue</Button>
          </Link>
        </div>
      </AdminShell>
    );
  }

  const handleExecuteReview = async (targetStatus: ClaimStatus) => {
    setActionError(null);

    try {
      await reviewClaimMutation.mutateAsync({
        claimId: claim.id,
        data: {
          status: targetStatus,
          approvedAmount:
            targetStatus === 'APPROVED' || targetStatus === 'PARTIALLY_APPROVED'
              ? Number(approvedAmount)
              : undefined,
          adjudicationNotes: adjudicationNotes.trim() || `Adjudicated as ${targetStatus} by Operations`,
        },
      });

      toast.success(`Claim Status Updated to ${targetStatus}`, {
        description: `Claim #${claim.claimReferenceNumber} has been updated.`,
      });
      setActiveDialog(null);
      setAdjudicationNotes('');
    } catch (err: any) {
      if (err.status === 409 || err.message?.includes('Illegal claim state transition')) {
        setActionError('This claim changed state or the transition is invalid. The latest state has been refreshed.');
      } else {
        setActionError(err.message || 'Failed to update claim determination.');
      }
    }
  };

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

  const isAdjudicable = claim.status === 'SUBMITTED' || claim.status === 'UNDER_REVIEW' || claim.status === 'ADDITIONAL_INFORMATION_REQUIRED';

  return (
    <AdminShell>
      <div className="max-w-5xl mx-auto space-y-8">
        <Link href="/admin/claims">
          <Button variant="ghost" size="sm" className="rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Claims Queue
          </Button>
        </Link>

        {/* Claim Review Header Card */}
        <div className="p-8 rounded-3xl glass-elevated border border-slate-200/90 dark:border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center space-x-3">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center">
                <FileText className="h-8 w-8" weight="duotone" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-primary">{claim.claimReferenceNumber}</span>
                  {getStatusBadge(claim.status)}
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1">
                  {claim.benefitName || claim.benefitType || 'Card Protection Claim'}
                </h1>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground">Requested Payout</p>
              <p className="text-2xl font-extrabold text-foreground">{formatCurrency(claim.requestedAmount)}</p>
              {claim.approvedAmount != null && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                  Approved: {formatCurrency(claim.approvedAmount)}
                </p>
              )}
            </div>
          </div>

          {/* Core Facts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 space-y-1">
              <span className="text-muted-foreground uppercase text-[10px] font-semibold">Merchant / Vendor</span>
              <p className="text-sm font-bold text-foreground">{claim.merchantName || 'Enrolled Merchant'}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 space-y-1">
              <span className="text-muted-foreground uppercase text-[10px] font-semibold">Incident Date</span>
              <p className="text-sm font-bold text-foreground">{formatDate(claim.incidentDate)}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 space-y-1">
              <span className="text-muted-foreground uppercase text-[10px] font-semibold">Customer ID</span>
              <p className="text-xs font-mono font-medium text-foreground truncate">{claim.customerId}</p>
            </div>
          </div>

          {/* Customer Statement */}
          {claim.submissionNotes && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cardholder Incident Statement</span>
              <p className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 text-xs text-foreground leading-relaxed">
                {claim.submissionNotes}
              </p>
            </div>
          )}

          {/* Adjudication Notes History */}
          {claim.adjudicationNotes && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Recorded Adjudication Notes</span>
              <p className="p-4 rounded-2xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 text-xs text-foreground leading-relaxed">
                {claim.adjudicationNotes}
              </p>
            </div>
          )}

          {/* Attached Evidence Review Console */}
          <div className="space-y-3 pt-4 border-t border-slate-200/60 dark:border-slate-800/60">
            <h3 className="text-sm font-bold text-foreground">Attached Evidence ({claim.evidences?.length || 0})</h3>

            {claim.evidences && claim.evidences.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {claim.evidences.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs"
                  >
                    <div className="flex items-center space-x-3 truncate max-w-[80%]">
                      <div className="h-8 w-8 rounded-lg bg-white dark:bg-slate-900 text-primary flex items-center justify-center shrink-0">
                        {ev.mimeType?.startsWith('image/') ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                      </div>
                      <div className="truncate">
                        <p className="font-semibold text-foreground truncate">{ev.fileName}</p>
                        <p className="text-[10px] text-muted-foreground">{ev.evidenceType}</p>
                      </div>
                    </div>
                    <Badge variant={ev.isVerified ? 'success' : 'secondary'} className="text-[10px]">
                      {ev.isVerified ? 'VERIFIED' : 'PENDING'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No evidence documents attached to this claim.</p>
            )}
          </div>

          {/* Claim Lifecycle Timeline */}
          <div className="pt-2">
            <ClaimTrackingTimeline
              status={claim.status}
              createdAt={claim.createdAt}
              updatedAt={claim.updatedAt}
              adjudicationNotes={claim.adjudicationNotes}
            />
          </div>

          {/* ADJUDICATION CONTROLS (Only visible for adjudicable states) */}
          {isAdjudicable && (
            <div className="pt-6 border-t border-slate-200/60 dark:border-slate-800/60 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Adjudication Determination</h3>
                  <p className="text-xs text-muted-foreground">Select an adjudication action to advance the claim lifecycle.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* 1. APPROVE FULL */}
                <Button
                  variant="default"
                  onClick={() => {
                    setApprovedAmount(claim.requestedAmount);
                    setActiveDialog('APPROVE');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs"
                >
                  <CheckCircle className="mr-1.5 h-4 w-4" weight="bold" /> Approve Claim ({formatCurrency(claim.requestedAmount)})
                </Button>

                {/* 2. PARTIAL APPROVAL */}
                <Button
                  variant="outline"
                  onClick={() => {
                    setApprovedAmount(claim.requestedAmount);
                    setActiveDialog('PARTIAL');
                  }}
                  className="rounded-xl text-xs font-semibold"
                >
                  <CurrencyDollar className="mr-1.5 h-4 w-4" /> Partial Approval
                </Button>

                {/* 3. REQUEST ADDITIONAL INFO */}
                <Button
                  variant="outline"
                  onClick={() => setActiveDialog('REQUEST_INFO')}
                  className="rounded-xl text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                >
                  <WarningCircle className="mr-1.5 h-4 w-4" /> Request Additional Info
                </Button>

                {/* 4. REJECT */}
                <Button
                  variant="destructive"
                  onClick={() => setActiveDialog('REJECT')}
                  className="rounded-xl text-xs font-semibold"
                >
                  <XCircle className="mr-1.5 h-4 w-4" /> Reject Claim
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* DIALOG: APPROVE FULL */}
        <Dialog open={activeDialog === 'APPROVE'} onOpenChange={(open) => !open && setActiveDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="h-5 w-5" weight="fill" /> Approve Claim Payout
              </DialogTitle>
              <DialogDescription className="text-xs">
                Confirm approval for Claim #{claim.claimReferenceNumber} for the full requested amount.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2 text-xs">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                <p className="text-[10px] font-semibold uppercase text-emerald-700 dark:text-emerald-400">Approved Payout Amount</p>
                <p className="text-xl font-extrabold text-foreground">{formatCurrency(claim.requestedAmount)}</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Adjudication Notes (Optional)</label>
                <Textarea
                  rows={3}
                  placeholder="e.g. Receipt verified, damage substantiated within 90-day coverage policy."
                  value={adjudicationNotes}
                  onChange={(e) => setAdjudicationNotes(e.target.value)}
                />
              </div>

              {actionError && <p className="text-destructive text-xs">{actionError}</p>}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" size="sm" onClick={() => setActiveDialog(null)}>Cancel</Button>
              <Button
                variant="default"
                size="sm"
                disabled={reviewClaimMutation.isPending}
                onClick={() => handleExecuteReview('APPROVED')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl"
              >
                {reviewClaimMutation.isPending ? 'Processing...' : 'Confirm Approval'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* DIALOG: PARTIAL APPROVAL */}
        <Dialog open={activeDialog === 'PARTIAL'} onOpenChange={(open) => !open && setActiveDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CurrencyDollar className="h-5 w-5 text-indigo-500" /> Partially Approve Claim
              </DialogTitle>
              <DialogDescription className="text-xs">
                Enter adjusted reimbursement amount and required policy justification.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Approved Amount ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={claim.requestedAmount}
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(Number(e.target.value))}
                />
                <p className="text-[10px] text-muted-foreground">Original requested: {formatCurrency(claim.requestedAmount)}</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Adjudication Rationale (Required)</label>
                <Textarea
                  rows={3}
                  placeholder="e.g. Approved item cost after deducting non-covered expedited shipping fees."
                  value={adjudicationNotes}
                  onChange={(e) => setAdjudicationNotes(e.target.value)}
                />
              </div>

              {actionError && <p className="text-destructive text-xs">{actionError}</p>}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" size="sm" onClick={() => setActiveDialog(null)}>Cancel</Button>
              <Button
                variant="default"
                size="sm"
                disabled={approvedAmount <= 0 || approvedAmount > claim.requestedAmount || reviewClaimMutation.isPending}
                onClick={() => handleExecuteReview('PARTIALLY_APPROVED')}
                className="font-semibold rounded-xl"
              >
                {reviewClaimMutation.isPending ? 'Processing...' : 'Confirm Partial Approval'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* DIALOG: REQUEST ADDITIONAL INFO */}
        <Dialog open={activeDialog === 'REQUEST_INFO'} onOpenChange={(open) => !open && setActiveDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <WarningCircle className="h-5 w-5" /> Request Additional Evidence
              </DialogTitle>
              <DialogDescription className="text-xs">
                Request supplementary documents or clarification from the cardholder.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Requested Information Details</label>
                <Textarea
                  rows={3}
                  placeholder="e.g. Please upload an itemized purchase receipt showing breakdown and date."
                  value={adjudicationNotes}
                  onChange={(e) => setAdjudicationNotes(e.target.value)}
                />
              </div>

              {actionError && <p className="text-destructive text-xs">{actionError}</p>}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" size="sm" onClick={() => setActiveDialog(null)}>Cancel</Button>
              <Button
                variant="default"
                size="sm"
                disabled={!adjudicationNotes.trim() || reviewClaimMutation.isPending}
                onClick={() => handleExecuteReview('ADDITIONAL_INFORMATION_REQUIRED')}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl"
              >
                {reviewClaimMutation.isPending ? 'Processing...' : 'Send Request to Cardholder'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* DIALOG: REJECT CLAIM */}
        <Dialog open={activeDialog === 'REJECT'} onOpenChange={(open) => !open && setActiveDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" weight="fill" /> Reject Claim
              </DialogTitle>
              <DialogDescription className="text-xs">
                Deny Claim #{claim.claimReferenceNumber}. This is a consequential action.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Denial Reason (Required)</label>
                <Textarea
                  rows={3}
                  placeholder="e.g. Incident occurred outside the active 90-day coverage window from original purchase."
                  value={adjudicationNotes}
                  onChange={(e) => setAdjudicationNotes(e.target.value)}
                />
              </div>

              {actionError && <p className="text-destructive text-xs">{actionError}</p>}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" size="sm" onClick={() => setActiveDialog(null)}>Cancel</Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={!adjudicationNotes.trim() || reviewClaimMutation.isPending}
                onClick={() => handleExecuteReview('REJECTED')}
                className="font-semibold rounded-xl"
              >
                {reviewClaimMutation.isPending ? 'Processing...' : 'Confirm Rejection'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminShell>
  );
}
