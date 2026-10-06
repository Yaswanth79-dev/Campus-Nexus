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
  Lightbulb,
  ThumbsUp,
  MessageSquareQuote,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
} from 'lucide-react';

type Idea = Tables<'innovation_ideas'>;

export default function FacultyInnovationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchIdeas = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('innovation_ideas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIdeas((data as Idea[]) || []);
    } catch (err: any) {
      console.error('Error fetching innovation ideas:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const handleReview = async (newStatus: 'Approved' | 'Needs Refinement' | 'Rejected') => {
    if (!selectedIdea || !feedbackText.trim()) return;

    setIsSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await (supabase
        .from('innovation_ideas') as any)
        .update({
          status: newStatus,
          faculty_mentor_id: user?.id,
          faculty_feedback: feedbackText.trim(),
        })
        .eq('id', selectedIdea.id);

      if (error) throw error;

      toast({
        type: 'success',
        title: 'Review Submitted',
        message: `Proposal marked as ${newStatus}.`,
      });

      setSelectedIdea(null);
      setFeedbackText('');
      await fetchIdeas();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Review Failed',
        message: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'Approved': return <Badge variant="success" size="sm" dot>Approved</Badge>;
      case 'Needs Refinement': return <Badge variant="warning" size="sm" dot>Needs Refinement</Badge>;
      case 'Rejected': return <Badge variant="danger" size="sm">Rejected</Badge>;
      default: return <Badge variant="blue" size="sm" dot>Under Review</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Innovation & Capstone Reviews"
        description="Review student project pitches, evaluate technical feasibility, and provide formal incubation guidance."
        breadcrumbs={[
          { label: 'Faculty Portal', href: '/faculty/dashboard' },
          { label: 'Innovation Reviews' },
        ]}
      />

      {/* Ideas Grid */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="lg" message="Loading innovation proposals..." />
        </div>
      ) : ideas.length === 0 ? (
        <EmptyState
          icon={<Lightbulb className="w-10 h-10 text-amber-500" />}
          title="No Innovation Proposals Pending"
          description="There are currently no capstone or patent proposals awaiting faculty review."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ideas.map((idea) => (
            <Card
              key={idea.id}
              className="bg-white border-slate-200 hover:border-amber-300 hover:shadow-md transition-all p-6 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                    {idea.domain}
                  </span>
                  {getStatusBadge(idea.status)}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">{idea.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Submitted on {new Date(idea.created_at).toLocaleDateString()} • {idea.votes_count} community votes
                  </p>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">{idea.description}</p>

                {idea.tech_stack && idea.tech_stack.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {idea.tech_stack.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {idea.faculty_feedback && (
                  <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-100 text-xs space-y-1">
                    <div className="font-bold text-purple-900 flex items-center gap-1.5">
                      <MessageSquareQuote className="w-4 h-4 text-purple-700" /> Recorded Faculty Feedback
                    </div>
                    <p className="text-purple-950 leading-relaxed font-medium">{idea.faculty_feedback}</p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSelectedIdea(idea);
                    setFeedbackText(idea.faculty_feedback || '');
                  }}
                >
                  <MessageSquareQuote className="w-4 h-4 mr-1.5" /> Review & Evaluate
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedIdea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <Card className="w-full max-w-lg bg-white shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Evaluate Proposal</h3>
                <p className="text-xs text-slate-500">Provide faculty technical feedback</p>
              </div>
              <button
                onClick={() => setSelectedIdea(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                <div className="text-sm font-bold text-slate-900">{selectedIdea.title}</div>
                <p className="text-xs text-slate-600">{selectedIdea.description}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mentor Evaluation / Feasibility Feedback
                </label>
                <textarea
                  rows={4}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Provide guidance on system architecture, dataset feasibility, or required modifications..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="pt-2 grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  disabled={!feedbackText.trim()}
                  onClick={() => handleReview('Approved')}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  isLoading={isSubmitting}
                  disabled={!feedbackText.trim()}
                  onClick={() => handleReview('Needs Refinement')}
                >
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Refine
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  isLoading={isSubmitting}
                  disabled={!feedbackText.trim()}
                  onClick={() => handleReview('Rejected')}
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
