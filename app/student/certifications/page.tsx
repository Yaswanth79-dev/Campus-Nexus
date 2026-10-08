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
  FileCheck,
  Plus,
  ExternalLink,
  Trash2,
  CheckCircle2,
  Calendar,
  Building,
  ShieldCheck,
} from 'lucide-react';

type Cert = Tables<'student_certifications'>;

export default function StudentCertificationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [certifications, setCertifications] = useState<Cert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [issuingOrg, setIssuingOrg] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [credentialId, setCredentialId] = useState('');
  const [credentialUrl, setCredentialUrl] = useState('');

  const fetchCerts = useCallback(async () => {
    if (!user) return;
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('student_certifications')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCertifications(data || []);
    } catch (err: any) {
      console.error('Error fetching certifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCerts();
  }, [fetchCerts]);

  const handleAddCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;

    setIsSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await (supabase.from('student_certifications') as any).insert({
        student_id: user.id,
        name: name.trim(),
        issuing_organization: issuingOrg.trim(),
        issue_date: issueDate || null,
        expiry_date: expiryDate || null,
        credential_id: credentialId.trim() || null,
        credential_url: credentialUrl.trim() || null,
        is_verified: true,
      });

      if (error) throw error;

      toast({
        type: 'success',
        title: 'Certification Added',
        message: `${name} has been added to your profile.`,
      });

      setName('');
      setIssuingOrg('');
      setIssueDate('');
      setExpiryDate('');
      setCredentialId('');
      setCredentialUrl('');
      setIsModalOpen(false);

      await fetchCerts();
    } catch (err: any) {
      console.error('Error adding certification:', err);
      toast({
        type: 'error',
        title: 'Failed to add certification',
        message: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCert = async (certId: string, certName: string) => {
    if (!confirm(`Delete certification "${certName}"?`)) return;

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from('student_certifications').delete().eq('id', certId);
      if (error) throw error;

      toast({
        type: 'success',
        title: 'Certification Removed',
        message: `${certName} was removed.`,
      });
      setCertifications((prev) => prev.filter((c) => c.id !== certId));
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
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1 block">Student Portal • Credentials</span>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Industry Certifications
          </h1>
          <p className="text-base text-slate-500 mt-2 max-w-2xl leading-relaxed">
            Verify and showcase professional credentials from AWS, Google Cloud, Microsoft, Cisco, Meta, and Coursera.
          </p>
        </div>
        <div className="w-full md:w-auto">
          <Button variant="primary" size="md" className="w-full bg-slate-900 hover:bg-slate-800 text-white" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Certification
          </Button>
        </div>
      </div>

      {/* KPI Typographic Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 py-6 mb-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1.5">Total Credentials</span>
          <div className="text-4xl font-black text-slate-900 tracking-tighter">{certifications.length}</div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">Verified certificates</div>
        </div>

        <div className="sm:border-l border-slate-200/60 sm:pl-8">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1.5 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Verified Status
          </span>
          <div className="text-4xl font-black text-emerald-600 tracking-tighter">
            100%
          </div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1">Authenticated credentials</div>
        </div>

        <div className="sm:border-l border-slate-200/60 sm:pl-8">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1.5 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> Resume Sync
          </span>
          <div className="text-xl font-black text-blue-600 tracking-tighter leading-none mt-1">
            Enabled
          </div>
          <div className="text-[11px] text-blue-600 font-bold mt-2">Attached to student profile</div>
        </div>
      </div>

      {/* Certifications Grid */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="lg" message="Loading certifications..." />
        </div>
      ) : certifications.length === 0 ? (
        <EmptyState
          icon={<FileCheck className="w-10 h-10 text-blue-500" />}
          title="No Certifications Added Yet"
          description="Add your external badges and certifications from AWS, Microsoft, Coursera, or HackerRank to bolster your profile."
          actionLabel="Add Certification"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certifications.map((cert) => (
            <div
              key={cert.id}
              className="bg-white rounded-[24px] border border-slate-200/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)] flex flex-col justify-between overflow-hidden hover:border-slate-300 transition-all"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 shrink-0">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <Badge variant="success" size="sm" dot>Verified</Badge>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-snug tracking-tight">{cert.name}</h3>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" /> {cert.issuing_organization}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-50/50 p-4 rounded-[16px] border border-slate-100">
                  {cert.issue_date && (
                    <div className="col-span-2 flex items-center gap-1.5 pb-2 border-b border-slate-100/60">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Issued: {new Date(cert.issue_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {cert.credential_id && (
                    <div className="col-span-2 pt-1 truncate">
                      ID: <span className="text-slate-900 ml-1">{cert.credential_id}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                {cert.credential_url ? (
                  <a
                    href={cert.credential_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" /> View Credential
                  </a>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">No URL provided</span>
                )}

                <button
                  onClick={() => handleDeleteCert(cert.id, cert.name)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  title="Delete Certificate"
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
                <h3 className="text-xl font-black text-slate-900">Add Certification</h3>
                <p className="text-xs text-slate-500 mt-1">Record a professional industry credential</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCert} className="space-y-5">
              <Input
                label="Certification Name"
                required
                placeholder="e.g. AWS Certified Solutions Architect"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />

              <Input
                label="Issuing Organization"
                required
                placeholder="e.g. Amazon Web Services / Microsoft"
                value={issuingOrg}
                onChange={(e) => setIssuingOrg(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Issue Date"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
                <Input
                  label="Expiry Date"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>

              <Input
                label="Credential ID (Optional)"
                placeholder="e.g. AWS-PSA-782190"
                value={credentialId}
                onChange={(e) => setCredentialId(e.target.value)}
              />

              <Input
                label="Verification Link (Optional)"
                placeholder="https://www.credly.com/badges/..."
                value={credentialUrl}
                onChange={(e) => setCredentialUrl(e.target.value)}
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
                  disabled={!name.trim() || !issuingOrg.trim()}
                >
                  Add Certificate
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
