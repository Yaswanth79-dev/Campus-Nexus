'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Tables } from '@/types/database';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  BarChart3,
  TrendingUp,
  Award,
  Layers,
  GraduationCap,
  Users,
  Building,
  Target,
  Trophy,
} from 'lucide-react';

export default function HodAnalyticsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Tables<'students'>[]>([]);
  const [skills, setSkills] = useState<Tables<'student_skills'>[]>([]);
  const [activities, setActivities] = useState<Tables<'student_learning_activities'>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      if (!user) return;
      try {
        const supabase = getSupabaseBrowserClient();
        const dept = user.department || 'IT';

        // 1. Fetch department students
        const { data: profData } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'student')
          .eq('department', dept);

        if (profData && profData.length > 0) {
          const pList = profData as Tables<'profiles'>[];
          const ids = pList.map((p) => p.id);
          const [sRes, skRes, actRes] = await Promise.all([
            supabase.from('students').select('*').in('id', ids),
            supabase.from('student_skills').select('*').in('student_id', ids),
            supabase.from('student_learning_activities').select('*').in('student_id', ids),
          ]);

          if (sRes.data) setStudents(sRes.data as Tables<'students'>[]);
          if (skRes.data) setSkills(skRes.data as Tables<'student_skills'>[]);
          if (actRes.data) setActivities(actRes.data as Tables<'student_learning_activities'>[]);
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAnalytics();
  }, [user]);

  // Compute metrics
  const distinctionCount = students.filter((s) => (s.cgpa || 0) >= 8.5).length;
  const firstClassCount = students.filter((s) => (s.cgpa || 0) >= 7.0 && (s.cgpa || 0) < 8.5).length;
  const passCount = students.filter((s) => (s.cgpa || 0) > 0 && (s.cgpa || 0) < 7.0).length;

  const totalCredits = activities.reduce((acc, a) => acc + (a.credits_earned || 0), 0);
  const avgCreditsPerStudent = students.length > 0 ? Math.round(totalCredits / students.length) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${user?.department || 'IT'} Department Performance Analytics`}
        description={`Comprehensive academic distribution, technical skills benchmark, and industry placement analytics for ${user?.department || 'IT'}.`}
        breadcrumbs={[
          { label: 'HOD Portal', href: '/hod/dashboard' },
          { label: 'Analytics' },
        ]}
      />

      {/* Top High-Level Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-white border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Enrolled</div>
          <div className="text-3xl font-black text-slate-900 mt-1">{students.length}</div>
          <div className="text-xs text-indigo-600 mt-1">Across 4 study years</div>
        </Card>

        <Card className="p-5 bg-white border-slate-200">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
            <Award className="w-4 h-4 text-emerald-500" /> High CGPA (≥ 8.5)
          </div>
          <div className="text-3xl font-black text-emerald-900 mt-1">{distinctionCount}</div>
          <div className="text-xs text-emerald-600 mt-1">
            {students.length > 0 ? `${Math.round((distinctionCount / students.length) * 100)}% of department` : '0%'}
          </div>
        </Card>

        <Card className="p-5 bg-white border-slate-200">
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider flex items-center gap-1">
            <Trophy className="w-4 h-4 text-amber-500" /> Total Learning Credits
          </div>
          <div className="text-3xl font-black text-amber-900 mt-1">{totalCredits}</div>
          <div className="text-xs text-amber-700 mt-1">Avg {avgCreditsPerStudent} pts / student</div>
        </Card>

        <Card className="p-5 bg-white border-slate-200">
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-1">
            <Layers className="w-4 h-4 text-blue-500" /> Total Verified Skills
          </div>
          <div className="text-3xl font-black text-blue-900 mt-1">{skills.length}</div>
          <div className="text-xs text-blue-600 mt-1">Technical proficiencies</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* CGPA Distribution Breakdown */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-600" /> CGPA & Academic Standing Distribution
            </CardTitle>
            <CardDescription>Verified academic performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Distinction (CGPA ≥ 8.5)</span>
                <span>{distinctionCount} Students</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-2.5 rounded-full"
                  style={{ width: `${students.length > 0 ? (distinctionCount / students.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>First Class (7.0 ≤ CGPA &lt; 8.5)</span>
                <span>{firstClassCount} Students</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${students.length > 0 ? (firstClassCount / students.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Pass & Remedial (CGPA &lt; 7.0)</span>
                <span>{passCount} Students</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-2.5 rounded-full"
                  style={{ width: `${students.length > 0 ? (passCount / students.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Domain Competency Breakdown */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" /> Technical Domain Competency Breakdown
            </CardTitle>
            <CardDescription>Distribution of student proficiencies across core computing domains</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {['Programming Languages', 'Web Development', 'Cloud & DevOps', 'AI / ML', 'Database'].map((cat) => {
              const count = skills.filter((s) => s.category === cat).length;
              return (
                <div key={cat} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-slate-800">{cat}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-600">{count} Skills</span>
                    <Badge variant="blue" size="sm">Active</Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
