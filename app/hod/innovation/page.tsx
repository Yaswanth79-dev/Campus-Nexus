'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Tables } from '@/types/database';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Lightbulb,
  ThumbsUp,
  MessageSquareQuote,
  Sparkles,
} from 'lucide-react';

type Idea = Tables<'innovation_ideas'>;

export default function HodInnovationPage() {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchIdeas = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('innovation_ideas')
        .select('*')
        .order('votes_count', { ascending: false });

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

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'Approved': return <Badge variant="success" size="sm" dot>Approved for Incubation</Badge>;
      case 'Needs Refinement': return <Badge variant="warning" size="sm">Needs Refinement</Badge>;
      case 'Rejected': return <Badge variant="danger" size="sm">Rejected</Badge>;
      default: return <Badge variant="blue" size="sm" dot>Under Review</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${user?.department || 'IT'} Department Innovation & Patent Incubator`}
        description={`Audit student research prototypes, patent proposals, and incubation initiatives in ${user?.department || 'IT'}.`}
        breadcrumbs={[
          { label: 'HOD Portal', href: '/hod/dashboard' },
          { label: 'Innovation Hub' },
        ]}
      />

      {/* Ideas Grid */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="lg" message="Loading department innovation portfolio..." />
        </div>
      ) : ideas.length === 0 ? (
        <EmptyState
          icon={<Lightbulb className="w-10 h-10 text-amber-500" />}
          title="No Innovation Pitches Logged"
          description="Student research and patent proposals will appear here as they are submitted."
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
                    Pitched on {new Date(idea.created_at).toLocaleDateString()} • {idea.votes_count} Student Votes
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
                      <MessageSquareQuote className="w-4 h-4 text-purple-700" /> Faculty Mentor Review
                    </div>
                    <p className="text-purple-950 leading-relaxed font-medium">{idea.faculty_feedback}</p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1 text-blue-600">
                  <ThumbsUp className="w-3.5 h-3.5" /> {idea.votes_count} Upvotes
                </span>
                <span>Department Innovation Track</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
