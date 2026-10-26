'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Tables } from '@/types/database';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import {
  AlertCircle,
  MessageSquare,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Send,
  UserCheck,
  Building,
} from 'lucide-react';

type Grievance = Tables<'feedback_grievances'>;

export default function FacultyConcernsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [concerns, setConcerns] = useState<Grievance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConcern, setSelectedConcern] = useState<Grievance | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchConcerns = useCallback(async () => {
    if (!user) return;
    try {
      const supabase = getSupabaseBrowserClient();
      const dept = user.department || 'IT';

      const { data, error } = await supabase
        .from('feedback_grievances')
        .select('*')
        .eq('department', dept)
        .eq('is_private_to_hod', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConcerns((data as Grievance[]) || []);
    } catch (err: any) {
      console.error('Error fetching faculty concerns:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConcerns();
  }, [fetchConcerns]);

  const handleSendResponse = async (status: 'Resolved' | 'Escalated') => {
    if (!selectedConcern || !responseText.trim()) return;

    setIsSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await (supabase
        .from('feedback_grievances') as any)
        .update({
          response: responseText.trim(),
          status,
          responded_by: user?.id,
          responded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedConcern.id);

      if (error) throw error;

      toast({
        type: 'success',
        title: status === 'Resolved' ? 'Concern Resolved' : 'Escalated to HOD',
        message: 'Your official faculty response has been recorded.',
      });

      setSelectedConcern(null);
      setResponseText('');
      await fetchConcerns();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Action Failed',
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
        title="Student Concerns & Grievance Redressal"
        description="Review academic inquiries, mentorship questions, and department feedback submitted by students in your department."
        breadcrumbs={[
          { label: 'Faculty Portal', href: '/faculty/dashboard' },
          { label: 'Student Concerns' },
        ]}
      />

      {/* Concerns List */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="lg" message="Loading student concerns..." />
        </div>
      ) : concerns.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="w-10 h-10 text-emerald-500" />}
          title="All Concerns Resolved"
          description="There are currently no active or pending student grievances in your department queue."
        />
      ) : (
        <div className="space-y-4">
          {concerns.map((item) => (
            <Card
              key={item.id}
              className="bg-white border-slate-200 hover:border-indigo-200 transition-all p-6 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="default" size="sm">{item.category}</Badge>
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

              {/* Response Section */}
              {item.response ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-emerald-900">
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-emerald-700" /> Recorded Faculty Resolution
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
                <div className="pt-2 flex justify-end">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setSelectedConcern(item);
                      setResponseText('');
                    }}
                  >
                    <MessageSquare className="w-3.5 h-3.5 mr-1" /> Provide Resolution
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Response Modal */}
      {selectedConcern && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <Card className="w-full max-w-lg bg-white shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Provide Official Resolution</h3>
                <p className="text-xs text-slate-500">Respond to student inquiry</p>
              </div>
              <button
                onClick={() => setSelectedConcern(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Concern Summary</span>
                <div className="text-sm font-bold text-slate-900">{selectedConcern.title}</div>
                <p className="text-xs text-slate-600 leading-relaxed">{selectedConcern.description}</p>
              </div>

              <Textarea
                label="Official Response / Action Taken"
                rows={4}
                required
                placeholder="State the resolution, meeting time, or instructions provided to the student..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                autoFocus
              />

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedConcern(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  className="flex-1"
                  isLoading={isSubmitting}
                  disabled={!responseText.trim()}
                  onClick={() => handleSendResponse('Resolved')}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Resolve Concern
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  className="flex-1"
                  isLoading={isSubmitting}
                  disabled={!responseText.trim()}
                  onClick={() => handleSendResponse('Escalated')}
                >
                  <ArrowUpRight className="w-4 h-4 mr-1.5" /> Escalate to HOD
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
