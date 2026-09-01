'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { ShieldCheck, User, EnvelopeSimple, LockKey, UserPlus, WarningCircle, Check } from '@phosphor-icons/react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { registerSchema, RegisterFormData } from '@/schemas';
import { useAuth } from '@/providers/auth-provider';
import { ApiError } from '@/services/api-client';

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerAuth, isAuthenticated } = useAuth();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
    },
  });

  const passwordValue = watch('password', '');
  const hasMinLength = passwordValue.length >= 8;

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const onSubmit = async (data: RegisterFormData) => {
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await registerAuth({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        role: 'ROLE_CUSTOMER',
      });
      router.push('/dashboard');
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setErrorMsg('An account with this email address already exists. Please sign in instead.');
        } else {
          setErrorMsg(err.message || 'Registration failed. Please check your information.');
        }
      } else {
        setErrorMsg('Network error connecting to backend service. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
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
          <div className="rounded-3xl glass-elevated p-8 border border-slate-200/90 dark:border-slate-800 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex h-12 w-12 rounded-2xl bg-primary/10 dark:bg-primary/20 items-center justify-center text-primary mb-2 shadow-inner">
                <ShieldCheck className="h-7 w-7" weight="duotone" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Create Account</h1>
              <p className="text-xs text-muted-foreground">
                Start activating your built-in card insurance benefits
              </p>
            </div>

            {errorMsg && (
              <Alert variant="destructive">
                <WarningCircle className="h-4 w-4" />
                <AlertTitle>Registration Failed</AlertTitle>
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Full Legal Name</label>
                <Input
                  type="text"
                  placeholder="Alex Carter"
                  autoComplete="name"
                  icon={<User className="h-4 w-4" />}
                  error={errors.fullName?.message}
                  {...register('fullName')}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Email Address</label>
                <Input
                  type="email"
                  placeholder="alex.carter@example.com"
                  autoComplete="email"
                  icon={<EnvelopeSimple className="h-4 w-4" />}
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Password</label>
                <Input
                  type="password"
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  icon={<LockKey className="h-4 w-4" />}
                  error={errors.password?.message}
                  {...register('password')}
                />
                <div className="flex items-center space-x-1.5 pt-1 text-[11px] text-muted-foreground">
                  <span
                    className={`inline-flex items-center justify-center h-3.5 w-3.5 rounded-full ${
                      hasMinLength ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  >
                    {hasMinLength && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  </span>
                  <span className={hasMinLength ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}>
                    At least 8 characters
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                variant="default"
                size="lg"
                disabled={isSubmitting}
                className="w-full font-semibold rounded-xl shadow-md shadow-primary/20 mt-2"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <span className="h-4 w-4 mr-2 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Creating Account...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <UserPlus className="mr-2 h-4 w-4" weight="bold" /> Create Account
                  </span>
                )}
              </Button>
            </form>

            <div className="text-center pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
              <p className="text-xs text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}
