'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Tables } from '@/types/database';
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
      {/* Premium Editorial Hero */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-4 pb-8 mb-4 border-b border-slate-200/60">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1 block">Student Portal • Achievements</span>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Student Achievements & Honors
          </h1>
          <p className="text-base text-slate-500 mt-2 max-w-2xl leading-relaxed">
            Record your hackathon victories, coding competitions, research publications, and department awards.
          </p>
        </div>
        <div className="w-full md:w-auto">
          <Button variant="primary" size="md" className="w-full bg-slate-900 hover:bg-slate-800 text-white" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Log Achievement
          </Button>
        </div>
      </div>

      {/* KPI Typographic Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 py-6 mb-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1.5">Total Honors</span>
          <div className="text-4xl font-black text-slate-900 tracking-tighter">{achievements.length}</div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">Logged achievements</div>
        </div>

        <div className="sm:border-l border-slate-200/60 sm:pl-8">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1.5 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-500" /> Hackathons & Wins
          </span>
          <div className="text-4xl font-black text-amber-600 tracking-tighter">
            {achievements.filter((a) => a.category === 'Hackathon' || a.category === 'Competition').length}
          </div>
          <div className="text-[11px] text-amber-600 font-bold mt-1">Competitive wins</div>
        </div>

        <div className="sm:border-l border-slate-200/60 sm:pl-8">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1.5 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-purple-500" /> Publications
          </span>
          <div className="text-4xl font-black text-purple-600 tracking-tighter">
            {achievements.filter((a) => a.category === 'Publication').length}
          </div>
          <div className="text-[11px] text-purple-600 font-bold mt-1">Academic papers</div>
        </div>
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
            <div
              key={ach.id}
              className="bg-white rounded-[24px] border border-slate-200/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)] flex flex-col justify-between overflow-hidden hover:border-slate-300 transition-all"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 shrink-0">
                    <Medal className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">{ach.category}</span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-snug tracking-tight">{ach.title}</h3>
                  {ach.achievement_date && (
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(ach.achievement_date).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {ach.description && (
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {ach.description}
                  </p>
                )}
              </div>

              <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                {ach.proof_url ? (
                  <a
                    href={ach.proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" /> Proof Link
                  </a>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">No proof link</span>
                )}

                <button
                  onClick={() => handleDelete(ach.id, ach.title)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  title="Delete Achievement"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-[24px] shadow-2xl p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">Log Achievement</h3>
                <p className="text-xs text-slate-500 mt-1">Record a win, award, or publication</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAchievement} className="space-y-5">
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
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Category</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-colors"
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
                <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Description</label>
                <textarea
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-colors"
                  placeholder="Details of the award, team contribution, or prize..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <Input
                label="Proof Document URL / Link"
                placeholder="https://drive.google.com/..."
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
              />

              <div className="pt-4 flex gap-3">
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
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
                  isLoading={isSubmitting}
                  disabled={!title.trim()}
                >
                  Save Honor
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
