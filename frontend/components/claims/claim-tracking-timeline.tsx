'use client';

import * as React from 'react';
import { CheckCircle, Clock, WarningCircle, XCircle, CurrencyDollar, PaperPlaneTilt } from '@phosphor-icons/react';
import { ClaimStatus } from '@/types';
import { Badge } from '@/components/ui/badge';

interface ClaimTrackingTimelineProps {
  status: ClaimStatus;
  createdAt: string;
  updatedAt?: string;
  adjudicationNotes?: string;
}

export function ClaimTrackingTimeline({
  status,
  createdAt,
  updatedAt,
  adjudicationNotes,
}: ClaimTrackingTimelineProps) {
  const isRejected = status === 'REJECTED';
  const isActionRequired = status === 'ADDITIONAL_INFORMATION_REQUIRED';

  const getStepStatus = (stepIndex: number) => {
    // 0: SUBMITTED, 1: UNDER_REVIEW, 2: ACTION/ADJUDICATION, 3: APPROVED/PAID
    switch (status) {
      case 'SUBMITTED':
        return stepIndex === 0 ? 'current' : 'upcoming';
      case 'UNDER_REVIEW':
        return stepIndex === 0 ? 'completed' : stepIndex === 1 ? 'current' : 'upcoming';
      case 'ADDITIONAL_INFORMATION_REQUIRED':
        return stepIndex <= 1 ? 'completed' : stepIndex === 2 ? 'action_required' : 'upcoming';
      case 'APPROVED':
        return stepIndex <= 2 ? 'completed' : stepIndex === 3 ? 'current' : 'upcoming';
      case 'PAID':
        return 'completed';
      case 'REJECTED':
        return stepIndex <= 1 ? 'completed' : stepIndex === 2 ? 'rejected' : 'upcoming';
      default:
        return 'upcoming';
    }
  };

  const timelineSteps = [
    {
      title: 'Claim Submitted',
      description: 'Your pre-filled claim was received and registered in the activation queue.',
      icon: <PaperPlaneTilt className="h-4 w-4" />,
      date: createdAt,
    },
    {
      title: 'Policy & Evidence Verification',
      description: 'Adjudication team verifies purchase receipts, damage photos, or common carrier delay statements.',
      icon: <Clock className="h-4 w-4" />,
    },
    {
      title: isActionRequired
        ? 'Additional Information Requested'
        : isRejected
        ? 'Claim Determination: Denied'
        : 'Adjudication Review',
      description: adjudicationNotes || (isActionRequired
        ? 'Please attach requested documents below to resume review.'
        : 'Evaluating claim against policy terms and maximum coverage limits.'),
      icon: isActionRequired ? (
        <WarningCircle className="h-4 w-4" />
      ) : isRejected ? (
        <XCircle className="h-4 w-4" />
      ) : (
        <CheckCircle className="h-4 w-4" />
      ),
    },
    {
      title: status === 'PAID' ? 'Reimbursement Paid' : 'Approved & Payout',
      description: status === 'PAID'
        ? 'Funds have been disbursed to your cardholder account.'
        : 'Final approved claim payout will be credited to your billing statement.',
      icon: <CurrencyDollar className="h-4 w-4" />,
      date: status === 'PAID' ? updatedAt : undefined,
    },
  ];

  return (
    <div className="p-6 rounded-3xl glass-primary border border-slate-200/80 dark:border-slate-800 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Claim Lifecycle Timeline</h3>
        <Badge variant={status === 'APPROVED' || status === 'PAID' ? 'success' : isRejected ? 'destructive' : isActionRequired ? 'warning' : 'secondary'}>
          {status}
        </Badge>
      </div>

      <div className="relative pl-6 space-y-6 border-l-2 border-slate-200 dark:border-slate-800 ml-3">
        {timelineSteps.map((step, idx) => {
          const stepState = getStepStatus(idx);

          return (
            <div key={idx} className="relative group">
              {/* Node Marker */}
              <div
                className={`absolute -left-[31px] top-0 h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  stepState === 'completed'
                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30 ring-4 ring-emerald-500/10'
                    : stepState === 'current'
                    ? 'bg-primary text-white shadow-md shadow-primary/30 ring-4 ring-primary/20 animate-pulse'
                    : stepState === 'action_required'
                    ? 'bg-amber-500 text-white shadow-sm ring-4 ring-amber-500/20'
                    : stepState === 'rejected'
                    ? 'bg-destructive text-white shadow-sm ring-4 ring-destructive/20'
                    : 'bg-slate-200 dark:bg-slate-800 text-muted-foreground'
                }`}
              >
                {step.icon}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4
                    className={`text-xs font-bold ${
                      stepState === 'current'
                        ? 'text-primary'
                        : stepState === 'action_required'
                        ? 'text-amber-600 dark:text-amber-400'
                        : stepState === 'rejected'
                        ? 'text-destructive'
                        : 'text-foreground'
                    }`}
                  >
                    {step.title}
                  </h4>
                  {step.date && (
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date(step.date).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-lg">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
