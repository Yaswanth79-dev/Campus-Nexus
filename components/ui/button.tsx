'use client';

import React, { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none cursor-pointer',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white border border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.1),0_4px_12px_rgba(15,23,42,0.15),inset_0_1px_0_rgba(255,255,255,0.15)] hover:shadow-[0_8px_20px_-4px_rgba(15,23,42,0.28)] hover:border-slate-700 hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-slate-900',
        accent:
          'bg-gradient-to-b from-indigo-600 via-indigo-600 to-indigo-700 text-white border border-indigo-500/80 shadow-[0_1px_2px_rgba(79,70,229,0.2),0_4px_16px_rgba(79,70,229,0.25),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_8px_24px_-4px_rgba(79,70,229,0.4)] hover:border-indigo-400 hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-indigo-600',
        secondary:
          'bg-white/95 backdrop-blur-md text-slate-800 border border-slate-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,1)] hover:bg-white hover:border-slate-300 hover:text-slate-900 hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-slate-400',
        outline:
          'border border-slate-200/90 bg-white/60 backdrop-blur-md text-slate-700 hover:bg-white hover:border-slate-300 hover:text-slate-900 hover:shadow-xs active:scale-[0.98] focus-visible:ring-slate-400',
        ghost:
          'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 active:scale-[0.98] focus-visible:ring-slate-400',
        danger:
          'bg-gradient-to-b from-rose-600 to-rose-700 text-white border border-rose-500/70 shadow-[0_1px_2px_rgba(225,29,72,0.2),0_4px_12px_rgba(225,29,72,0.2),inset_0_1px_0_rgba(255,255,255,0.15)] hover:shadow-[0_8px_20px_-4px_rgba(225,29,72,0.35)] hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-rose-600',
        subtle:
          'bg-indigo-50/80 text-indigo-700 border border-indigo-100/80 hover:bg-indigo-100/90 hover:text-indigo-800 active:scale-[0.98] focus-visible:ring-indigo-500',
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
