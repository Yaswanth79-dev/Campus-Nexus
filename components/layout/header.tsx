'use client';

import React, { useState } from 'react';
import {
  Menu,
  Bell,
  LogOut,
  User as UserIcon,
  Settings,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { RoleBadge } from '@/components/navigation/role-badge';
import { Avatar } from '@/components/ui/avatar';
import { Dropdown } from '@/components/ui/dropdown';

export interface HeaderProps {
  onOpenMobileNav: () => void;
  title?: string;
}

export function Header({ onOpenMobileNav, title }: HeaderProps) {
  const { user, role, signOut } = useAuth();
  const [unreadCount] = useState(3);

  const notifications = [
    {
      id: 'notif-1',
      title: 'New Cloud Computing Workshop Posted',
      time: '15m ago',
      unread: true,
    },
    {
      id: 'notif-2',
      title: 'Department Academic Notice: Mid-Term Review',
      time: '1h ago',
      unread: true,
    },
    {
      id: 'notif-3',
      title: 'Smart India Hackathon Registration Open',
      time: '1d ago',
      unread: false,
    },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-[72px] w-full items-center justify-between bg-white/75 backdrop-blur-xl px-4 sm:px-8 border-b border-slate-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all">
      {/* Left side: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenMobileNav}
          className="lg:hidden rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5 stroke-[2.2]" />
        </button>

        {title && (
          <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 truncate">
            {title}
          </h1>
        )}
      </div>

      {/* Middle/Center: Quick search bar */}
      <div className="hidden lg:flex items-center">
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border border-slate-200/80 bg-slate-50/80 text-xs text-slate-400 hover:border-slate-300 hover:bg-white transition-all w-72 shadow-2xs cursor-pointer group">
          <span className="text-slate-400 group-hover:text-indigo-600 transition-colors">
            🔍
          </span>
          <span className="flex-1 text-slate-400 font-medium">Search anything...</span>
          <kbd className="px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-400 shadow-2xs">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right side: Role Badge, Notifications, Profile Dropdown */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Active Role Badge */}
        {role && (
          <div className="hidden sm:block">
            <RoleBadge role={role} size="md" />
          </div>
        )}

        {/* Notifications Dropdown */}
        <Dropdown
          align="right"
          trigger={
            <button
              className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 border border-slate-200/60 bg-white/60 transition-all shadow-2xs cursor-pointer"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4 stroke-[2.2]" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                </span>
              )}
            </button>
          }
        >
          <div className="p-3.5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Notifications
              </span>
              <span className="text-[11px] text-indigo-600 font-semibold cursor-pointer hover:underline">Mark all read</span>
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100/80 py-1">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="px-3.5 py-2.5 hover:bg-slate-50/80 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-800 leading-snug">
                    {n.title}
                  </span>
                  {n.unread && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0 mt-1" />}
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block font-medium">{n.time}</span>
              </div>
            ))}
          </div>
        </Dropdown>

        {/* User Profile Menu */}
        {user && role && (
          <Dropdown
            align="right"
            trigger={
              <button className="flex items-center gap-2.5 rounded-2xl p-1.5 pr-2.5 border border-slate-200/70 bg-white/70 hover:bg-white hover:border-slate-300 transition-all shadow-2xs cursor-pointer">
                <Avatar
                  name={user.fullName}
                  role={role}
                  size="sm"
                  showRoleIndicator
                />
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-900 leading-tight">
                    {user.fullName}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500">
                    {user.studentId || user.facultyId || user.department}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block stroke-[2.2]" />
              </button>
            }
            items={[
              {
                label: user.fullName,
                icon: <UserIcon className="w-4 h-4" />,
                badge: role.toUpperCase(),
              },
              {
                label: 'Account & Department Settings',
                icon: <Settings className="w-4 h-4" />,
              },
              {
                divider: true,
                label: '',
              },
              {
                label: 'Sign Out',
                icon: <LogOut className="w-4 h-4 text-rose-600" />,
                destructive: true,
                onClick: signOut,
              },
            ]}
          />
        )}
      </div>
    </header>
  );
}
