import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const buttonVariants = {
  default: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
  destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  outline: 'border border-gray-300 dark:border-gray-700 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100',
  secondary: 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700',
  ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100',
  link: 'text-blue-600 underline-offset-4 hover:underline p-0 h-auto',
};

const buttonSizes = {
  default: 'h-10 px-4 py-2 text-sm',
  sm: 'h-8 px-3 text-xs rounded-md',
  lg: 'h-12 px-8 text-base rounded-md',
  icon: 'h-10 w-10 p-0',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50',
          buttonVariants[variant],
          buttonSizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
