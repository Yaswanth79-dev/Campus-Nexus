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
  GraduationCap,
  Briefcase,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Save,
} from 'lucide-react';

export default function FacultySettingsPage() {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();

  // Profile Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('IT');
  const [designation, setDesignation] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [qualification, setQualification] = useState('');
  const [experienceYears, setExperienceYears] = useState(8);
  const [officeLocation, setOfficeLocation] = useState('');
  const [officeHours, setOfficeHours] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
      setDepartment(user.department || 'IT');
      setDesignation(user.designation || 'Associate Professor');
      setSpecialization(user.specialization || 'Distributed Systems & Cloud Computing');
      setQualification(user.qualification || 'Ph.D. in Computer Science');
      setExperienceYears(user.experienceYears || 8);
      setOfficeLocation(user.officeLocation || 'Block 2, Room 304');
      setOfficeHours(user.officeHours || 'Mon-Wed 2:00 PM - 4:00 PM');
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSavingProfile(true);
    try {
      const supabase = getSupabaseBrowserClient();

      // 1. Update profiles table
      const { error: pErr } = await (supabase
        .from('profiles') as any)
        .update({ 
          full_name: fullName.trim() || user.fullName || 'Faculty Member', 
          phone: phone.trim() || null,
          department: department || user.department || 'IT',
        })
        .eq('id', user.id);
      if (pErr) throw pErr;

      // 2. Upsert faculty table
      const { error: fErr } = await (supabase
        .from('faculty') as any)
        .upsert({
          id: user.id,
          designation: designation.trim() || null,
          specialization: specialization.trim() || null,
          qualification: qualification.trim() || null,
          experience_years: Number(experienceYears) || 0,
          office_location: officeLocation.trim() || null,
          office_hours: officeHours.trim() || null,
        });
      if (fErr) throw fErr;

      await refreshProfile();
      toast({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your faculty credentials have been saved.',
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

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
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
        title="Faculty Profile & Account Settings"
        description="Manage your verified faculty credentials, research specialization, office hours, and security credentials."
        breadcrumbs={[
          { label: 'Faculty Portal', href: '/faculty/dashboard' },
          { label: 'Settings' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 Columns: Faculty Profile Details */}
        <div className="lg:col-span-2 space-y-6">

          {/* Profile Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-600" /> Academic & Professional Credentials
              </CardTitle>
              <CardDescription>Visible to students and HOD in your department</CardDescription>
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
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Department <span className="text-rose-500">*</span>
                    </label>
                    <select
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    >
                      <option value="IT">Information Technology (IT)</option>
                      <option value="CSE">Computer Science & Engineering (CSE)</option>
                      <option value="ECE">Electronics & Communication Engineering (ECE)</option>
                      <option value="EEE">Electrical & Electronics Engineering (EEE)</option>
                      <option value="MECH">Mechanical Engineering (MECH)</option>
                      <option value="CIVIL">Civil Engineering (CIVIL)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 12345"
                  />
                  <Input
                    label="College Email"
                    disabled
                    value={user?.email || ''}
                    helperText="Assigned by institution"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Designation"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Associate Professor"
                  />
                  <Input
                    label="Highest Qualification"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    placeholder="e.g. Ph.D. in Computer Science"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Specialization / Research Domain"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="e.g. Cloud Computing & Distributed Systems"
                  />
                  <Input
                    label="Teaching Experience (Years)"
                    type="number"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value))}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Office Location"
                    value={officeLocation}
                    onChange={(e) => setOfficeLocation(e.target.value)}
                    placeholder="e.g. Academic Block 2, Room 304"
                  />
                  <Input
                    label="Office / Consultation Hours"
                    value={officeHours}
                    onChange={(e) => setOfficeHours(e.target.value)}
                    placeholder="e.g. Mon-Wed 2:00 PM - 4:00 PM"
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit" variant="primary" isLoading={isSavingProfile}>
                    <Save className="w-4 h-4 mr-1.5" /> Save Profile Details
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Change Password Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-600" /> Change Account Password
              </CardTitle>
              <CardDescription>Update your login credentials</CardDescription>
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

        </div>

        {/* Right Column: Account Snapshot & Security Controls */}
        <div className="space-y-6">

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" /> Account Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Full Name</span>
                <span className="font-bold text-slate-900 text-sm">{user?.fullName}</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Role</span>
                <Badge variant="faculty" size="sm">FACULTY MENTOR</Badge>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Department</span>
                <div className="flex items-center gap-1.5 font-bold text-slate-900 mt-0.5">
                  <Building className="w-4 h-4 text-indigo-600" />
                  <span>{user?.department || 'IT'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">
                  Account ID: <span className="font-mono text-[10px] text-slate-600">{user?.id}</span>
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Security & Access Overview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Governance Policies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-800">Department Isolation</span>
                <span className="text-emerald-700 font-bold text-[11px]">{user?.department || 'IT'} Only</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-800">Mentorship Access</span>
                <span className="text-emerald-700 font-bold text-[11px]">Active</span>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
