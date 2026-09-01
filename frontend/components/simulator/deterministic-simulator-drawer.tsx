'use client';

import * as React from 'react';
import { Lightning, Sparkle, ShieldCheck, ArrowCounterClockwise, AirplaneTakeoff, Prohibit, CheckCircle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { useSimulateScenario } from '@/features/transactions/use-transactions';
import { toast } from 'sonner';

export function DeterministicSimulatorDrawer() {
  const [isOpen, setIsOpen] = React.useState(false);
  const simulateMutation = useSimulateScenario();

  const handleSimulate = async (scenarioName: string, label: string) => {
    try {
      await simulateMutation.mutateAsync({ scenarioName });
      toast.success(`Simulation Triggered: ${label}`, {
        description: 'Transaction ingested and evaluated by benefit eligibility engine.',
      });
      setIsOpen(false);
    } catch (err: any) {
      toast.error('Simulation Failed', {
        description: err.message || 'Error executing scenario simulation.',
      });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="glass"
          size="sm"
          className="rounded-xl text-xs font-semibold border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 shadow-sm"
        >
          <Lightning className="mr-1.5 h-3.5 w-3.5" weight="fill" />
          ⚡ Scenario Simulator
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="space-y-6 max-w-md w-full">
        <SheetHeader>
          <div className="flex items-center space-x-2">
            <Badge variant="warning">Demo & Testing Tool</Badge>
          </div>
          <SheetTitle className="text-xl font-bold flex items-center gap-2">
            <Lightning className="h-5 w-5 text-amber-500" weight="fill" /> Deterministic Simulator
          </SheetTitle>
          <SheetDescription className="text-xs leading-relaxed">
            Trigger real-time card transactions through the ingestion pipeline to evaluate the benefit eligibility engine and preview live claim prefill.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 pt-2">
          {/* Scenario 1: Purchase Protection */}
          <div className="p-4 rounded-2xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" weight="duotone" />
                <h4 className="text-sm font-bold text-foreground">Purchase Protection</h4>
              </div>
              <Badge variant="purchase">Eligible (98%)</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Simulates $1,499.00 Apple MacBook Pro purchase at Best Buy (MCC 5732). Qualifies for $10,000 policy coverage.
            </p>
            <Button
              variant="default"
              size="sm"
              disabled={simulateMutation.isPending}
              onClick={() => handleSimulate('PURCHASE_PROTECTION_ELIGIBLE', 'Laptop Purchase at Best Buy')}
              className="w-full text-xs font-semibold rounded-xl"
            >
              Simulate $1,499 Electronics Swipe
            </Button>
          </div>

          {/* Scenario 2: Return Protection */}
          <div className="p-4 rounded-2xl bg-purple-500/5 dark:bg-purple-500/10 border border-purple-500/20 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <ArrowCounterClockwise className="h-5 w-5 text-purple-600 dark:text-purple-400" weight="duotone" />
                <h4 className="text-sm font-bold text-foreground">Return Protection</h4>
              </div>
              <Badge variant="return">Eligible (95%)</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Simulates $280.00 apparel purchase at Zara (MCC 5651). Qualifies for $300 per-item merchant denial coverage.
            </p>
            <Button
              variant="secondary"
              size="sm"
              disabled={simulateMutation.isPending}
              onClick={() => handleSimulate('RETURN_PROTECTION_ELIGIBLE', 'Apparel Purchase at Zara')}
              className="w-full text-xs font-semibold rounded-xl"
            >
              Simulate $280 Apparel Swipe
            </Button>
          </div>

          {/* Scenario 3: Travel Delay */}
          <div className="p-4 rounded-2xl bg-sky-500/5 dark:bg-sky-500/10 border border-sky-500/20 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <AirplaneTakeoff className="h-5 w-5 text-sky-600 dark:text-sky-400" weight="duotone" />
                <h4 className="text-sm font-bold text-foreground">Travel Delay Insurance</h4>
              </div>
              <Badge variant="travel">Eligible (99%)</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Simulates Delta Air Lines ticket with 7-hour common carrier delay due to weather. Qualifies for $500 expense coverage.
            </p>
            <Button
              variant="glass"
              size="sm"
              disabled={simulateMutation.isPending}
              onClick={() => handleSimulate('TRAVEL_DELAY_ELIGIBLE', '7-Hour Flight Delay on Delta')}
              className="w-full text-xs font-semibold rounded-xl"
            >
              Simulate 7-Hr Flight Delay
            </Button>
          </div>

          {/* Scenario 4: Negative Case */}
          <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <Prohibit className="h-5 w-5 text-slate-500" />
                <h4 className="text-sm font-bold text-foreground">Excluded Category (Negative)</h4>
              </div>
              <Badge variant="outline">Not Eligible</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Simulates $4,500 automobile dealership transaction (MCC 5511). Rejected by policy exclusion rules.
            </p>
            <Button
              variant="outline"
              size="sm"
              disabled={simulateMutation.isPending}
              onClick={() => handleSimulate('EXCLUDED_MCC', 'Motor Vehicle Purchase')}
              className="w-full text-xs font-semibold rounded-xl"
            >
              Simulate Ineligible Automotive Swipe
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
