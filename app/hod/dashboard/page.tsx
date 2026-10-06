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
      {/* Top Welcome & Department Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-linear-to-r from-slate-950 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs uppercase font-bold tracking-wider text-amber-400">
              Department Governance & Intelligence
            </span>
            <Badge variant="hod" size="sm">
              Head of Department
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {user?.department || 'IT'} Department Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Governing {studentCount} Enrolled Students • {facultyCount} Faculty Mentors • Continuous Accreditation Ready
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <Link href="/hod/reports">
            <Button variant="primary" size="md" className="shadow-md">
              <FileText className="w-4 h-4 mr-1.5" /> NAAC / NBA Audit
            </Button>
          </Link>
          <Link href="/hod/analytics">
            <Button variant="outline" size="md" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              <BarChart3 className="w-4 h-4 mr-1.5" /> Department Analytics
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          id="stat-students-dept"
          title="Enrolled Students"
          value={studentCount.toString()}
          subtext={`Total Active in ${user?.department || 'IT'}`}
          change={{ value: 'Full Roster', trend: 'neutral' }}
          icon="students"
          variant="indigo"
          href="/hod/students"
        />

        <StatCard
          id="stat-faculty-dept"
          title="Faculty Mentors"
          value={facultyCount.toString()}
          subtext="Department instructional staff"
          change={{ value: 'Active Roster', trend: 'neutral' }}
          icon="faculty"
          variant="blue"
          href="/hod/faculty"
        />

        <StatCard
          id="stat-credits-dept"
          title="Learning Credits"
          value={totalCreditsEarned.toString()}
          subtext="Total student coding achievements"
          change={{ value: 'Verified Ledger', trend: 'up' }}
          icon="projects"
          variant="emerald"
          href="/hod/analytics"
        />

        <StatCard
          id="stat-grievance-dept"
          title="Open Grievances"
          value={openGrievances.toString()}
          subtext="Requires HOD redressal"
          change={{ value: openGrievances > 0 ? 'Action Needed' : 'Zero Backlog', trend: openGrievances > 0 ? 'down' : 'up' }}
          icon="feedback"
          variant="rose"
          href="/hod/feedback"
        />
      </div>

      {/* Main Governance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 Columns: Department Health & Grievance Governance */}
        <div className="lg:col-span-2 space-y-6">

          {/* Department Quality Index */}
          <Card className="bg-white border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Department Quality & Maturity Index</CardTitle>
                <CardDescription>Continuous performance indicators for NBA / NAAC compliance</CardDescription>
              </div>
              <Badge variant="success" size="lg" dot>
                Tier-1 Compliant
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-xs text-slate-500 font-semibold uppercase">Average CGPA</div>
                  <div className="text-2xl font-black text-slate-900">8.42</div>
                  <div className="text-[11px] text-emerald-600 font-medium">Top quartile college-wide</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-xs text-slate-500 font-semibold uppercase">Placement Readiness</div>
                  <div className="text-2xl font-black text-blue-600">88%</div>
                  <div className="text-[11px] text-blue-600 font-medium">Eligible & preparing</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-xs text-slate-500 font-semibold uppercase">Mentorship Ratio</div>
                  <div className="text-2xl font-black text-purple-600">1:18</div>
                  <div className="text-[11px] text-purple-600 font-medium">Optimal faculty load</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Grievance & Escalation Audits */}
          <Card className="bg-white border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Department Grievances & Escalations</CardTitle>
                <CardDescription>Direct student feedback, confidential reports, and faculty escalations</CardDescription>
              </div>
              <Link
                href="/hod/feedback"
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                Review All ({openGrievances}) <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentGrievances.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No active student grievances reported in this department.
                </div>
              ) : (
                recentGrievances.map((g) => (
                  <div
                    key={g.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={g.is_private_to_hod ? 'purple' : 'default'} size="sm">
                          {g.is_private_to_hod ? 'HOD Confidential' : g.category}
                        </Badge>
                        <span className="font-bold text-sm text-slate-900">{g.title}</span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-1">{g.description}</p>
                    </div>

                    <Link href="/hod/feedback">
                      <Button variant="outline" size="sm">Review & Resolve</Button>
                    </Link>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

        </div>

        {/* Right Column: Governance Links & Accreditation Checklist */}
        <div className="space-y-6">

          {/* Accreditation Fast-Track */}
          <Card className="border-indigo-200 bg-linear-to-b from-indigo-50/40 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" /> Accreditation Compliance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600">
              <div className="flex justify-between items-center py-1 border-b border-indigo-100">
                <span className="font-semibold text-slate-700">NAAC SSR Data</span>
                <span className="text-emerald-700 font-bold text-[11px]">Ready for Export</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-indigo-100">
                <span className="font-semibold text-slate-700">NBA Outcome Assessment</span>
                <span className="text-emerald-700 font-bold text-[11px]">Computed</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="font-semibold text-slate-700">Department Audit</span>
                <span className="text-indigo-700 font-bold text-[11px]">AY 2025-2026</span>
              </div>

              <div className="pt-2">
                <Link href="/hod/reports" className="block">
                  <Button variant="primary" size="sm" className="w-full text-xs">
                    <FileText className="w-3.5 h-3.5 mr-1.5" /> Generate Accreditation Report
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Quick Command Navigation */}
          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Governance Portals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/hod/mentoring" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                  <GraduationCap className="w-4 h-4 mr-2 text-indigo-600" /> Assign Faculty Mentors
                </Button>
              </Link>
              <Link href="/hod/faculty" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                  <Users className="w-4 h-4 mr-2 text-blue-600" /> Department Faculty Directory
                </Button>
              </Link>
              <Link href="/hod/announcements" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                  <Sparkles className="w-4 h-4 mr-2 text-amber-600" /> Post Official Department Notice
                </Button>
              </Link>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
