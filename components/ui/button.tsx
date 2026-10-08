'use client';

import React, { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none cursor-pointer',
  {
    variants: {
      variant: {
        primary:
          'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 focus-visible:ring-slate-900 shadow-md',
        accent:
          'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 focus-visible:ring-indigo-600 shadow-md',
        secondary:
          'bg-white text-slate-900 hover:bg-slate-50 hover:shadow-md focus-visible:ring-slate-400 border border-slate-200/80 shadow-sm',
        outline:
          'border border-slate-200/80 bg-white/50 backdrop-blur-sm text-slate-700 hover:bg-white hover:text-slate-900 focus-visible:ring-slate-400 shadow-sm',
        ghost:
          'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 focus-visible:ring-slate-400',
        danger:
          'bg-rose-600 text-white hover:bg-rose-700 hover:shadow-lg hover:-translate-y-0.5 focus-visible:ring-rose-600 shadow-md',
        subtle:
          'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 focus-visible:ring-indigo-500',
      },
      size: {
        xs: 'h-8 px-2.5 text-xs gap-1.5',
        sm: 'h-9 px-3 text-sm gap-1.5',
        md: 'h-10 px-4 text-sm gap-2',
        lg: 'h-11 px-5 text-base gap-2.5',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
