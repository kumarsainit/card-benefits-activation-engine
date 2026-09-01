'use client';

import * as React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowCounterClockwise, AirplaneTakeoff, Lightning, Sparkle, Info } from '@phosphor-icons/react';
import { AppShell } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BenefitOpportunityCard } from '@/components/opportunities/benefit-opportunity-card';
import { useOpportunities } from '@/features/opportunities/use-opportunities';
import { useCards } from '@/features/cards/use-cards';
import { formatCurrency } from '@/lib/utils';

export default function BenefitsHubPage() {
  const { data: opportunities = [], isLoading: oppsLoading } = useOpportunities();
  const { data: cards = [], isLoading: cardsLoading } = useCards();

  const purchaseOpps = opportunities.filter((o) => o.benefitType === 'PURCHASE_PROTECTION');
  const returnOpps = opportunities.filter((o) => o.benefitType === 'RETURN_PROTECTION');
  const travelOpps = opportunities.filter((o) => o.benefitType === 'TRAVEL_DELAY');

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-6 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl glass-primary border border-slate-200/80 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Badge variant="default">Benefits Hub</Badge>
              <span className="text-xs text-muted-foreground">&bull; Protection Intelligence</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Card Protection Coverages</h1>
            <p className="text-xs text-muted-foreground">
              Overview of configured insurance policies and live benefit opportunities detected for your cards.
            </p>
          </div>
        </div>

        {/* Informational Disclaimer Banner */}
        <div className="p-4 rounded-2xl glass-secondary border border-indigo-500/20 flex items-start gap-3 text-xs text-muted-foreground">
          <Info className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" weight="duotone" />
          <p className="leading-relaxed">
            <strong>Policy Terms Note:</strong> Benefits displayed represent the configured rules of your enrolled credit cards. When an eligible transaction is detected, the engine pre-fills a claim draft for your review. Final claim adjudication is performed by your card issuer.
          </p>
        </div>

        {/* Tabbed Opportunities & Protections */}
        <Tabs defaultValue="all">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="all">All Opportunities ({opportunities.length})</TabsTrigger>
            <TabsTrigger value="purchase">Purchase Protection ({purchaseOpps.length})</TabsTrigger>
            <TabsTrigger value="return">Return Protection ({returnOpps.length})</TabsTrigger>
            <TabsTrigger value="travel">Travel Delay ({travelOpps.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="pt-4">
            {opportunities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {opportunities.map((opp) => (
                  <BenefitOpportunityCard key={opp.id} opportunity={opp} />
                ))}
              </div>
            ) : (
              <EmptyOpportunitiesState />
            )}
          </TabsContent>

          <TabsContent value="purchase" className="pt-4">
            {purchaseOpps.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {purchaseOpps.map((opp) => (
                  <BenefitOpportunityCard key={opp.id} opportunity={opp} />
                ))}
              </div>
            ) : (
              <EmptyOpportunitiesState />
            )}
          </TabsContent>

          <TabsContent value="return" className="pt-4">
            {returnOpps.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {returnOpps.map((opp) => (
                  <BenefitOpportunityCard key={opp.id} opportunity={opp} />
                ))}
              </div>
            ) : (
              <EmptyOpportunitiesState />
            )}
          </TabsContent>

          <TabsContent value="travel" className="pt-4">
            {travelOpps.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {travelOpps.map((opp) => (
                  <BenefitOpportunityCard key={opp.id} opportunity={opp} />
                ))}
              </div>
            ) : (
              <EmptyOpportunitiesState />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function EmptyOpportunitiesState() {
  return (
    <div className="text-center py-16 px-6 rounded-3xl glass-secondary border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
      <ShieldCheck className="h-10 w-10 text-muted-foreground mx-auto opacity-40" weight="duotone" />
      <h3 className="text-sm font-semibold text-foreground">No Detected Opportunities in this Category</h3>
      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
        When you swipe an enrolled card on an eligible purchase or experience travel disruption, qualifying opportunities will appear here.
      </p>
    </div>
  );
}
