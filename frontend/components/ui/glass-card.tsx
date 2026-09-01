import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const glassCardVariants = cva('rounded-2xl transition-all duration-300 relative overflow-hidden', {
  variants: {
    variant: {
      default: 'glass-primary',
      secondary: 'glass-secondary',
      elevated: 'glass-elevated',
      interactive: 'glass-interactive',
      purchase: 'glass-primary benefit-glow-purchase',
      return: 'glass-primary benefit-glow-return',
      travel: 'glass-primary benefit-glow-travel',
    },
    padding: {
      none: 'p-0',
      sm: 'p-4',
      default: 'p-6',
      lg: 'p-8',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'default',
  },
});

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant, padding, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(glassCardVariants({ variant, padding, className }))} {...props}>
        {children}
      </div>
    );
  }
);
GlassCard.displayName = 'GlassCard';

export const GlassCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('flex flex-col space-y-1.5 mb-4', className)} {...props} />
);
GlassCardHeader.displayName = 'GlassCardHeader';

export const GlassCardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-lg font-semibold leading-none tracking-tight text-foreground', className)} {...props} />
  )
);
GlassCardTitle.displayName = 'GlassCardTitle';

export const GlassCardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground leading-relaxed', className)} {...props} />
  )
);
GlassCardDescription.displayName = 'GlassCardDescription';

export const GlassCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('space-y-4', className)} {...props} />
);
GlassCardContent.displayName = 'GlassCardContent';

export const GlassCardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center justify-between pt-4 mt-4 border-t border-slate-200/50 dark:border-slate-800/50', className)} {...props} />
  )
);
GlassCardFooter.displayName = 'GlassCardFooter';
