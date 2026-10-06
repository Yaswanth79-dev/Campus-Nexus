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
            'absolute z-50 mt-2 min-w-[200px] rounded-xl bg-white p-1.5 shadow-lg border border-slate-200 ring-1 ring-black/5 animate-in fade-in zoom-in-95',
            align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left',
            className
          )}
        >
          {items
            ? items.map((item, index) => {
                if (item.divider) {
                  return <hr key={`divider-${index}`} className="my-1 border-slate-100" />;
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
                      'flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-colors text-left',
                      item.destructive
                        ? 'text-rose-600 hover:bg-rose-50'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
                      item.disabled && 'opacity-50 pointer-events-none'
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      {item.icon && <span className="text-slate-400">{item.icon}</span>}
                      <span>{item.label}</span>
                    </span>
                    {item.badge && (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
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
