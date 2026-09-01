'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Sparkle,
  CreditCard,
  Receipt,
  FileText,
  Lightning,
  Clock,
  ArrowRight,
  CurrencyDollar,
  CheckCircle,
} from '@phosphor-icons/react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent, GlassCardFooter } from '@/components/ui/glass-card';
import { Skeleton } from '@/components/ui/skeleton';
import { BenefitOpportunityCard } from '@/components/opportunities/benefit-opportunity-card';
import { DeterministicSimulatorDrawer } from '@/components/simulator/deterministic-simulator-drawer';
import { TransactionTable } from '@/components/transactions/transaction-table';
import { useAuth } from '@/providers/auth-provider';
import { useDashboardData } from '@/features/dashboard/use-dashboard';
import { formatCurrency, formatDate } from '@/lib/utils';
import { fadeIn, slideUp, staggerContainer } from '@/lib/motion';

export default function CustomerDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data, isLoading: dataLoading, error, refetch } = useDashboardData();

  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || dataLoading) {
    return (
      <AppShell>
        <div className="max-w-6xl mx-auto px-6 space-y-8 animate-pulse">
          <div className="h-16 rounded-2xl glass-primary" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl glass-primary" />
            ))}
          </div>
          <div className="h-64 rounded-2xl glass-primary" />
        </div>
      </AppShell>
    );
  }

  const { cards = [], opportunities = [], transactions = [], claims = [], metrics } = data || {
    cards: [],
    opportunities: [],
    transactions: [],
    claims: [],
    metrics: {
      totalPotentialProtectionValue: 0,
      activeOpportunitiesCount: 0,
      enrolledCardsCount: 0,
      claimsInProgressCount: 0,
    },
  };

  const activeOpportunities = opportunities.filter(
    (o) => o.status === 'DETECTED' || o.status === 'VIEWED'
  );

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-6 space-y-10">
        {/* Top Header & Simulator Action */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl glass-primary border border-slate-200/80 dark:border-slate-800 shadow-sm"
        >
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Badge variant="default">Cardholder Portal</Badge>
              <span className="text-xs text-muted-foreground">&bull; Active Protection Engine</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Welcome back, {user?.fullName || 'Cardholder'}
            </h1>
            <p className="text-xs text-muted-foreground">
              Your registered cards are actively monitored for eligible insurance protections.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <DeterministicSimulatorDrawer />
          </div>
        </motion.div>

        {/* Value Realization Metric Cards (Tremor-inspired) */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Metric 1: Potential Protection Value */}
          <motion.div variants={slideUp}>
            <div className="p-5 rounded-2xl glass-primary border border-indigo-500/20 space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Available Protection</span>
                <CurrencyDollar className="h-5 w-5 text-indigo-500" weight="duotone" />
              </div>
              <p className="text-2xl font-extrabold tracking-tight text-foreground">
                {formatCurrency(metrics.totalPotentialProtectionValue)}
              </p>
              <p className="text-[11px] text-muted-foreground flex items-center">
                <Sparkle className="h-3 w-3 mr-1 text-emerald-500" /> Across active detected opportunities
              </p>
            </div>
          </motion.div>

          {/* Metric 2: Active Opportunities */}
          <motion.div variants={slideUp}>
            <div className="p-5 rounded-2xl glass-primary border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold uppercase tracking-wider">Detected Opportunities</span>
                <Lightning className="h-5 w-5 text-amber-500" weight="duotone" />
              </div>
              <p className="text-2xl font-extrabold tracking-tight text-foreground">
                {metrics.activeOpportunitiesCount}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {metrics.activeOpportunitiesCount > 0 ? 'Qualifying claims ready to prefill' : 'No active alerts pending'}
              </p>
            </div>
          </motion.div>

          {/* Metric 3: Enrolled Cards */}
          <motion.div variants={slideUp}>
            <div className="p-5 rounded-2xl glass-primary border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold uppercase tracking-wider">Enrolled Cards</span>
                <CreditCard className="h-5 w-5 text-purple-500" weight="duotone" />
              </div>
              <p className="text-2xl font-extrabold tracking-tight text-foreground">
                {metrics.enrolledCardsCount}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Platinum &bull; Sapphire Reserve &bull; Gold
              </p>
            </div>
          </motion.div>

          {/* Metric 4: Claims in Progress */}
          <motion.div variants={slideUp}>
            <div className="p-5 rounded-2xl glass-primary border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold uppercase tracking-wider">Claims Filed</span>
                <FileText className="h-5 w-5 text-sky-500" weight="duotone" />
              </div>
              <p className="text-2xl font-extrabold tracking-tight text-foreground">
                {claims.length}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {metrics.claimsInProgressCount} under review with issuer
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* PRIMARY SECTION: Protection Opportunities Feed */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Lightning className="h-5 w-5 text-indigo-500" weight="fill" />
                Detected Protection Opportunities
              </h2>
              <p className="text-xs text-muted-foreground">
                Recent transactions identified by the policy engine as qualifying for built-in card protections.
              </p>
            </div>
            {activeOpportunities.length > 0 && (
              <Badge variant="purchase">{activeOpportunities.length} Active</Badge>
            )}
          </div>

          {activeOpportunities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeOpportunities.map((opp) => (
                <BenefitOpportunityCard key={opp.id} opportunity={opp} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-6 rounded-3xl glass-secondary border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
              <ShieldCheck className="h-10 w-10 text-muted-foreground mx-auto opacity-40" weight="duotone" />
              <h3 className="text-sm font-semibold text-foreground">No Pending Protection Opportunities</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                Transactions are continuously evaluated as you swipe. You can also trigger a mock purchase using the{' '}
                <strong>Scenario Simulator</strong> in the top-right to test the engine.
              </p>
            </div>
          )}
        </section>

        {/* SECONDARY SECTION: Recent Card Transactions */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Receipt className="h-5 w-5 text-slate-500" weight="duotone" />
                Recent Card Transactions
              </h2>
              <p className="text-xs text-muted-foreground">
                Monitored transaction activity across all your enrolled payment cards.
              </p>
            </div>
            <Link href="/transactions">
              <Button variant="ghost" size="sm" className="text-xs font-semibold">
                View All <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <TransactionTable transactions={transactions.slice(0, 5)} />
        </section>
      </div>
    </AppShell>
  );
}
