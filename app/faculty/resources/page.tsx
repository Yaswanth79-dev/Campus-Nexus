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
  BookOpen,
  Plus,
  Download,
  Trash2,
  FileText,
  Building,
} from 'lucide-react';

type Resource = Tables<'department_resources'>;

const CATEGORIES = ['Syllabus', 'Lecture Notes', 'Lab Manual', 'Reference Book', 'E-Learning', 'Past Papers'] as const;

export default function FacultyResourcesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [subject, setSubject] = useState('');
  const [semester, setSemester] = useState<number>(6);
  const [fileUrl, setFileUrl] = useState('');
  const [description, setDescription] = useState('');

  const fetchResources = useCallback(async () => {
    if (!user) return;
    try {
      const supabase = getSupabaseBrowserClient();
      const dept = user.department || 'IT';

      const { data, error } = await supabase
        .from('department_resources')
        .select('*')
        .eq('department', dept)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResources((data as Resource[]) || []);
    } catch (err: any) {
      console.error('Error fetching department resources:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !fileUrl.trim()) return;

    setIsSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await (supabase.from('department_resources') as any).insert({
        department: user.department || 'IT',
        title: title.trim(),
        category,
        subject: subject.trim() || null,
        semester: Number(semester),
        file_url: fileUrl.trim(),
        description: description.trim() || null,
        uploaded_by: user.id,
      });

      if (error) throw error;

      toast({
        type: 'success',
        title: 'Resource Published',
        message: `"${title}" is now available to ${user.department || 'IT'} students.`,
      });

      setTitle('');
      setSubject('');
      setFileUrl('');
      setDescription('');
      setIsModalOpen(false);

      await fetchResources();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Upload Failed',
        message: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, resTitle: string) => {
    if (!confirm(`Delete "${resTitle}"?`)) return;

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from('department_resources').delete().eq('id', id);
      if (error) throw error;

      toast({
        type: 'success',
        title: 'Resource Removed',
        message: `File deleted.`,
      });
      setResources((prev) => prev.filter((r) => r.id !== id));
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
        title={`${user?.department || 'IT'} Academic & Course Resources`}
        description={`Upload and manage curriculum syllabi, lecture notes, lab manuals, and exam materials for ${user?.department || 'IT'} students.`}
        breadcrumbs={[
          { label: 'Faculty Portal', href: '/faculty/dashboard' },
          { label: 'Resources' },
        ]}
        actions={
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Upload Resource
          </Button>
        }
      />

      {/* Resources List */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="lg" message="Loading department resources..." />
        </div>
      ) : resources.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-10 h-10 text-indigo-500" />}
          title="No Academic Resources Uploaded"
          description="Upload your lecture notes, lab assignments, or reference materials for department students."
          actionLabel="Upload First Resource"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((res) => (
            <Card
              key={res.id}
              className="bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="blue" size="sm">{res.category}</Badge>
                  {res.semester && (
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      Sem {res.semester}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base leading-tight">{res.title}</h3>
                  {res.subject && (
                    <p className="text-xs font-semibold text-slate-600 mt-1">Subject: {res.subject}</p>
                  )}
                </div>

                {res.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {res.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <a
                  href={res.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> View File
                </a>

                <button
                  onClick={() => handleDelete(res.id, res.title)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete Resource"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <Card className="w-full max-w-md bg-white shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Upload Academic Material</h3>
                  <p className="text-xs text-slate-500">Publish resources for {user?.department || 'IT'} students</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddResource} className="space-y-4">
              <Input
                label="Resource Title"
                required
                placeholder="e.g. Unit 3 — Distributed System Consensus Protocols"
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

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Semester</label>
                  <select
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={semester}
                    onChange={(e) => setSemester(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Input
                label="Subject Name"
                placeholder="e.g. Distributed Computing (CS601)"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />

              <Input
                label="File / Drive URL"
                required
                placeholder="https://drive.google.com/..."
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description (Optional)</label>
                <textarea
                  rows={2}
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Summary of contents, chapters covered..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
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
                  disabled={!title.trim() || !fileUrl.trim()}
                >
                  Publish Resource
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
