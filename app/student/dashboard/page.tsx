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
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs uppercase font-bold tracking-wider text-blue-300">
              Campus Nexus • Student Portal
            </span>
            <Badge variant="student" size="sm">
              {user?.department || 'IT'} Department
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Welcome back, {user?.fullName || 'Student'}!
          </h1>
          <p className="text-xs sm:text-sm text-blue-200 mt-1 flex items-center gap-2 flex-wrap">
            <span>Roll No: <strong className="text-white">{user?.studentId || 'Not Set'}</strong></span>
            <span>•</span>
            <span>Sem {user?.semester ?? 1} (Section {user?.section || 'A'})</span>
            <span>•</span>
            <span>CGPA: <strong className="text-emerald-400">{user?.cgpa != null ? Number(user.cgpa).toFixed(2) : 'N/A'}</strong></span>
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <Link href="/student/learning">
            <Button variant="primary" size="md" className="shadow-md">
              <Trophy className="w-4 h-4 mr-1.5 text-amber-300" /> Earn Credits
            </Button>
          </Link>
          <Link href="/student/profile">
            <Button variant="outline" size="md" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              <User className="w-4 h-4 mr-1.5" /> Edit Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          id="stat-profile"
          title="Profile Completion"
          value={`${completionPct}%`}
          subtext="Industry Readiness Score"
          change={{ value: 'Profile Active', trend: 'up' }}
          icon="academic"
          variant="blue"
          href="/student/profile"
        />

        <StatCard
          id="stat-skills"
          title="Verified Skills"
          value={skillsCount.toString()}
          subtext="Technical proficiencies"
          change={{ value: '+2 this month', trend: 'up' }}
          icon="skills"
          variant="indigo"
          href="/student/skills"
        />

        <StatCard
          id="stat-credits"
          title="Learning Credits"
          value={learningCredits.toString()}
          subtext={`${activitiesCount} activities completed`}
          change={{ value: 'Credits Ledger', trend: 'up' }}
          icon="projects"
          variant="emerald"
          href="/student/learning"
        />

        <StatCard
          id="stat-internships"
          title="Internship Status"
          value={user?.internshipStatus || 'Not Started'}
          subtext="Active pipeline tracking"
          change={{ value: user?.placementStatus || 'Not Eligible', trend: 'neutral' }}
          icon="internships"
          variant="amber"
          href="/student/internships"
        />
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 Columns: Portfolio & Learning */}
        <div className="lg:col-span-2 space-y-6">

          {/* Development Progress & Benchmarks */}
          <Card className="bg-white border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Development Progress & Readiness</CardTitle>
                <CardDescription>Academic & technical profile maturity score</CardDescription>
              </div>
              <Badge variant="success" size="lg" dot>
                {completionPct}% Industry Ready
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                  <span>Semester {user?.semester ?? 1} Benchmark Completion</span>
                  <span>{completionPct}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-linear-to-r from-blue-600 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-xs text-slate-500 font-medium">Core IT Skills</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">{skillsCount} Verified</div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Above benchmark</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-xs text-slate-500 font-medium">Project Portfolio</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">{projects.length} Showcased</div>
                  <div className="text-[11px] text-blue-600 font-medium mt-0.5">Active repository</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-xs text-slate-500 font-medium">Learning Credits</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">{learningCredits} Pts</div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Verified on ledger</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Skills Showcase */}
          <Card className="bg-white border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Technical Skills & Proficiencies</CardTitle>
                <CardDescription>Verified domain proficiencies</CardDescription>
              </div>
              <Link
                href="/student/skills"
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                View All ({skillsCount}) <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              {topSkills.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400">
                  No skills added yet. <Link href="/student/skills" className="text-blue-600 font-semibold hover:underline">Add your skills</Link>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {topSkills.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs shadow-2xs"
                    >
                      <span className="font-bold text-slate-800">{s.skill_name}</span>
                      <span className="text-[10px] text-slate-500">({s.proficiency})</span>
                      {s.is_endorsed && <span className="text-purple-600 text-xs">★</span>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Featured Projects & Certifications Dual Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            {/* Projects Shell */}
            <Card className="bg-white border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Recent Projects</CardTitle>
                <Link href="/student/projects" className="text-xs text-blue-600 font-semibold">
                  View All
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {projects.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400">
                    No projects showcased yet.
                  </div>
                ) : (
                  projects.map((p) => (
                    <div key={p.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{p.title}</span>
                        <Badge variant="blue" size="sm">{p.status}</Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{p.description}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Certifications Shell */}
            <Card className="bg-white border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Certifications</CardTitle>
                <Link href="/student/certifications" className="text-xs text-blue-600 font-semibold">
                  View All
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {certs.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400">
                    No certifications added yet.
                  </div>
                ) : (
                  certs.map((c) => (
                    <div key={c.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{c.name}</span>
                        <FileCheck className="w-4 h-4 text-emerald-600" />
                      </div>
                      <p className="text-[11px] text-slate-500">{c.issuing_organization}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Right Column: Faculty Mentor, Career Goals & Opportunities */}
        <div className="space-y-6">

          {/* Assigned Faculty Mentor Card */}
          <Card className="border-indigo-100 bg-linear-to-b from-indigo-50/40 to-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                  Assigned Faculty Mentor
                </span>
                <Badge variant="faculty" size="sm">Mentoring</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar name="Dr. Sarah Jenkins" role="faculty" size="lg" />
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Dr. Sarah Jenkins</h4>
                  <p className="text-xs text-slate-500">Associate Professor, {user?.department || 'IT'} Dept.</p>
                  <p className="text-[11px] text-indigo-600 font-medium">sarah.jenkins@{user?.department?.toLowerCase() || 'it'}.college.edu</p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-white border border-indigo-100 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-medium">Next Review Session:</span>
                  <span className="font-bold text-slate-900">Thursday, 2:30 PM</span>
                </div>
                <div className="text-[11px] text-slate-500">Topic: Semester 6 Capstone Project Milestone</div>
              </div>

              <div className="flex gap-2">
                <Link href="/student/feedback" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Submit Concern
                  </Button>
                </Link>
                <Link href="/student/career" className="flex-1">
                  <Button variant="primary" size="sm" className="w-full text-xs">
                    Career Goals
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Target Career Goal */}
          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-600" /> Target Career Goal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-slate-900">{user?.careerGoalTitle || 'Set Your Career Goal'}</span>
                <Badge variant="student" size="sm">Target: Batch {user?.batch || '2023-2027'}</Badge>
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-2 text-slate-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Core Backend & Database Foundations</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>2 Production Web Applications</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Industry AWS Certification</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Department Opportunities */}
          <Card className="bg-white border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Opportunities</CardTitle>
              <Link href="/student/opportunities" className="text-xs text-blue-600 font-semibold">
                View All
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {opportunities.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400">
                  No active drives posted.
                </div>
              ) : (
                opportunities.map((op) => (
                  <div key={op.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{op.title}</span>
                      <Badge variant="warning" size="sm">{op.type}</Badge>
                    </div>
                    <p className="text-[11px] text-slate-500">{op.company_or_org}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
