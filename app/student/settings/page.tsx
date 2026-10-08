'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
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
      {/* Premium Editorial Hero */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-4 pb-8 mb-4 border-b border-slate-200/60">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1 block">Student Portal • Settings</span>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Account & Security Settings
          </h1>
          <p className="text-base text-slate-500 mt-2 max-w-2xl leading-relaxed">
            Manage your institutional authentication credentials, account security, and department profile.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 Columns: Password & Security */}
        <div className="lg:col-span-2 space-y-6">

          {/* Authentication Overview */}
          <div className="bg-white rounded-[24px] border border-slate-200/60 p-6 sm:p-8 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)]">
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 mb-2">
              <KeyRound className="w-5 h-5 text-indigo-600" /> Authentication Method
            </h3>
            <p className="text-sm font-semibold text-slate-500 mb-6">
              How you sign in to the Campus Nexus portal
            </p>
            
            <div className="p-5 rounded-[16px] bg-indigo-50/50 border border-indigo-100/50 flex items-start gap-4 relative overflow-hidden">
              <ShieldCheck className="w-6 h-6 text-indigo-600 mt-1 shrink-0 relative z-10" />
              <div className="relative z-10">
                <p className="text-sm font-black text-indigo-950 uppercase tracking-widest mb-1.5">Google Sign-In Active</p>
                <p className="text-sm font-medium text-slate-700 leading-relaxed max-w-md">
                  Your Campus Nexus account is securely authenticated through Google Sign-In. Password management is handled entirely by your Google account.
                </p>
              </div>
              <ShieldCheck className="w-32 h-32 text-indigo-100 absolute -right-6 -bottom-8 opacity-40 rotate-12" />
            </div>
          </div>

          {/* Security & Access Overview */}
          <div className="bg-white rounded-[24px] border border-slate-200/60 p-6 sm:p-8 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)]">
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" /> Security & Access Controls
            </h3>
            <p className="text-sm font-semibold text-slate-500 mb-6">
              Verified security protections active on your account
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-[16px] bg-slate-50/50 border border-slate-100 transition-colors hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100/50 text-emerald-600 rounded-lg">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-800 text-sm">Database Row Level Security (RLS)</span>
                </div>
                <span className="text-[10px] uppercase font-black tracking-widest text-emerald-600 px-3 py-1 bg-emerald-50 rounded-md">Enforced</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-[16px] bg-slate-50/50 border border-slate-100 transition-colors hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100/50 text-emerald-600 rounded-lg">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-800 text-sm">Department Isolation Policy</span>
                </div>
                <span className="text-[10px] uppercase font-black tracking-widest text-emerald-600 px-3 py-1 bg-emerald-50 rounded-md">
                  {user?.department || 'IT'} Only
                </span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-[16px] bg-slate-50/50 border border-slate-100 transition-colors hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100/50 text-emerald-600 rounded-lg">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-800 text-sm">Tamper-Proof Role Trigger</span>
                </div>
                <span className="text-[10px] uppercase font-black tracking-widest text-emerald-600 px-3 py-1 bg-emerald-50 rounded-md">Active</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Account Snapshot */}
        <div className="space-y-6">

          <div className="bg-white rounded-[24px] border border-slate-200/60 p-6 sm:p-8 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)] sticky top-24">
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 mb-6">
              <User className="w-5 h-5 text-indigo-600" /> Profile Credentials
            </h3>
            
            <div className="space-y-5">
              <div className="flex flex-col gap-1.5 pb-4 border-b border-slate-100/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</span>
                <span className="font-black text-slate-900 text-lg">{user?.fullName}</span>
              </div>

              <div className="flex flex-col gap-1.5 pb-4 border-b border-slate-100/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">College Email</span>
                <span className="font-semibold text-slate-700 text-sm">{user?.email}</span>
              </div>

              {user?.phone && (
                <div className="flex flex-col gap-1.5 pb-4 border-b border-slate-100/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact Phone</span>
                  <span className="font-semibold text-slate-700 text-sm">{user.phone}</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5 pb-4 border-b border-slate-100/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</span>
                <div><Badge variant="student" size="sm">STUDENT</Badge></div>
              </div>

              <div className="flex flex-col gap-1.5 pb-4 border-b border-slate-100/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</span>
                <div className="flex items-center gap-2 font-black text-slate-900">
                  <Building className="w-4 h-4 text-indigo-600" />
                  <span>{user?.department || 'IT'}</span>
                </div>
              </div>

              {user?.studentId && (
                <div className="flex flex-col gap-1.5 pb-4 border-b border-slate-100/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Roll Number</span>
                  <span className="font-bold font-mono text-slate-700 text-sm bg-slate-50 self-start px-2 py-0.5 rounded-md">{user.studentId}</span>
                </div>
              )}

              {user?.semester && (
                <div className="flex flex-col gap-1.5 pb-4 border-b border-slate-100/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Semester</span>
                  <span className="font-bold text-slate-700 text-sm">Semester {user.semester} (Year {user.year || 1})</span>
                </div>
              )}

              <div className="pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Account ID</span>
                <span className="font-mono text-[10px] text-slate-500 bg-slate-100/50 p-2 rounded-lg block truncate">{user?.id}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
