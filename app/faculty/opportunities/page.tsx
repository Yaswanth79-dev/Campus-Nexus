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
  Sparkles,
  Plus,
  Building,
  Calendar,
  ExternalLink,
  Trash2,
  Clock,
} from 'lucide-react';

type Opportunity = Tables<'opportunities'>;

const TYPES = ['Internship', 'Hackathon', 'Research', 'Scholarship', 'Workshop', 'Competition', 'Job'] as const;

export default function FacultyOpportunitiesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState<string>(TYPES[0]);
  const [companyOrOrg, setCompanyOrOrg] = useState('');
  const [description, setDescription] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [deadline, setDeadline] = useState('');

  const fetchOpportunities = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const dept = user?.department || 'IT';

      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .or(`department.eq.${dept},department.is.null`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOpportunities((data as Opportunity[]) || []);
    } catch (err: any) {
      console.error('Error fetching opportunities:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const handlePostOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !companyOrOrg.trim()) return;

    setIsSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await (supabase.from('opportunities') as any).insert({
        department: user.department || 'IT',
        title: title.trim(),
        type,
        company_or_org: companyOrOrg.trim(),
        description: description.trim(),
        link_url: linkUrl.trim() || null,
        deadline: deadline || null,
        posted_by: user.id,
        is_active: true,
      });

      if (error) throw error;

      toast({
        type: 'success',
        title: 'Opportunity Broadcasted',
        message: `"${title}" has been published to department students.`,
      });

      setTitle('');
      setCompanyOrOrg('');
      setDescription('');
      setLinkUrl('');
      setDeadline('');
      setIsModalOpen(false);

      await fetchOpportunities();
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

  const handleDelete = async (id: string, opTitle: string) => {
    if (!confirm(`Delete "${opTitle}"?`)) return;

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from('opportunities').delete().eq('id', id);
      if (error) throw error;

      toast({
        type: 'success',
        title: 'Opportunity Deleted',
        message: `Removed drive post.`,
      });
      setOpportunities((prev) => prev.filter((o) => o.id !== id));
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
        title="Student Opportunities & Placement Drives"
        description="Post industry internship drives, research fellowship openings, and hackathon registrations for department students."
        breadcrumbs={[
          { label: 'Faculty Portal', href: '/faculty/dashboard' },
          { label: 'Opportunities' },
        ]}
        actions={
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Post Opportunity
          </Button>
        }
      />

      {/* Opportunities List */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="lg" message="Loading department opportunities..." />
        </div>
      ) : opportunities.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="w-10 h-10 text-amber-500" />}
          title="No Opportunities Posted"
          description="Broadcast internship openings, competitive hackathons, or research assistant roles to department students."
          actionLabel="Post First Drive"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map((op) => (
            <Card
              key={op.id}
              className="bg-white border-slate-200 hover:border-amber-300 hover:shadow-md transition-all p-6 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="warning" size="sm">{op.type}</Badge>
                  {op.deadline && (
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Due {new Date(op.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">{op.title}</h3>
                  <p className="text-xs font-semibold text-slate-600 mt-1 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" /> {op.company_or_org}
                  </p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {op.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                {op.link_url ? (
                  <a
                    href={op.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    View Application <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">Direct application</span>
                )}

                <button
                  onClick={() => handleDelete(op.id, op.title)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete Opportunity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
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
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Post Student Opportunity</h3>
                  <p className="text-xs text-slate-500">Publish internship or hackathon drive</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePostOpportunity} className="space-y-4">
              <Input
                label="Opportunity Title"
                required
                placeholder="e.g. Summer 2026 AI Research Fellowships"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Type</label>
                  <select
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    {TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>

              <Input
                label="Organization / Company"
                required
                placeholder="e.g. Microsoft Research / Indian Institute of Science"
                value={companyOrOrg}
                onChange={(e) => setCompanyOrOrg(e.target.value)}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description & Eligibility</label>
                <textarea
                  rows={3}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Outline stipend, qualifications, CGPA cutoff, and application steps..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <Input
                label="Registration / Application Link"
                placeholder="https://..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
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
                  disabled={!title.trim() || !companyOrOrg.trim()}
                >
                  Broadcast Drive
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
