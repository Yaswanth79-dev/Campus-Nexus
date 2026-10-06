'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RoleBadge } from '@/components/navigation/role-badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ROLE_CONFIGS, UserRole } from '@/types/roles';

function UnauthorizedContent() {
  const searchParams = useSearchParams();
  const attempted = searchParams.get('attempted') || 'this protected area';
  const requiredRole = (searchParams.get('requiredRole') || 'ADMIN') as UserRole;

  const { role, signOut } = useAuth();

  const userDashboard = role ? ROLE_CONFIGS[role].defaultRoute : '/login';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center bg-white border-slate-200 shadow-md">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Access Restricted</h1>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          You do not have the required authorization permissions to access{' '}
          <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-xs text-slate-800">
            {attempted}
          </code>
          .
        </p>

        {/* Role information box */}
        <div className="my-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-left space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Your Active Role:</span>
            {role ? <RoleBadge role={role} size="sm" /> : <span className="text-slate-400">Unauthenticated</span>}
          </div>
          {requiredRole && (
            <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
              <span className="text-slate-500 font-medium">Required Authorization:</span>
              <span className="font-semibold text-rose-700">{requiredRole}</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Link href={userDashboard} className="block">
            <Button variant="primary" className="w-full" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Return to Authorized Dashboard
            </Button>
          </Link>

          <Button
            variant="outline"
            className="w-full"
            onClick={signOut}
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Sign Out / Switch Account
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <LoadingSpinner size="lg" message="Verifying authorization..." />
        </div>
      }
    >
      <UnauthorizedContent />
    </Suspense>
  );
}
