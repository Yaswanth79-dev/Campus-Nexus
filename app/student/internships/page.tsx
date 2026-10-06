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
  Briefcase,
  Plus,
  Building2,
  Calendar,
  DollarSign,
  ExternalLink,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

type Internship = Tables<'student_internships'>;

const STATUSES = ['Applied', 'Interview', 'Offered', 'Active', 'Completed', 'Rejected'] as const;
const TYPES = ['Summer', 'Winter', 'Full-Semester', 'Virtual', 'Part-Time'] as const;

export default function StudentInternshipsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [internships, setInternships] = useState<Internship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Form State
  const [companyName, setCompanyName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [internshipType, setInternshipType] = useState<string>(TYPES[0]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<'Applied' | 'Interview' | 'Offered' | 'Active' | 'Completed' | 'Rejected'>('Applied');
  const [stipend, setStipend] = useState('');
  const [certificateUrl, setCertificateUrl] = useState('');
  const [description, setDescription] = useState('');

  const fetchInternships = useCallback(async () => {
    if (!user) return;
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('student_internships')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInternships(data || []);
    } catch (err: any) {
      console.error('Error fetching internships:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInternships();
  }, [fetchInternships]);

  const handleAddInternship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !companyName.trim() || !roleTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await (supabase.from('student_internships') as any).insert({
        student_id: user.id,
        company_name: companyName.trim(),
        role_title: roleTitle.trim(),
        internship_type: internshipType,
        start_date: startDate || null,
        end_date: endDate || null,
        status,
        stipend: stipend.trim() || null,
        certificate_url: certificateUrl.trim() || null,
        description: description.trim() || null,
      });

      if (error) throw error;

      toast({
        type: 'success',
        title: 'Internship Logged',
        message: `${roleTitle} at ${companyName} has been recorded.`,
      });

      setCompanyName('');
      setRoleTitle('');
      setStartDate('');
      setEndDate('');
      setStipend('');
      setCertificateUrl('');
      setDescription('');
      setStatus('Applied');
      setIsModalOpen(false);

      await fetchInternships();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Failed to record',
        message: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, company: string) => {
    if (!confirm(`Delete internship at ${company}?`)) return;

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from('student_internships').delete().eq('id', id);
      if (error) throw error;

      toast({
        type: 'success',
        title: 'Internship Deleted',
        message: `Record removed.`,
      });
      setInternships((prev) => prev.filter((i) => i.id !== id));
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message,
      });
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'Completed':
      case 'Offered':
        return <Badge variant="success" size="sm" dot>{st}</Badge>;
      case 'Active':
      case 'Interview':
        return <Badge variant="blue" size="sm" dot>{st}</Badge>;
      case 'Rejected':
        return <Badge variant="danger" size="sm">{st}</Badge>;
      default:
        return <Badge variant="warning" size="sm">{st}</Badge>;
    }
  };

  const filteredInternships = internships.filter(
    (i) => statusFilter === 'All' || i.status === statusFilter
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Internships & Placement Pipeline"
        description="Track industry internships, summer training, active technical interviews, and placement offers."
        breadcrumbs={[
          { label: 'Student Portal', href: '/student/dashboard' },
          { label: 'Internships' },
        ]}
        actions={
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Log Internship / Drive
          </Button>
        }
      />

      {/* Summary Pipeline Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Applied</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{internships.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Companies tracked</div>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> In Interview
          </div>
          <div className="text-2xl font-black text-blue-900 mt-1">
            {internships.filter((i) => i.status === 'Interview').length}
          </div>
          <div className="text-[11px] text-blue-600 mt-0.5">Active interview rounds</div>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Offers / Active
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-1">
            {internships.filter((i) => i.status === 'Offered' || i.status === 'Active' || i.status === 'Completed').length}
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Secured roles</div>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Conversion Rate
          </div>
          <div className="text-2xl font-black text-purple-900 mt-1">
            {internships.length > 0
              ? `${Math.round(
                  (internships.filter((i) => i.status === 'Offered' || i.status === 'Active' || i.status === 'Completed').length /
                    internships.length) *
                    100
                )}%`
              : '0%'}
          </div>
          <div className="text-[11px] text-purple-600 mt-0.5">Application to offer</div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {['All', 'Applied', 'Interview', 'Offered', 'Active', 'Completed', 'Rejected'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
              statusFilter === st
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {st} ({st === 'All' ? internships.length : internships.filter((i) => i.status === st).length})
          </button>
        ))}
      </div>

      {/* Internships List */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="lg" message="Loading internships pipeline..." />
        </div>
      ) : filteredInternships.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="w-10 h-10 text-blue-500" />}
          title="No Internships in Pipeline"
          description="Log your applications for summer internships, research labs, or campus recruitment drives."
          actionLabel="Log Your First Application"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredInternships.map((item) => (
            <Card
              key={item.id}
              className="bg-white border-slate-200 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-snug">{item.role_title}</h3>
                    <p className="text-sm font-semibold text-slate-700 mt-0.5 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-slate-400" /> {item.company_name}
                    </p>
                  </div>
                  {getStatusBadge(item.status)}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <span className="font-semibold text-slate-700">Type:</span> {item.internship_type || 'Summer'}
                  </div>
                  {item.stipend && (
                    <div>
                      <span className="font-semibold text-slate-700">Stipend:</span> {item.stipend}
                    </div>
                  )}
                  {item.start_date && (
                    <div className="col-span-2 flex items-center gap-1 text-[11px] text-slate-400 pt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(item.start_date).toLocaleDateString()} {item.end_date ? `— ${new Date(item.end_date).toLocaleDateString()}` : ''}</span>
                    </div>
                  )}
                </div>

                {item.description && (
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {item.description}
                  </p>
                )}
              </div>

              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                {item.certificate_url ? (
                  <a
                    href={item.certificate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Offer / Certificate
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">No doc attached</span>
                )}

                <button
                  onClick={() => handleDelete(item.id, item.company_name)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete Record"
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
          <Card className="w-full max-w-md bg-white shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Log Internship / Drive</h3>
                  <p className="text-xs text-slate-500">Track application status and offers</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddInternship} className="space-y-4">
              <Input
                label="Company Name"
                required
                placeholder="e.g. Microsoft, TCS Research, Google, Infosys"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                autoFocus
              />

              <Input
                label="Role Title"
                required
                placeholder="e.g. Software Engineering Intern"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Internship Type</label>
                  <select
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={internshipType}
                    onChange={(e) => setInternshipType(e.target.value)}
                  >
                    {TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Current Status</label>
                  <select
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Input
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <Input
                label="Stipend (Optional)"
                placeholder="e.g. ₹45,000 / month"
                value={stipend}
                onChange={(e) => setStipend(e.target.value)}
              />

              <Input
                label="Offer Letter / Certificate Link (Optional)"
                placeholder="https://drive.google.com/..."
                value={certificateUrl}
                onChange={(e) => setCertificateUrl(e.target.value)}
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
                  disabled={!companyName.trim() || !roleTitle.trim()}
                >
                  Save Record
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
