import * as React from 'react';
import { CircleNotch } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'default' | 'lg' | 'xl';
}

export function Spinner({ size = 'default', className, ...props }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  return (
    <div role="status" aria-label="Loading" className={cn('inline-flex items-center justify-center', className)} {...props}>
      <CircleNotch className={cn('animate-spin text-primary', sizeClasses[size])} />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
