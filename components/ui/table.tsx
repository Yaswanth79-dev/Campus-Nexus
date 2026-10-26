import React, { HTMLAttributes, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export const Table = forwardRef<HTMLTableElement, TableHTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-x-auto rounded-2xl sm:rounded-3xl border border-slate-200/70 bg-white/95 backdrop-blur-md shadow-[0_1px_3px_rgba(15,23,42,0.03),0_8px_24px_-4px_rgba(15,23,42,0.04)]">
      <table ref={ref} className={cn('w-full caption-bottom text-sm text-left', className)} {...props} />
    </div>
  )
);
Table.displayName = 'Table';

export const TableHeader = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead
      ref={ref}
      className={cn('bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/70', className)}
      {...props}
    />
  )
);
TableHeader.displayName = 'TableHeader';

export const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn('divide-y divide-slate-100/90 [&_tr:last-child]:border-0', className)} {...props} />
  )
);
TableBody.displayName = 'TableBody';

export const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'transition-colors duration-150 hover:bg-slate-50/90 data-[state=selected]:bg-indigo-50/50',
        className
      )}
      {...props}
    />
  )
);
TableRow.displayName = 'TableRow';

export const TableHead = forwardRef<HTMLTableCellElement, ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn('h-11 px-5 text-left align-middle font-bold text-slate-600 select-none whitespace-nowrap', className)}
      {...props}
    />
  )
);
TableHead.displayName = 'TableHead';

export const TableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn('p-4 sm:p-5 align-middle text-slate-800', className)} {...props} />
  )
);
TableCell.displayName = 'TableCell';

export const TableCaption = forwardRef<HTMLTableCaptionElement, HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} className={cn('mt-4 text-xs text-slate-500 font-medium', className)} {...props} />
  )
);
TableCaption.displayName = 'TableCaption';

