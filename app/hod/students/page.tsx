'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Tables } from '@/types/database';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Users,
  Search,
  Filter,
  Eye,
  GraduationCap,
  Layers,
  Code,
  Trophy,
} from 'lucide-react';

interface StudentRecord {
  id: string;
  full_name: string;
  email: string;
  department: string;
  student: Tables<'students'> | null;
}

export default function HodStudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('All');
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [studentSkills, setStudentSkills] = useState<Tables<'student_skills'>[]>([]);
  const [studentProjects, setStudentProjects] = useState<Tables<'student_projects'>[]>([]);
  const [studentCredits, setStudentCredits] = useState<number>(0);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const fetchStudents = useCallback(async () => {
    if (!user) return;
    try {
      const supabase = getSupabaseBrowserClient();
      const dept = user.department || 'IT';

      const { data: profilesData, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .eq('department', dept)
        .order('full_name', { ascending: true });

      if (profErr) throw profErr;

      if (profilesData && profilesData.length > 0) {
        const profList = profilesData as Tables<'profiles'>[];
        const studentIds = profList.map((p) => p.id);
        const { data: sData } = await supabase
          .from('students')
          .select('*')
          .in('id', studentIds);

        const sList = (sData as Tables<'students'>[]) || [];
        const studentsMap = new Map<string, Tables<'students'>>(sList.map((s) => [s.id, s]));

        const combined: StudentRecord[] = profList.map((p) => ({
          id: p.id,
          full_name: p.full_name,
          email: p.email,
          department: p.department,
          student: studentsMap.get(p.id) || null,
        }));

        setStudents(combined);
      } else {
        setStudents([]);
      }
    } catch (err: any) {
      console.error('Error fetching department students:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleOpenStudentDetail = async (st: StudentRecord) => {
    setSelectedStudent(st);
    setIsDetailLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();

      const [skillsRes, projRes, actRes] = await Promise.all([
        supabase.from('student_skills').select('*').eq('student_id', st.id),
        supabase.from('student_projects').select('*').eq('student_id', st.id),
        supabase.from('student_learning_activities').select('credits_earned').eq('student_id', st.id),
      ]);

      if (skillsRes.data) setStudentSkills(skillsRes.data as Tables<'student_skills'>[]);
      if (projRes.data) setStudentProjects(projRes.data as Tables<'student_projects'>[]);
      if (actRes.data) {
        const list = actRes.data as Tables<'student_learning_activities'>[];
        setStudentCredits(list.reduce((sum, a) => sum + (a.credits_earned || 0), 0));
      }
    } catch (err) {
      console.error('Error loading student detail:', err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.student?.roll_number && s.student.roll_number.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesYear = yearFilter === 'All' || s.student?.year?.toString() === yearFilter;
    return matchesSearch && matchesYear;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${user?.department || 'IT'} Student Directory & Intelligence`}
        description={`Complete student directory for the ${user?.department || 'IT'} Department. Audit verified credentials, CGPA distributions, and learning credits.`}
        breadcrumbs={[
          { label: 'HOD Portal', href: '/hod/dashboard' },
          { label: 'Students' },
        ]}
      />

      {/* Filter & Search */}
      <Card className="p-4 bg-white border-slate-200">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search by student name or roll number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {['All', '1', '2', '3', '4'].map((yr) => (
              <button
                key={yr}
                onClick={() => setYearFilter(yr)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                  yearFilter === yr
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {yr === 'All' ? 'All Years' : `Year ${yr}`}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Students Grid */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="lg" message="Loading student roster..." />
        </div>
      ) : filteredStudents.length === 0 ? (
        <EmptyState
          icon={<Users className="w-10 h-10 text-indigo-500" />}
          title="No Students Found"
          description="No students matching your filter criteria were found in the department."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((st) => (
            <Card
              key={st.id}
              className="bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <Avatar name={st.full_name} role="student" size="lg" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-base leading-tight truncate">
                      {st.full_name}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Roll: {st.student?.roll_number || 'Not Set'}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{st.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Year/Sem</div>
                    <div className="text-xs font-bold text-slate-800 mt-0.5">
                      {st.student?.year ? `Y${st.student.year} / S${st.student.semester}` : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">CGPA</div>
                    <div className="text-xs font-bold text-emerald-600 mt-0.5">
                      {st.student?.cgpa || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Backlogs</div>
                    <div className={`text-xs font-bold mt-0.5 ${
                      (st.student?.backlog_count || 0) > 0 ? 'text-rose-600' : 'text-slate-800'
                    }`}>
                      {st.student?.backlog_count || 0}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <Badge variant="student" size="sm">
                  {st.department}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenStudentDetail(st)}
                >
                  <Eye className="w-3.5 h-3.5 mr-1" /> View Full Profile
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Student Deep Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <Card className="w-full max-w-2xl bg-white shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <Avatar name={selectedStudent.full_name} role="student" size="lg" />
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{selectedStudent.full_name}</h3>
                  <p className="text-xs text-slate-500">
                    Roll: <strong>{selectedStudent.student?.roll_number || 'N/A'}</strong> • {selectedStudent.department} Dept
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            {isDetailLoading ? (
              <div className="py-12 flex justify-center">
                <LoadingSpinner size="md" message="Loading student portfolio..." />
              </div>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">CGPA</div>
                    <div className="text-lg font-black text-emerald-600 mt-0.5">{selectedStudent.student?.cgpa || 'N/A'}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Learning Credits</div>
                    <div className="text-lg font-black text-amber-600 mt-0.5">{studentCredits} Pts</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Skills</div>
                    <div className="text-lg font-black text-blue-600 mt-0.5">{studentSkills.length}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Projects</div>
                    <div className="text-lg font-black text-purple-600 mt-0.5">{studentProjects.length}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900 mb-2 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-600" /> Technical Skills
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {studentSkills.map((s) => (
                      <span
                        key={s.id}
                        className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800"
                      >
                        {s.skill_name} ({s.proficiency})
                      </span>
                    ))}
                  </div>
                </div>

                {/* Resume / Portfolio Document */}
                {selectedStudent.student?.resume_url && (
                  <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-rose-600 text-white font-black text-[10px] flex items-center justify-center">
                        PDF
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">Student Resume / CV Document</div>
                        <div className="text-slate-500 text-[11px]">Available for accreditation audits and placements</div>
                      </div>
                    </div>

                    <a
                      href={selectedStudent.student.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-1 shrink-0"
                    >
                      View / Download Resume
                    </a>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <Button variant="primary" onClick={() => setSelectedStudent(null)}>
                    Close Drawer
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
