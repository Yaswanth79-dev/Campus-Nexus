'use client';

import React, { useState, ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { MobileNav } from './mobile-nav';
import { RoleGuard } from '@/lib/auth/guards';
import { UserRole } from '@/types/roles';

export interface DashboardLayoutProps {
  children: ReactNode;
  role: UserRole;
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <RoleGuard allowedRoles={[role]}>
      <div className="min-h-screen flex bg-transparent">
        {/* Desktop Sidebar */}
        <Sidebar
          role={role}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          className="hidden lg:flex"
        />

        {/* Mobile Navigation Drawer */}
        <MobileNav
          role={role}
          isOpen={isMobileNavOpen}
          onClose={() => setIsMobileNavOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header
            onOpenMobileNav={() => setIsMobileNavOpen(true)}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
