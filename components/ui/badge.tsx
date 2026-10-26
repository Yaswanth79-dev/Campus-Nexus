import React, { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 border select-none',
  {
    variants: {
      variant: {
        default: 'bg-slate-100/90 text-slate-700 border-slate-200/80',
        student: 'bg-blue-50/90 text-blue-700 border-blue-200/80 shadow-[0_1px_4px_rgba(37,99,235,0.08)]',
        faculty: 'bg-indigo-50/90 text-indigo-700 border-indigo-200/80 shadow-[0_1px_4px_rgba(79,70,229,0.08)]',
        hod: 'bg-gradient-to-r from-slate-900 to-indigo-950 text-slate-100 border-slate-700/80 shadow-xs',
        success: 'bg-emerald-50/90 text-emerald-700 border-emerald-200/80 shadow-[0_1px_4px_rgba(16,185,129,0.08)]',
        warning: 'bg-amber-50/90 text-amber-800 border-amber-200/80 shadow-[0_1px_4px_rgba(217,119,6,0.08)]',
        danger: 'bg-rose-50/90 text-rose-700 border-rose-200/80 shadow-[0_1px_4px_rgba(225,29,72,0.08)]',
        blue: 'bg-sky-50/90 text-sky-700 border-sky-200/80',
        purple: 'bg-purple-50/90 text-purple-700 border-purple-200/80',
        outline: 'text-slate-600 border-slate-200 bg-white/70 backdrop-blur-xs',
      },
      size: {
        sm: 'px-2 py-0.2 text-[10px]',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-xs font-bold tracking-wider uppercase',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  pulse?: boolean;
}

export function Badge({ className, variant, size, dot, pulse = false, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span className="relative flex h-2 w-2 shrink-0">
          {pulse && (
            <span
              className={cn(
                'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                variant === 'success' && 'bg-emerald-400',
                variant === 'warning' && 'bg-amber-400',
                variant === 'danger' && 'bg-rose-400',
                variant === 'student' && 'bg-blue-400',
                variant === 'faculty' && 'bg-indigo-400',
                variant === 'hod' && 'bg-indigo-400',
                (!variant || variant === 'default' || variant === 'outline') && 'bg-slate-400'
              )}
            />
          )}
          <span
            className={cn(
              'relative inline-flex rounded-full h-2 w-2',
              variant === 'success' && 'bg-emerald-500',
              variant === 'warning' && 'bg-amber-500',
              variant === 'danger' && 'bg-rose-500',
              variant === 'student' && 'bg-blue-500',
              variant === 'faculty' && 'bg-indigo-500',
              variant === 'hod' && 'bg-slate-300',
              (!variant || variant === 'default' || variant === 'outline') && 'bg-slate-400'
            )}
          />
        </span>
      )}
      {children}
    </span>
  );
}

