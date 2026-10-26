'use client';

import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export interface DropdownItem {
  id?: string;
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  destructive?: boolean;
  badge?: string;
  divider?: boolean;
}

export interface DropdownProps {
  trigger: ReactNode;
  items?: DropdownItem[];
  children?: ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({ trigger, items, children, align = 'right', className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div onClick={() => setIsOpen((prev) => !prev)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-2 min-w-[220px] rounded-2xl bg-white/95 backdrop-blur-xl p-1.5 shadow-[0_12px_36px_-6px_rgba(15,23,42,0.12),0_2px_8px_rgba(0,0,0,0.04)] border border-slate-200/80 ring-1 ring-black/[0.03] animate-in fade-in zoom-in-95 duration-150',
            align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left',
            className
          )}
        >
          {items
            ? items.map((item, index) => {
                if (item.divider) {
                  return <hr key={`divider-${index}`} className="my-1.5 border-slate-100" />;
                }

                return (
                  <button
                    key={item.id || item.label}
                    disabled={item.disabled}
                    onClick={() => {
                      if (item.onClick) item.onClick();
                      setIsOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs sm:text-sm font-medium transition-colors text-left cursor-pointer',
                      item.destructive
                        ? 'text-rose-600 hover:bg-rose-50/80'
                        : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900',
                      item.disabled && 'opacity-50 pointer-events-none'
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      {item.icon && <span className="text-slate-400 shrink-0">{item.icon}</span>}
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.badge && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200/50">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })
            : children}
        </div>
      )}
    </div>
  );
}
