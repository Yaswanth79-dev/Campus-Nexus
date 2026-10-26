import React, { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl sm:rounded-3xl border border-slate-200/70 bg-white/90 backdrop-blur-md text-slate-900',
        'shadow-[0_1px_3px_rgba(15,23,42,0.03),0_8px_24px_-4px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.9)]',
        'transition-all duration-300',
        hoverable &&
          'hover:shadow-[0_12px_36px_-6px_rgba(15,23,42,0.08),0_4px_12px_rgba(99,102,241,0.04)] hover:border-indigo-200/80 hover:-translate-y-1 cursor-pointer',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-5 sm:p-6 pb-4 sm:pb-5 border-b border-slate-100/80', className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('font-bold text-base sm:text-lg text-slate-900 leading-snug tracking-tight', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-xs sm:text-sm text-slate-500 font-normal leading-relaxed mt-1', className)}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-5 sm:p-6', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center p-5 sm:p-6 pt-3.5 sm:pt-4 border-t border-slate-100/70 bg-slate-50/40 rounded-b-2xl sm:rounded-b-3xl',
        className
      )}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

