'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ShieldCheck,
  ArrowCounterClockwise,
  AirplaneTakeoff,
  Clock,
  Sparkle,
  CheckCircle,
  Receipt,
  CreditCard,
  FileText,
  Info,
  Lightning,
} from '@phosphor-icons/react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ClaimActivationWizard } from '@/components/claims/claim-activation-wizard';
import { useOpportunity } from '@/features/opportunities/use-opportunities';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function OpportunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: opp, isLoading, error } = useOpportunity(id);
  const [isWizardOpen, setIsWizardOpen] = React.useState(false);

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

  if (error || !opp) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto px-6 py-20 text-center space-y-4">
          <h2 className="text-xl font-bold">Benefit Opportunity Not Found</h2>
          <p className="text-xs text-muted-foreground">The requested benefit opportunity could not be located or has expired.</p>
          <Link href="/dashboard">
            <Button variant="default" size="sm">Back to Dashboard</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const getBenefitIcon = () => {
    switch (opp.benefitType) {
      case 'PURCHASE_PROTECTION':
        return <ShieldCheck className="h-8 w-8 text-indigo-500" weight="duotone" />;
      case 'RETURN_PROTECTION':
        return <ArrowCounterClockwise className="h-8 w-8 text-purple-500" weight="duotone" />;
      case 'TRAVEL_DELAY':
        return <AirplaneTakeoff className="h-8 w-8 text-sky-500" weight="duotone" />;
      default:
        return <Sparkle className="h-8 w-8 text-primary" weight="duotone" />;
    }
  };

  const matchPercent = Math.round(
    (typeof opp.confidenceScore === 'number'
      ? opp.confidenceScore
      : parseFloat(opp.confidenceScore || '0.95')) * 100
  );

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-6 space-y-8">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Dashboard
          </Button>
        </Link>

        {/* Top Benefit Opportunity Card */}
        <div className="p-8 rounded-3xl glass-elevated border border-slate-200/90 dark:border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center space-x-3">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                {getBenefitIcon()}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <Badge variant="default">{opp.benefitName}</Badge>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    {matchPercent}% Rule Match
                  </span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1">{opp.merchantName}</h1>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground">Potential Protection Coverage</p>
              <p className="text-2xl font-extrabold text-primary">{formatCurrency(opp.potentialClaimAmount)}</p>
            </div>
          </div>

          {/* Transaction Fact Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 space-y-1">
              <span className="text-muted-foreground uppercase text-[10px] font-semibold">Purchase Amount</span>
              <p className="text-sm font-bold text-foreground">{formatCurrency(opp.transactionAmount)}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 space-y-1">
              <span className="text-muted-foreground uppercase text-[10px] font-semibold">Enrolled Payment Card</span>
              <p className="text-sm font-bold text-foreground">
                {opp.cardNetwork || 'Payment Card'} &bull;&bull;&bull;&bull; {opp.cardNumberLast4 || '4821'}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 space-y-1">
              <span className="text-muted-foreground uppercase text-[10px] font-semibold">Coverage Status</span>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">90-Day Window Active</p>
            </div>
          </div>

          {/* Explainability Section: WHY YOU MAY BE ELIGIBLE */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center space-x-2">
              <Sparkle className="h-4 w-4 text-indigo-500" weight="bold" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Why You May Be Eligible</h3>
            </div>
            <div className="p-4 rounded-2xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 space-y-2">
              {opp.eligibilityReasons && opp.eligibilityReasons.length > 0 ? (
                <ul className="space-y-2 text-xs">
                  {opp.eligibilityReasons.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" weight="fill" />
                      <span className="text-foreground leading-relaxed">{reason}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">Transaction matches card protection criteria.</p>
              )}
            </div>
          </div>

          {/* Evidence Checklist */}
          {opp.requiredEvidenceList && opp.requiredEvidenceList.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-500" /> Recommended Evidence Checklist
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {opp.requiredEvidenceList.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0" />
                    <span className="text-foreground font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Policy Information Disclaimer */}
          <div className="p-3.5 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-start gap-2.5 text-[11px] text-muted-foreground leading-relaxed">
            <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p>
              <strong>Configured Policy Note:</strong> The confidence score represents our automated rule-matching engine. Submitting a claim generates an official prefilled draft for review; final approval is subject to policy verification by your card issuer.
            </p>
          </div>

          {/* Primary CTA: Launch Claim Activation Wizard */}
          <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              Ready to claim reimbursement? 85% of claim details will be pre-filled automatically.
            </p>
            <Button
              variant="default"
              size="lg"
              onClick={() => setIsWizardOpen(true)}
              className="w-full sm:w-auto font-bold rounded-xl shadow-lg shadow-primary/25"
            >
              <Lightning className="mr-2 h-4 w-4" weight="fill" /> Activate Benefit & Start Claim
            </Button>
          </div>
        </div>

        {/* Claim Activation Modal Dialog */}
        <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lightning className="h-5 w-5 text-indigo-500" weight="fill" /> Benefit Claim Activation
              </DialogTitle>
              <DialogDescription className="text-xs">
                Activate {opp.benefitName} for {opp.merchantName} ({formatCurrency(opp.transactionAmount)}).
              </DialogDescription>
            </DialogHeader>

            <ClaimActivationWizard
              opportunity={opp}
              onSuccess={() => {
                // Keep modal open on success step
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
