'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  ArrowCounterClockwise,
  AirplaneTakeoff,
  Clock,
  Sparkle,
  CheckCircle,
  X,
  ArrowRight,
  Receipt,
  CreditCard,
} from '@phosphor-icons/react';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent, GlassCardFooter } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BenefitOpportunity } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useDismissOpportunity } from '@/features/opportunities/use-opportunities';

interface BenefitOpportunityCardProps {
  opportunity: BenefitOpportunity;
}

export function BenefitOpportunityCard({ opportunity }: BenefitOpportunityCardProps) {
  const dismissMutation = useDismissOpportunity();

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

  const getCardVariant = () => {
    switch (opportunity.benefitType) {
      case 'PURCHASE_PROTECTION':
        return 'purchase' as const;
      case 'RETURN_PROTECTION':
        return 'return' as const;
      case 'TRAVEL_DELAY':
        return 'travel' as const;
      default:
        return 'default' as const;
    }
  };

  const getBadgeVariant = () => {
    switch (opportunity.benefitType) {
      case 'PURCHASE_PROTECTION':
        return 'purchase' as const;
      case 'RETURN_PROTECTION':
        return 'return' as const;
      case 'TRAVEL_DELAY':
        return 'travel' as const;
      default:
        return 'default' as const;
    }
  };

  const matchPercent = Math.round(
    (typeof opportunity.confidenceScore === 'number'
      ? opportunity.confidenceScore
      : parseFloat(opportunity.confidenceScore || '0.95')) * 100
  );

  return (
    <GlassCard variant={getCardVariant()} className="flex flex-col justify-between group transition-all duration-300">
      <div>
        <GlassCardHeader className="mb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Badge variant={getBadgeVariant()}>{opportunity.benefitName}</Badge>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full">
                {matchPercent}% Match
              </span>
            </div>
            <div className="flex items-center space-x-1">
              {getBenefitIcon()}
              <button
                onClick={() => dismissMutation.mutate(opportunity.id)}
                disabled={dismissMutation.isPending}
                aria-label="Dismiss opportunity"
                title="Dismiss opportunity"
                className="opacity-40 hover:opacity-100 p-1 text-muted-foreground hover:text-foreground transition-opacity rounded-md"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="pt-3">
            <p className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
              <CreditCard className="h-3.5 w-3.5" /> {opportunity.cardNetwork} &bull;&bull;&bull;&bull; {opportunity.cardNumberLast4}
            </p>
            <GlassCardTitle className="mt-1 text-base font-bold truncate">
              {opportunity.merchantName}
            </GlassCardTitle>
          </div>
        </GlassCardHeader>

        <GlassCardContent className="space-y-3">
          {/* Amount and potential coverage highlight */}
          <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Purchase</p>
              <p className="text-sm font-bold text-foreground">{formatCurrency(opportunity.transactionAmount)}</p>
            </div>
            <div>
              <p className="text-[10px] text-primary uppercase tracking-wider font-semibold">Max Coverage</p>
              <p className="text-sm font-bold text-primary">{formatCurrency(opportunity.potentialClaimAmount)}</p>
            </div>
          </div>

          {/* Explainability bullets */}
          {opportunity.eligibilityReasons && opportunity.eligibilityReasons.length > 0 && (
            <div className="space-y-1 pt-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Matched Policy Clauses</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {opportunity.eligibilityReasons.slice(0, 2).map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 line-clamp-1">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" weight="fill" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </GlassCardContent>
      </div>

      <GlassCardFooter className="pt-3 mt-3 border-t border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center text-[11px] text-muted-foreground">
          <Clock className="h-3.5 w-3.5 mr-1 text-amber-500" />
          <span>90-Day Window Active</span>
        </div>

        <Link href={`/opportunities/${opportunity.id}`}>
          <Button variant="default" size="sm" className="rounded-xl text-xs font-semibold">
            Review Benefit <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </Link>
      </GlassCardFooter>
    </GlassCard>
  );
}
