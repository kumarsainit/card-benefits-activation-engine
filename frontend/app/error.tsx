'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { WarningCircle, ArrowClockwise, House } from '@phosphor-icons/react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('Unhandled Application Error:', error);
  }, [error]);

  return (
    <AppShell showFooter={false}>
      <div className="min-h-[calc(100vh-180px)] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="max-w-md w-full text-center space-y-6 rounded-3xl glass-elevated p-8 border border-slate-200/90 dark:border-slate-800 shadow-2xl"
        >
          <div className="inline-flex h-16 w-16 rounded-2xl bg-destructive/10 dark:bg-destructive/20 items-center justify-center text-destructive shadow-inner">
            <WarningCircle className="h-9 w-9" weight="duotone" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-destructive">Application Error</span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Something went wrong</h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              An unexpected error occurred while rendering this page. Our engine team has been notified.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button variant="default" onClick={() => reset()} className="w-full font-semibold rounded-xl">
              <ArrowClockwise className="mr-2 h-4 w-4" weight="bold" /> Try Again
            </Button>
            <Link href="/" className="w-full">
              <Button variant="outline" className="w-full font-medium rounded-xl">
                <House className="mr-2 h-4 w-4" /> Home
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}
