'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldWarning, House } from '@phosphor-icons/react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <AppShell showFooter={false}>
      <div className="min-h-[calc(100vh-180px)] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="max-w-md w-full text-center space-y-6 rounded-3xl glass-elevated p-8 border border-slate-200/90 dark:border-slate-800 shadow-2xl"
        >
          <div className="inline-flex h-16 w-16 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 items-center justify-center text-amber-500 shadow-inner">
            <ShieldWarning className="h-9 w-9" weight="duotone" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">404 Error</span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Page Not Found</h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The page or benefit resource you are searching for does not exist or has been moved.
            </p>
          </div>

          <Link href="/">
            <Button variant="default" className="w-full font-semibold rounded-xl">
              <House className="mr-2 h-4 w-4" weight="bold" /> Return to Homepage
            </Button>
          </Link>
        </motion.div>
      </div>
    </AppShell>
  );
}
