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
  Award,
  Plus,
  Trophy,
  ExternalLink,
  Trash2,
  Calendar,
  Sparkles,
  BookOpen,
  Medal,
} from 'lucide-react';

type Achievement = Tables<'student_achievements'>;

const CATEGORIES = ['Hackathon', 'Competition', 'Award', 'Workshop', 'Publication', 'Other'] as const;

export default function StudentAchievementsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [achievementDate, setAchievementDate] = useState('');
  const [description, setDescription] = useState('');
  const [proofUrl, setProofUrl] = useState('');

  const fetchAchievements = useCallback(async () => {
    if (!user) return;
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('student_achievements')
        .select('*')
        .eq('student_id', user.id)
        .order('achievement_date', { ascending: false });

      if (error) throw error;
      setAchievements(data || []);
    } catch (err: any) {
      console.error('Error fetching achievements:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const handleAddAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    setIsSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await (supabase.from('student_achievements') as any).insert({
        student_id: user.id,
        title: title.trim(),
        category,
        achievement_date: achievementDate || null,
        description: description.trim() || null,
        proof_url: proofUrl.trim() || null,
      });

      if (error) throw error;

      toast({
        type: 'success',
        title: 'Achievement Logged',
        message: `"${title}" has been recorded.`,
      });

      setTitle('');
      setCategory(CATEGORIES[0]);
      setAchievementDate('');
      setDescription('');
      setProofUrl('');
      setIsModalOpen(false);

      await fetchAchievements();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Save Failed',
        message: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, achTitle: string) => {
    if (!confirm(`Delete achievement "${achTitle}"?`)) return;

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from('student_achievements').delete().eq('id', id);
      if (error) throw error;

      toast({
        type: 'success',
        title: 'Achievement Deleted',
        message: `"${achTitle}" was deleted.`,
      });
      setAchievements((prev) => prev.filter((a) => a.id !== id));
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
        title="Student Achievements & Honors"
        description="Record your hackathon victories, coding competitions, research publications, and department awards."
        breadcrumbs={[
          { label: 'Student Portal', href: '/student/dashboard' },
          { label: 'Achievements' },
        ]}
        actions={
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Log Achievement
          </Button>
        }
      />

      {/* Summary Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Honors</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{achievements.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Logged achievements</div>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-500" /> Hackathons & Wins
          </div>
          <div className="text-2xl font-black text-amber-900 mt-1">
            {achievements.filter((a) => a.category === 'Hackathon' || a.category === 'Competition').length}
          </div>
          <div className="text-[11px] text-amber-600 mt-0.5">Competitive wins</div>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-purple-500" /> Publications & Research
          </div>
          <div className="text-2xl font-black text-purple-900 mt-1">
            {achievements.filter((a) => a.category === 'Publication').length}
          </div>
          <div className="text-[11px] text-purple-600 mt-0.5">Academic papers</div>
        </Card>
      </div>

      {/* Achievements List */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="lg" message="Loading achievements..." />
        </div>
      ) : achievements.length === 0 ? (
        <EmptyState
          icon={<Trophy className="w-10 h-10 text-amber-500" />}
          title="No Achievements Logged Yet"
          description="Have you won a hackathon, published a paper, or participated in an innovation contest? Add it here."
          actionLabel="Log Your First Achievement"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map((ach) => (
            <Card
              key={ach.id}
              className="bg-white border-slate-200 hover:border-amber-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="p-6 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 shrink-0">
                    <Medal className="w-6 h-6" />
                  </div>
                  <Badge variant="warning" size="sm">{ach.category}</Badge>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">{ach.title}</h3>
                  {ach.achievement_date && (
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(ach.achievement_date).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {ach.description && (
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {ach.description}
                  </p>
                )}
              </div>

              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                {ach.proof_url ? (
                  <a
                    href={ach.proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Proof Link
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">No proof link</span>
                )}

                <button
                  onClick={() => handleDelete(ach.id, ach.title)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete Achievement"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <Card className="w-full max-w-md bg-white shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Log Achievement</h3>
                  <p className="text-xs text-slate-500">Record a win, award, or publication</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAchievement} className="space-y-4">
              <Input
                label="Achievement Title"
                required
                placeholder="e.g. 1st Place — National Smart India Hackathon"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Category</label>
                  <select
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Date"
                  type="date"
                  value={achievementDate}
                  onChange={(e) => setAchievementDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description (Optional)</label>
                <textarea
                  rows={2}
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Details of the award, team contribution, or prize..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <Input
                label="Proof Document URL / News Article Link"
                placeholder="https://drive.google.com/... or article URL"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
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
                  Save Honor
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
