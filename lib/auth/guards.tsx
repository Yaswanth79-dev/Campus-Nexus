'use client';

import React, { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthContext } from './auth-context';
import { UserRole, normalizeRole } from '@/types/roles';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: (UserRole | string)[];
  fallbackRoute?: string;
}

export function RoleGuard({ children, allowedRoles, fallbackRoute }: RoleGuardProps) {
  const { role, isLoading, isAuthenticated } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();

  const normalizedAllowed = allowedRoles.map((r) => normalizeRole(r)).filter(Boolean) as UserRole[];
  const normalizedUserRole = normalizeRole(role);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (normalizedUserRole && !normalizedAllowed.includes(normalizedUserRole)) {
      if (fallbackRoute) {
        router.push(fallbackRoute);
      } else {
        router.push(
          `/unauthorized?attempted=${encodeURIComponent(pathname)}&requiredRole=${normalizedAllowed.join(',').toUpperCase()}&currentRole=${(normalizedUserRole || '').toUpperCase()}`
        );
      }
    }
  }, [normalizedUserRole, isLoading, isAuthenticated, normalizedAllowed, fallbackRoute, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" message="Verifying department authorization..." />
      </div>
    );
  }

  if (!isAuthenticated || !normalizedUserRole || !normalizedAllowed.includes(normalizedUserRole)) {
    return null;
  }

  return <>{children}</>;
}
