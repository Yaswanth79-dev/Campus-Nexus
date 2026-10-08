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
      {/* Premium Editorial Hero */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-4 pb-8 mb-4 border-b border-slate-200/60">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1 block">Student Portal • Internships</span>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Internships & Placement Pipeline
          </h1>
          <p className="text-base text-slate-500 mt-2 max-w-2xl leading-relaxed">
            Track industry internships, summer training, active technical interviews, and placement offers.
          </p>
        </div>
        <div className="w-full md:w-auto">
          <Button variant="primary" size="md" className="w-full" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Log Application
          </Button>
        </div>
      </div>

      {/* KPI Typographic Blocks */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 py-6 mb-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1.5">Total Applied</span>
          <div className="text-4xl font-black text-slate-900 tracking-tighter">{internships.length}</div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">Companies tracked</div>
        </div>

        <div className="lg:border-l border-slate-200/60 lg:pl-8">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1.5">In Interview</span>
          <div className="text-4xl font-black text-blue-600 tracking-tighter">
            {internships.filter((i) => i.status === 'Interview').length}
          </div>
          <div className="text-[11px] text-blue-600 font-bold mt-1">Active interview rounds</div>
        </div>

        <div className="lg:border-l border-slate-200/60 lg:pl-8">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1.5">Offers & Active</span>
          <div className="text-4xl font-black text-emerald-600 tracking-tighter">
            {internships.filter((i) => i.status === 'Offered' || i.status === 'Active' || i.status === 'Completed').length}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1">Secured roles</div>
        </div>

        <div className="lg:border-l border-slate-200/60 lg:pl-8">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1.5">Conversion Rate</span>
          <div className="text-4xl font-black text-purple-600 tracking-tighter">
            {internships.length > 0
              ? `${Math.round(
                  (internships.filter((i) => i.status === 'Offered' || i.status === 'Active' || i.status === 'Completed').length /
                    internships.length) *
                    100
                )}%`
              : '0%'}
          </div>
          <div className="text-[11px] text-purple-600 font-bold mt-1">Application to offer</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-2">
        {['All', 'Applied', 'Interview', 'Offered', 'Active', 'Completed', 'Rejected'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === st
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {st} <span className="opacity-60 ml-1">({st === 'All' ? internships.length : internships.filter((i) => i.status === st).length})</span>
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
            <div
              key={item.id}
              className="bg-white rounded-[24px] border border-slate-200/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)] flex flex-col justify-between overflow-hidden hover:border-slate-300 transition-all"
            >
              <div className="p-6 sm:p-8 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight leading-snug">{item.role_title}</h3>
                    <p className="text-sm font-bold text-slate-600 mt-1 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> {item.company_name}
                    </p>
                  </div>
                  {getStatusBadge(item.status)}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 bg-slate-50/50 p-4 rounded-[16px] border border-slate-100">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</span>
                    <span className="font-semibold text-slate-800">{item.internship_type || 'Summer'}</span>
                  </div>
                  {item.stipend && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stipend</span>
                      <span className="font-semibold text-slate-800">{item.stipend}</span>
                    </div>
                  )}
                  {item.start_date && (
                    <div className="col-span-2 flex flex-col gap-1 pt-2 border-t border-slate-100/60">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Timeline</span>
                      <span className="font-semibold text-slate-800">
                        {new Date(item.start_date).toLocaleDateString()} {item.end_date ? `— ${new Date(item.end_date).toLocaleDateString()}` : ''}
                      </span>
                    </div>
                  )}
                </div>

                {item.description && (
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>

              <div className="px-6 sm:px-8 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                {item.certificate_url ? (
                  <a
                    href={item.certificate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" /> Offer / Docs
                  </a>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">No doc attached</span>
                )}

                <button
                  onClick={() => handleDelete(item.id, item.company_name)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  title="Delete Record"
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
                <h3 className="text-xl font-black text-slate-900">Log Application</h3>
                <p className="text-xs text-slate-500 mt-1">Track application status and offers</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddInternship} className="space-y-5">
              <Input
                label="Company Name"
                required
                placeholder="e.g. Microsoft, TCS"
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
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Type</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-colors"
                    value={internshipType}
                    onChange={(e) => setInternshipType(e.target.value)}
                  >
                    {TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Status</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-colors"
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
                label="Offer Link (Optional)"
                placeholder="https://drive.google.com/..."
                value={certificateUrl}
                onChange={(e) => setCertificateUrl(e.target.value)}
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
                  disabled={!companyName.trim() || !roleTitle.trim()}
                >
                  Save Record
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
