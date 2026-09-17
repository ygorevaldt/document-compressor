import * as React from 'react';
import { cn } from '@/lib/utils';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'success' | 'warning';
}

const alertVariants = {
  default: 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100',
  destructive: 'border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-200',
  success: 'border-emerald-300 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200',
  warning: 'border-amber-300 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200',
};

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn('relative w-full rounded-lg border p-4 text-sm', alertVariants[variant], className)}
      {...props}
    />
  )
);
Alert.displayName = 'Alert';

export const AlertTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn('mb-1 font-medium leading-none tracking-tight', className)} {...props} />
  )
);
AlertTitle.displayName = 'AlertTitle';

export const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-sm opacity-90', className)} {...props} />
  )
);
AlertDescription.displayName = 'AlertDescription';
