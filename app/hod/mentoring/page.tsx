'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Tables } from '@/types/database';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import {
  GraduationCap,
  Users,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock,
  Building,
} from 'lucide-react';

interface AssignmentWithNames {
  id: string;
  faculty_id: string;
  student_id: string;
  faculty_name: string;
  student_name: string;
  assigned_at: string;
}

export default function HodMentoringPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<AssignmentWithNames[]>([]);
  const [facultyMembers, setFacultyMembers] = useState<{ id: string; full_name: string }[]>([]);
  const [students, setStudents] = useState<{ id: string; full_name: string }[]>([]);
  const [sessions, setSessions] = useState<Tables<'mentoring_sessions'>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const fetchMentoringGovernance = useCallback(async () => {
    if (!user) return;
    try {
      const supabase = getSupabaseBrowserClient();
      const dept = user.department || 'IT';

      // 1. Fetch faculty & students in dept
      const [facRes, stRes, assignRes, sessRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name').eq('role', 'faculty').eq('department', dept),
        supabase.from('profiles').select('id, full_name').eq('role', 'student').eq('department', dept),
        supabase.from('faculty_mentor_assignments').select('*').eq('department', dept),
        supabase.from('mentoring_sessions').select('*').eq('department', dept).order('session_date', { ascending: false }),
      ]);

      const facList = (facRes.data as { id: string; full_name: string }[]) || [];
      const stList = (stRes.data as { id: string; full_name: string }[]) || [];
      setFacultyMembers(facList);
      setStudents(stList);

      if (facList.length > 0 && !selectedFacultyId) setSelectedFacultyId(facList[0].id);
      if (stList.length > 0 && !selectedStudentId) setSelectedStudentId(stList[0].id);

      const fMap = new Map(facList.map((f) => [f.id, f.full_name]));
      const sMap = new Map(stList.map((s) => [s.id, s.full_name]));

      const rawAssigns = (assignRes.data as Tables<'faculty_mentor_assignments'>[]) || [];
      const combined: AssignmentWithNames[] = rawAssigns.map((a) => ({
        id: a.id,
        faculty_id: a.faculty_id,
        student_id: a.student_id,
        faculty_name: fMap.get(a.faculty_id) || 'Faculty',
        student_name: sMap.get(a.student_id) || 'Student',
        assigned_at: a.assigned_at,
      }));
      setAssignments(combined);

      if (sessRes.data) setSessions(sessRes.data as Tables<'mentoring_sessions'>[]);
    } catch (err: any) {
      console.error('Error fetching mentoring governance:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedFacultyId, selectedStudentId]);

  useEffect(() => {
    fetchMentoringGovernance();
  }, [fetchMentoringGovernance]);

  const handleAssignMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFacultyId || !selectedStudentId) return;

    setIsSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await (supabase.from('faculty_mentor_assignments') as any).insert({
        faculty_id: selectedFacultyId,
        student_id: selectedStudentId,
        department: user.department || 'IT',
      });

      if (error) throw error;

      toast({
        type: 'success',
        title: 'Mentorship Group Updated',
        message: 'Student assigned to faculty mentor.',
      });

      setIsModalOpen(false);
      await fetchMentoringGovernance();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Assignment Failed',
        message: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveAssignment = async (assignId: string) => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from('faculty_mentor_assignments').delete().eq('id', assignId);
      if (error) throw error;

      toast({
        type: 'success',
        title: 'Assignment Removed',
        message: 'Mentorship link deleted.',
      });
      setAssignments((prev) => prev.filter((a) => a.id !== assignId));
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message,
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Department Mentorship Governance & Auditing"
        description={`Allocate students to faculty mentors, audit review completion frequencies, and ensure mentorship guidelines for ${user?.department || 'IT'}.`}
        breadcrumbs={[
          { label: 'HOD Portal', href: '/hod/dashboard' },
          { label: 'Mentoring' },
        ]}
        actions={
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Assign Mentor
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 Columns: Active Mentor Assignments */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" /> Active Mentorship Allocations ({assignments.length})
          </h3>

          {isLoading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner size="lg" message="Loading mentorship allocations..." />
            </div>
          ) : assignments.length === 0 ? (
            <EmptyState
              icon={<GraduationCap className="w-10 h-10 text-indigo-500" />}
              title="No Mentors Assigned"
              description="Allocate students to faculty mentors to initiate structured review cycles."
              actionLabel="Assign First Mentor"
              onAction={() => setIsModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {assignments.map((item) => (
                <Card key={item.id} className="p-4 bg-white border-slate-200 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-xs text-slate-500 font-semibold">Mentee Student</div>
                    <div className="text-sm font-bold text-slate-900">{item.student_name}</div>
                    <div className="text-xs text-indigo-700 font-medium pt-1">
                      Mentor: <strong>{item.faculty_name}</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveAssignment(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Remove assignment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Department Mentoring Logs Audit */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" /> Mentoring Review Logs ({sessions.length})
          </h3>

          <Card className="p-4 bg-white border-slate-200">
            {sessions.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No session logs recorded.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {sessions.map((s) => (
                  <div key={s.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{s.topic}</span>
                      <Badge variant={s.status === 'Completed' ? 'success' : 'blue'} size="sm">
                        {s.status}
                      </Badge>
                    </div>
                    <p className="text-slate-500 text-[11px]">{new Date(s.session_date).toLocaleDateString()} • {s.meeting_mode}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

      </div>

      {/* Assignment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <Card className="w-full max-w-md bg-white shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Assign Faculty Mentor</h3>
                <p className="text-xs text-slate-500">Pair student with department faculty</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignMentor} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Faculty Mentor</label>
                <select
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedFacultyId}
                  onChange={(e) => setSelectedFacultyId(e.target.value)}
                >
                  {facultyMembers.map((f) => (
                    <option key={f.id} value={f.id}>{f.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Student</label>
                <select
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  isLoading={isSubmitting}
                >
                  Confirm Assignment
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
