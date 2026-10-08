'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
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
      {/* Editorial Header */}
      <div className="pt-4 pb-8 mb-4 border-b border-slate-200/60">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
          Career Journey
        </h1>
        <p className="text-base text-slate-500 mt-2 max-w-2xl leading-relaxed">
          Build your path toward your target role. Track your milestones and readiness.
        </p>
      </div>

      {/* Premium Target Banner (Flat) */}
      <div className="flex flex-col md:flex-row justify-between gap-8 py-6 mb-8">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1 block">Active Career Target</span>
          <h2 className="text-3xl font-extrabold text-slate-900">{careerGoalTitle || 'Full-Stack Engineer'}</h2>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-sm font-medium text-slate-600 border-r border-slate-200 pr-3">{careerDomain || 'Cloud & Web Architecture'}</span>
            <span className="text-sm font-medium text-slate-600">{preferredRole || 'SDE-1'}</span>
          </div>
        </div>

        <div className="md:min-w-[280px]">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Industry Readiness</span>
            <span className="text-2xl font-black text-slate-900">{readinessPct}%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${readinessPct}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            {completedCount} of {milestones.length} milestones achieved
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 Columns: Milestone Roadmap Checklist */}
        <div className="lg:col-span-2 space-y-6">

          {/* Timeline Milestone Layout */}
          <section className="bg-white rounded-[24px] border border-slate-200/60 p-8 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)]">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Preparation Timeline</h3>
            <div className="relative border-l-2 border-slate-100 ml-3 space-y-6">
              {milestones.map((m) => (
                <div key={m.id} className="relative pl-6">
                  {/* Timeline Node */}
                  <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 bg-white transition-colors cursor-pointer ${
                    m.completed ? 'border-emerald-500' : 'border-slate-300'
                  }`} onClick={() => toggleMilestone(m.id)}>
                    {m.completed && <div className="absolute inset-0.5 rounded-full bg-emerald-500" />}
                  </div>
                  
                  <div 
                    onClick={() => toggleMilestone(m.id)}
                    className="group cursor-pointer"
                  >
                    <h4 className={`text-sm font-semibold transition-colors ${
                      m.completed ? 'text-slate-400 line-through' : 'text-slate-900 group-hover:text-indigo-600'
                    }`}>
                      {m.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {m.completed ? 'Milestone achieved' : 'Click to mark as complete'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

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

          <section className="bg-white rounded-[24px] border border-slate-200/60 p-6 md:p-8 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)]">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Target Profile</h3>
            <div className="space-y-5">
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
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">Internship Status</label>
                <select
                  className="block w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 appearance-none transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent border-slate-300 hover:border-slate-400 cursor-pointer"
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
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">Placement Readiness</label>
                <select
                  className="block w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 appearance-none transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent border-slate-300 hover:border-slate-400 cursor-pointer"
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

              <div className="pt-4 border-t border-slate-100">
                <Button
                  variant="primary"
                  className="w-full"
                  isLoading={isSaving}
                  onClick={handleSave}
                >
                  Save Targets
                </Button>
              </div>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}
