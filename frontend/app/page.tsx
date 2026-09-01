'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  ShieldCheck,
  ArrowCounterClockwise,
  AirplaneTakeoff,
  Sun,
  Moon,
  Sparkle,
  CheckCircle,
  CurrencyDollar,
  Lightning,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent, GlassCardFooter } from '@/components/ui/glass-card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import { fadeIn, slideUp, staggerContainer } from '@/lib/motion';

export default function FoundationShowcasePage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-100 dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-900 p-6 md:p-12">
      {/* Background ambient lighting */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-12 relative z-10">
        {/* Header bar */}
        <motion.header
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="flex items-center justify-between p-4 rounded-2xl glass-primary"
        >
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary">
              <ShieldCheck className="h-6 w-6" weight="duotone" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none tracking-tight">Card Benefit Activation Engine</h1>
              <p className="text-xs text-muted-foreground mt-1">Design System & Architecture Foundation (Phase 6)</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant="success">Phase 6 Verified</Badge>
            {mounted && (
              <Button
                variant="glass"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
              </Button>
            )}
          </div>
        </motion.header>

        {/* Protection Core Pillars */}
        <motion.section
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Purchase Protection */}
          <motion.div variants={slideUp}>
            <GlassCard variant="purchase" className="h-full">
              <GlassCardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="purchase">90-Day Coverage</Badge>
                  <ShieldCheck className="h-6 w-6 text-indigo-500" weight="duotone" />
                </div>
                <GlassCardTitle className="mt-3">Purchase Protection</GlassCardTitle>
                <GlassCardDescription>
                  Automatically detects damage or theft on eligible retail purchases up to $10,000 per occurrence.
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-800/50">
                    <span>Coverage Limit</span>
                    <span className="font-semibold text-foreground">$10,000 / item</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-800/50">
                    <span>Window</span>
                    <span className="font-semibold text-foreground">90 days from swipe</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Deductible</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">$0.00 (Zero)</span>
                  </div>
                </div>
              </GlassCardContent>
              <GlassCardFooter>
                <Button variant="default" size="sm" className="w-full">
                  <Lightning className="mr-1.5 h-4 w-4" /> Explore Rule Logic
                </Button>
              </GlassCardFooter>
            </GlassCard>
          </motion.div>

          {/* Return Protection */}
          <motion.div variants={slideUp}>
            <GlassCard variant="return" className="h-full">
              <GlassCardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="return">Merchant Denial</Badge>
                  <ArrowCounterClockwise className="h-6 w-6 text-purple-500" weight="duotone" />
                </div>
                <GlassCardTitle className="mt-3">Return Protection</GlassCardTitle>
                <GlassCardDescription>
                  Reimburses cardholders when merchants refuse returns within 90 days of purchase.
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-800/50">
                    <span>Per-Item Cap</span>
                    <span className="font-semibold text-foreground">$300.00</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-800/50">
                    <span>Annual Limit</span>
                    <span className="font-semibold text-foreground">$1,000.00 / yr</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Eligible Categories</span>
                    <span className="font-semibold text-purple-600 dark:text-purple-400">Retail Merchandise</span>
                  </div>
                </div>
              </GlassCardContent>
              <GlassCardFooter>
                <Button variant="secondary" size="sm" className="w-full">
                  <CurrencyDollar className="mr-1.5 h-4 w-4" /> View Coverage
                </Button>
              </GlassCardFooter>
            </GlassCard>
          </motion.div>

          {/* Travel Delay */}
          <motion.div variants={slideUp}>
            <GlassCard variant="travel" className="h-full">
              <GlassCardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="travel">6+ Hr Delays</Badge>
                  <AirplaneTakeoff className="h-6 w-6 text-sky-500" weight="duotone" />
                </div>
                <GlassCardTitle className="mt-3">Travel Delay Insurance</GlassCardTitle>
                <GlassCardDescription>
                  Instant reimbursement for lodging, meals, and essentials on common carrier delays exceeding 6 hours.
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-800/50">
                    <span>Expense Cap</span>
                    <span className="font-semibold text-foreground">$500.00</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-800/50">
                    <span>Delay Trigger</span>
                    <span className="font-semibold text-foreground">&ge; 6 Hours</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Covered Causes</span>
                    <span className="font-semibold text-sky-600 dark:text-sky-400">Weather, ATC, Mech</span>
                  </div>
                </div>
              </GlassCardContent>
              <GlassCardFooter>
                <Button variant="glass" size="sm" className="w-full">
                  <Sparkle className="mr-1.5 h-4 w-4" /> Check Eligibility
                </Button>
              </GlassCardFooter>
            </GlassCard>
          </motion.div>
        </motion.section>

        {/* Design System Primitives Showcase */}
        <motion.section variants={slideUp} initial="hidden" animate="visible">
          <GlassCard variant="elevated">
            <GlassCardHeader>
              <GlassCardTitle>Design System Primitives</GlassCardTitle>
              <GlassCardDescription>
                Translucent, accessible components configured with Aceternity-inspired micro-interactions and Phosphor icons.
              </GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <Tabs defaultValue="buttons">
                <TabsList>
                  <TabsTrigger value="buttons">Buttons & Badges</TabsTrigger>
                  <TabsTrigger value="inputs">Form Inputs</TabsTrigger>
                  <TabsTrigger value="feedback">Progress & Spinners</TabsTrigger>
                </TabsList>

                <TabsContent value="buttons" className="space-y-4 pt-4">
                  <div className="flex flex-wrap gap-3">
                    <Button variant="default">Primary Action</Button>
                    <Button variant="secondary">Secondary Action</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="glass">Glass Surface</Button>
                    <Button variant="destructive">Destructive</Button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Badge variant="default">Default</Badge>
                    <Badge variant="success">Approved</Badge>
                    <Badge variant="warning">Under Review</Badge>
                    <Badge variant="purchase">Purchase Protection</Badge>
                    <Badge variant="return">Return Protection</Badge>
                    <Badge variant="travel">Travel Delay</Badge>
                  </div>
                </TabsContent>

                <TabsContent value="inputs" className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
                    <Input placeholder="Cardholder full name" />
                    <Input placeholder="Search transaction..." icon={<CurrencyDollar className="h-4 w-4" />} />
                  </div>
                </TabsContent>

                <TabsContent value="feedback" className="space-y-6 pt-4">
                  <div className="space-y-2 max-w-md">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Claim Prefill Completeness</span>
                      <span className="font-semibold text-foreground">85%</span>
                    </div>
                    <Progress value={85} />
                  </div>
                  <div className="flex items-center space-x-4">
                    <Spinner size="sm" />
                    <Spinner size="default" />
                    <Spinner size="lg" />
                    <span className="text-xs text-muted-foreground">Real-time SSE Notification Stream Active</span>
                  </div>
                </TabsContent>
              </Tabs>
            </GlassCardContent>
          </GlassCard>
        </motion.section>
      </div>
    </main>
  );
}
