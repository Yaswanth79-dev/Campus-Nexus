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

          {/* Authentication Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-600" /> Authentication Method
              </CardTitle>
              <CardDescription>
                How you sign in to the Campus Nexus portal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-blue-900">Google Sign-In Active</p>
                  <p className="text-xs text-blue-800 mt-1 leading-relaxed">
                    Your Campus Nexus account is securely authenticated through Google Sign-In. Password management is handled entirely by your Google account.
                  </p>
                </div>
              </div>
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
