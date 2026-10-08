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
  Users,
  GraduationCap,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  Clock,
  MessageSquare,
  Trophy,
  Megaphone,
  Sparkles,
  Calendar,
} from 'lucide-react';

export default function FacultyDashboardPage() {
  const { user } = useAuth();
  const [studentsCount, setStudentsCount] = useState(0);
  const [menteesCount, setMenteesCount] = useState(0);
  const [pendingConcerns, setPendingConcerns] = useState(0);
  const [pendingIdeas, setPendingIdeas] = useState(0);
  const [recentSessions, setRecentSessions] = useState<Tables<'mentoring_sessions'>[]>([]);
  const [recentConcerns, setRecentConcerns] = useState<Tables<'feedback_grievances'>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadFacultyData() {
      if (!user) return;
      try {
        const supabase = getSupabaseBrowserClient();
        const dept = user.department || 'IT';

        // 1. Fetch department students count
        const { data: studentsData } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'student')
          .eq('department', dept);
        if (studentsData) setStudentsCount(studentsData.length);

        // 2. Fetch assigned mentees
        const { data: menteesData } = await supabase
          .from('faculty_mentor_assignments')
          .select('id')
          .eq('faculty_id', user.id);
        if (menteesData) setMenteesCount(menteesData.length);

        // 3. Fetch pending concerns for department
        const { data: concernsData } = await supabase
          .from('feedback_grievances')
          .select('*')
          .eq('department', dept)
          .eq('is_private_to_hod', false)
          .order('created_at', { ascending: false });
        if (concernsData) {
          const list = concernsData as Tables<'feedback_grievances'>[];
          setPendingConcerns(list.filter((c) => c.status === 'Submitted' || c.status === 'Under Review').length);
          setRecentConcerns(list.slice(0, 3));
        }

        // 4. Fetch pending innovation proposals
        const { data: ideasData } = await supabase
          .from('innovation_ideas')
          .select('id')
          .eq('status', 'Under Review');
        if (ideasData) setPendingIdeas(ideasData.length);

        // 5. Fetch mentoring sessions
        const { data: sessionsData } = await supabase
          .from('mentoring_sessions')
          .select('*')
          .eq('faculty_id', user.id)
          .order('session_date', { ascending: false })
          .limit(3);
        if (sessionsData) setRecentSessions(sessionsData as Tables<'mentoring_sessions'>[]);
      } catch (err) {
        console.error('Error fetching faculty dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadFacultyData();
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Premium Editorial Hero */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-4 pb-8 mb-4 border-b border-slate-200/60">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1 block">Campus Nexus • {user?.department || 'IT'} Department</span>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Welcome, Professor {user?.fullName || 'Faculty'}
          </h1>
          <p className="text-base text-slate-500 mt-2 max-w-2xl leading-relaxed">
            {user?.designation || 'Assistant Professor'} • {user?.specialization || 'Distributed Systems & Cloud'}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Link href="/faculty/announcements" className="flex-1 md:flex-none">
            <Button variant="outline" size="md" className="w-full">
              Announcements
            </Button>
          </Link>
          <Link href="/faculty/mentoring" className="flex-1 md:flex-none">
            <Button variant="primary" size="md" className="w-full">
              <Calendar className="w-4 h-4 mr-1.5" /> Schedule Session
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Typographic Blocks */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 py-6 mb-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1.5">Department Students</span>
          <div className="text-4xl font-black text-slate-900 tracking-tighter">{studentsCount}</div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">Enrolled in {user?.department || 'IT'}</div>
        </div>

        <div className="lg:border-l border-slate-200/60 lg:pl-8">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1.5">Assigned Mentees</span>
          <div className="text-4xl font-black text-slate-900 tracking-tighter">{menteesCount}</div>
          <div className="text-[11px] text-indigo-600 font-bold mt-1">Mentorship Group</div>
        </div>

        <div className="lg:border-l border-slate-200/60 lg:pl-8">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1.5">Student Concerns</span>
          <div className="text-4xl font-black text-slate-900 tracking-tighter">{pendingConcerns}</div>
          <div className={`text-[11px] font-bold mt-1 ${pendingConcerns > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {pendingConcerns > 0 ? 'Requires Action' : 'All Clear'}
          </div>
        </div>

        <div className="lg:border-l border-slate-200/60 lg:pl-8">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1.5">Innovation Pitches</span>
          <div className="text-4xl font-black text-slate-900 tracking-tighter">{pendingIdeas}</div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">Review Queue</div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 Columns: Mentoring Sessions & Student Concerns */}
        <div className="lg:col-span-2 space-y-6">

          {/* Mentoring Sessions */}
          <section className="bg-white rounded-[24px] border border-slate-200/60 p-6 md:p-8 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)]">
            <div className="flex flex-row items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Upcoming Mentoring Sessions</h3>
                <p className="text-sm text-slate-500 mt-1">One-on-one academic and technical milestone reviews</p>
              </div>
              <Link
                href="/faculty/mentoring"
                className="text-xs text-indigo-600 hover:text-indigo-700 font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            
            <div className="space-y-4">
              {recentSessions.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500 border border-dashed border-slate-300 rounded-[16px]">
                  No upcoming mentoring sessions scheduled.
                </div>
              ) : (
                recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-5 rounded-[16px] bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:border-slate-200"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{session.topic}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${
                          session.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {session.status}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-500 flex items-center gap-2">
                        <span>Mode: <strong className="text-slate-700">{session.meeting_mode}</strong></span>
                        <span className="text-slate-300">•</span>
                        <span>{new Date(session.session_date).toLocaleString()}</span>
                      </p>
                    </div>

                    <Link href="/faculty/mentoring">
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">Review Notes</Button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Student Concerns & Grievances */}
          <section className="bg-white rounded-[24px] border border-slate-200/60 p-6 md:p-8 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)]">
            <div className="flex flex-row items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Recent Student Concerns</h3>
                <p className="text-sm text-slate-500 mt-1">Academic and mentoring queries needing faculty resolution</p>
              </div>
              <Link
                href="/faculty/concerns"
                className="text-xs text-indigo-600 hover:text-indigo-700 font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
              >
                View All ({pendingConcerns}) <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            
            <div className="space-y-4">
              {recentConcerns.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500 border border-dashed border-slate-300 rounded-[16px]">
                  No pending student grievances.
                </div>
              ) : (
                recentConcerns.map((concern) => (
                  <div
                    key={concern.id}
                    className="p-5 rounded-[16px] bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:border-slate-200"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">{concern.category}</span>
                        <span className="font-bold text-sm text-slate-900">{concern.title}</span>
                      </div>
                      <p className="text-xs font-medium text-slate-600 line-clamp-1">{concern.description}</p>
                    </div>

                    <Link href="/faculty/concerns">
                      <Button variant="primary" size="sm" className="w-full sm:w-auto">Respond</Button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </section>

        </div>

        {/* Right Column: Quick Links & Department Information */}
        <div className="space-y-6">

          {/* Department Intelligence Snapshot */}
          <section className="bg-slate-900 text-white rounded-[24px] p-6 md:p-8 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
              <Users className="w-32 h-32 text-white" />
            </div>
            
            <div className="relative z-10">
              <h3 className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-6">
                Department Governance
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-sm font-semibold text-slate-300">Department Scope</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-white/10 text-white">{user?.department || 'IT'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-sm font-semibold text-slate-300">Head of Department</span>
                  <span className="font-bold text-white text-sm">Dr. A. Sharma</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-semibold text-slate-300">Role Authority</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400">Verified Mentor</span>
                </div>
              </div>
            </div>
          </section>

          {/* Faculty Quick Actions */}
          <section className="bg-white rounded-[24px] border border-slate-200/60 p-6 md:p-8 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)]">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Quick Actions</h3>
            
            <div className="space-y-3">
              <Link href="/faculty/students" className="block">
                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/60 hover:bg-slate-50 transition-colors">
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-slate-700">Browse Students</span>
                </div>
              </Link>
              <Link href="/faculty/resources" className="block">
                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/60 hover:bg-slate-50 transition-colors">
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-slate-700">Upload Course Notes</span>
                </div>
              </Link>
              <Link href="/faculty/opportunities" className="block">
                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/60 hover:bg-slate-50 transition-colors">
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-slate-700">Post Research Drive</span>
                </div>
              </Link>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}
