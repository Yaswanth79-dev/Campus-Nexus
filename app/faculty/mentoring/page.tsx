'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Tables } from '@/types/database';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import {
  GraduationCap,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Video,
  MapPin,
  Phone,
  FileText,
  Save,
} from 'lucide-react';

type Session = Tables<'mentoring_sessions'>;

export default function FacultyMentoringPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [departmentStudents, setDepartmentStudents] = useState<{ id: string; full_name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [topic, setTopic] = useState('');
  const [meetingMode, setMeetingMode] = useState<'In-Person' | 'Online (Google Meet)' | 'Phone / Call'>('In-Person');
  const [notes, setNotes] = useState('');
  const [actionItems, setActionItems] = useState('');

  const fetchMentoringData = useCallback(async () => {
    if (!user) return;
    try {
      const supabase = getSupabaseBrowserClient();
      const dept = user.department || 'IT';

      // 1. Fetch sessions
      const { data: sessData, error: sErr } = await supabase
        .from('mentoring_sessions')
        .select('*')
        .eq('faculty_id', user.id)
        .order('session_date', { ascending: false });

      if (sErr) throw sErr;
      setSessions((sessData as Session[]) || []);

      // 2. Fetch department students for selection
      const { data: stData } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .eq('department', dept)
        .order('full_name', { ascending: true });

      if (stData) {
        const list = stData as Tables<'profiles'>[];
        setDepartmentStudents(list.map((p) => ({ id: p.id, full_name: p.full_name })));
        if (list.length > 0 && !selectedStudentId) {
          setSelectedStudentId(list[0].id);
        }
      }
    } catch (err: any) {
      console.error('Error fetching mentoring sessions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedStudentId]);

  useEffect(() => {
    fetchMentoringData();
  }, [fetchMentoringData]);

  const handleScheduleSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedStudentId || !topic.trim()) return;

    setIsSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await (supabase.from('mentoring_sessions') as any).insert({
        faculty_id: user.id,
        student_id: selectedStudentId,
        session_date: sessionDate ? new Date(sessionDate).toISOString() : new Date().toISOString(),
        topic: topic.trim(),
        meeting_mode: meetingMode,
        status: 'Scheduled',
        notes: notes.trim() || null,
        action_items: actionItems.trim() || null,
        department: user.department || 'IT',
      });

      if (error) throw error;

      toast({
        type: 'success',
        title: 'Mentoring Session Scheduled',
        message: `Session on "${topic}" has been added to your calendar.`,
      });

      setTopic('');
      setNotes('');
      setActionItems('');
      setIsModalOpen(false);

      await fetchMentoringData();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Failed to schedule',
        message: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (sessionId: string, newStatus: 'Completed' | 'Action Needed') => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await (supabase
        .from('mentoring_sessions') as any)
        .update({ status: newStatus })
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        type: 'success',
        title: 'Session Updated',
        message: `Status set to ${newStatus}.`,
      });

      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, status: newStatus } : s))
      );
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Update Failed',
        message: err.message,
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Mentoring & Advisory"
        description="Schedule periodic mentoring reviews, track student milestones, and maintain official consultation notes."
        breadcrumbs={[
          { label: 'Faculty Portal', href: '/faculty/dashboard' },
          { label: 'Mentoring' },
        ]}
        actions={
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Schedule Mentoring Session
          </Button>
        }
      />

      {/* Sessions List */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="lg" message="Loading mentoring logs..." />
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="w-10 h-10 text-indigo-500" />}
          title="No Mentoring Sessions Scheduled"
          description="Schedule your first one-on-one review session with an assigned student mentee."
          actionLabel="Schedule Session"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {sessions.map((sess) => (
            <Card
              key={sess.id}
              className="bg-white border-slate-200 hover:border-indigo-200 transition-all p-6 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={sess.status === 'Completed' ? 'success' : sess.status === 'Action Needed' ? 'warning' : 'blue'} size="sm" dot>
                    {sess.status}
                  </Badge>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                    {sess.meeting_mode}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(sess.session_date).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {sess.status === 'Scheduled' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(sess.id, 'Completed')}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Mark Complete
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{sess.topic}</h3>
                {sess.notes && (
                  <p className="text-sm text-slate-600 mt-1.5 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <strong>Discussion Notes:</strong> {sess.notes}
                  </p>
                )}
                {sess.action_items && (
                  <p className="text-xs text-indigo-900 mt-2 font-medium bg-indigo-50/60 p-2.5 rounded-lg border border-indigo-100">
                    ⚡ <strong>Action Items:</strong> {sess.action_items}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <Card className="w-full max-w-lg bg-white shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Schedule Mentoring Session</h3>
                  <p className="text-xs text-slate-500">Plan review meeting with a department student</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleScheduleSession} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Student</label>
                <select
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                >
                  {departmentStudents.map((st) => (
                    <option key={st.id} value={st.id}>{st.full_name}</option>
                  ))}
                </select>
              </div>

              <Input
                label="Discussion Topic / Agenda"
                required
                placeholder="e.g. Capstone Architecture Review & Code Optimization"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                autoFocus
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Session Date & Time"
                  type="datetime-local"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                />

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Meeting Mode</label>
                  <select
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={meetingMode}
                    onChange={(e) => setMeetingMode(e.target.value as any)}
                  >
                    <option value="In-Person">In-Person (Faculty Cabin)</option>
                    <option value="Online (Google Meet)">Online (Google Meet)</option>
                    <option value="Phone / Call">Phone / Call</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Initial Guidance Notes</label>
                <textarea
                  rows={2}
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Key discussion points, preparation required by student..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Action Items for Student</label>
                <textarea
                  rows={2}
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 1. Complete LeetCode test, 2. Deploy Next.js build..."
                  value={actionItems}
                  onChange={(e) => setActionItems(e.target.value)}
                />
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
                  disabled={!topic.trim()}
                >
                  Schedule Session
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
