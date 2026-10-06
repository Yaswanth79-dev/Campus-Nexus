'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Building,
  Mail,
  User,
  KeyRound,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function StudentSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      toast({
        type: 'success',
        title: 'Password Updated',
        message: 'Your account password has been changed successfully.',
      });

      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password.');
      toast({
        type: 'error',
        title: 'Update Failed',
        message: err.message,
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Account & Security Settings"
        description="Manage your institutional authentication credentials, account security, and department profile."
        breadcrumbs={[
          { label: 'Student Portal', href: '/student/dashboard' },
          { label: 'Settings' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 Columns: Password & Security */}
        <div className="lg:col-span-2 space-y-6">

          {/* Change Password Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-600" /> Change Account Password
              </CardTitle>
              <CardDescription>
                Update your login password used across the Campus Nexus portal
              </CardDescription>
            </CardHeader>
            <CardContent>
              {passwordError && (
                <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="relative">
                  <Input
                    label="New Password"
                    type={showPass ? 'text' : 'password'}
                    required
                    placeholder="Minimum 8 characters"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordError(null);
                    }}
                    leadingIcon={<Lock className="w-4 h-4" />}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div>
                  <Input
                    label="Confirm New Password"
                    type={showPass ? 'text' : 'password'}
                    required
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPasswordError(null);
                    }}
                    leadingIcon={<Lock className="w-4 h-4" />}
                  />
                  {confirmPassword.length > 0 && newPassword === confirmPassword && (
                    <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3 h-3" /> Passwords match
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isUpdatingPassword}
                  disabled={!newPassword || newPassword !== confirmPassword || isUpdatingPassword}
                >
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Security & Access Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Security & Access Controls
              </CardTitle>
              <CardDescription>Verified security protections active on your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-800">Database Row Level Security (RLS)</span>
                </div>
                <span className="text-emerald-700 font-bold text-[11px]">Enforced</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-800">Department Isolation Policy</span>
                </div>
                <span className="text-emerald-700 font-bold text-[11px]">
                  {user?.department || 'IT'} Only
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-800">Tamper-Proof Role Trigger</span>
                </div>
                <span className="text-emerald-700 font-bold text-[11px]">Active</span>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right Column: Account Snapshot */}
        <div className="space-y-6">

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" /> Profile Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Full Name</span>
                <span className="font-bold text-slate-900 text-sm">{user?.fullName}</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">College Email</span>
                <span className="font-semibold text-slate-800">{user?.email}</span>
              </div>

              {user?.phone && (
                <div>
                  <span className="text-slate-400 block font-medium">Contact Phone</span>
                  <span className="font-semibold text-slate-800">{user.phone}</span>
                </div>
              )}

              <div>
                <span className="text-slate-400 block font-medium">Role</span>
                <Badge variant="student" size="sm">STUDENT</Badge>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Department</span>
                <div className="flex items-center gap-1.5 font-bold text-slate-900 mt-0.5">
                  <Building className="w-4 h-4 text-blue-600" />
                  <span>{user?.department || 'IT'}</span>
                </div>
              </div>

              {user?.studentId && (
                <div>
                  <span className="text-slate-400 block font-medium">Roll Number</span>
                  <span className="font-bold font-mono text-slate-900">{user.studentId}</span>
                </div>
              )}

              {user?.semester && (
                <div>
                  <span className="text-slate-400 block font-medium">Current Semester</span>
                  <span className="font-semibold text-slate-900">Semester {user.semester} (Year {user.year || 1})</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">
                  Account ID: <span className="font-mono text-[10px] text-slate-600">{user?.id}</span>
                </span>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
