'use client';

import * as React from 'react';
import { Navbar } from './navbar';
import { Footer } from './footer';

export function AppShell({
  children,
  showFooter = true,
}: {
  children: React.ReactNode;
  showFooter?: boolean;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative selection:bg-primary/20 selection:text-primary">
      {/* Ambient background glows */}
      <div className="fixed top-[-15%] left-[-10%] w-[600px] h-[600px] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-15%] right-[-10%] w-[600px] h-[600px] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed top-[40%] right-[20%] w-[400px] h-[400px] bg-sky-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Floating Navigation */}
      <Navbar />

      {/* Main Content Body */}
      <main className="flex-1 pt-24 pb-12 relative z-10">{children}</main>

      {/* Footer */}
      {showFooter && <Footer />}
    </div>
  );
}
