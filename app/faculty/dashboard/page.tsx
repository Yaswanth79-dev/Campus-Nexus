'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Tables } from '@/types/database';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
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
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-linear-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs uppercase font-bold tracking-wider text-indigo-300">
              Campus Nexus • Faculty Mentoring Portal
            </span>
            <Badge variant="faculty" size="sm">
              {user?.department || 'IT'} Department
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Welcome, Professor {user?.fullName || 'Faculty'}
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200 mt-1">
            {user?.designation || 'Assistant Professor'} • {user?.specialization || 'Distributed Systems & Cloud'}
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <Link href="/faculty/mentoring">
            <Button variant="primary" size="md" className="shadow-md">
              <Calendar className="w-4 h-4 mr-1.5" /> Schedule Mentoring
            </Button>
          </Link>
          <Link href="/faculty/announcements">
            <Button variant="outline" size="md" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              <Megaphone className="w-4 h-4 mr-1.5" /> Announcement
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          id="stat-students"
          title="Department Students"
          value={studentsCount.toString()}
          subtext={`${user?.department || 'IT'} Enrolled Students`}
          change={{ value: 'Dept Scope', trend: 'neutral' }}
          icon="students"
          variant="indigo"
          href="/faculty/students"
        />

        <StatCard
          id="stat-mentees"
          title="Assigned Mentees"
          value={menteesCount.toString()}
          subtext="Under active faculty guidance"
          change={{ value: 'Mentorship Group', trend: 'up' }}
          icon="mentoring"
          variant="blue"
          href="/faculty/mentoring"
        />

        <StatCard
          id="stat-concerns"
          title="Student Concerns"
          value={pendingConcerns.toString()}
          subtext="Pending redressal reviews"
          change={{ value: pendingConcerns > 0 ? 'Requires Action' : 'All Clear', trend: pendingConcerns > 0 ? 'down' : 'up' }}
          icon="feedback"
          variant="rose"
          href="/faculty/concerns"
        />

        <StatCard
          id="stat-ideas"
          title="Innovation Pitches"
          value={pendingIdeas.toString()}
          subtext="Student capstone ideas"
          change={{ value: 'Review Queue', trend: 'neutral' }}
          icon="innovation"
          variant="amber"
          href="/faculty/innovation"
        />
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 Columns: Mentoring Sessions & Student Concerns */}
        <div className="lg:col-span-2 space-y-6">

          {/* Mentoring Sessions Card */}
          <Card className="bg-white border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Upcoming Mentoring Sessions</CardTitle>
                <CardDescription>One-on-one academic and technical milestone reviews</CardDescription>
              </div>
              <Link
                href="/faculty/mentoring"
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentSessions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No upcoming mentoring sessions scheduled.
                </div>
              ) : (
                recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{session.topic}</span>
                        <Badge variant={session.status === 'Completed' ? 'success' : 'blue'} size="sm">
                          {session.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-2">
                        <span>Mode: <strong>{session.meeting_mode}</strong></span>
                        <span>•</span>
                        <span>{new Date(session.session_date).toLocaleString()}</span>
                      </p>
                    </div>

                    <Link href="/faculty/mentoring">
                      <Button variant="outline" size="sm">Review Notes</Button>
                    </Link>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Student Concerns & Grievances */}
          <Card className="bg-white border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Recent Student Concerns</CardTitle>
                <CardDescription>Academic and mentoring queries needing faculty resolution</CardDescription>
              </div>
              <Link
                href="/faculty/concerns"
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                View All ({pendingConcerns}) <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentConcerns.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No pending student grievances.
                </div>
              ) : (
                recentConcerns.map((concern) => (
                  <div
                    key={concern.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" size="sm">{concern.category}</Badge>
                        <span className="font-bold text-sm text-slate-900">{concern.title}</span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-1">{concern.description}</p>
                    </div>

                    <Link href="/faculty/concerns">
                      <Button variant="primary" size="sm">Respond</Button>
                    </Link>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

        </div>

        {/* Right Column: Quick Links & Department Information */}
        <div className="space-y-6">

          {/* Department Intelligence Snapshot */}
          <Card className="border-indigo-200 bg-linear-to-b from-indigo-50/40 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-indigo-950 uppercase tracking-wider">
                Department Governance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600">
              <div className="flex justify-between items-center py-1 border-b border-indigo-100">
                <span className="font-semibold text-slate-700">Department Scope</span>
                <Badge variant="student" size="sm">{user?.department || 'IT'}</Badge>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-indigo-100">
                <span className="font-semibold text-slate-700">Head of Department (HOD)</span>
                <span className="font-bold text-slate-900">Dr. A. Sharma</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="font-semibold text-slate-700">Role Authority</span>
                <span className="font-bold text-emerald-600">Verified Faculty Mentor</span>
              </div>
            </CardContent>
          </Card>

          {/* Faculty Quick Actions */}
          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/faculty/students" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                  <Users className="w-4 h-4 mr-2 text-indigo-600" /> Browse Department Students
                </Button>
              </Link>
              <Link href="/faculty/resources" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                  <GraduationCap className="w-4 h-4 mr-2 text-blue-600" /> Upload Course Notes / Syllabus
                </Button>
              </Link>
              <Link href="/faculty/opportunities" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                  <Sparkles className="w-4 h-4 mr-2 text-amber-600" /> Post Research / Internship Drive
                </Button>
              </Link>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
