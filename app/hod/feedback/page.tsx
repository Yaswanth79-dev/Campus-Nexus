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
  MessageSquare,
  Lock,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Send,
  Building,
} from 'lucide-react';

type Grievance = Tables<'feedback_grievances'>;

export default function HodFeedbackPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchGrievances = useCallback(async () => {
    if (!user) return;
    try {
      const supabase = getSupabaseBrowserClient();
      const dept = user.department || 'IT';

      const { data, error } = await supabase
        .from('feedback_grievances')
        .select('*')
        .eq('department', dept)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGrievances((data as Grievance[]) || []);
    } catch (err: any) {
      console.error('Error fetching HOD grievances:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGrievances();
  }, [fetchGrievances]);

  const handleResolve = async () => {
    if (!selectedGrievance || !responseText.trim()) return;

    setIsSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await (supabase
        .from('feedback_grievances') as any)
        .update({
          response: responseText.trim(),
          status: 'Resolved',
          responded_by: user?.id,
          responded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedGrievance.id);

      if (error) throw error;

      toast({
        type: 'success',
        title: 'Grievance Resolved',
        message: 'Official HOD executive resolution recorded.',
      });

      setSelectedGrievance(null);
      setResponseText('');
      await fetchGrievances();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Resolution Failed',
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
        title={`${user?.department || 'IT'} Grievance Redressal & Escalation Board`}
        description={`Executive redressal portal for confidential student concerns, escalated academic grievances, and department governance in ${user?.department || 'IT'}.`}
        breadcrumbs={[
          { label: 'HOD Portal', href: '/hod/dashboard' },
          { label: 'Grievances' },
        ]}
      />

      {/* Grievances List */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="lg" message="Loading department grievance records..." />
        </div>
      ) : grievances.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="w-10 h-10 text-emerald-500" />}
          title="No Open Grievances"
          description="All department student feedback and grievances have been resolved."
        />
      ) : (
        <div className="space-y-4">
          {grievances.map((item) => (
            <Card
              key={item.id}
              className="bg-white border-slate-200 hover:border-indigo-200 transition-all p-6 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="default" size="sm">{item.category}</Badge>
                  {item.is_private_to_hod && (
                    <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> Confidential HOD Direct
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

              {item.response ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-emerald-900">
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-emerald-700" /> Recorded Resolution
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
                      setSelectedGrievance(item);
                      setResponseText('');
                    }}
                  >
                    <MessageSquare className="w-3.5 h-3.5 mr-1" /> Executive Resolution
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Resolution Modal */}
      {selectedGrievance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <Card className="w-full max-w-lg bg-white shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Issue Executive Resolution</h3>
                <p className="text-xs text-slate-500">HOD formal decision and record</p>
              </div>
              <button
                onClick={() => setSelectedGrievance(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Concern Summary</span>
                <div className="text-sm font-bold text-slate-900">{selectedGrievance.title}</div>
                <p className="text-xs text-slate-600">{selectedGrievance.description}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Official HOD Decision</label>
                <textarea
                  rows={4}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="State the findings, corrective actions initiated, or final decision..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="pt-2 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedGrievance(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  className="flex-1"
                  isLoading={isSubmitting}
                  disabled={!responseText.trim()}
                  onClick={handleResolve}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Confirm & Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
