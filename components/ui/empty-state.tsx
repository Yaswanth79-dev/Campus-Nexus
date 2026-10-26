import React, { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from './button';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-10 sm:p-14 text-center rounded-2xl sm:rounded-3xl border border-dashed border-slate-300/80 bg-white/70 backdrop-blur-md shadow-xs',
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-5 ring-8 ring-indigo-50/50 shadow-xs">
        {icon || <Inbox className="h-7 w-7 text-indigo-500 stroke-[1.8]" />}
      </div>
      <h4 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">{title}</h4>
      <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md leading-relaxed">{description}</p>
      {actionLabel && (onAction || actionHref) && (
        <div className="mt-6">
          {actionHref ? (
            <a href={actionHref}>
              <Button size="sm" variant="accent">
                {actionLabel}
              </Button>
            </a>
          ) : (
            <Button size="sm" variant="accent" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
