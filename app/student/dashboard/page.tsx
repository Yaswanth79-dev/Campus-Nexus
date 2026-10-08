'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Tables } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  Compass,
  Code,
  Layers,
  GraduationCap,
  Trophy,
  Building,
  User,
} from 'lucide-react';

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [skillsCount, setSkillsCount] = useState(0);
  const [topSkills, setTopSkills] = useState<Tables<'student_skills'>[]>([]);
  const [projects, setProjects] = useState<Tables<'student_projects'>[]>([]);
  const [certs, setCerts] = useState<Tables<'student_certifications'>[]>([]);
  const [learningCredits, setLearningCredits] = useState(0);
  const [activitiesCount, setActivitiesCount] = useState(0);
  const [opportunities, setOpportunities] = useState<Tables<'opportunities'>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic additions
  const [mentor, setMentor] = useState<{name: string, email: string, designation: string, department: string} | null>(null);
  const [nextSession, setNextSession] = useState<{date: string, topic: string} | null>(null);
  const [completedActivities, setCompletedActivities] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      if (!user) return;
      try {
        const supabase = getSupabaseBrowserClient();

        // 1. Fetch skills
        const { data: skillsData } = await supabase
          .from('student_skills')
          .select('*')
          .eq('student_id', user.id);
        if (skillsData) {
          setSkillsCount(skillsData.length);
          setTopSkills(skillsData.slice(0, 8));
        }

        // 2. Fetch projects
        const { data: projData } = await supabase
          .from('student_projects')
          .select('*')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false })
          .limit(2);
        if (projData) setProjects(projData);

        // 3. Fetch certs
        const { data: certData } = await supabase
          .from('student_certifications')
          .select('*')
          .eq('student_id', user.id)
          .limit(2);
        if (certData) setCerts(certData);

        // 4. Fetch learning credits
        const { data: actData } = await supabase
          .from('student_learning_activities')
          .select('*')
          .eq('student_id', user.id);
        if (actData) {
          const list = actData as Tables<'student_learning_activities'>[];
          setActivitiesCount(list.length);
          setLearningCredits(list.reduce((sum, a) => sum + (a.credits_earned || 0), 0));
        }

        // 5. Fetch opportunities
        const { data: opData } = await supabase
          .from('opportunities')
          .select('*')
          .eq('is_active', true)
          .limit(2);
        if (opData) setOpportunities(opData as Tables<'opportunities'>[]);

        // 6. Fetch Faculty Mentor
        const { data: mentorAssignment } = (await supabase
          .from('faculty_mentor_assignments')
          .select('faculty_id')
          .eq('student_id', user.id)
          .single()) as any;

        if (mentorAssignment?.faculty_id) {
          const { data: mentorProfile } = (await supabase
            .from('profiles')
            .select('full_name, email, department')
            .eq('id', mentorAssignment.faculty_id)
            .single()) as any;

          const { data: facultyData } = (await supabase
            .from('faculty')
            .select('designation')
            .eq('id', mentorAssignment.faculty_id)
            .single()) as any;
            
          if (mentorProfile) {
            setMentor({
              name: mentorProfile.full_name,
              email: mentorProfile.email,
              department: mentorProfile.department,
              designation: facultyData?.designation || 'Faculty',
            });
          }
        }

        // 7. Fetch Next Mentoring Session
        const { data: sessions } = (await supabase
          .from('mentoring_sessions')
          .select('session_date, topic')
          .eq('student_id', user.id)
          .eq('status', 'Scheduled')
          .order('session_date', { ascending: true })
          .limit(1)) as any;
          
        if (sessions && sessions.length > 0) {
          setNextSession({
            date: new Date(sessions[0].session_date).toLocaleString('en-US', { weekday: 'long', hour: 'numeric', minute: '2-digit', hour12: true }),
            topic: sessions[0].topic,
          });
        }

        // 8. Fetch completed career milestones
        const { data: milestoneLinks } = (await supabase
          .from('student_career_milestones')
          .select('milestone_id')
          .eq('student_id', user.id)
          .eq('is_completed', true)
          .limit(3)) as any;
          
        if (milestoneLinks && milestoneLinks.length > 0) {
          const milestoneIds = milestoneLinks.map((m: any) => m.milestone_id);
          const { data: fetchedMilestones } = (await supabase
            .from('career_milestones')
            .select('id, title')
            .in('id', milestoneIds)) as any;
            
          if (fetchedMilestones) setCompletedActivities(fetchedMilestones);
        }
      } catch (err) {
        console.error('Error fetching student dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, [user]);

  const completionPct = user?.profileCompletion ?? 0;

  return (
    <div className="space-y-6">
      {/* Editorial Hero */}
      <div className="pt-6 pb-12 border-b border-slate-200/60 mb-8">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          Good morning, {user?.fullName?.split(' ')[0] || 'Student'}.
        </h1>
        <p className="text-base text-slate-500 mt-3 max-w-2xl leading-relaxed">
          Here is your academic and professional development overview for {user?.semester ? `Semester ${user.semester}` : 'this term'}. 
          Your profile is currently {completionPct}% complete.
        </p>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">Current CGPA</span>
            <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter">
              {user?.cgpa != null ? Number(user.cgpa).toFixed(2) : 'N/A'}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">Industry Readiness</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter">{completionPct}</span>
              <span className="text-xl font-bold text-slate-400">%</span>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">Verified Skills</span>
            <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter">{skillsCount}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">Learning Credits</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter">{learningCredits}</span>
              <span className="text-sm font-semibold text-emerald-600">Pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Content - Asymmetric Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column (Wide) */}
        <div className="lg:col-span-8 space-y-12">

          {/* Development Section (Flat on Canvas) */}
          <section>
            <div className="flex items-end justify-between mb-6">
              <div>
                <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Target Role</h3>
                <h2 className="text-2xl font-extrabold text-slate-900 mt-1">{user?.careerGoalTitle || 'Set Your Career Goal'}</h2>
              </div>
              <Link href="/student/career" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors">
                View Journey <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-6 rounded-[24px] border border-slate-200/60 bg-white/60 backdrop-blur-sm space-y-4 hover:border-slate-300/80 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Career Milestones</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{completedActivities.length} achievements recorded</p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-[24px] border border-slate-200/60 bg-white/60 backdrop-blur-sm space-y-4 hover:border-slate-300/80 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                    <Code className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Technical Showcase</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{projects.length} active projects</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Skills Portfolio */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">Verified Proficiencies</h2>
              <Link href="/student/skills" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                Manage Portfolio
              </Link>
            </div>
            
            {topSkills.length === 0 ? (
              <div className="py-12 px-6 rounded-[24px] border border-dashed border-slate-300 text-center text-slate-500">
                No skills added yet. Build your technical portfolio.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {topSkills.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm hover:border-slate-300 hover:shadow-sm transition-all"
                  >
                    <span className="font-semibold text-slate-900">{s.skill_name}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md">{s.proficiency}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column (Narrow) */}
        <div className="lg:col-span-4 space-y-8">

          {/* Assigned Faculty Mentor */}
          <section className="bg-white rounded-[24px] border border-slate-200/60 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Faculty Mentorship</h3>
            </div>
            
            {mentor ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar name={mentor.name} role="faculty" size="lg" />
                  <div>
                    <h4 className="font-bold text-base text-slate-900">{mentor.name}</h4>
                    <p className="text-sm text-slate-500">{mentor.designation}</p>
                  </div>
                </div>

                {nextSession && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Next Review</span>
                    <div className="font-bold text-slate-900 text-sm">{nextSession.date}</div>
                    <div className="text-xs text-slate-500">{nextSession.topic}</div>
                  </div>
                )}
                
                <Link href="/student/feedback" className="block w-full">
                  <Button variant="secondary" className="w-full text-sm">
                    Schedule Session
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="py-6 text-center text-sm text-slate-500">
                No mentor assigned yet.
              </div>
            )}
          </section>

          {/* Opportunities */}
          <section className="bg-white rounded-[24px] border border-slate-200/60 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-slate-900">Opportunities</h3>
              <Link href="/student/opportunities" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                All
              </Link>
            </div>
            <div className="space-y-4">
              {opportunities.length === 0 ? (
                <div className="text-sm text-slate-500">No active drives posted.</div>
              ) : (
                opportunities.map((op) => (
                  <div key={op.id} className="pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">{op.type}</span>
                    <h4 className="font-bold text-slate-900 text-sm mt-1">{op.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{op.company_or_org}</p>
                  </div>
                ))
              )}
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}
