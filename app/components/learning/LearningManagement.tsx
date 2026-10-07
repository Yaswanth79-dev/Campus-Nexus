'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Database } from '@/types/database';
import { useAuthContext } from '@/lib/auth/auth-context';
import { useToast } from '@/components/ui/toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, CheckCircle2, XCircle, Search, Settings2, ShieldCheck, X } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import Link from 'next/link';

type LearningModule = Database['public']['Tables']['learning_modules']['Row'];

export function LearningManagement() {
  const { user: profile } = useAuthContext();
  const { toast } = useToast();
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Partial<LearningModule> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchModules = useCallback(async () => {
    if (!profile) return;
    setIsLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('learning_modules')
        .select('*')
        .eq('department', profile.department)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setModules(data || []);
    } catch (err: any) {
      console.error('Error fetching modules:', err);
      toast({ type: 'error', title: 'Error', message: 'Failed to load modules' });
    } finally {
      setIsLoading(false);
    }
  }, [profile, toast]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModule?.title || !editingModule?.topic) return;

    setIsSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      if (editingModule.id) {
        const { error } = await (supabase as any)
          .from('learning_modules')
          .update({
            title: editingModule.title,
            category: editingModule.category || 'Quiz',
            topic: editingModule.topic,
            credits_reward: editingModule.credits_reward || 100,
            passing_score: editingModule.passing_score || 70,
            is_active: editingModule.is_active || false,
          })
          .eq('id', editingModule.id);
        if (error) throw error;
        toast({ type: 'success', title: 'Success', message: 'Module updated successfully.' });
      } else {
        const { error } = await (supabase as any)
          .from('learning_modules')
          .insert({
            title: editingModule.title,
            category: editingModule.category || 'Quiz',
            topic: editingModule.topic,
            credits_reward: editingModule.credits_reward || 100,
            passing_score: editingModule.passing_score || 70,
            is_active: editingModule.is_active || false,
            department: profile!.department,
          });
        if (error) throw error;
        toast({ type: 'success', title: 'Success', message: 'Module created successfully.' });
      }
      setIsModalOpen(false);
      fetchModules();
    } catch (err: any) {
      console.error('Error saving module:', err);
      toast({ type: 'error', title: 'Error', message: err.message || 'Failed to save module' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (mod: LearningModule) => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await (supabase as any)
        .from('learning_modules')
        .update({ is_active: !mod.is_active })
        .eq('id', mod.id);
      if (error) throw error;
      toast({ type: 'success', title: 'Success', message: `Module ${mod.is_active ? 'unpublished' : 'published'} successfully.` });
      fetchModules();
    } catch (err: any) {
      toast({ type: 'error', title: 'Error', message: 'Failed to toggle status' });
    }
  };

  if (isLoading) {
    return <div className="p-8 flex justify-center"><LoadingSpinner size="lg" /></div>;
  }

  const rolePrefix = profile?.role === 'hod' ? '/hod' : '/faculty';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Learning Content Management</h2>
          <p className="text-sm text-slate-500">Manage learning modules and quizzes for the {profile?.department} department.</p>
        </div>
        <Button onClick={() => { setEditingModule({}); setIsModalOpen(true); }} variant="primary" size="sm">
          <Plus className="w-4 h-4 mr-2" /> Create Module
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-900 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Title</th>
                <th className="px-6 py-4 whitespace-nowrap">Topic / Category</th>
                <th className="px-6 py-4 whitespace-nowrap">Passing Score</th>
                <th className="px-6 py-4 whitespace-nowrap">Status</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {modules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No learning modules found for this department.
                  </td>
                </tr>
              ) : (
                modules.map((mod) => (
                  <tr key={mod.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{mod.title}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span>{mod.topic}</span>
                        <span className="text-xs text-slate-400">{mod.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{mod.passing_score}%</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(mod)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                          mod.is_active 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {mod.is_active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {mod.is_active ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          onClick={() => { setEditingModule(mod); setIsModalOpen(true); }} 
                          variant="outline" 
                          size="sm"
                          className="h-8 px-2.5 text-xs"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit Info
                        </Button>
                        <Link href={`${rolePrefix}/learning/${mod.id}`}>
                          <Button 
                            variant="primary" 
                            size="sm"
                            className="h-8 px-2.5 text-xs"
                          >
                            <Settings2 className="w-3.5 h-3.5 mr-1.5" /> Manage Quiz
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => !isSubmitting && setIsModalOpen(false)}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">{editingModule?.id ? 'Edit Module' : 'Create Module'}</h3>
            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Title</label>
              <input
                type="text"
                required
                value={editingModule?.title || ''}
                onChange={e => setEditingModule(prev => ({ ...prev!, title: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. Advanced React Hooks"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Topic</label>
                <input
                  type="text"
                  required
                  value={editingModule?.topic || ''}
                  onChange={e => setEditingModule(prev => ({ ...prev!, topic: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. React"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={editingModule?.category || 'Quiz'}
                  onChange={e => setEditingModule(prev => ({ ...prev!, category: e.target.value as any }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Quiz">Quiz</option>
                  <option value="Programming">Programming</option>
                  <option value="Course">Course</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Credits Reward</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editingModule?.credits_reward || ''}
                  onChange={e => setEditingModule(prev => ({ ...prev!, credits_reward: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Passing Score (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={editingModule?.passing_score || ''}
                  onChange={e => setEditingModule(prev => ({ ...prev!, passing_score: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
            <div className="pt-4 border-t flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>Save Module</Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
