'use client';

import React, { useState, useEffect } from 'react';
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
  User,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Save,
} from 'lucide-react';

export default function HodSettingsPage() {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();

  // Profile State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSavingProfile(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await (supabase
        .from('profiles') as any)
        .update({ full_name: fullName, phone })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      toast({
        type: 'success',
        title: 'HOD Profile Updated',
        message: 'Your profile changes have been saved.',
      });
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Save Failed',
        message: err.message,
      });
    } finally {
      setIsSavingProfile(false);
    }
  };



  return (
    <div className="space-y-6">
      <PageHeader
        title="Department Governance & Security Settings"
        description={`Manage executive credentials, department governance policies, and security settings for ${user?.department || 'IT'}.`}
        breadcrumbs={[
          { label: 'HOD Portal', href: '/hod/dashboard' },
          { label: 'Settings' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 Columns: Profile & Password */}
        <div className="lg:col-span-2 space-y-6">

          {/* Profile Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" /> Executive Profile
              </CardTitle>
              <CardDescription>Head of Department contact information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                  <Input
                    label="College Email"
                    disabled
                    value={user?.email || ''}
                    helperText="Assigned executive account"
                  />
                </div>

                <Input
                  label="Official Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />

                <div className="pt-2">
                  <Button type="submit" variant="primary" isLoading={isSavingProfile}>
                    <Save className="w-4 h-4 mr-1.5" /> Save Executive Profile
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

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

        </div>

        {/* Right Column: Department Scope & Governance Details */}
        <div className="space-y-6">

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-600" /> Department Scope
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Governing Department</span>
                <span className="font-bold text-slate-900 text-sm">{user?.department || 'IT'}</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Role</span>
                <Badge variant="hod" size="sm">HEAD OF DEPARTMENT</Badge>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Governance Scope</span>
                <span className="font-semibold text-emerald-700">Strict Department Isolation</span>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">
                  Account ID: <span className="font-mono text-[10px] text-slate-600">{user?.id}</span>
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Row Level Security Audit */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Security Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-800">Database RLS</span>
                <span className="text-emerald-700 font-bold text-[11px]">Enforced</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-800">Cross-Dept Filter</span>
                <span className="text-emerald-700 font-bold text-[11px]">Restricted</span>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
