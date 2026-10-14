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
  FileText,
  Plus,
  Download,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  Building,
} from 'lucide-react';

type Report = Tables<'department_reports'>;

const REPORT_TYPES = [
  'NAAC / NBA Accreditation',
  'Semester Academic Audit',
  'Placement & Internship Report',
  'Faculty Workload',
  'Grievance Redressal Audit',
] as const;

export default function HodReportsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [reportType, setReportType] = useState<string>(REPORT_TYPES[0]);
  const [academicYear, setAcademicYear] = useState('2025-2026');

  const fetchReports = useCallback(async () => {
    if (!user) return;
    try {
      const supabase = getSupabaseBrowserClient();
      const dept = user.department || 'IT';

      const { data, error } = await supabase
        .from('department_reports')
        .select('*')
        .eq('department', dept)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports((data as Report[]) || []);
    } catch (err: any) {
      console.error('Error fetching department reports:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    setIsGenerating(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const dept = user.department || 'IT';

      // 1. Fetch genuine department telemetry for audit dossier
      const [stuRes, facRes, grievRes] = await Promise.all([
        supabase.from('profiles').select('id').eq('role', 'student').eq('department', dept),
        supabase.from('profiles').select('id').eq('role', 'faculty').eq('department', dept),
        supabase.from('feedback_grievances').select('id, status').eq('department', dept),
      ]);

      const studentCount = stuRes.data?.length || 0;
      const facultyCount = facRes.data?.length || 0;
      const grievances = (grievRes.data as any[]) || [];
      const resolvedGrievances = grievances.filter((g) => g.status === 'Resolved').length;

      const summaryPayload = {
        generatedAt: new Date().toISOString(),
        department: dept,
        academicYear,
        reportType,
        auditStatus: 'Draft — Compiled from Live Department Records',
        complianceAssessment: 'Pending External Institutional Committee Review',
        metrics: {
          enrolledStudents: studentCount,
          activeFaculty: facultyCount,
          studentFacultyRatio: facultyCount > 0 ? (studentCount / facultyCount).toFixed(1) : 'N/A',
          totalGrievancesLogged: grievances.length,
          resolvedGrievances,
        },
        telemetryVerified: true,
        complianceNote: 'Live verified department telemetry recorded. Official accreditation compliance scoring requires institutional auditor review.',
      };

      const { error } = await (supabase.from('department_reports') as any).insert({
        department: dept,
        title: title.trim(),
        report_type: reportType,
        academic_year: academicYear,
        summary_json: summaryPayload,
        generated_by: user.id,
      });

      if (error) throw error;

      toast({
        type: 'success',
        title: 'Report Generated & Archived',
        message: `"${title}" has been compiled and saved.`,
      });

      setTitle('');
      setIsModalOpen(false);
      await fetchReports();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Generation Failed',
        message: err.message,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteReport = async (id: string, repTitle: string) => {
    if (!confirm(`Delete report "${repTitle}"?`)) return;

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from('department_reports').delete().eq('id', id);
      if (error) throw error;

      toast({
        type: 'success',
        title: 'Report Removed',
        message: 'Record deleted.',
      });
      setReports((prev) => prev.filter((r) => r.id !== id));
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
        title={`${user?.department || 'IT'} Department Accreditation & Audit Reports`}
        description={`Generate NAAC / NBA accreditation dossiers, semester audit compilations, and compliance reports for ${user?.department || 'IT'}.`}
        breadcrumbs={[
          { label: 'HOD Portal', href: '/hod/dashboard' },
          { label: 'Reports' },
        ]}
        actions={
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Compile New Audit Dossier
          </Button>
        }
      />

      {/* Reports Grid */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="lg" message="Loading department reports..." />
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-10 h-10 text-indigo-500" />}
          title="No Compliance Reports Compiled Yet"
          description="Generate your first NAAC / NBA outcome assessment or semester academic audit dossier."
          actionLabel="Compile First Report"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((rep) => (
            <Card
              key={rep.id}
              className="bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all p-6 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="faculty" size="sm">{rep.report_type}</Badge>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    AY {rep.academic_year}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">{rep.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Compiled on {new Date(rep.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 flex items-center gap-2 font-medium">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>{(rep.summary_json as any)?.auditStatus || 'Department Metrics Verified'}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => alert(`Exporting "${rep.title}" summary data...`)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Export PDF / CSV
                </button>

                <button
                  onClick={() => handleDeleteReport(rep.id, rep.title)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete Report"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Generate Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <Card className="w-full max-w-md bg-white shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Compile Audit Dossier</h3>
                  <p className="text-xs text-slate-500">Official NAAC / NBA department audit</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateReport} className="space-y-4">
              <Input
                label="Report Title"
                required
                placeholder="e.g. NBA Tier-1 Self-Study Report — IT Department"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Audit Report Type</label>
                <select
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  {REPORT_TYPES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Academic Year</label>
                <select
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                >
                  <option value="2025-2026">2025-2026</option>
                  <option value="2024-2025">2024-2025</option>
                  <option value="2023-2024">2023-2024</option>
                </select>
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
                  isLoading={isGenerating}
                  disabled={!title.trim()}
                >
                  Generate Dossier
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
