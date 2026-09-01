'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  ArrowCounterClockwise,
  AirplaneTakeoff,
  CheckCircle,
  FileText,
  CreditCard,
  Receipt,
  Sparkle,
  LockKey,
  ArrowRight,
  ArrowLeft,
  PaperPlaneRight,
  WarningCircle,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { EvidenceUploader, UploadedEvidenceItem } from './evidence-uploader';
import { BenefitOpportunity, Claim } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useSubmitClaim } from '@/features/claims/use-claims';
import { toast } from 'sonner';

interface ClaimActivationWizardProps {
  opportunity: BenefitOpportunity;
  onSuccess?: (claim: Claim) => void;
}

export function ClaimActivationWizard({ opportunity, onSuccess }: ClaimActivationWizardProps) {
  const router = useRouter();
  const submitClaimMutation = useSubmitClaim();

  const [step, setStep] = React.useState<number>(1);
  const [requestedAmount, setRequestedAmount] = React.useState<number>(
    opportunity.potentialClaimAmount || opportunity.transactionAmount || 0
  );
  const [incidentDate, setIncidentDate] = React.useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [submissionNotes, setSubmissionNotes] = React.useState<string>('');
  const [evidenceList, setEvidenceList] = React.useState<UploadedEvidenceItem[]>([]);
  const [isConfirmed, setIsConfirmed] = React.useState<boolean>(false);
  const [submittedClaim, setSubmittedClaim] = React.useState<Claim | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const getBenefitIcon = () => {
    switch (opportunity.benefitType) {
      case 'PURCHASE_PROTECTION':
        return <ShieldCheck className="h-6 w-6 text-indigo-500" weight="duotone" />;
      case 'RETURN_PROTECTION':
        return <ArrowCounterClockwise className="h-6 w-6 text-purple-500" weight="duotone" />;
      case 'TRAVEL_DELAY':
        return <AirplaneTakeoff className="h-6 w-6 text-sky-500" weight="duotone" />;
      default:
        return <Sparkle className="h-6 w-6 text-primary" weight="duotone" />;
    }
  };

  const getNotesPlaceholder = () => {
    switch (opportunity.benefitType) {
      case 'PURCHASE_PROTECTION':
        return 'Please describe how the item was accidentally damaged or stolen (e.g. Dropped laptop while traveling, screen cracked and body dented).';
      case 'RETURN_PROTECTION':
        return 'Please explain the reason for return and the merchant refusal (e.g. Store refused return within 45 days stating final sale policy).';
      case 'TRAVEL_DELAY':
        return 'Please specify the flight delay details and incurred expenses (e.g. Flight DL482 delayed 7 hours due to storm; incurred $450 in hotel & meal expenses).';
      default:
        return 'Provide any additional details regarding your protection claim...';
    }
  };

  const handleSubmit = async () => {
    if (!isConfirmed) {
      setErrorMsg('You must review and confirm the accuracy of this claim before submission.');
      return;
    }

    setErrorMsg(null);
    const idempotencyKey = `idemp-claim-${opportunity.id}-${Date.now()}`;

    try {
      const claim = await submitClaimMutation.mutateAsync({
        data: {
          opportunityId: opportunity.id,
          transactionId: opportunity.transactionId,
          cardBenefitId: opportunity.benefitId,
          requestedAmount: Number(requestedAmount),
          incidentDate: new Date(incidentDate).toISOString(),
          submissionNotes: submissionNotes || 'Claim submitted via Card Benefit Activation Engine',
          initialEvidence: evidenceList.map((e) => ({
            evidenceType: e.evidenceType,
            fileName: e.fileName,
            fileUrl: e.fileUrl,
            fileSize: e.fileSize,
            mimeType: e.mimeType,
          })),
        },
        idempotencyKey,
      });

      setSubmittedClaim(claim);
      setStep(5);
      toast.success('Protection Claim Submitted Successfully', {
        description: `Claim ${claim.claimReferenceNumber} is now registered for review.`,
      });
      if (onSuccess) onSuccess(claim);
    } catch (err: any) {
      if (err.status === 409) {
        setErrorMsg('A claim has already been submitted for this qualifying transaction.');
      } else {
        setErrorMsg(err.message || 'Error submitting claim. Please check your information and try again.');
      }
    }
  };

  const stepsList = [
    { number: 1, title: 'Verified Facts' },
    { number: 2, title: 'Incident Details' },
    { number: 3, title: 'Evidence' },
    { number: 4, title: 'Review & Confirm' },
  ];

  return (
    <div className="space-y-8">
      {/* Stepper Header (Only shown during steps 1-4) */}
      {step < 5 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            {stepsList.map((s, idx) => (
              <React.Fragment key={s.number}>
                <div className="flex items-center space-x-2">
                  <div
                    className={`h-7 w-7 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                      step === s.number
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 ring-2 ring-primary/30'
                        : step > s.number
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold'
                        : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground'
                    }`}
                  >
                    {step > s.number ? <CheckCircle className="h-4 w-4" weight="fill" /> : s.number}
                  </div>
                  <span
                    className={`text-xs font-medium hidden sm:inline ${
                      step === s.number ? 'text-foreground font-bold' : 'text-muted-foreground'
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
                {idx < stepsList.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 sm:mx-4 rounded-full ${
                      step > idx + 1 ? 'bg-emerald-500/40' : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <Alert variant="destructive">
          <WarningCircle className="h-4 w-4" />
          <AlertTitle>Claim Error</AlertTitle>
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      {/* STEP 1: VERIFIED FACTS (Zero Re-Entry) */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Badge variant="success">Zero Re-Entry</Badge>
              <span className="text-xs text-muted-foreground">&bull; Verified Transaction Facts</span>
            </div>
            <h2 className="text-xl font-bold text-foreground">Verified Pre-filled Details</h2>
            <p className="text-xs text-muted-foreground">
              We have automatically pre-populated 85% of your claim details directly from the transaction and active policy rules.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground">Merchant / Vendor</p>
              <p className="text-sm font-bold text-foreground">{opportunity.merchantName}</p>
              <p className="text-[10px] text-muted-foreground">Original Transaction ID: {opportunity.transactionId}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground">Original Purchase Amount</p>
              <p className="text-sm font-bold text-foreground">{formatCurrency(opportunity.transactionAmount)}</p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Verified by settlement record</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground">Payment Card Used</p>
              <p className="text-sm font-bold text-foreground">
                {opportunity.cardNetwork} &bull;&bull;&bull;&bull; {opportunity.cardNumberLast4}
              </p>
              <p className="text-[10px] text-muted-foreground">Policy: {opportunity.benefitName}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
              <p className="text-[10px] uppercase font-semibold text-primary">Max Policy Coverage</p>
              <p className="text-sm font-bold text-primary">{formatCurrency(opportunity.potentialClaimAmount)}</p>
              <p className="text-[10px] text-muted-foreground">$0 Deductible &bull; Active Coverage Window</p>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button variant="default" onClick={() => setStep(2)} className="font-semibold rounded-xl">
              Continue to Incident Details <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* STEP 2: INCIDENT & CLAIM DETAILS */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Badge variant="default">Customer Provided</Badge>
              <span className="text-xs text-muted-foreground">&bull; Step 2 of 4</span>
            </div>
            <h2 className="text-xl font-bold text-foreground">Incident Details & Claim Amount</h2>
            <p className="text-xs text-muted-foreground">
              Provide details of what happened to the purchased item or travel itinerary.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Requested Claim Amount ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={opportunity.potentialClaimAmount}
                  value={requestedAmount}
                  onChange={(e) => setRequestedAmount(Number(e.target.value))}
                />
                <p className="text-[10px] text-muted-foreground">
                  Policy maximum: {formatCurrency(opportunity.potentialClaimAmount)}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Date of Incident</label>
                <Input
                  type="date"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">Date the damage, denial, or delay occurred</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Incident Description</label>
              <Textarea
                rows={4}
                placeholder={getNotesPlaceholder()}
                value={submissionNotes}
                onChange={(e) => setSubmissionNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="ghost" onClick={() => setStep(1)} className="rounded-xl">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button
              variant="default"
              disabled={requestedAmount <= 0}
              onClick={() => setStep(3)}
              className="font-semibold rounded-xl"
            >
              Continue to Evidence <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* STEP 3: EVIDENCE ATTACHMENT */}
      {step === 3 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Badge variant="default">Supporting Documents</Badge>
              <span className="text-xs text-muted-foreground">&bull; Step 3 of 4</span>
            </div>
            <h2 className="text-xl font-bold text-foreground">Attach Supporting Evidence</h2>
            <p className="text-xs text-muted-foreground">
              Attach receipts, photos, or delay documentation to substantiate your claim.
            </p>
          </div>

          <EvidenceUploader
            evidenceList={evidenceList}
            onChange={setEvidenceList}
            suggestedEvidence={opportunity.requiredEvidenceList || ['Purchase Receipt']}
          />

          <div className="flex justify-between pt-4">
            <Button variant="ghost" onClick={() => setStep(2)} className="rounded-xl">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button variant="default" onClick={() => setStep(4)} className="font-semibold rounded-xl">
              Continue to Review <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* STEP 4: REVIEW & CONFIRM */}
      {step === 4 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Badge variant="warning">Final Step</Badge>
              <span className="text-xs text-muted-foreground">&bull; Step 4 of 4</span>
            </div>
            <h2 className="text-xl font-bold text-foreground">Review & Submit Claim</h2>
            <p className="text-xs text-muted-foreground">
              Review all prefilled and provided claim information before submitting to your card issuer.
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-secondary border border-slate-200/80 dark:border-slate-800 space-y-4 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-200/50 dark:border-slate-700/50">
              <span className="text-muted-foreground">Protection Benefit</span>
              <span className="font-bold text-foreground">{opportunity.benefitName}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-200/50 dark:border-slate-700/50">
              <span className="text-muted-foreground">Merchant / Transaction</span>
              <span className="font-semibold text-foreground">{opportunity.merchantName} ({formatCurrency(opportunity.transactionAmount)})</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-200/50 dark:border-slate-700/50">
              <span className="text-muted-foreground">Requested Claim Reimbursement</span>
              <span className="font-bold text-lg text-primary">{formatCurrency(requestedAmount)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-200/50 dark:border-slate-700/50">
              <span className="text-muted-foreground">Incident Date</span>
              <span className="font-medium text-foreground">{incidentDate}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-200/50 dark:border-slate-700/50">
              <span className="text-muted-foreground">Attached Evidence</span>
              <span className="font-semibold text-foreground">{evidenceList.length} files attached</span>
            </div>
            {submissionNotes && (
              <div className="py-2">
                <span className="text-muted-foreground block mb-1">Incident Notes</span>
                <p className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 text-foreground leading-relaxed">
                  {submissionNotes}
                </p>
              </div>
            )}
          </div>

          {/* Mandatory Confirmation Checkbox */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start space-x-3">
            <Checkbox
              id="confirm-terms"
              checked={isConfirmed}
              onCheckedChange={(checked) => setIsConfirmed(checked === true)}
              className="mt-0.5"
            />
            <label htmlFor="confirm-terms" className="text-xs text-foreground cursor-pointer leading-relaxed">
              <strong>Cardholder Confirmation:</strong> I have reviewed the facts summarized above and confirm they are accurate. I understand that final claim approval and payout is subject to card issuer policy verification.
            </label>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="ghost" onClick={() => setStep(3)} className="rounded-xl">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button
              variant="default"
              size="lg"
              disabled={!isConfirmed || submitClaimMutation.isPending}
              onClick={handleSubmit}
              className="font-bold rounded-xl shadow-lg shadow-primary/25"
            >
              {submitClaimMutation.isPending ? (
                <span className="flex items-center">
                  <span className="h-4 w-4 mr-2 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Submitting Claim...
                </span>
              ) : (
                <span className="flex items-center">
                  <PaperPlaneRight className="mr-2 h-4 w-4" weight="bold" /> Submit Claim
                </span>
              )}
            </Button>
          </div>
        </motion.div>
      )}

      {/* STEP 5: SUCCESS STATE */}
      {step === 5 && submittedClaim && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center py-8 space-y-6 max-w-lg mx-auto"
        >
          <div className="inline-flex h-20 w-20 rounded-3xl bg-emerald-500/15 text-emerald-500 items-center justify-center shadow-inner">
            <CheckCircle className="h-12 w-12" weight="duotone" />
          </div>

          <div className="space-y-2">
            <Badge variant="success">Claim Submitted</Badge>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Claim #{submittedClaim.claimReferenceNumber}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
              Your claim for <strong>{formatCurrency(submittedClaim.requestedAmount)}</strong> has been registered and submitted for adjudication.
            </p>
          </div>

          <div className="p-4 rounded-2xl glass-secondary border border-slate-200/80 dark:border-slate-800 text-xs space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Status</span>
              <Badge variant="secondary">SUBMITTED</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Filing Date</span>
              <span className="font-medium text-foreground">{formatDate(submittedClaim.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Issuer Reference</span>
              <span className="font-mono text-foreground">{submittedClaim.id}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link href={`/claims/${submittedClaim.id}`} className="w-full">
              <Button variant="default" className="w-full font-semibold rounded-xl">
                View Claim Status <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
            <Link href="/dashboard" className="w-full">
              <Button variant="outline" className="w-full font-medium rounded-xl">
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}
