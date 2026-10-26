'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Cpu, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Google Icon SVG
const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
  };

  const displayError = errorMessage || authContextError || (searchParams.get('error') ? decodeURIComponent(searchParams.get('error') || '').replace(/_/g, ' ') : null);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-indigo-600 selection:text-white">
      {/* Ambient background blur circles */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-indigo-200/30 to-transparent blur-3xl -z-10" />
      <div className="pointer-events-none absolute bottom-0 right-10 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl -z-10" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-blue-600 text-white shadow-[0_4px_16px_rgba(79,70,229,0.35)]">
            <Cpu className="w-6 h-6 text-white stroke-[2.2]" />
          </div>
          <div className="text-left">
            <span className="font-extrabold text-2xl tracking-tight text-slate-900 block leading-tight">
              Campus Nexus
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              Department Portal
            </span>
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 mt-2">
          Institutional Sign In
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
          Information Technology Student Development &amp; Intelligence
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-7 sm:p-9 bg-white/95 backdrop-blur-xl border-slate-200/80 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,1)] rounded-3xl">
          {displayError && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 text-rose-700 text-xs sm:text-sm border border-rose-200/80 flex items-start gap-2.5 animate-in fade-in duration-200 font-medium">
              <span className="mt-0.5">⚠️</span>
              <span>{displayError === 'access_denied' ? 'Google sign-in was cancelled.' : displayError}</span>
            </div>
          )}

          <div className="space-y-4">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={handleGoogleLogin}
              isLoading={isGoogleLoading}
              className="w-full bg-white hover:bg-slate-50/90 border-slate-200/90 text-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)] py-6 text-base font-bold rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
            >
              <span className="flex items-center justify-center gap-3 w-full">
                {!isGoogleLoading && <GoogleIcon />}
                <span>Continue with Google</span>
              </span>
            </Button>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100/90 text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600 stroke-[2.2]" />
              <span>Single Sign-On with Verified College Domain</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/60 text-left">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Automatic Role Mapping
              </p>
              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                  <span><strong>Students:</strong> Skill gap tracking, projects &amp; portfolio</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                  <span><strong>Faculty:</strong> Mentee rosters, session logs &amp; approvals</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                  <span><strong>HOD:</strong> Analytics, governance &amp; accreditation reports</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Security badge at bottom */}
        <div className="mt-6 text-center flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>Protected by Row Level Security (RLS) &amp; Encrypted Sessions</span>
        </div>
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

