import * as React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, CreditCard, Sparkle } from '@phosphor-icons/react';
import { Card } from '@/types';
import { Badge } from '@/components/ui/badge';

interface VirtualGlassCardProps {
  card: Card;
}

export function VirtualGlassCard({ card }: VirtualGlassCardProps) {
  const getNetworkStyle = () => {
    switch (card.cardNetwork) {
      case 'AMEX':
        return 'from-slate-800 via-slate-900 to-indigo-950 text-slate-100 border-indigo-500/30';
      case 'VISA':
        return 'from-blue-900 via-indigo-950 to-slate-900 text-blue-50 border-blue-500/30';
      case 'MASTERCARD':
        return 'from-slate-900 via-stone-900 to-amber-950 text-amber-50 border-amber-500/30';
      default:
        return 'from-slate-800 via-slate-900 to-slate-950 text-slate-100 border-slate-700/50';
    }
  };

  const getTierLabel = () => {
    switch (card.cardTier) {
      case 'PLATINUM':
        return 'Platinum Card';
      case 'SAPPHIRE_RESERVE':
        return 'Sapphire Reserve';
      case 'GOLD':
        return 'Gold Premier';
      default:
        return 'Standard Protection Card';
    }
  };

  return (
    <Link href={`/cards/${card.id}`} className="group block focus:outline-none">
      <div
        className={`relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br ${getNetworkStyle()} border shadow-xl transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-2xl h-52 flex flex-col justify-between`}
      >
        {/* Card Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-white/90" weight="duotone" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/90">{getTierLabel()}</p>
              <p className="text-[10px] text-white/60 font-mono">{card.cardNetwork}</p>
            </div>
          </div>
          <Badge variant="success" className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 text-[10px]">
            ACTIVE
          </Badge>
        </div>

        {/* Card Number Masked */}
        <div className="py-2">
          <p className="text-lg font-mono font-bold tracking-widest text-white/95">
            &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; {card.cardNumberLast4}
          </p>
        </div>

        {/* Card Footer */}
        <div className="flex items-end justify-between border-t border-white/10 pt-3">
          <div>
            <p className="text-[9px] uppercase tracking-wider text-white/50">Cardholder</p>
            <p className="text-xs font-medium text-white/90">{card.cardholderName || 'Verified Cardholder'}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-wider text-white/50">Expires</p>
            <p className="text-xs font-mono font-medium text-white/90">
              {String(card.expiryMonth).padStart(2, '0')}/{String(card.expiryYear).slice(-2)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
