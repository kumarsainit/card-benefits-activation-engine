import * as React from 'react';
import { Button, ButtonProps } from './button';
import { cn } from '@/lib/utils';

export interface IconButtonProps extends ButtonProps {
  label: string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, label, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        size="icon"
        variant="ghost"
        aria-label={label}
        title={label}
        className={cn('rounded-xl', className)}
        {...props}
      >
        {children}
      </Button>
    );
  }
);
IconButton.displayName = 'IconButton';
