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
  Megaphone,
  Plus,
  Pin,
  Trash2,
  Calendar,
  Building,
} from 'lucide-react';

type Announcement = Tables<'department_announcements'>;

export default function FacultyAnnouncementsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    if (!user) return;
    try {
      const supabase = getSupabaseBrowserClient();
      const dept = user.department || 'IT';

      const { data, error } = await supabase
        .from('department_announcements')
        .select('*')
        .eq('department', dept)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements((data as Announcement[]) || []);
    } catch (err: any) {
      console.error('Error fetching announcements:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await (supabase.from('department_announcements') as any).insert({
        department: user.department || 'IT',
        title: title.trim(),
        content: content.trim(),
        author_id: user.id,
        target_roles: ['student', 'faculty'],
        is_pinned: isPinned,
      });

      if (error) throw error;

      toast({
        type: 'success',
        title: 'Announcement Published',
        message: `"${title}" has been broadcast to ${user.department || 'IT'} department students.`,
      });

      setTitle('');
      setContent('');
      setIsPinned(false);
      setIsModalOpen(false);

      await fetchAnnouncements();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Publish Failed',
        message: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, annTitle: string) => {
    if (!confirm(`Delete announcement "${annTitle}"?`)) return;

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from('department_announcements').delete().eq('id', id);
      if (error) throw error;

      toast({
        type: 'success',
        title: 'Announcement Deleted',
        message: `Removed notice.`,
      });
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
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
        title={`${user?.department || 'IT'} Department Announcements`}
        description={`Broadcast official exam schedules, guest lecture alerts, and project deadlines to ${user?.department || 'IT'} students.`}
        breadcrumbs={[
          { label: 'Faculty Portal', href: '/faculty/dashboard' },
          { label: 'Announcements' },
        ]}
        actions={
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Broadcast Announcement
          </Button>
        }
      />

      {/* Announcements List */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="lg" message="Loading department notices..." />
        </div>
      ) : announcements.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="w-10 h-10 text-indigo-500" />}
          title="No Announcements Active"
          description="Broadcast project milestone deadlines, lab instructions, or guest lecture schedules to department students."
          actionLabel="Post First Notice"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <Card
              key={ann.id}
              className={`p-6 transition-all space-y-3 ${
                ann.is_pinned
                  ? 'border-indigo-300 bg-linear-to-r from-indigo-50/40 to-white shadow-xs'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {ann.is_pinned && (
                    <Badge variant="faculty" size="sm">
                      <Pin className="w-3 h-3 mr-1 text-indigo-600" /> Pinned
                    </Badge>
                  )}
                  <Badge variant="student" size="sm">{ann.department}</Badge>
                  <span className="text-xs text-slate-400">
                    Posted on {new Date(ann.created_at).toLocaleDateString()}
                  </span>
                </div>

                <button
                  onClick={() => handleDelete(ann.id, ann.title)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete Notice"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">{ann.title}</h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
                  {ann.content}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Post Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <Card className="w-full max-w-lg bg-white shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Broadcast Department Notice</h3>
                  <p className="text-xs text-slate-500">Post announcement to {user?.department || 'IT'} students</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePost} className="space-y-4">
              <Input
                label="Announcement Headline"
                required
                placeholder="e.g. Mandatory Capstone Progress Review — Phase 2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Announcement Content</label>
                <textarea
                  rows={4}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Detail instructions, dates, requirements, submission rubrics..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="pinCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Pin to Top of Department Feed
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
                  disabled={!title.trim() || !content.trim()}
                >
                  Publish Announcement
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
