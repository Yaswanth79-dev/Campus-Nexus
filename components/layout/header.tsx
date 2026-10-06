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
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/90 px-4 sm:px-6 backdrop-blur-md">
      {/* Left side: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileNav}
          className="lg:hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {title && (
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 truncate">
            {title}
          </h1>
        )}
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
              className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                </span>
              )}
            </button>
          }
        >
          <div className="p-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Notifications
              </span>
              <span className="text-[11px] text-blue-600 font-medium">Mark all read</span>
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 py-1">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="px-3.5 py-2.5 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-medium text-slate-800 leading-tight">
                    {n.title}
                  </span>
                  {n.unread && <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0 mt-1" />}
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">{n.time}</span>
              </div>
            ))}
          </div>
        </Dropdown>

        {/* User Profile Menu */}
        {user && role && (
          <Dropdown
            align="right"
            trigger={
              <button className="flex items-center gap-2.5 rounded-xl p-1.5 hover:bg-slate-100 transition-colors">
                <Avatar
                  name={user.fullName}
                  role={role}
                  size="sm"
                  showRoleIndicator
                />
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-900 leading-tight">
                    {user.fullName}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {user.studentId || user.facultyId || user.department}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
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
