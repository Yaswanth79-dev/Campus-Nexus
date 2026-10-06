import React, { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors border select-none',
  {
    variants: {
      variant: {
        default: 'bg-slate-100 text-slate-800 border-slate-200',
        student: 'bg-blue-50 text-blue-700 border-blue-200',
        faculty: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        hod: 'bg-slate-900 text-slate-100 border-slate-700',
        success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        warning: 'bg-amber-50 text-amber-700 border-amber-200',
        danger: 'bg-rose-50 text-rose-700 border-rose-200',
        blue: 'bg-sky-50 text-sky-700 border-sky-200',
        purple: 'bg-purple-50 text-purple-700 border-purple-200',
        outline: 'text-slate-600 border-slate-300 bg-transparent',
      },
      size: {
        sm: 'px-2 py-0.2 text-[11px]',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm font-semibold',
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
}

export function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            variant === 'success' && 'bg-emerald-500',
            variant === 'warning' && 'bg-amber-500',
            variant === 'danger' && 'bg-rose-500',
            variant === 'student' && 'bg-blue-500',
            variant === 'faculty' && 'bg-indigo-500',
            variant === 'hod' && 'bg-slate-300',
            (!variant || variant === 'default' || variant === 'outline') && 'bg-slate-400'
          )}
        />
      )}
      {children}
    </span>
  );
}
