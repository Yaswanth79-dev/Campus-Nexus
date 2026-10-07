'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Compass,
  CheckCircle2,
  Clock,
  ArrowRight,
  Target,
  Sparkles,
  BookOpen,
  Briefcase,
  Layers,
  GraduationCap,
  Save,
} from 'lucide-react';

export default function StudentCareerPage() {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [careerGoalTitle, setCareerGoalTitle] = useState('');
  const [careerDomain, setCareerDomain] = useState('');
  const [preferredRole, setPreferredRole] = useState('');
  const [internshipStatus, setInternshipStatus] = useState('Applied');
  const [placementStatus, setPlacementStatus] = useState('Eligible');
  const [higherStudies, setHigherStudies] = useState(false);

  // Database-backed milestones state
  const [milestones, setMilestones] = useState<{ id: string, title: string, completed: boolean }[]>([]);

  useEffect(() => {
    if (user) {
      setCareerGoalTitle(user.careerGoalTitle || 'Full-Stack Developer');
      setCareerDomain(user.careerDomain || 'Software Engineering');
      setPreferredRole(user.preferredRole || 'Software Engineer');
      setInternshipStatus(user.internshipStatus || 'Not Started');
      setPlacementStatus(user.placementStatus || 'Not Eligible');
      setHigherStudies(user.higherStudies || false);
      
      // Load milestones from database
      const loadMilestones = async () => {
        try {
          const supabase = getSupabaseBrowserClient();
          
          // Fetch global milestones
          const { data: globalMilestones, error: globalErr } = (await supabase
            .from('career_milestones')
            .select('id, title, display_order')
            .order('display_order', { ascending: true })) as any;
            
          if (globalErr) throw globalErr;
          
          // Fetch student milestones
          const { data: studentMilestones, error: studentErr } = (await supabase
            .from('student_career_milestones')
            .select('milestone_id, is_completed')
            .eq('student_id', user.id)) as any;
            
          if (studentErr) throw studentErr;
          
          // Merge
          if (globalMilestones) {
            const merged = globalMilestones.map((gm: any) => {
              const sm = studentMilestones?.find((s: any) => s.milestone_id === gm.id);
              return {
                id: gm.id,
                title: gm.title,
                completed: sm ? sm.is_completed : false,
              };
            });
            setMilestones(merged);
          }
        } catch (err) {
          console.error('Error loading milestones:', err);
        }
      };
      loadMilestones();
    }
  }, [user]);

  const toggleMilestone = async (id: string) => {
    if (!user) return;
    
    // Find current state
    const currentMilestone = milestones.find((m) => m.id === id);
    if (!currentMilestone) return;
    
    const newCompletedState = !currentMilestone.completed;
    
    // Optimistic UI update
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, completed: newCompletedState } : m))
    );
    
    // Persist to DB
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await (supabase.from('student_career_milestones') as any)
        .upsert({
          student_id: user.id,
          milestone_id: id,
          is_completed: newCompletedState,
          completed_at: newCompletedState ? new Date().toISOString() : null,
        }, {
          onConflict: 'student_id, milestone_id'
        });
        
      if (error) throw error;
    } catch (err: any) {
      console.error('Error updating milestone:', err);
      // Revert optimistic update
      setMilestones((prev) =>
        prev.map((m) => (m.id === id ? { ...m, completed: !newCompletedState } : m))
      );
      toast({
        type: 'error',
        title: 'Update Failed',
        message: 'Unable to save milestone. Please try again.',
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await (supabase.from('students') as any).upsert({
        id: user.id,
        career_goal_title: careerGoalTitle.trim() || null,
        career_domain: careerDomain.trim() || null,
        preferred_role: preferredRole.trim() || null,
        internship_status: internshipStatus as any,
        placement_status: placementStatus as any,
        higher_studies: higherStudies,
      });

      if (error) throw error;
      await refreshProfile();
      toast({
        type: 'success',
        title: 'Career Plan Updated',
        message: 'Your career targets and readiness milestones have been synchronized with your profile.',
      });
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Save Failed',
        message: err.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const completedCount = milestones.filter((m) => m.completed).length;
  const readinessPct = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Career Roadmaps & Placement Readiness"
        description="Define your professional aspirations, align skills with target job roles, and track milestone completion."
        breadcrumbs={[
          { label: 'Student Portal', href: '/student/dashboard' },
          { label: 'Career' },
        ]}
        actions={
          <Link href="/student/skill-gap">
            <Button variant="outline">
              <Target className="w-4 h-4 mr-1.5" /> Open Skill Gap Analyzer
            </Button>
          </Link>
        }
      />

      {/* Target Goal Banner */}
      <div className="rounded-2xl bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Compass className="w-5 h-5 text-blue-400" />
              <span className="text-xs uppercase font-bold tracking-wider text-blue-300">
                Active Career Target
              </span>
              <Badge variant="student" size="sm">Target: Batch {user?.batch || '2023-2027'}</Badge>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">{careerGoalTitle || 'Full-Stack Engineer'}</h2>
            <p className="text-sm text-blue-200 mt-1">
              Domain: <strong className="text-white">{careerDomain || 'Cloud & Web Architecture'}</strong> • Target Role: <strong className="text-white">{preferredRole || 'SDE-1'}</strong>
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 min-w-[220px]">
            <div className="flex justify-between items-center text-xs font-bold mb-1.5 text-blue-200">
              <span>Industry Readiness</span>
              <span className="text-emerald-400 font-extrabold">{readinessPct}%</span>
            </div>
            <div className="w-full bg-black/30 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-linear-to-r from-blue-400 to-emerald-400 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${readinessPct}%` }}
              />
            </div>
            <p className="text-[11px] text-blue-200/80 mt-1.5 font-medium">
              {completedCount} of {milestones.length} benchmarks achieved
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 Columns: Milestone Roadmap Checklist */}
        <div className="lg:col-span-2 space-y-6">

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600" /> Career Preparation Milestones
              </CardTitle>
              <CardDescription>
                Check off benchmarks as you complete coursework, projects, certifications, and interviews
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {milestones.map((m) => (
                <div
                  key={m.id}
                  onClick={() => toggleMilestone(m.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    m.completed
                      ? 'bg-emerald-50/40 border-emerald-200 text-slate-900'
                      : 'bg-white border-slate-200 hover:border-blue-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center border shrink-0 transition-colors ${
                        m.completed
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {m.completed && <CheckCircle2 className="w-4 h-4" />}
                    </div>
                    <span className={`text-sm font-semibold ${m.completed ? 'line-through text-slate-500' : ''}`}>
                      {m.title}
                    </span>
                  </div>

                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                    m.completed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {m.completed ? 'Achieved' : 'In Progress'}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recommended Learning Path for Target Role */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-600" /> Recommended Action Track
              </CardTitle>
              <CardDescription>Targeted learning modules tailored for {careerGoalTitle || 'Full-Stack'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-900">Advanced Trees & Dynamic Programming Test</div>
                  <p className="text-[11px] text-slate-500">Core interview assessment • Earn +30 Credits</p>
                </div>
                <Link href="/student/learning">
                  <Button variant="outline" size="sm">Start Activity</Button>
                </Link>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-900">Cloud Foundations with AWS Architecture</div>
                  <p className="text-[11px] text-slate-500">Industry credential course • Earn +50 Credits</p>
                </div>
                <Link href="/student/learning">
                  <Button variant="outline" size="sm">Start Activity</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right Column: Career Target Editor */}
        <div className="space-y-6">

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-600" /> Edit Career Aspirations
              </CardTitle>
              <CardDescription>Update your target role and recruitment preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Target Job Title"
                value={careerGoalTitle}
                onChange={(e) => setCareerGoalTitle(e.target.value)}
                placeholder="e.g. Cloud Solutions Architect"
              />

              <Input
                label="Interested Domain"
                value={careerDomain}
                onChange={(e) => setCareerDomain(e.target.value)}
                placeholder="e.g. Distributed Systems & AI"
              />

              <Input
                label="Preferred Role Category"
                value={preferredRole}
                onChange={(e) => setPreferredRole(e.target.value)}
                placeholder="e.g. Backend SDE / DevOps Engineer"
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Internship Status</label>
                <select
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={internshipStatus}
                  onChange={(e) => setInternshipStatus(e.target.value)}
                >
                  <option value="Not Started">Not Started</option>
                  <option value="Searching">Searching</option>
                  <option value="Applied">Applied</option>
                  <option value="Secured">Secured Offer</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Placement Drive Readiness</label>
                <select
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={placementStatus}
                  onChange={(e) => setPlacementStatus(e.target.value)}
                >
                  <option value="Eligible">Eligible & Preparing</option>
                  <option value="Applied">Applied to Drives</option>
                  <option value="Offer Received">Offer Received</option>
                  <option value="Placed">Placed</option>
                  <option value="Higher Studies">Opting for Higher Studies</option>
                </select>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  className="w-full"
                  isLoading={isSaving}
                  onClick={handleSave}
                >
                  <Save className="w-4 h-4 mr-1.5" /> Save Career Targets
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
