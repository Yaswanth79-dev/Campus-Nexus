'use client';

import React, { SelectHTMLAttributes, forwardRef, useId } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  labelBadge?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      labelBadge,
      error,
      helperText,
      options,
      children,
      id,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;

    return (
      <div className="w-full space-y-1.5 group">
        {(label || labelBadge) && (
          <div className="flex items-center justify-between gap-2 px-0.5">
            {label && (
              <label
                htmlFor={selectId}
                className="block text-xs font-semibold tracking-wide text-slate-700 select-none transition-colors group-focus-within:text-indigo-900"
              >
                {label}
                {required && <span className="ml-1 text-rose-500 font-bold">*</span>}
              </label>
            )}
            {labelBadge && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200/60">
                {labelBadge}
              </span>
            )}
          </div>
        )}

        <div className="relative rounded-xl transition-all duration-200">
          <select
            ref={ref}
            id={selectId}
            required={required}
            disabled={disabled}
            className={cn(
              'block w-full rounded-xl border bg-white/95 px-3.5 py-2.5 pr-10 text-sm text-slate-900 appearance-none cursor-pointer',
              'transition-all duration-200 ease-out',
              'shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,1)]',
              'hover:border-slate-300 hover:bg-white',
              'focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 focus:shadow-[0_0_0_1px_rgba(99,102,241,0.2),0_4px_16px_rgba(99,102,241,0.08)]',
              'disabled:cursor-not-allowed disabled:bg-slate-50/80 disabled:text-slate-400 disabled:border-slate-200 disabled:shadow-none',
              error
                ? 'border-rose-300 bg-rose-50/20 text-rose-950 focus:border-rose-500 focus:ring-rose-500/15'
                : 'border-slate-200/90',
              className
            )}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors duration-200">
            <ChevronDown className="w-4 h-4 stroke-[2.2]" />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-1.5 px-0.5 pt-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
            <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <p className="text-xs text-rose-600 font-medium">{error}</p>
          </div>
        )}

        {!error && helperText && (
          <p className="text-xs text-slate-500 px-0.5 leading-relaxed">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

