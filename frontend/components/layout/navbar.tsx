'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  ShieldCheck,
  Sun,
  Moon,
  List,
  X,
  SignOut,
  User as UserIcon,
  ShieldStar,
  Sparkle,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NotificationDropdown } from '@/components/notifications/notification-dropdown';
import { useAuth } from '@/providers/auth-provider';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, logout, hasRole } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navLinks = isAuthenticated
    ? hasRole('ROLE_ADMIN')
      ? [
          { name: 'Claims Queue', href: '/admin/claims' },
          { name: 'Value Realization', href: '/admin/analytics' },
        ]
      : [
          { name: 'Dashboard', href: '/dashboard' },
          { name: 'Opportunities', href: '/opportunities' },
          { name: 'Claims', href: '/claims' },
          { name: 'Cards', href: '/cards' },
          { name: 'Transactions', href: '/transactions' },
        ]
    : [
        { name: 'How It Works', href: '/#how-it-works' },
        { name: 'Protection Types', href: '/#protections' },
        { name: 'Trust & Transparency', href: '/#trust' },
      ];

  return (
    <header className="fixed top-4 inset-x-0 max-w-6xl mx-auto px-4 z-50">
      <nav
        aria-label="Main Navigation"
        className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl px-4 py-2.5 shadow-lg shadow-slate-900/5 flex items-center justify-between transition-all"
      >
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1">
          <div className="h-9 w-9 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
            <ShieldCheck className="h-5 w-5" weight="duotone" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight leading-none text-foreground">Card Benefits</span>
            <span className="text-[10px] font-medium text-primary leading-none mt-0.5">ACTIVATION ENGINE</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center space-x-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all relative text-muted-foreground hover:text-foreground hover:bg-slate-100/70 dark:hover:bg-slate-800/70',
                  isActive && 'text-foreground font-semibold bg-slate-100/90 dark:bg-slate-800/90 shadow-sm'
                )}
              >
                {link.name}
                {isActive && (
                  <motion.div
                    layoutId="activeNavTab"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right Action Section */}
        <div className="hidden md:flex items-center space-x-3">
          {/* Theme Switcher */}
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

          {/* Real-time Notifications Bell */}
          {isAuthenticated && <NotificationDropdown />}

          {/* Auth Controls */}
          {isAuthenticated ? (
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200/60 dark:border-slate-800/60">
              <div className="flex items-center space-x-2">
                <div className="h-7 w-7 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-semibold">
                  {user?.fullName ? user.fullName.charAt(0).toUpperCase() : <UserIcon className="h-3.5 w-3.5" />}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-medium leading-none truncate max-w-[120px]">{user?.fullName}</span>
                  <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
                    {hasRole('ROLE_ADMIN') ? 'Operations Admin' : 'Cardholder'}
                  </span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                aria-label="Sign out"
                title="Sign out"
                className="h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <SignOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="rounded-xl text-xs font-medium">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="default" size="sm" className="rounded-xl text-xs font-semibold shadow-sm shadow-primary/20">
                  <Sparkle className="mr-1.5 h-3.5 w-3.5" weight="bold" /> Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="flex md:hidden items-center space-x-2">
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
              className="h-8 w-8 rounded-xl"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            className="h-8 w-8 rounded-xl"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <List className="h-5 w-5" />}
          </Button>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden mt-2 p-4 rounded-2xl glass-elevated border border-slate-200 dark:border-slate-800 space-y-3"
          >
            <div className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'px-3 py-2 rounded-xl text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800',
                    pathname === link.href && 'text-foreground font-semibold bg-slate-100 dark:bg-slate-800'
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
              {isAuthenticated ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                      {user?.fullName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{user?.fullName}</p>
                      <p className="text-[10px] text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="text-xs text-destructive hover:bg-destructive/10"
                  >
                    <SignOut className="mr-1 h-3.5 w-3.5" /> Sign Out
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="default" size="sm" className="w-full text-xs font-semibold">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
