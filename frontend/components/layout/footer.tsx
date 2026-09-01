import * as React from 'react';
import Link from 'next/link';
import { ShieldCheck, LockKey, Sparkle, Heart } from '@phosphor-icons/react';

export function Footer() {
  return (
    <footer className="border-t border-slate-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-950/40 backdrop-blur-md mt-20">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="h-8 w-8 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary">
                <ShieldCheck className="h-5 w-5" weight="duotone" />
              </div>
              <span className="font-bold text-sm tracking-tight text-foreground">Card Benefit Activation Engine</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
              An intelligent activation platform that detects qualifying transactions for built-in card protections,
              surfaces transparent explainability, and eliminates claim friction.
            </p>
            <div className="flex items-center space-x-2 text-[11px] text-muted-foreground">
              <LockKey className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Bank-grade stateless authentication & encrypted transport</span>
            </div>
          </div>

          {/* Protections Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">Built-in Protections</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="/#protections" className="hover:text-primary transition-colors">
                  Purchase Protection
                </Link>
              </li>
              <li>
                <Link href="/#protections" className="hover:text-primary transition-colors">
                  Return Protection
                </Link>
              </li>
              <li>
                <Link href="/#protections" className="hover:text-primary transition-colors">
                  Travel Delay Insurance
                </Link>
              </li>
              <li>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-muted-foreground">
                  Extensible Architecture
                </span>
              </li>
            </ul>
          </div>

          {/* Transparency & Governance */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">Platform Governance</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="/#trust" className="hover:text-primary transition-colors">
                  Zero Auto-Submissions
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-primary transition-colors">
                  Explainability Scoring
                </Link>
              </li>
              <li>
                <Link href="/#trust" className="hover:text-primary transition-colors">
                  Cardholder Confirmation
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-primary transition-colors">
                  Operations Portal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal Disclaimer & Copyright */}
        <div className="pt-8 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <p className="text-[11px] text-muted-foreground leading-relaxed max-w-2xl">
            <strong>Important Disclosure:</strong> This platform detects potential eligibility based on configured cardholder policy terms and generates pre-filled claim drafts. The platform does not guarantee insurer approval, and claims are only submitted upon explicit cardholder confirmation.
          </p>
          <p className="text-[11px] text-muted-foreground whitespace-nowrap">
            &copy; {new Date().getFullYear()} Card Benefit Activation Engine. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
