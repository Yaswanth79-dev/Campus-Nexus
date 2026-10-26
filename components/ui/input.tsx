'use client';

import React, { InputHTMLAttributes, forwardRef, ReactNode, useId } from 'react';
import { cn } from '@/lib/utils/cn';
import { AlertCircle } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelBadge?: string;
  error?: string;
  helperText?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  onClear?: () => void;
  showClear?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      labelBadge,
      error,
      helperText,
      leadingIcon,
      trailingIcon,
      id,
      disabled,
      required,
      value,
      onClear,
      showClear,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const hasValue = value !== undefined && value !== '' && value !== null;

    return (
      <div className="w-full space-y-1.5 group">
        {(label || labelBadge) && (
          <div className="flex items-center justify-between gap-2 px-0.5">
            {label && (
              <label
                htmlFor={inputId}
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
          {leadingIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors duration-200">
              {leadingIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled}
            required={required}
            value={value}
            className={cn(
              'block w-full rounded-xl border bg-white/95 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400',
              'transition-all duration-200 ease-out',
              'shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,1)]',
              'hover:border-slate-300 hover:bg-white',
              'focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 focus:shadow-[0_0_0_1px_rgba(99,102,241,0.2),0_4px_16px_rgba(99,102,241,0.08)]',
              'disabled:cursor-not-allowed disabled:bg-slate-50/80 disabled:text-slate-400 disabled:border-slate-200 disabled:shadow-none',
              error
                ? 'border-rose-300 bg-rose-50/20 text-rose-950 placeholder:text-rose-300 focus:border-rose-500 focus:ring-rose-500/15'
                : 'border-slate-200/90',
              leadingIcon && 'pl-10',
              (trailingIcon || (showClear && hasValue && onClear)) && 'pr-10',
              className
            )}
            {...props}
          />

          {/* Clear button if enabled */}
          {showClear && hasValue && onClear && !disabled && (
            <button
              type="button"
              onClick={onClear}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Clear input"
            >
              <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                ✕
              </span>
            </button>
          )}

          {trailingIcon && (!showClear || !hasValue || !onClear) && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors duration-200">
              {trailingIcon}
            </div>
          )}
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

Input.displayName = 'Input';

