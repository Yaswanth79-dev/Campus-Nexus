'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { UserRole } from '@/types/roles';
import { ROLE_NAVIGATION_MAP } from '@/components/navigation/nav-items';
import { getNavIcon } from './nav-icon';

export interface SidebarProps {
  role: UserRole;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onItemClick?: () => void;
  className?: string;
}

export function Sidebar({
  role,
  isCollapsed,
  onToggleCollapse,
  onItemClick,
  className,
}: SidebarProps) {
  const pathname = usePathname();
  const navConfig = ROLE_NAVIGATION_MAP[role] || ROLE_NAVIGATION_MAP.student;

  // Group items by section
  const sectionLabels: Record<string, string> = {
    main: 'Overview',
    development: 'Development',
    engagement: 'Engagement',
    management: 'Administration',
    system: 'Account',
  };

  const sections = ['main', 'development', 'management', 'engagement', 'system'] as const;

  return (
    <aside
      className={cn(
        'relative flex flex-col border border-slate-200/70 bg-white/85 backdrop-blur-2xl transition-all duration-300 ease-in-out select-none shrink-0 h-[calc(100vh-2rem)] my-4 ml-4 rounded-3xl sticky top-4',
        'shadow-[0_4px_24px_-4px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.9)]',
        isCollapsed ? 'w-20' : 'w-64',
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-100/80">
        <Link
          href={`/${role.toLowerCase()}/dashboard`}
          className="flex items-center gap-2.5 overflow-hidden group"
          onClick={onItemClick}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-blue-600 text-white shadow-[0_2px_8px_rgba(79,70,229,0.3)] transition-transform duration-200 group-hover:scale-105">
            <Cpu className="w-5 h-5 text-white stroke-[2.2]" />
          </div>

          {!isCollapsed && (
            <div className="flex flex-col truncate ml-1">
              <span className="font-extrabold tracking-tight text-slate-900 text-sm">
                Campus Nexus
              </span>
              <span className="text-[10px] font-medium text-slate-500 tracking-wider uppercase">
                IT Department
              </span>
            </div>
          )}
        </Link>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4 stroke-[2.2]" /> : <ChevronLeft className="w-4 h-4 stroke-[2.2]" />}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
        {sections.map((sectionKey) => {
          const items = navConfig.items.filter((item) => (item.section || 'main') === sectionKey);
          if (items.length === 0) return null;

          return (
            <div key={sectionKey} className="space-y-1">
              {!isCollapsed && sectionLabels[sectionKey] && (
                <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {sectionLabels[sectionKey]}
                </div>
              )}

              {items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== `/${role.toLowerCase()}/dashboard` &&
                    pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onItemClick}
                    title={isCollapsed ? item.title : undefined}
                    className={cn(
                      'group flex items-center justify-between rounded-xl px-3 py-2 text-xs sm:text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-gradient-to-r from-slate-900 to-indigo-950 text-white font-semibold shadow-[0_2px_8px_rgba(15,23,42,0.18)]'
                        : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900',
                      isCollapsed && 'justify-center px-0'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'transition-colors duration-200',
                          isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-700'
                        )}
                      >
                        {getNavIcon(item.icon, 'w-4 h-4 stroke-[2.2]')}
                      </span>

                      {!isCollapsed && <span className="truncate">{item.title}</span>}
                    </div>

                    {!isCollapsed && item.badge && (
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0',
                          item.badgeVariant === 'primary' && 'bg-indigo-100 text-indigo-700',
                          item.badgeVariant === 'success' && 'bg-emerald-100 text-emerald-700',
                          item.badgeVariant === 'warning' && 'bg-amber-100 text-amber-800',
                          item.badgeVariant === 'danger' && 'bg-rose-100 text-rose-700',
                          (!item.badgeVariant || item.badgeVariant === 'default') &&
                            'bg-slate-100 text-slate-600'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="p-3 mt-auto">
        <div className="rounded-2xl p-3 border border-slate-200/70 bg-slate-50/70 backdrop-blur-xs">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            {navConfig.portalTitle}
          </div>
          <div className="text-xs font-bold text-slate-800 mt-0.5">Campus Intelligence</div>
        </div>
      </div>
    </aside>
  );
}
