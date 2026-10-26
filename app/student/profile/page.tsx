'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  User,
  BookOpen,
  GraduationCap,
  Briefcase,
  Globe,
  Code2,
  Share2,
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Sparkles,
  UploadCloud,
  FileCheck,
  Trash2,
  Eye,
  Download,
  Paperclip,
  ExternalLink,
  Lock,
} from 'lucide-react';

export default function StudentProfilePage() {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    // Basic Info (profiles table)
    fullName: '',
    phone: '',
    avatarUrl: '',
    department: 'IT',

    // Academic Info (students table)
    rollNumber: '',
    year: 1,
    semester: 1,
    section: 'A',
    batch: '2023-2027',
    admissionYear: 2023,
    cgpa: 8.5,
    dateOfBirth: '',
    gender: 'Male',
    bio: '',

    // Career & Links (students table)
    githubUrl: '',
    linkedinUrl: '',
    portfolioUrl: '',
    resumeUrl: '',
    careerGoalTitle: '',
    careerDomain: 'Full-Stack Development',
    preferredRole: 'Software Engineer',
    internshipStatus: 'Searching',
    placementStatus: 'Eligible',
    higherStudies: false,
  });

  // Resume / CV Document state
  const [resumeFileName, setResumeFileName] = useState<string>('');
  const [resumeFileSize, setResumeFileSize] = useState<string>('');
  const [resumeMode, setResumeMode] = useState<'upload' | 'url'>('upload');
  const [isReadingFile, setIsReadingFile] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        phone: user.phone || '',
        avatarUrl: user.avatarUrl || '',
        department: user.department || 'IT',
        rollNumber: user.studentId || '',
        year: user.year ?? 1,
        semester: user.semester ?? 1,
        section: user.section || 'A',
        batch: user.batch || '',
        admissionYear: user.admissionYear ?? new Date().getFullYear(),
        cgpa: user.cgpa ?? 0,
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || 'Male',
        bio: user.bio || '',
        githubUrl: user.githubUrl || '',
        linkedinUrl: user.linkedinUrl || '',
        portfolioUrl: user.portfolioUrl || '',
        resumeUrl: user.resumeUrl || '',
        careerGoalTitle: user.careerGoalTitle || '',
        careerDomain: user.careerDomain || 'Full-Stack Development',
        preferredRole: user.preferredRole || 'Software Engineer',
        internshipStatus: user.internshipStatus || 'Not Started',
        placementStatus: user.placementStatus || 'Not Eligible',
        higherStudies: user.higherStudies || false,
      });

      if (user.resumeUrl) {
        if (user.resumeUrl.startsWith('data:application/pdf') || user.resumeUrl.startsWith('data:')) {
          setResumeFileName('Uploaded_Student_Resume.pdf');
          setResumeFileSize('Embedded PDF');
          setResumeMode('upload');
        } else if (user.resumeUrl.startsWith('http')) {
          setResumeFileName(user.resumeUrl.split('/').pop() || 'Online_Resume_Document');
          setResumeMode(user.resumeUrl.includes('.pdf') ? 'upload' : 'url');
        }
      }
    }
  }, [user]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        type: 'error',
        title: 'File too large',
        message: 'Please upload a PDF or document under 10MB.',
      });
      return;
    }

    setIsReadingFile(true);
    setResumeFileName(file.name);
    setResumeFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);

    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = reader.result as string;
      handleInputChange('resumeUrl', dataUri);
      setIsReadingFile(false);
      toast({
        type: 'success',
        title: 'Resume Document Attached',
        message: `${file.name} ready to save. Click "Save Profile Changes" to persist.`,
      });
    };
    reader.onerror = () => {
      setIsReadingFile(false);
      toast({
        type: 'error',
        title: 'Read Failed',
        message: 'Could not read the selected PDF file.',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveResume = () => {
    handleInputChange('resumeUrl', '');
    setResumeFileName('');
    setResumeFileSize('');
    toast({
      type: 'info',
      title: 'Resume Removed',
      message: 'Resume document cleared. Save changes to update database.',
    });
  };

  const handleDownloadResume = () => {
    if (!formData.resumeUrl) return;
    const a = document.createElement('a');
    a.href = formData.resumeUrl;
    a.download = resumeFileName || `${(formData.fullName || 'Student').replace(/\s+/g, '_')}_Resume.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      const supabase = getSupabaseBrowserClient();
      // 1. Update profiles table - only personal profile fields allowed
      const { error: profileError } = await (supabase
        .from('profiles') as any)
        .update({
          full_name: formData.fullName.trim() || user.fullName || 'Student',
          phone: formData.phone.trim() || null,
          avatar_url: formData.avatarUrl || null,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 2. Update students table - only personal and career fields allowed (academic fields are protected)
      const { error: studentError } = await (supabase
        .from('students') as any)
        .update({
          date_of_birth: formData.dateOfBirth ? formData.dateOfBirth : null,
          gender: formData.gender as any,
          bio: formData.bio?.trim() || null,
          github_url: formData.githubUrl?.trim() || null,
          linkedin_url: formData.linkedinUrl?.trim() || null,
          portfolio_url: formData.portfolioUrl?.trim() || null,
          resume_url: formData.resumeUrl || null,
          career_goal_title: formData.careerGoalTitle?.trim() || null,
          career_domain: formData.careerDomain?.trim() || null,
          preferred_role: formData.preferredRole?.trim() || null,
          internship_status: formData.internshipStatus as any,
          placement_status: formData.placementStatus as any,
          higher_studies: Boolean(formData.higherStudies),
        })
        .eq('id', user.id);

      if (studentError) throw studentError;

      await refreshProfile();
      toast({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your academic portfolio and profile details have been saved successfully.',
      });
    } catch (err: any) {
      console.error('Error updating profile:', err);
      toast({
        type: 'error',
        title: 'Save Failed',
        message: err.message || 'Could not save profile changes. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate completion percentage
  const calculateCompletion = () => {
    let filled = 0;
    const total = 14;
    if (formData.fullName) filled++;
    if (formData.phone) filled++;
    if (formData.rollNumber) filled++;
    if (formData.year) filled++;
    if (formData.semester) filled++;
    if (formData.batch) filled++;
    if (formData.cgpa) filled++;
    if (formData.bio) filled++;
    if (formData.githubUrl) filled++;
    if (formData.linkedinUrl) filled++;
    if (formData.portfolioUrl) filled++;
    if (formData.resumeUrl) filled++;
    if (formData.careerGoalTitle) filled++;
    if (formData.dateOfBirth) filled++;
    return Math.round((filled / total) * 100);
  };

  const completionPct = calculateCompletion();

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile & Academic Portfolio"
        description="Manage your verified student credentials, academic standing, technical links, and career goals."
        breadcrumbs={[
          { label: 'Student Portal', href: '/student/dashboard' },
          { label: 'My Profile' },
        ]}
      />

      {/* Top Overview Banner */}
      <div className="rounded-2xl bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Avatar
              name={formData.fullName || user?.fullName || 'Student'}
              role="student"
              size="xl"
              className="border-2 border-white/20 shadow-lg"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {formData.fullName || user?.fullName || 'Student Name'}
                </h2>
                <Badge variant="student" size="sm">
                  {formData.department || user?.department || 'IT'} Department
                </Badge>
                <Badge variant="success" size="sm" dot>
                  Active Student
                </Badge>
              </div>
              <p className="text-sm text-blue-200 mt-1 flex items-center gap-3 flex-wrap">
                <span>Roll No: <strong className="text-white">{formData.rollNumber || 'Not set'}</strong></span>
                <span>•</span>
                <span>Year {formData.year}, Sem {formData.semester} (Sec {formData.section})</span>
                <span>•</span>
                <span>CGPA: <strong className="text-emerald-400">{formData.cgpa || 'N/A'}</strong></span>
              </p>
            </div>
          </div>

          {/* Profile Completion Indicator */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 min-w-[200px] w-full md:w-auto">
            <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
              <span className="text-blue-200 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Profile Completion
              </span>
              <span className="text-white font-bold">{completionPct}%</span>
            </div>
            <div className="w-full bg-black/30 h-2 rounded-full overflow-hidden">
              <div
                className="bg-linear-to-r from-blue-400 to-emerald-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <p className="text-[11px] text-blue-200/80 mt-1.5">
              {completionPct >= 80 ? '✨ Profile is industry ready' : 'Complete profile to unlock all features'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column: Personal & Academic Details */}
          <div className="lg:col-span-2 space-y-6">

            {/* 1. Basic & Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" /> Basic & Contact Information
                </CardTitle>
                <CardDescription>Personal details and institutional contact</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    required
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="e.g. Yashwanth Kumar"
                  />
                  <Input
                    label="College Email"
                    disabled
                    value={user?.email || ''}
                    helperText="Assigned by institution (cannot be changed)"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Phone Number"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                  <Input
                    label="Date of Birth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  />
                  <Select
                    label="Gender"
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </Select>
                </div>

                <Textarea
                  label="Professional Bio"
                  rows={3}
                  placeholder="Passionate IT student specializing in full-stack cloud applications, microservices, and distributed systems."
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                />
              </CardContent>
            </Card>

            {/* 2. Academic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-600" /> Academic Credentials & Standing
                </CardTitle>
                <CardDescription>Official institutional enrollment, semester standing, and registrar-verified CGPA</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800">Protected Academic Credentials: </span>
                    Department affiliation, roll number, semester standing, and cumulative CGPA are official records verified by the academic registry and cannot be self-modified. Contact your department HOD or registrar for official record updates.
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Department / Branch"
                    disabled
                    value={formData.department ? `${formData.department} (Information Technology)` : (user?.department || 'IT')}
                    helperText="Official department assignment"
                  />

                  <Input
                    label="Roll / Registration No."
                    disabled
                    value={formData.rollNumber || 'Assigned by Registrar'}
                    helperText="Institutional registration number"
                  />

                  <Input
                    label="Graduation Batch"
                    disabled
                    value={formData.batch || '2023-2027'}
                    helperText="Admitted batch"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Input
                    label="Year of Study"
                    disabled
                    value={`${formData.year || 1} Year`}
                  />

                  <Input
                    label="Current Semester"
                    disabled
                    value={`Semester ${formData.semester || 1}`}
                  />

                  <Input
                    label="Section"
                    disabled
                    value={formData.section || 'A'}
                  />

                  <Input
                    label="Cumulative CGPA"
                    disabled
                    value={formData.cgpa != null ? Number(formData.cgpa).toFixed(2) : '8.50'}
                    helperText="Registrar verified"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 3. Portfolio & Social Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-600" /> Portfolio & Developer Profiles
                </CardTitle>
                <CardDescription>Showcase your code repositories, live projects, and professional network</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="GitHub Profile URL"
                    leadingIcon={<Code2 className="w-4 h-4" />}
                    value={formData.githubUrl}
                    onChange={(e) => handleInputChange('githubUrl', e.target.value)}
                    placeholder="https://github.com/username"
                  />
                  <Input
                    label="LinkedIn Profile URL"
                    leadingIcon={<Share2 className="w-4 h-4" />}
                    value={formData.linkedinUrl}
                    onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                  />
                  <Input
                    label="Personal Portfolio Website"
                    leadingIcon={<Globe className="w-4 h-4" />}
                    value={formData.portfolioUrl}
                    onChange={(e) => handleInputChange('portfolioUrl', e.target.value)}
                    placeholder="https://yourportfolio.dev"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 4. Resume & Curriculum Vitae (CV) Document Uploader */}
            <Card className="border-indigo-100 bg-linear-to-b from-indigo-50/20 to-white">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" /> Resume & Curriculum Vitae (CV)
                  </CardTitle>
                  <CardDescription>Upload your PDF resume for faculty mentor reviews and campus placements</CardDescription>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setResumeMode('upload')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      resumeMode === 'upload' ? 'bg-white shadow-2xs text-indigo-700 font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    📄 Upload PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setResumeMode('url')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      resumeMode === 'url' ? 'bg-white shadow-2xs text-indigo-700 font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🔗 Web URL
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {resumeMode === 'upload' ? (
                  <div>
                    {formData.resumeUrl ? (
                      <div className="p-4 rounded-xl bg-white border-2 border-indigo-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0">
                            <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.5 rounded font-black tracking-wider">PDF</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-slate-900 text-sm">{resumeFileName || 'Student_Resume.pdf'}</h4>
                              <Badge variant="success" size="sm">Document Attached</Badge>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {resumeFileSize || 'Ready for faculty review & placement drives'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleDownloadResume}
                          >
                            <Download className="w-3.5 h-3.5 mr-1 text-slate-600" /> Download
                          </Button>
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx"
                              className="hidden"
                              onChange={handleFileUpload}
                            />
                            <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs">
                              <UploadCloud className="w-3.5 h-3.5 mr-1 text-blue-600" /> Replace PDF
                            </span>
                          </label>
                          <button
                            type="button"
                            onClick={handleRemoveResume}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Remove Document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 hover:bg-indigo-50/70 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all text-center group">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                        <div className="w-12 h-12 rounded-full bg-white shadow-sm text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {isReadingFile ? 'Reading PDF file...' : 'Click to Upload Resume (PDF / DOCX)'}
                        </span>
                        <p className="text-xs text-slate-500 mt-1">
                          Drag and drop or browse from your computer (Maximum 10 MB)
                        </p>
                      </label>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Input
                      label="Online Resume / Cloud Document URL"
                      leadingIcon={<FileText className="w-4 h-4" />}
                      value={formData.resumeUrl}
                      onChange={(e) => handleInputChange('resumeUrl', e.target.value)}
                      placeholder="https://drive.google.com/file/d/... or https://notion.so/..."
                      helperText="Paste a public Google Drive, Dropbox, or Overleaf link"
                    />
                    {formData.resumeUrl && formData.resumeUrl.startsWith('http') && (
                      <div className="flex justify-end">
                        <a
                          href={formData.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Test Open Link in New Tab
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Career Orientation & Action */}
          <div className="space-y-6">

            {/* Career & Aspirations Card */}
            <Card className="border-indigo-100 bg-linear-to-b from-indigo-50/30 to-white">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-600" /> Career Roadmap & Goals
                </CardTitle>
                <CardDescription>Target domain and industry placement preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Target Career Goal"
                  value={formData.careerGoalTitle}
                  onChange={(e) => handleInputChange('careerGoalTitle', e.target.value)}
                  placeholder="e.g. Cloud Solutions Architect"
                />

                <Input
                  label="Preferred Domain / Track"
                  value={formData.careerDomain}
                  onChange={(e) => handleInputChange('careerDomain', e.target.value)}
                  placeholder="e.g. Full-Stack / DevOps"
                />

                <Select
                  label="Internship Status"
                  value={formData.internshipStatus}
                  onChange={(e) => handleInputChange('internshipStatus', e.target.value)}
                >
                  <option value="Not Started">Not Started</option>
                  <option value="Searching">Searching</option>
                  <option value="Applied">Applied (In Interview)</option>
                  <option value="Secured">Secured Offer</option>
                  <option value="Completed">Completed</option>
                </Select>

                <Select
                  label="Placement Readiness"
                  value={formData.placementStatus}
                  onChange={(e) => handleInputChange('placementStatus', e.target.value)}
                >
                  <option value="Eligible">Eligible & Preparing</option>
                  <option value="Applied">Applied for Drives</option>
                  <option value="Offer Received">Offer Received</option>
                  <option value="Placed">Placed</option>
                  <option value="Higher Studies">Opting for Higher Studies</option>
                </Select>
              </CardContent>
            </Card>

            {/* Department Faculty Advisory Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-slate-900">
                  Department Information Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-600 space-y-2 leading-relaxed">
                <p>
                  🔒 <strong>Privacy Protected:</strong> Your academic record and private profile are visible only to you, assigned faculty mentors in the <strong>{user?.department || 'IT'}</strong> department, and the Head of Department.
                </p>
                <p>
                  Students from other departments cannot view your profile or academic progress.
                </p>
              </CardContent>
            </Card>

            {/* Sticky Save Action */}
            <div className="sticky bottom-6">
              <Card className="p-4 bg-white shadow-lg border-blue-200">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isSaving}
                  className="w-full shadow-md"
                >
                  <Save className="w-4 h-4 mr-2" /> Save Profile Changes
                </Button>
              </Card>
            </div>

          </div>
        </div>
      </form>
    </div>
  );
}
