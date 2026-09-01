'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  ArrowCounterClockwise,
  AirplaneTakeoff,
  Sparkle,
  CheckCircle,
  Lightning,
  LockKey,
  FileText,
  UserCheck,
  Eye,
  Check,
  ArrowRight,
  CurrencyDollar,
  Receipt,
  Airplane,
} from '@phosphor-icons/react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent, GlassCardFooter } from '@/components/ui/glass-card';
import { fadeIn, slideUp, staggerContainer } from '@/lib/motion';

export default function LandingPage() {
  return (
    <AppShell>
      {/* 1. HERO SECTION */}
      <section className="relative pt-8 pb-20 px-6 max-w-6xl mx-auto text-center space-y-8">
        <motion.div initial="hidden" animate="visible" variants={fadeIn} className="flex justify-center">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full glass-secondary text-xs font-medium text-primary border border-primary/20 shadow-sm">
            <Sparkle className="h-3.5 w-3.5" weight="bold" />
            <span>Built-in Card Protection Activation Engine</span>
          </div>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={slideUp} className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Your card may already{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-primary dark:from-indigo-400 dark:via-purple-300 dark:to-primary">
              protect more than you think.
            </span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Billions in built-in credit card insurance benefits expire unused every year. We automatically detect qualifying
            transactions, explain policy terms, and pre-fill claims so you never leave money on the table.
          </p>
        </motion.div>

        {/* Hero CTAs */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={slideUp}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
        >
          <a href="#how-it-works">
            <Button size="lg" variant="default" className="w-full sm:w-auto font-semibold px-8 rounded-xl shadow-lg shadow-primary/25">
              See How It Works <ArrowRight className="ml-2 h-4 w-4" weight="bold" />
            </Button>
          </a>
          <Link href="/login">
            <Button size="lg" variant="glass" className="w-full sm:w-auto font-medium px-8 rounded-xl">
              Sign In to Engine
            </Button>
          </Link>
        </motion.div>

        {/* 2. LIVE INTERACTIVE DETECTION SIMULATION CARD */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="pt-8 max-w-3xl mx-auto text-left"
        >
          <div className="rounded-2xl glass-elevated p-6 border border-slate-200/90 dark:border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200/60 dark:border-slate-800/60">
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Detection Pipeline Simulation</span>
              </div>
              <Badge variant="success">98% Match Confidence</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Event 1: Ingested Transaction */}
              <div className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Card Swipe</span>
                  <Receipt className="h-4 w-4 text-indigo-500" />
                </div>
                <p className="text-sm font-bold text-foreground">Best Buy Electronics</p>
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">$1,499.00 USD</p>
                <p className="text-[10px] text-muted-foreground font-mono">MCC 5732 &bull; Amex Platinum &bull; 90-Day Window</p>
              </div>

              {/* Event 2: Engine Evaluation */}
              <div className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Rule Engine</span>
                  <Lightning className="h-4 w-4 text-amber-500" />
                </div>
                <p className="text-sm font-bold text-foreground">Purchase Protection</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">&bull; Eligible for Damage / Theft</p>
                <p className="text-[10px] text-muted-foreground">Policy Limit: $10,000 / $0 Deductible</p>
              </div>

              {/* Event 3: Pre-filled Claim */}
              <div className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Draft Claim</span>
                  <FileText className="h-4 w-4 text-purple-500" />
                </div>
                <p className="text-sm font-bold text-foreground">Draft #CLM-2026-A83B1</p>
                <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold">85% Form Pre-filled</p>
                <p className="text-[10px] text-muted-foreground">Awaiting Cardholder Confirmation</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 3. HOW IT WORKS (Sticky Scroll / Process Timeline) */}
      <section id="how-it-works" className="py-20 px-6 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="default">Streamlined Process</Badge>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">How the Engine Activates Benefits</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            From raw card swipe to approved reimbursement, every step is automated, transparent, and always under your control.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <GlassCard variant="default">
            <GlassCardHeader>
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                01
              </div>
              <GlassCardTitle className="mt-3">Swipe & Auto-Detect</GlassCardTitle>
              <GlassCardDescription>
                Card transactions are ingested with merchant name normalization and merchant category code (MCC) parsing in real-time.
              </GlassCardDescription>
            </GlassCardHeader>
          </GlassCard>

          {/* Step 2 */}
          <GlassCard variant="default">
            <GlassCardHeader>
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm">
                02
              </div>
              <GlassCardTitle className="mt-3">Evaluate & Explain</GlassCardTitle>
              <GlassCardDescription>
                Our policy engine matches transaction facts against active card benefit rules, generating human-readable explainability and match scores.
              </GlassCardDescription>
            </GlassCardHeader>
          </GlassCard>

          {/* Step 3 */}
          <GlassCard variant="default">
            <GlassCardHeader>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                03
              </div>
              <GlassCardTitle className="mt-3">Pre-fill & Confirm</GlassCardTitle>
              <GlassCardDescription>
                Claim forms are automatically pre-populated with verified receipt data. You review known facts, upload evidence, and submit with one click.
              </GlassCardDescription>
            </GlassCardHeader>
          </GlassCard>
        </div>
      </section>

      {/* 4. THREE BUILT-IN PROTECTIONS */}
      <section id="protections" className="py-20 px-6 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="purchase">Initial Protection Catalog</Badge>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Built-in Card Insurance Protections</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This platform focuses strictly on built-in card protections and insurance coverages—not loyalty or rewards points.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Purchase Protection */}
          <GlassCard variant="purchase" className="flex flex-col justify-between">
            <GlassCardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="purchase">Damage & Theft</Badge>
                <ShieldCheck className="h-6 w-6 text-indigo-500" weight="duotone" />
              </div>
              <GlassCardTitle className="mt-4 text-xl">Purchase Protection</GlassCardTitle>
              <GlassCardDescription>
                Covers accidental damage or theft on eligible retail purchases made with your card within 90 days.
              </GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center"><Check className="h-3.5 w-3.5 text-emerald-600 mr-2 shrink-0" /> Up to $10,000 per claim coverage</li>
                <li className="flex items-center"><Check className="h-3.5 w-3.5 text-emerald-600 mr-2 shrink-0" /> 90-day protection window from swipe</li>
                <li className="flex items-center"><Check className="h-3.5 w-3.5 text-emerald-600 mr-2 shrink-0" /> $0 deductible on repair or replacement</li>
              </ul>
            </GlassCardContent>
            <GlassCardFooter>
              <Link href="/login" className="w-full">
                <Button variant="default" size="sm" className="w-full">Activate Purchase Protection</Button>
              </Link>
            </GlassCardFooter>
          </GlassCard>

          {/* Return Protection */}
          <GlassCard variant="return" className="flex flex-col justify-between">
            <GlassCardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="return">Merchant Refusal</Badge>
                <ArrowCounterClockwise className="h-6 w-6 text-purple-500" weight="duotone" />
              </div>
              <GlassCardTitle className="mt-4 text-xl">Return Protection</GlassCardTitle>
              <GlassCardDescription>
                Reimburses you when a merchant refuses an item return within 90 days of the original transaction.
              </GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center"><Check className="h-3.5 w-3.5 text-emerald-600 mr-2 shrink-0" /> Up to $300 per item reimbursement</li>
                <li className="flex items-center"><Check className="h-3.5 w-3.5 text-emerald-600 mr-2 shrink-0" /> $1,000 annual claim limit</li>
                <li className="flex items-center"><Check className="h-3.5 w-3.5 text-emerald-600 mr-2 shrink-0" /> Covers physical merchandise</li>
              </ul>
            </GlassCardContent>
            <GlassCardFooter>
              <Link href="/login" className="w-full">
                <Button variant="secondary" size="sm" className="w-full">Activate Return Protection</Button>
              </Link>
            </GlassCardFooter>
          </GlassCard>

          {/* Travel Delay */}
          <GlassCard variant="travel" className="flex flex-col justify-between">
            <GlassCardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="travel">Common Carrier</Badge>
                <AirplaneTakeoff className="h-6 w-6 text-sky-500" weight="duotone" />
              </div>
              <GlassCardTitle className="mt-4 text-xl">Travel Delay Insurance</GlassCardTitle>
              <GlassCardDescription>
                Reimburses essential meals, lodging, and toiletries when airline or rail travel is delayed by 6+ hours.
              </GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center"><Check className="h-3.5 w-3.5 text-emerald-600 mr-2 shrink-0" /> Up to $500 per delayed trip</li>
                <li className="flex items-center"><Check className="h-3.5 w-3.5 text-emerald-600 mr-2 shrink-0" /> 6-hour delay threshold requirement</li>
                <li className="flex items-center"><Check className="h-3.5 w-3.5 text-emerald-600 mr-2 shrink-0" /> Covers weather, ATC, and mechanical delays</li>
              </ul>
            </GlassCardContent>
            <GlassCardFooter>
              <Link href="/login" className="w-full">
                <Button variant="glass" size="sm" className="w-full">Activate Travel Delay</Button>
              </Link>
            </GlassCardFooter>
          </GlassCard>
        </div>
      </section>

      {/* 5. TRUST & TRANSPARENCY */}
      <section id="trust" className="py-20 px-6 max-w-6xl mx-auto space-y-12">
        <div className="rounded-3xl glass-elevated p-8 md:p-12 border border-slate-200/80 dark:border-slate-800 space-y-8">
          <div className="max-w-2xl space-y-3">
            <Badge variant="success">Trust & Governance</Badge>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Cardholder Control First</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We believe in full transparency. Our engine empowers you with information without ever taking unilateral action on your behalf.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <UserCheck className="h-5 w-5" weight="duotone" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Zero Auto-Submissions</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The platform will never submit a claim without your explicit confirmation and review of facts.
              </p>
            </div>

            <div className="space-y-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Eye className="h-5 w-5" weight="duotone" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Explainable AI Scoring</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Every opportunity includes clear bullet-point rationale showing which card policy terms were matched.
              </p>
            </div>

            <div className="space-y-2">
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <LockKey className="h-5 w-5" weight="duotone" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Bank-Grade Isolation</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Stateless token authentication and strict role-based access ensure your transaction details remain confidential.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. BOTTOM CALL TO ACTION */}
      <section className="py-16 px-6 max-w-4xl mx-auto text-center space-y-6">
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
          Ready to discover your hidden card protection benefits?
        </h2>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Sign in to the engine or create an account to start detecting qualifying purchase and travel protection claims.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/register">
            <Button size="lg" variant="default" className="w-full sm:w-auto font-semibold px-8 rounded-xl shadow-lg shadow-primary/25">
              <Sparkle className="mr-2 h-4 w-4" weight="bold" /> Get Started Free
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="w-full sm:w-auto font-medium px-8 rounded-xl">
              Sign In to Existing Account
            </Button>
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
