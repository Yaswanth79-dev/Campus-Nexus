'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Cpu, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

type PageState = 'loading' | 'form' | 'success' | 'invalid';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password strength checks
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const strengthScore = Object.values(checks).filter(Boolean).length;
  const strengthLabel = strengthScore <= 1 ? 'Weak' : strengthScore === 2 ? 'Fair' : strengthScore === 3 ? 'Good' : 'Strong';
  const strengthColor = strengthScore <= 1 ? 'bg-rose-500' : strengthScore === 2 ? 'bg-amber-500' : strengthScore === 3 ? 'bg-blue-500' : 'bg-emerald-500';

  useEffect(() => {
    // Verify that the user has an active recovery session
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setPageState('form');
      } else {
        setPageState('invalid');
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!checks.length) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your new password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: updateErr } = await supabase.auth.updateUser({ password });

      if (updateErr) {
        setError(updateErr.message || 'Failed to update password. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Sign out after password reset so the user logs in fresh with new password
      await supabase.auth.signOut();
      setPageState('success');
    } catch (err) {
      console.error('Password reset error:', err);
      setError('An unexpected error occurred. Please request a new reset link.');
      setIsSubmitting(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" message="Verifying reset link..." />
      </div>
    );
  }

  // ── Invalid / expired link ─────────────────────────────────────────────────
  if (pageState === 'invalid') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md">
                <Cpu className="w-6 h-6 text-blue-400" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-slate-900">Campus Nexus</span>
            </Link>
          </div>
          <Card className="p-8 bg-white border-slate-200/80 shadow-md text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Reset Link Expired or Invalid</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              This password reset link is no longer valid. Reset links expire after 1 hour for security.
              Please request a new one from the login page.
            </p>
            <Link href="/login">
              <Button variant="primary" className="w-full mt-2">
                Back to Sign In
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (pageState === 'success') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md">
                <Cpu className="w-6 h-6 text-blue-400" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-slate-900">Campus Nexus</span>
            </Link>
          </div>
          <Card className="p-8 bg-white border-slate-200/80 shadow-md text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Password Changed Successfully</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Your password has been updated. You can now sign in to Campus Nexus with your new password.
            </p>
            <Button
              variant="primary"
              className="w-full mt-2"
              onClick={() => router.push('/login')}
            >
              Sign In Now
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md">
            <Cpu className="w-6 h-6 text-blue-400" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-slate-900">Campus Nexus</span>
        </Link>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Set New Password
        </h2>
        <p className="mt-1.5 text-sm text-slate-500">
          Choose a strong password for your department portal account.
        </p>
      </div>

      {/* Form Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="p-6 sm:p-8 bg-white border-slate-200/80 shadow-md">

          {/* Security badge */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100 mb-6">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-xs text-blue-700 font-medium">Secure password reset — your identity has been verified</span>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password */}
            <div className="relative">
              <Input
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                placeholder="Minimum 8 characters"
                leadingIcon={<Lock className="w-4 h-4" />}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Strength */}
            {password.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Password strength</span>
                  <span className={`font-semibold ${
                    strengthScore <= 1 ? 'text-rose-600' :
                    strengthScore === 2 ? 'text-amber-600' :
                    strengthScore === 3 ? 'text-blue-600' : 'text-emerald-600'
                  }`}>{strengthLabel}</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                        i <= strengthScore ? strengthColor : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-1 pt-1">
                  {[
                    { ok: checks.length, label: '8+ characters' },
                    { ok: checks.uppercase, label: 'Uppercase letter' },
                    { ok: checks.lowercase, label: 'Lowercase letter' },
                    { ok: checks.number, label: 'Number' },
                  ].map(({ ok, label }) => (
                    <div key={label} className={`flex items-center gap-1.5 text-[11px] font-medium ${ok ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <CheckCircle2 className={`w-3 h-3 ${ok ? 'text-emerald-500' : 'text-slate-300'}`} />
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confirm Password */}
            <div className="relative">
              <Input
                label="Confirm New Password"
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                placeholder="Re-enter your new password"
                leadingIcon={<Lock className="w-4 h-4" />}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600 transition-colors"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <p className="text-[11px] text-rose-600 mt-1.5 font-medium">Passwords do not match</p>
              )}
              {confirmPassword.length > 0 && password === confirmPassword && (
                <p className="text-[11px] text-emerald-600 mt-1.5 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Passwords match
                </p>
              )}
            </div>

            <div className="pt-1">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                className="w-full"
                disabled={!checks.length || password !== confirmPassword || isSubmitting}
              >
                Set New Password
              </Button>
            </div>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Remembered your password?{' '}
              <Link href="/login" className="text-blue-600 font-semibold hover:underline">
                Back to Sign In
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
