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
  Lightbulb,
  Plus,
  ThumbsUp,
  MessageSquareQuote,
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
} from 'lucide-react';

type Idea = Tables<'innovation_ideas'>;

export default function StudentInnovationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState('Artificial Intelligence');
  const [description, setDescription] = useState('');
  const [techStackInput, setTechStackInput] = useState('');

  const fetchIdeas = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('innovation_ideas')
        .select('*')
        .order('votes_count', { ascending: false });

      if (error) throw error;
      setIdeas(data || []);
    } catch (err: any) {
      console.error('Error fetching ideas:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const handleAddIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    setIsSubmitting(true);
    try {
      const techArray = techStackInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const supabase = getSupabaseBrowserClient();
      const { error } = await (supabase.from('innovation_ideas') as any).insert({
        student_id: user.id,
        title: title.trim(),
        domain: domain.trim(),
        description: description.trim(),
        tech_stack: techArray,
        status: 'Under Review',
        votes_count: 1,
      });

      if (error) throw error;

      toast({
        type: 'success',
        title: 'Idea Submitted for Review',
        message: `"${title}" has been submitted to department faculty mentors.`,
      });

      setTitle('');
      setDescription('');
      setTechStackInput('');
      setIsModalOpen(false);

      await fetchIdeas();
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

  const handleVote = async (ideaId: string, currentVotes: number) => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await (supabase
        .from('innovation_ideas') as any)
        .update({ votes_count: currentVotes + 1 })
        .eq('id', ideaId);

      if (error) throw error;

      setIdeas((prev) =>
        prev.map((i) => (i.id === ideaId ? { ...i, votes_count: i.votes_count + 1 } : i))
      );
    } catch (err) {
      console.error('Error upvoting idea:', err);
    }
  };

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
        title="Innovation Hub & Project Incubator"
        description="Pitch innovative technical solutions, receive faculty mentorship, and collaborate on student research projects."
        breadcrumbs={[
          { label: 'Student Portal', href: '/student/dashboard' },
          { label: 'Innovation Hub' },
        ]}
        actions={
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Submit Innovation Idea
          </Button>
        }
      />

      {/* Ideas Grid */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="lg" message="Loading innovation proposals..." />
        </div>
      ) : ideas.length === 0 ? (
        <EmptyState
          icon={<Lightbulb className="w-10 h-10 text-amber-500" />}
          title="No Innovation Ideas Pitched Yet"
          description="Have an idea for a patent, hackathon prototype, or research paper? Pitch it to department faculty."
          actionLabel="Pitch First Idea"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ideas.map((idea) => (
            <Card
              key={idea.id}
              className="bg-white border-slate-200 hover:border-amber-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                      {idea.domain}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 leading-snug mt-0.5">{idea.title}</h3>
                  </div>
                  {getStatusBadge(idea.status)}
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">
                  {idea.description}
                </p>

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
                    <div className="flex items-center gap-1.5 text-purple-800 font-bold">
                      <MessageSquareQuote className="w-4 h-4" /> Faculty Reviewer Feedback
                    </div>
                    <p className="text-purple-950 leading-relaxed">{idea.faculty_feedback}</p>
                  </div>
                )}
              </div>

              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleVote(idea.id, idea.votes_count)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-2xs"
                >
                  <ThumbsUp className="w-3.5 h-3.5 text-blue-600" />
                  <span>Upvote ({idea.votes_count})</span>
                </button>

                <span className="text-[11px] text-slate-400">
                  {new Date(idea.created_at).toLocaleDateString()}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pitch Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <Card className="w-full max-w-md bg-white shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Pitch Innovation Idea</h3>
                  <p className="text-xs text-slate-500">Submit proposal for department mentoring</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddIdea} className="space-y-4">
              <Input
                label="Proposal Title"
                required
                placeholder="e.g. Autonomous Campus Navigation System"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Domain</label>
                <select
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                >
                  <option value="Artificial Intelligence">Artificial Intelligence</option>
                  <option value="Internet of Things (IoT)">Internet of Things (IoT)</option>
                  <option value="Cloud & Distributed Systems">Cloud & Distributed Systems</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                  <option value="HealthTech / MedTech">HealthTech / MedTech</option>
                  <option value="FinTech">FinTech</option>
                  <option value="EdTech">EdTech</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description & Architecture</label>
                <textarea
                  rows={3}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Outline the problem statement, proposed solution, key novel innovation, and expected impact..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <Input
                label="Target Tech Stack (Comma-separated)"
                placeholder="e.g. Python, ROS, YOLOv8, Raspberry Pi"
                value={techStackInput}
                onChange={(e) => setTechStackInput(e.target.value)}
              />

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
                  disabled={!title.trim()}
                >
                  Submit Pitch
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
