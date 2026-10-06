'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Cpu, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Simple Google Icon SVG
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

function LoginForm() {
  const searchParams = useSearchParams();
  const { signInWithGoogle, error: authContextError } = useAuth();
  
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    await signInWithGoogle();
    // Intentionally not setting isGoogleLoading to false because we redirect away
  };

  const displayError = errorMessage || authContextError || (searchParams.get('error') ? decodeURIComponent(searchParams.get('error') || '').replace(/_/g, ' ') : null);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center gap-2.5 mb-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md">
            <Cpu className="w-6 h-6 text-blue-400" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-slate-900">Campus Nexus</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Institutional Portal Sign In
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
          Student Development &amp; Intelligence Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="p-6 sm:p-8 bg-white border-slate-200/80 shadow-md">
          {displayError && (
            <div className="mb-6 p-3 rounded bg-rose-50 text-rose-600 text-sm border border-rose-100 flex items-start gap-2">
              <span className="mt-0.5">⚠️</span>
              <span>{displayError === 'access_denied' ? 'Google sign-in was cancelled.' : displayError}</span>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleGoogleLogin}
            isLoading={isGoogleLoading}
            className="w-full bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-sm py-6 text-base font-medium"
          >
            <span className="flex items-center justify-center gap-3 w-full">
              {!isGoogleLoading && <GoogleIcon />}
              <span>Continue with Google</span>
            </span>
          </Button>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500 leading-relaxed">
              Use your registered institutional Google account to access the portal.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <LoadingSpinner size="lg" message="Loading Campus Nexus sign-in portal..." />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
