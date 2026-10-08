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
        'relative flex flex-col border border-slate-200/60 bg-white/90 backdrop-blur-xl transition-all duration-300 ease-in-out select-none shrink-0 h-[calc(100vh-2rem)] my-4 ml-4 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] sticky top-4',
        isCollapsed ? 'w-20' : 'w-64',
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-100">
        <Link
          href={`/${role.toLowerCase()}/dashboard`}
          className="flex items-center gap-2.5 overflow-hidden"
          onClick={onItemClick}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md">
            <Cpu className="w-5 h-5 text-indigo-400" />
          </div>

          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <span className="font-bold tracking-tight text-slate-900 text-sm flex items-center gap-1.5">
                Campus Nexus
              </span>
              <span className="text-[11px] font-medium text-slate-500 truncate">
                {navConfig.portalTitle}
              </span>
            </div>
          )}
        </Link>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
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
                      'group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-indigo-50/90 text-indigo-700 font-semibold shadow-sm ring-1 ring-indigo-100/50'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                      isCollapsed && 'justify-center px-0'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'transition-colors',
                          isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                        )}
                      >
                        {getNavIcon(item.icon, 'w-4 h-4')}
                      </span>

                      {!isCollapsed && <span className="truncate">{item.title}</span>}
                    </div>

                    {!isCollapsed && item.badge && (
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0',
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

      {/* Bottom Subtitle / Info */}
      {!isCollapsed && (
        <div className="p-4 border-t border-slate-100 bg-slate-50/30 rounded-b-[24px]">
          <div className="rounded-2xl p-3 bg-white border border-slate-200/60 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-800">IT Department Portal</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Development & Intelligence</div>
          </div>
        </div>
      )}
    </aside>
  );
}
