'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, ShieldCheck, CheckCircle, Info, LockKey } from '@phosphor-icons/react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent } from '@/components/ui/glass-card';
import { useCard } from '@/features/cards/use-cards';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function CardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const cardId = params.id as string;
  const { data: card, isLoading, error } = useCard(cardId);

  if (isLoading) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto px-6 space-y-6 animate-pulse">
          <div className="h-10 w-32 rounded-xl glass-primary" />
          <div className="h-56 rounded-3xl glass-primary" />
          <div className="h-48 rounded-2xl glass-primary" />
        </div>
      </AppShell>
    );
  }

  if (error || !card) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto px-6 py-20 text-center space-y-4">
          <h2 className="text-xl font-bold">Card Not Found</h2>
          <p className="text-xs text-muted-foreground">The requested card does not exist or does not belong to your account.</p>
          <Link href="/cards">
            <Button variant="default" size="sm">Back to Cards</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-6 space-y-8">
        <Link href="/cards">
          <Button variant="ghost" size="sm" className="rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Cards
          </Button>
        </Link>

        {/* Card Header Surface */}
        <div className="p-6 md:p-8 rounded-3xl glass-elevated border border-slate-200/90 dark:border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center">
                <CreditCard className="h-7 w-7" weight="duotone" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold tracking-tight text-foreground">{card.cardTier} Card</h1>
                  <Badge variant="success">ACTIVE</Badge>
                </div>
                <p className="text-xs font-mono text-muted-foreground mt-0.5">
                  {card.cardNetwork} &bull;&bull;&bull;&bull; {card.cardNumberLast4}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Enrolled Protections</p>
              <p className="text-lg font-bold text-primary">{card.benefits?.length || 0} Policies Active</p>
            </div>
          </div>

          <Tabs defaultValue="protections">
            <TabsList>
              <TabsTrigger value="protections">Enrolled Protections ({card.benefits?.length || 0})</TabsTrigger>
              <TabsTrigger value="overview">Card Metadata</TabsTrigger>
            </TabsList>

            {/* Protections Tab */}
            <TabsContent value="protections" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {card.benefits?.map((benefit) => (
                  <GlassCard key={benefit.id} variant="default" className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="default">{benefit.benefitName}</Badge>
                        <p className="text-xs font-semibold text-foreground mt-2">
                          Max Limit: {formatCurrency(benefit.maxCoverageAmount)}
                        </p>
                      </div>
                      <ShieldCheck className="h-6 w-6 text-indigo-500" weight="duotone" />
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {benefit.termsAndConditions || 'Covers eligible occurrences according to card issuer policy terms.'}
                    </p>

                    <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/50 text-[11px] text-muted-foreground flex justify-between">
                      <span>Deductible: $0.00</span>
                      {benefit.coverageWindowDays && <span>Window: {benefit.coverageWindowDays} Days</span>}
                      {benefit.minDelayHours && <span>Trigger: &ge; {benefit.minDelayHours} Hours</span>}
                    </div>
                  </GlassCard>
                ))}
              </div>
            </TabsContent>

            {/* Metadata Tab */}
            <TabsContent value="overview" className="space-y-3 pt-4">
              <div className="p-4 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-200/40 dark:border-slate-700/40">
                  <span className="text-muted-foreground">Cardholder Name</span>
                  <span className="font-semibold text-foreground">{card.cardholderName || 'Verified Cardholder'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200/40 dark:border-slate-700/40">
                  <span className="text-muted-foreground">Expiration Date</span>
                  <span className="font-mono font-semibold text-foreground">
                    {String(card.expiryMonth).padStart(2, '0')}/{card.expiryYear}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200/40 dark:border-slate-700/40">
                  <span className="text-muted-foreground">Card Status</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">ACTIVE & MONITORED</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Enrolled Date</span>
                  <span className="font-mono text-muted-foreground">{formatDate(card.createdAt)}</span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppShell>
  );
}
