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
        'flex flex-col items-center justify-center p-10 sm:p-14 text-center rounded-[24px] border border-dashed border-slate-200 bg-white/50 backdrop-blur-sm',
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 mb-6 ring-[12px] ring-slate-50/50 shadow-xs">
        {icon || <Inbox className="h-7 w-7 text-slate-400" />}
      </div>
      <h4 className="text-lg font-semibold text-slate-900">{title}</h4>
      <p className="text-sm text-slate-500 mt-2 max-w-md leading-relaxed">{description}</p>
      {actionLabel && (onAction || actionHref) && (
        <div className="mt-5">
          {actionHref ? (
            <a href={actionHref}>
              <Button size="sm" variant="primary">
                {actionLabel}
              </Button>
            </a>
          ) : (
            <Button size="sm" variant="primary" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
