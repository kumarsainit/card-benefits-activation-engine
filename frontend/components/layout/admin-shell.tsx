'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Queue,
  ChartPieSlice,
  LockKey,
  SignOut,
  User,
  ArrowLeft,
  SquaresFour,
  Sun,
  Moon,
} from '@phosphor-icons/react';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, hasRole, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Security Gate: Check ROLE_ADMIN
  if (!hasRole('ROLE_ADMIN')) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full p-8 rounded-3xl glass-elevated border border-destructive/30 text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <LockKey className="h-8 w-8" weight="duotone" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Access Restricted</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The Claims Adjudication Portal is restricted to authorized financial operations personnel with <strong>ROLE_ADMIN</strong>. Your account does not have permission to view or adjudicate customer claims.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link href="/dashboard">
              <Button variant="default" size="sm" className="rounded-xl font-semibold">
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Return to Customer Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const adminNavItems = [
    { label: 'Operations Overview', href: '/admin', icon: <SquaresFour className="h-4 w-4" /> },
    { label: 'Claims Queue', href: '/admin/claims', icon: <Queue className="h-4 w-4" /> },
    { label: 'Analytics', href: '/admin/analytics', icon: <ChartPieSlice className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative selection:bg-primary/20 selection:text-primary">
      {/* Background Ambience */}
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Admin Operations Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800/80 px-6 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/admin" className="flex items-center space-x-2.5">
              <div className="h-8 w-8 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary">
                <ShieldCheck className="h-5 w-5" weight="duotone" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight leading-none text-foreground">
                  Card Benefits Engine
                </span>
                <span className="text-[9px] font-bold text-primary uppercase tracking-wider mt-0.5">
                  Operations Portal
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center space-x-1">
              {adminNavItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-primary/10 text-primary font-bold shadow-xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-slate-100/70 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            <Badge variant="default" className="text-[10px] hidden sm:inline-flex">
              ROLE_ADMIN
            </Badge>

            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle theme"
                className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
              </Button>
            )}

            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200/60 dark:border-slate-800/60">
              <span className="text-xs font-medium text-foreground hidden sm:inline">{user?.fullName}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => logout()}
                aria-label="Sign out"
                title="Sign out"
                className="h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <SignOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">{children}</main>
    </div>
  );
}
