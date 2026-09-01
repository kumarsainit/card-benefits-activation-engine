'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { ShieldCheck, EnvelopeSimple, LockKey, SignIn, WarningCircle, Sparkle, UserCheck } from '@phosphor-icons/react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { loginSchema, LoginFormData } from '@/schemas';
import { useAuth } from '@/providers/auth-provider';
import { ApiError } from '@/services/api-client';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, hasRole } = useAuth();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      if (hasRole('ROLE_ADMIN')) {
        router.push('/admin/claims');
      } else {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, hasRole, router]);

  const onSubmit = async (data: LoginFormData) => {
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await login(data.email, data.password);
      // AuthProvider triggers redirect via useEffect
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setErrorMsg('Invalid email or password. Please verify credentials and try again.');
        } else {
          setErrorMsg(err.message || 'An error occurred during authentication.');
        }
      } else {
        setErrorMsg('Network error connecting to backend service. Ensure backend is running.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutofillDemo = (email: string, pass: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
  };

  return (
    <AppShell showFooter={false}>
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {/* Main Glassmorphic Form Card */}
          <div className="rounded-3xl glass-elevated p-8 border border-slate-200/90 dark:border-slate-800 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex h-12 w-12 rounded-2xl bg-primary/10 dark:bg-primary/20 items-center justify-center text-primary mb-2 shadow-inner">
                <ShieldCheck className="h-7 w-7" weight="duotone" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Sign In</h1>
              <p className="text-xs text-muted-foreground">
                Access your card benefit opportunities and prefilled claims
              </p>
            </div>

            {/* Error Alert */}
            {errorMsg && (
              <Alert variant="destructive">
                <WarningCircle className="h-4 w-4" />
                <AlertTitle>Authentication Failed</AlertTitle>
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Email Address</label>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  icon={<EnvelopeSimple className="h-4 w-4" />}
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">Password</label>
                  <span className="text-[11px] text-muted-foreground hover:text-primary cursor-pointer">
                    Forgot password?
                  </span>
                </div>
                <Input
                  type="password"
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  autoComplete="current-password"
                  icon={<LockKey className="h-4 w-4" />}
                  error={errors.password?.message}
                  {...register('password')}
                />
              </div>

              <Button
                type="submit"
                variant="default"
                size="lg"
                disabled={isSubmitting}
                className="w-full font-semibold rounded-xl shadow-md shadow-primary/20"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <span className="h-4 w-4 mr-2 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Signing In...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <SignIn className="mr-2 h-4 w-4" weight="bold" /> Sign In
                  </span>
                )}
              </Button>
            </form>

            {/* Quick Demo Credentials Autofill */}
            <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Quick Demo Accounts
                </span>
                <Sparkle className="h-3.5 w-3.5 text-amber-500" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleAutofillDemo('customer@example.com', 'Password123!')}
                  className="p-2 rounded-xl bg-slate-100/70 hover:bg-slate-200/80 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-left transition-all text-[11px]"
                >
                  <p className="font-semibold text-foreground">Cardholder</p>
                  <p className="text-[10px] text-muted-foreground truncate">customer@example.com</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleAutofillDemo('admin@cbae.internal', 'AdminSecret123!')}
                  className="p-2 rounded-xl bg-slate-100/70 hover:bg-slate-200/80 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-left transition-all text-[11px]"
                >
                  <p className="font-semibold text-foreground">Operations Admin</p>
                  <p className="text-[10px] text-muted-foreground truncate">admin@cbae.internal</p>
                </button>
              </div>
            </div>

            <div className="text-center pt-2">
              <p className="text-xs text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="font-semibold text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}
