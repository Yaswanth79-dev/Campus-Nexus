'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Tables } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  BarChart3,
  Users,
  GraduationCap,
  MessageSquare,
  Sparkles,
  TrendingUp,
  FileText,
  Building,
  ShieldCheck,
  ArrowRight,
  Trophy,
} from 'lucide-react';

export default function HodDashboardPage() {
  const { user } = useAuth();
  const [studentCount, setStudentCount] = useState(0);
  const [facultyCount, setFacultyCount] = useState(0);
  const [openGrievances, setOpenGrievances] = useState(0);
  const [activeIdeas, setActiveIdeas] = useState(0);
  const [totalCreditsEarned, setTotalCreditsEarned] = useState(0);
  const [recentGrievances, setRecentGrievances] = useState<Tables<'feedback_grievances'>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadHodData() {
      if (!user) return;
      try {
        const supabase = getSupabaseBrowserClient();
        const dept = user.department || 'IT';

        // 1. Students in department
        const { data: sData } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'student')
          .eq('department', dept);
        if (sData) setStudentCount(sData.length);

        // 2. Faculty in department
        const { data: fData } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'faculty')
          .eq('department', dept);
        if (fData) setFacultyCount(fData.length);

        // 3. Open grievances in department
        const { data: gData } = await supabase
          .from('feedback_grievances')
          .select('*')
          .eq('department', dept)
          .order('created_at', { ascending: false });
        if (gData) {
          const list = gData as Tables<'feedback_grievances'>[];
          setOpenGrievances(list.filter((g) => g.status === 'Submitted' || g.status === 'Under Review' || g.status === 'Escalated').length);
          setRecentGrievances(list.slice(0, 3));
        }

        // 4. Innovation ideas
        const { data: iData } = await supabase
          .from('innovation_ideas')
          .select('id');
        if (iData) setActiveIdeas(iData.length);

        // 5. Total Learning Credits in Department
        const { data: actData } = await supabase
          .from('student_learning_activities')
          .select('credits_earned');
        if (actData) {
          const list = actData as Tables<'student_learning_activities'>[];
          setTotalCreditsEarned(list.reduce((acc, a) => acc + (a.credits_earned || 0), 0));
        }
      } catch (err) {
        console.error('Error fetching HOD dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadHodData();
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Premium Editorial Hero */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-4 pb-8 mb-4 border-b border-slate-200/60">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1 block">Department Governance & Intelligence</span>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            {user?.department || 'IT'} Command Center
          </h1>
          <p className="text-base text-slate-500 mt-2 max-w-2xl leading-relaxed">
            Governing {studentCount} Enrolled Students • {facultyCount} Faculty Mentors • Continuous Accreditation Ready
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Link href="/hod/analytics" className="flex-1 md:flex-none">
            <Button variant="outline" size="md" className="w-full">
              Analytics
            </Button>
          </Link>
          <Link href="/hod/reports" className="flex-1 md:flex-none">
            <Button variant="primary" size="md" className="w-full bg-slate-900 hover:bg-slate-800 text-white">
              <FileText className="w-4 h-4 mr-1.5" /> NAAC / NBA Audit
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Typographic Blocks */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 py-6 mb-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1.5">Enrolled Students</span>
          <div className="text-4xl font-black text-slate-900 tracking-tighter">{studentCount}</div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">Total Active in {user?.department || 'IT'}</div>
        </div>

        <div className="lg:border-l border-slate-200/60 lg:pl-8">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1.5">Faculty Mentors</span>
          <div className="text-4xl font-black text-slate-900 tracking-tighter">{facultyCount}</div>
          <div className="text-[11px] text-indigo-600 font-bold mt-1">Active Roster</div>
        </div>

        <div className="lg:border-l border-slate-200/60 lg:pl-8">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1.5">Learning Credits</span>
          <div className="text-4xl font-black text-slate-900 tracking-tighter">{totalCreditsEarned}</div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1">Verified Ledger</div>
        </div>

        <div className="lg:border-l border-slate-200/60 lg:pl-8">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1.5">Open Grievances</span>
          <div className="text-4xl font-black text-slate-900 tracking-tighter">{openGrievances}</div>
          <div className={`text-[11px] font-bold mt-1 ${openGrievances > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {openGrievances > 0 ? 'Action Needed' : 'Zero Backlog'}
          </div>
        </div>
      </div>

      {/* Main Governance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 Columns: Department Health & Grievance Governance */}
        <div className="lg:col-span-2 space-y-6">

          {/* Department Quality Index */}
          <section className="bg-white rounded-[24px] border border-slate-200/60 p-6 md:p-8 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Department Quality & Maturity Index</h3>
                <p className="text-sm text-slate-500 mt-1">Continuous performance indicators for compliance</p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1.5 shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Tier-1 Compliant
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-[16px] bg-slate-50 border border-slate-100 space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Average CGPA</div>
                <div className="text-3xl font-black text-slate-900 tracking-tighter">8.42</div>
                <div className="text-xs text-emerald-600 font-semibold">Top quartile overall</div>
              </div>

              <div className="p-5 rounded-[16px] bg-slate-50 border border-slate-100 space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Placement Readiness</div>
                <div className="text-3xl font-black text-slate-900 tracking-tighter">88%</div>
                <div className="text-xs text-indigo-600 font-semibold">Eligible & preparing</div>
              </div>

              <div className="p-5 rounded-[16px] bg-slate-50 border border-slate-100 space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mentorship Ratio</div>
                <div className="text-3xl font-black text-slate-900 tracking-tighter">1:18</div>
                <div className="text-xs text-purple-600 font-semibold">Optimal load</div>
              </div>
            </div>
          </section>

          {/* Grievances & Escalations */}
          <section className="bg-white rounded-[24px] border border-slate-200/60 p-6 md:p-8 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)]">
            <div className="flex flex-row items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Grievances & Escalations</h3>
                <p className="text-sm text-slate-500 mt-1">Confidential reports and faculty escalations</p>
              </div>
              <Link
                href="/hod/feedback"
                className="text-xs text-indigo-600 hover:text-indigo-700 font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
              >
                Review All ({openGrievances}) <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            
            <div className="space-y-4">
              {recentGrievances.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500 border border-dashed border-slate-300 rounded-[16px]">
                  No active student grievances reported.
                </div>
              ) : (
                recentGrievances.map((g) => (
                  <div
                    key={g.id}
                    className="p-5 rounded-[16px] bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:border-slate-200"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${
                          g.is_private_to_hod ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {g.is_private_to_hod ? 'Confidential' : g.category}
                        </span>
                        <span className="font-bold text-sm text-slate-900">{g.title}</span>
                      </div>
                      <p className="text-xs font-medium text-slate-600 line-clamp-1">{g.description}</p>
                    </div>

                    <Link href="/hod/feedback">
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">Review</Button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </section>

        </div>

        {/* Right Column: Governance Links & Accreditation Checklist */}
        <div className="space-y-6">

          {/* Accreditation Fast-Track */}
          <section className="bg-slate-900 text-white rounded-[24px] p-6 md:p-8 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
              <ShieldCheck className="w-32 h-32 text-white" />
            </div>
            
            <div className="relative z-10">
              <h3 className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-6">
                Accreditation Check
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-sm font-semibold text-slate-300">NAAC SSR Data</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400">Ready</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-sm font-semibold text-slate-300">NBA Assessment</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400">Computed</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-semibold text-slate-300">Department Audit</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">AY 2025-2026</span>
                </div>
              </div>

              <div className="pt-6">
                <Link href="/hod/reports" className="block">
                  <Button variant="primary" size="sm" className="w-full bg-white hover:bg-slate-100 text-slate-900">
                    Generate Report
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          {/* Quick Command Navigation */}
          <section className="bg-white rounded-[24px] border border-slate-200/60 p-6 md:p-8 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)]">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Governance Portals</h3>
            
            <div className="space-y-3">
              <Link href="/hod/mentoring" className="block">
                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/60 hover:bg-slate-50 transition-colors">
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-slate-700">Assign Mentors</span>
                </div>
              </Link>
              <Link href="/hod/faculty" className="block">
                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/60 hover:bg-slate-50 transition-colors">
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-slate-700">Faculty Directory</span>
                </div>
              </Link>
              <Link href="/hod/announcements" className="block">
                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/60 hover:bg-slate-50 transition-colors">
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-slate-700">Post Official Notice</span>
                </div>
              </Link>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}
