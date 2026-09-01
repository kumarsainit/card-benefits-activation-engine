'use client';

import * as React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreditCard, Plus, ShieldCheck, Sparkle, LockKey } from '@phosphor-icons/react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { VirtualGlassCard } from '@/components/cards/virtual-glass-card';
import { useCards, useCreateCard } from '@/features/cards/use-cards';
import { cardCreateSchema, CardCreateFormData } from '@/schemas';
import { toast } from 'sonner';

export default function CardsPage() {
  const { data: cards = [], isLoading } = useCards();
  const createCardMutation = useCreateCard();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CardCreateFormData>({
    resolver: zodResolver(cardCreateSchema),
    defaultValues: {
      cardNumberLast4: '',
      cardNetwork: 'AMEX',
      cardTier: 'PLATINUM',
      cardholderName: '',
      expiryMonth: 12,
      expiryYear: 2028,
    },
  });

  const onSubmit = async (data: CardCreateFormData) => {
    try {
      await createCardMutation.mutateAsync({
        cardNumberLast4: data.cardNumberLast4,
        cardNetwork: data.cardNetwork,
        cardTier: data.cardTier,
        cardholderName: data.cardholderName,
        expiryMonth: Number(data.expiryMonth),
        expiryYear: Number(data.expiryYear),
      });
      toast.success('Card Enrolled Successfully', {
        description: 'Built-in protection policies attached to your card.',
      });
      setIsDialogOpen(false);
      reset();
    } catch (err: any) {
      toast.error('Enrollment Failed', {
        description: err.message || 'Error enrolling card.',
      });
    }
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-6 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl glass-primary border border-slate-200/80 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Badge variant="default">Card Portfolio</Badge>
              <span className="text-xs text-muted-foreground">&bull; Enrolled Protections</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Enrolled Payment Cards</h1>
            <p className="text-xs text-muted-foreground">
              Credit cards connected to the activation engine with automatic insurance policy coverage.
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm" className="rounded-xl text-xs font-semibold shadow-md shadow-primary/20">
                <Plus className="mr-1.5 h-3.5 w-3.5" weight="bold" /> Enroll New Card
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enroll Payment Card</DialogTitle>
                <DialogDescription className="text-xs">
                  Connect a credit card to automatically activate its built-in purchase, return, and travel delay benefits.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Card Network</label>
                    <select
                      className="flex h-11 w-full rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 px-3 py-2 text-sm"
                      {...register('cardNetwork')}
                    >
                      <option value="AMEX">American Express</option>
                      <option value="VISA">Visa</option>
                      <option value="MASTERCARD">Mastercard</option>
                      <option value="DISCOVER">Discover</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Card Tier</label>
                    <select
                      className="flex h-11 w-full rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 px-3 py-2 text-sm"
                      {...register('cardTier')}
                    >
                      <option value="PLATINUM">Platinum Tier ($10,000 Purchase / $300 Return)</option>
                      <option value="SAPPHIRE_RESERVE">Sapphire Reserve ($500 Travel / $500 Purchase)</option>
                      <option value="GOLD">Gold Premier ($500 Purchase)</option>
                      <option value="STANDARD">Standard Protection</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">Cardholder Name</label>
                  <Input placeholder="Alex Carter" error={errors.cardholderName?.message} {...register('cardholderName')} />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Last 4 Digits</label>
                    <Input placeholder="4821" maxLength={4} error={errors.cardNumberLast4?.message} {...register('cardNumberLast4')} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Exp Month</label>
                    <Input type="number" min={1} max={12} placeholder="12" error={errors.expiryMonth?.message} {...register('expiryMonth')} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Exp Year</label>
                    <Input type="number" min={2024} placeholder="2028" error={errors.expiryYear?.message} {...register('expiryYear')} />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="submit" variant="default" disabled={createCardMutation.isPending} className="w-full">
                    {createCardMutation.isPending ? 'Enrolling...' : 'Enroll Card & Attach Protections'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-52 rounded-2xl glass-primary" />
            ))}
          </div>
        ) : cards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card) => (
              <VirtualGlassCard key={card.id} card={card} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-6 rounded-3xl glass-secondary border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
            <CreditCard className="h-10 w-10 text-muted-foreground mx-auto opacity-40" weight="duotone" />
            <h3 className="text-sm font-semibold text-foreground">No Cards Enrolled</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Click &quot;Enroll New Card&quot; to add your credit cards and start monitoring transactions for built-in insurance coverages.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
