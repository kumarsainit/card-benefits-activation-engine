'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ChartPieSlice,
  ShieldCheck,
  CurrencyDollar,
  Sparkle,
  ArrowUpRight,
  CheckCircle,
  Clock,
  CreditCard,
  Funnel,
  TrendUp,
  ArrowRight,
} from '@phosphor-icons/react';
import { AdminShell } from '@/components/layout/admin-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAdminAnalytics } from '@/features/admin/use-admin-analytics';
import { useAdminClaims } from '@/features/admin/use-admin-claims';
import { formatCurrency } from '@/lib/utils';

export default function AdminAnalyticsPage() {
  const { data: analytics, isLoading } = useAdminAnalytics();
  const { data: claims = [] } = useAdminClaims();

  const purchaseClaims = claims.filter((c) => (c.benefitName || c.benefitType)?.includes('PURCHASE'));
  const returnClaims = claims.filter((c) => (c.benefitName || c.benefitType)?.includes('RETURN'));
  const travelClaims = claims.filter((c) => (c.benefitName || c.benefitType)?.includes('TRAVEL'));

  return (
    <AdminShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl glass-primary border border-slate-200/80 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Badge variant="default">Value Realization Analytics</Badge>
              <span className="text-xs text-muted-foreground">&bull; Engine Performance</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Protection Activation Metrics
            </h1>
            <p className="text-xs text-muted-foreground">
              Platform-wide value realization, benefit activation funnel, and claim adjudication efficiency.
            </p>
          </div>

          <Link href="/admin/claims">
            <Button variant="outline" size="sm" className="rounded-xl text-xs font-semibold">
              View Claims Queue <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {/* Core Metric Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
            <div className="h-32 rounded-3xl glass-primary" />
            <div className="h-32 rounded-3xl glass-primary" />
            <div className="h-32 rounded-3xl glass-primary" />
            <div className="h-32 rounded-3xl glass-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl glass-primary border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Potential Value Detected
                </span>
                <div className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <Sparkle className="h-4 w-4" weight="bold" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-foreground">
                {formatCurrency(analytics?.totalPotentialValueDetected || 0)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Across {analytics?.totalOpportunitiesDetected || 0} qualifying events
              </p>
            </div>

            <div className="p-5 rounded-3xl glass-primary border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Realized Approved Value
                </span>
                <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <CurrencyDollar className="h-4 w-4" weight="bold" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(analytics?.totalValueUnlockedDollars || 0)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {analytics?.totalClaimsApproved || 0} claims approved & paid
              </p>
            </div>

            <div className="p-5 rounded-3xl glass-primary border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  Activation Rate
                </span>
                <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <TrendUp className="h-4 w-4" weight="bold" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-foreground">
                {analytics?.benefitUtilizationRatePercent != null
                  ? `${analytics.benefitUtilizationRatePercent.toFixed(1)}%`
                  : '0.0%'}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Opportunity-to-claim conversion
              </p>
            </div>

            <div className="p-5 rounded-3xl glass-primary border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Enrolled Card Portfolio
                </span>
                <div className="h-7 w-7 rounded-lg bg-slate-200 dark:bg-slate-800 text-foreground flex items-center justify-center">
                  <CreditCard className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-foreground">
                {analytics?.totalEnrolledCards || 0}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Active cards under automated protection
              </p>
            </div>
          </div>
        )}

        {/* Value Realization Funnel */}
        <div className="p-6 rounded-3xl glass-primary border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Funnel className="h-4 w-4 text-primary" weight="bold" /> Benefit Activation Funnel
              </h2>
              <p className="text-xs text-muted-foreground">
                Conversion stages from transaction qualification through adjudication payout.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">1. Opportunities Detected</span>
              <p className="text-xl font-bold text-foreground">{analytics?.totalOpportunitiesDetected || 0}</p>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2">
                <div className="bg-indigo-500 h-1.5 rounded-full w-full" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">2. Claims Submitted</span>
              <p className="text-xl font-bold text-foreground">{analytics?.totalClaimsSubmitted || 0}</p>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2">
                <div
                  className="bg-purple-500 h-1.5 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      ((analytics?.totalClaimsSubmitted || 0) /
                        Math.max(1, analytics?.totalOpportunitiesDetected || 1)) *
                        100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">3. Under Review</span>
              <p className="text-xl font-bold text-foreground">{analytics?.totalClaimsUnderReview || 0}</p>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2">
                <div
                  className="bg-amber-500 h-1.5 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      ((analytics?.totalClaimsUnderReview || 0) /
                        Math.max(1, analytics?.totalClaimsSubmitted || 1)) *
                        100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">4. Claims Approved</span>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{analytics?.totalClaimsApproved || 0}</p>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      ((analytics?.totalClaimsApproved || 0) /
                        Math.max(1, analytics?.totalClaimsSubmitted || 1)) *
                        100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Protection Domain Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-3xl glass-primary border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5 text-indigo-500" weight="duotone" />
              <h3 className="text-sm font-bold text-foreground">Purchase Protection</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Theft and accidental damage within 90-day coverage window.
            </p>
            <div className="pt-2 flex justify-between text-xs font-semibold">
              <span className="text-muted-foreground">Total Claims Filed:</span>
              <span className="text-foreground">{purchaseClaims.length}</span>
            </div>
          </div>

          <div className="p-5 rounded-3xl glass-primary border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5 text-purple-500" weight="duotone" />
              <h3 className="text-sm font-bold text-foreground">Return Protection</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Merchant refund denial reimbursement within 45-day window.
            </p>
            <div className="pt-2 flex justify-between text-xs font-semibold">
              <span className="text-muted-foreground">Total Claims Filed:</span>
              <span className="text-foreground">{returnClaims.length}</span>
            </div>
          </div>

          <div className="p-5 rounded-3xl glass-primary border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5 text-sky-500" weight="duotone" />
              <h3 className="text-sm font-bold text-foreground">Travel Delay Insurance</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Common carrier delay coverage exceeding 6-hour delay threshold.
            </p>
            <div className="pt-2 flex justify-between text-xs font-semibold">
              <span className="text-muted-foreground">Total Claims Filed:</span>
              <span className="text-foreground">{travelClaims.length}</span>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
