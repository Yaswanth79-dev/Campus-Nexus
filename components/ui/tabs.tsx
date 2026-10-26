'use client';

import React, { useState, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export interface TabItem {
  id: string;
  label: string;
  count?: number | string;
  icon?: ReactNode;
  content: ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
  variant?: 'underline' | 'pills';
}

export function Tabs({ tabs, defaultTab, onChange, className, variant = 'underline' }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (onChange) onChange(tabId);
  };

  const activeContent = tabs.find((t) => t.id === activeTab)?.content;

  if (variant === 'pills') {
    return (
      <div className={cn('w-full space-y-5', className)}>
        <div className="inline-flex p-1 bg-slate-100/90 backdrop-blur-md rounded-2xl border border-slate-200/80 gap-1 overflow-x-auto no-scrollbar max-w-full">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 whitespace-nowrap cursor-pointer',
                  isActive
                    ? 'bg-white text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                )}
              >
                {tab.icon && <span className="text-current">{tab.icon}</span>}
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.2 text-[10px] font-bold',
                      isActive ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200/80 text-slate-600'
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div>{activeContent}</div>
      </div>
    );
  }

  return (
    <div className={cn('w-full space-y-5', className)}>
      <div className="flex border-b border-slate-200/80 gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                'group flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 -mb-px transition-all duration-200 whitespace-nowrap cursor-pointer',
                isActive
                  ? 'border-indigo-600 text-indigo-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              )}
            >
              {tab.icon && (
                <span className={cn('transition-colors', isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600')}>
                  {tab.icon}
                </span>
              )}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors',
                    isActive ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/60' : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div>{activeContent}</div>
    </div>
  );
}

