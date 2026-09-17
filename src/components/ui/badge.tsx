import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'destructive';
}

const badgeVariants = {
  default: 'bg-blue-600 text-white',
  secondary: 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100',
  outline: 'border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200',
  success: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800',
  destructive: 'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800',
};

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500',
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  )
);
Badge.displayName = 'Badge';
