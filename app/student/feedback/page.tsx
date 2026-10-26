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
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import {
  MessageSquare,
  Plus,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  Lock,
  Send,
  Building,
  UserCheck,
} from 'lucide-react';

type Grievance = Tables<'feedback_grievances'>;

const CATEGORIES = [
  'Academic Concern',
  'Mentoring',
  'Department Concern',
  'Infrastructure',
  'Complaint',
  'Suggestion',
  'Other',
] as const;

export default function StudentFeedbackPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [targetRole, setTargetRole] = useState<'faculty' | 'hod' | 'both'>('both');
  const [isPrivateToHod, setIsPrivateToHod] = useState(false);

  const fetchGrievances = useCallback(async () => {
    if (!user) return;
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('feedback_grievances')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGrievances(data || []);
    } catch (err: any) {
      console.error('Error fetching grievances:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGrievances();
  }, [fetchGrievances]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await (supabase.from('feedback_grievances') as any).insert({
        student_id: user.id,
        title: title.trim(),
        description: description.trim(),
        category,
        target_role: isPrivateToHod ? 'hod' : targetRole,
        department: user.department || 'IT',
        status: 'Submitted',
        is_private_to_hod: isPrivateToHod,
      });

      if (error) throw error;

      toast({
        type: 'success',
        title: 'Feedback / Grievance Submitted',
        message: isPrivateToHod
          ? 'Your concern has been submitted privately and encrypted for Head of Department review only.'
          : 'Your submission has been logged with department authorities.',
      });

      setTitle('');
      setDescription('');
      setIsPrivateToHod(false);
      setTargetRole('both');
      setIsModalOpen(false);

      await fetchGrievances();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Submission Failed',
        message: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'Resolved': return <Badge variant="success" size="sm" dot>Resolved</Badge>;
      case 'Under Review': return <Badge variant="blue" size="sm" dot>Under Review</Badge>;
      case 'Escalated': return <Badge variant="danger" size="sm" dot>Escalated to HOD</Badge>;
      default: return <Badge variant="warning" size="sm" dot>Submitted</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feedback & Grievance Redressal"
        description="Submit suggestions, academic concerns, or confidential complaints directly to faculty mentors and the Head of Department."
        breadcrumbs={[
          { label: 'Student Portal', href: '/student/dashboard' },
          { label: 'Feedback & Grievances' },
        ]}
        actions={
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Submit Concern / Feedback
          </Button>
        }
      />

      {/* Confidentiality Alert Banner */}
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-3 shadow-2xs">
        <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Confidential & Protected Redressal System</p>
          <p className="text-blue-800 leading-relaxed">
            All grievances are tracked under department governance policy. If you check <strong>Direct to HOD Only</strong>, the complaint is encrypted so faculty members cannot view it.
          </p>
        </div>
      </div>

      {/* Grievances List */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="lg" message="Loading feedback requests..." />
        </div>
      ) : grievances.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="w-10 h-10 text-blue-500" />}
          title="No Feedback or Concerns Submitted"
          description="If you have an academic inquiry, mentorship concern, or suggestion for the department, submit it here."
          actionLabel="Submit Feedback"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {grievances.map((item) => (
            <Card
              key={item.id}
              className="bg-white border-slate-200 hover:border-blue-200 transition-all p-6 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="default" size="sm">{item.category}</Badge>
                  {item.is_private_to_hod && (
                    <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Lock className="w-3 h-3" /> HOD Confidential
                    </span>
                  )}
                  <span className="text-xs text-slate-400">
                    Logged {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
                {getStatusBadge(item.status)}
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">{item.description}</p>
              </div>

              {/* Official Response Section */}
              {item.response ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-emerald-700" /> Official Department Resolution
                    </span>
                    {item.responded_at && (
                      <span className="text-[11px] text-emerald-700">
                        {new Date(item.responded_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-emerald-950 leading-relaxed font-medium">{item.response}</p>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-500 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Awaiting formal review from department advisory committee</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Submission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <Card className="w-full max-w-lg bg-white shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Submit Feedback / Grievance</h3>
                  <p className="text-xs text-slate-500">Structured communication with department</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Subject / Concern Summary"
                required
                placeholder="e.g. Request for Cloud Lab access / Mid-term review clarification"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>

                <Select
                  label="Target Recipient"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value as any)}
                  disabled={isPrivateToHod}
                >
                  <option value="both">Both Faculty & HOD</option>
                  <option value="faculty">Faculty Mentor</option>
                  <option value="hod">Head of Department (HOD)</option>
                </Select>
              </div>

              <Textarea
                label="Detailed Description"
                rows={4}
                required
                placeholder="Provide complete facts, dates, course codes, or infrastructure details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              {/* Private to HOD Toggle */}
              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="hodPrivateCheck"
                  checked={isPrivateToHod}
                  onChange={(e) => setIsPrivateToHod(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="hodPrivateCheck" className="text-xs text-purple-950 font-medium cursor-pointer">
                  <strong>Confidential HOD Escalation:</strong> Route exclusively to the Head of Department. Faculty will not have access to view this submission.
                </label>
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
                  disabled={!title.trim() || !description.trim()}
                >
                  <Send className="w-4 h-4 mr-1.5" /> Submit Request
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
