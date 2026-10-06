'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Cpu, Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ROLE_CONFIGS, UserRole } from '@/types/roles';

// Simple Google Icon SVG
const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
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

type AuthMode = 'login' | 'register' | 'forgot_password';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPasswordForEmail, error: authContextError } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    await signInWithGoogle();
    setIsGoogleLoading(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    if (mode === 'login') {
      if (!email || !password) {
        setErrorMessage('Please enter both email and password.');
        setIsLoading(false);
        return;
      }
      const result = await signInWithEmail(email, password);
      if (result.success && result.role) {
        const defaultRoute = ROLE_CONFIGS[result.role as UserRole]?.defaultRoute || '/student/dashboard';
        const destination = redirectUrl || defaultRoute;
        router.push(destination);
      } else {
        setErrorMessage(result.error || 'Invalid login credentials.');
      }
    } else if (mode === 'register') {
      if (!fullName || !email || !password || !confirmPassword) {
        setErrorMessage('Please fill in all fields.');
        setIsLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        setIsLoading(false);
        return;
      }
      if (password.length < 8) {
        setErrorMessage('Password must be at least 8 characters long.');
        setIsLoading(false);
        return;
      }
      
      const result = await signUpWithEmail(email, password, fullName);
      if (result.success) {
        setSuccessMessage(result.error || 'Registration successful. Please log in or check your email.');
        if (result.role) {
           const defaultRoute = ROLE_CONFIGS[result.role as UserRole]?.defaultRoute || '/student/dashboard';
           const destination = redirectUrl || defaultRoute;
           router.push(destination);
           return;
        }
        setMode('login');
        setPassword('');
        setConfirmPassword('');
      } else {
        setErrorMessage(result.error || 'Registration failed.');
      }
    } else if (mode === 'forgot_password') {
      if (!email) {
        setErrorMessage('Please enter your email address.');
        setIsLoading(false);
        return;
      }
      const result = await resetPasswordForEmail(email);
      if (result.success) {
        setSuccessMessage('Password reset instructions have been sent to your email.');
        setMode('login');
      } else {
        setErrorMessage(result.error || 'Failed to send reset instructions.');
      }
    }

    setIsLoading(false);
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
          {mode === 'login' ? 'Institutional Portal Sign In' : mode === 'register' ? 'Create an Account' : 'Reset Password'}
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
          Student Development &amp; Intelligence Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="p-6 sm:p-8 bg-white border-slate-200/80 shadow-md">
          {displayError && (
            <div className="mb-4 p-3 rounded bg-rose-50 text-rose-600 text-sm border border-rose-100 flex items-start gap-2">
              <span className="mt-0.5">⚠️</span>
              <span>{displayError}</span>
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-3 rounded bg-emerald-50 text-emerald-600 text-sm border border-emerald-100 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-500" />
              <span>{successMessage}</span>
            </div>
          )}

          {(mode === 'login' || mode === 'register') && (
            <>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleGoogleLogin}
                isLoading={isGoogleLoading}
                className="w-full bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-sm"
              >
                {!isGoogleLoading && <GoogleIcon />}
                Continue with Google
              </Button>

              <div className="mt-6 mb-6 flex items-center justify-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="px-4 text-xs font-medium text-slate-400 bg-white">OR</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>
            </>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      setErrorMessage(null);
                    }}
                    className="block w-full pl-10 pr-3 py-2 rounded-md sm:text-sm border border-slate-300 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMessage(null);
                  }}
                  className="block w-full pl-10 pr-3 py-2 rounded-md sm:text-sm border border-slate-300 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  placeholder="name@college.edu"
                />
              </div>
            </div>

            {mode !== 'forgot_password' && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMessage(null);
                    }}
                    className="block w-full pl-10 pr-10 py-2 rounded-md sm:text-sm border border-slate-300 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrorMessage(null);
                    }}
                    className="block w-full pl-10 pr-10 py-2 rounded-md sm:text-sm border border-slate-300 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot_password');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-xs font-medium text-blue-600 hover:text-blue-500"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-2"
            >
              {mode === 'login' ? 'Sign In' : mode === 'register' ? 'Register' : 'Send Reset Link'}
            </Button>
            
            <div className="mt-4 text-center">
               {mode === 'login' ? (
                 <p className="text-xs text-slate-500">
                   Don't have an account?{' '}
                   <button
                     type="button"
                     onClick={() => {
                       setMode('register');
                       setErrorMessage(null);
                       setSuccessMessage(null);
                     }}
                     className="font-semibold text-blue-600 hover:text-blue-500"
                   >
                     Register here
                   </button>
                 </p>
               ) : (
                 <p className="text-xs text-slate-500">
                   {mode === 'register' ? 'Already have an account?' : 'Remember your password?'}
                   {' '}
                   <button
                     type="button"
                     onClick={() => {
                       setMode('login');
                       setErrorMessage(null);
                       setSuccessMessage(null);
                     }}
                     className="font-semibold text-blue-600 hover:text-blue-500"
                   >
                     Sign In
                   </button>
                 </p>
               )}
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500 leading-relaxed">
              Use your registered Google account or institutional email to access the portal.
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
