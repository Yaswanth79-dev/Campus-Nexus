import React, { ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from './button';

export interface ErrorStateProps {
  icon?: ReactNode;
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  icon,
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this data. Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-xl border border-rose-200 bg-rose-50/40',
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600 mb-4 ring-8 ring-rose-50">
        {icon || <AlertCircle className="h-6 w-6" />}
      </div>
      <h4 className="text-base font-semibold text-rose-950">{title}</h4>
      <p className="text-sm text-rose-700/90 mt-1 max-w-md">{message}</p>
      {onRetry && (
        <div className="mt-5">
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            leftIcon={<RefreshCw className="w-4 h-4" />}
            className="bg-white border-rose-300 text-rose-800 hover:bg-rose-50"
          >
            Retry Request
          </Button>
        </div>
      )}
    </div>
  );
}
