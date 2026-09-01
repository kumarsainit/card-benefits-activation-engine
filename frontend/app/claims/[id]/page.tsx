'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  ShieldCheck,
  Clock,
  CheckCircle,
  WarningCircle,
  Plus,
  PaperPlaneRight,
  CurrencyDollar,
  Receipt,
  Image as ImageIcon,
} from '@phosphor-icons/react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { EvidenceUploader, UploadedEvidenceItem } from '@/components/claims/evidence-uploader';
import { useClaim, useAddEvidence } from '@/features/claims/use-claims';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function ClaimDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: claim, isLoading, error } = useClaim(id);
  const addEvidenceMutation = useAddEvidence();

  const [isEvidenceDialogOpen, setIsEvidenceDialogOpen] = React.useState(false);
  const [evidenceList, setEvidenceList] = React.useState<UploadedEvidenceItem[]>([]);

  if (isLoading) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto px-6 space-y-6 animate-pulse">
          <div className="h-10 w-32 rounded-xl glass-primary" />
          <div className="h-48 rounded-3xl glass-primary" />
          <div className="h-64 rounded-2xl glass-primary" />
        </div>
      </AppShell>
    );
  }

  if (error || !claim) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto px-6 py-20 text-center space-y-4">
          <h2 className="text-xl font-bold">Claim Not Found</h2>
          <p className="text-xs text-muted-foreground">The requested claim could not be located or does not belong to your account.</p>
          <Link href="/claims">
            <Button variant="default" size="sm">Back to Claims</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const handleUploadAdditionalEvidence = async () => {
    if (evidenceList.length === 0) return;

    try {
      for (const item of evidenceList) {
        await addEvidenceMutation.mutateAsync({
          claimId: claim.id,
          evidence: {
            evidenceType: item.evidenceType,
            fileName: item.fileName,
            fileUrl: item.fileUrl,
            fileSize: item.fileSize,
            mimeType: item.mimeType,
          },
        });
      }
      toast.success('Evidence Attached Successfully');
      setIsEvidenceDialogOpen(false);
      setEvidenceList([]);
    } catch (err: any) {
      toast.error('Failed to attach evidence', {
        description: err.message || 'Error uploading file.',
      });
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

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-6 space-y-8">
        <Link href="/claims">
          <Button variant="ghost" size="sm" className="rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Claims
          </Button>
        </Link>

        {/* Claim Main Header Card */}
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
              <p className="text-[10px] uppercase font-semibold text-muted-foreground">Requested Amount</p>
              <p className="text-2xl font-extrabold text-foreground">{formatCurrency(claim.requestedAmount)}</p>
              {claim.approvedAmount != null && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                  Approved: {formatCurrency(claim.approvedAmount)}
                </p>
              )}
            </div>
          </div>

          {/* Claim Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 space-y-1">
              <span className="text-muted-foreground uppercase text-[10px] font-semibold">Incident Date</span>
              <p className="text-sm font-bold text-foreground">{formatDate(claim.incidentDate)}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 space-y-1">
              <span className="text-muted-foreground uppercase text-[10px] font-semibold">Submitted On</span>
              <p className="text-sm font-bold text-foreground">{formatDate(claim.createdAt)}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 space-y-1">
              <span className="text-muted-foreground uppercase text-[10px] font-semibold">Merchant Reference</span>
              <p className="text-sm font-bold text-foreground">{claim.merchantName || 'Enrolled Merchant'}</p>
            </div>
          </div>

          {/* Submission Notes */}
          {claim.submissionNotes && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer Statement</span>
              <p className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 text-xs text-foreground leading-relaxed">
                {claim.submissionNotes}
              </p>
            </div>
          )}

          {/* Adjudication Notes (if evaluated by Admin) */}
          {claim.adjudicationNotes && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Adjudicator Feedback</span>
              <p className="p-4 rounded-2xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 text-xs text-foreground leading-relaxed">
                {claim.adjudicationNotes}
              </p>
            </div>
          )}

          {/* Attached Evidences Section */}
          <div className="space-y-4 pt-4 border-t border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Attached Evidence ({claim.evidences?.length || 0})</h3>
                <p className="text-xs text-muted-foreground">Documents submitted to substantiate this protection claim.</p>
              </div>

              <Dialog open={isEvidenceDialogOpen} onOpenChange={setIsEvidenceDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-xl text-xs font-semibold">
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Attach Additional File
                  </Button>
                </DialogTrigger>

                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Attach Supplementary Evidence</DialogTitle>
                    <DialogDescription className="text-xs">
                      Upload receipts, damage photos, or issuer request documents for Claim #{claim.claimReferenceNumber}.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="pt-2">
                    <EvidenceUploader
                      evidenceList={evidenceList}
                      onChange={setEvidenceList}
                      suggestedEvidence={['Receipt', 'Damage Photo', 'Denial Letter']}
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      variant="default"
                      disabled={evidenceList.length === 0 || addEvidenceMutation.isPending}
                      onClick={handleUploadAdditionalEvidence}
                      className="w-full font-semibold rounded-xl"
                    >
                      {addEvidenceMutation.isPending ? 'Uploading...' : 'Save & Attach to Claim'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

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
        </div>
      </div>
    </AppShell>
  );
}
