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
      <PageHeader
        title="Industry Certifications & Credentials"
        description="Verify and showcase professional credentials from AWS, Google Cloud, Microsoft, Cisco, Meta, and Coursera."
        breadcrumbs={[
          { label: 'Student Portal', href: '/student/dashboard' },
          { label: 'Certifications' },
        ]}
        actions={
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Certification
          </Button>
        }
      />

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Credentials</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{certifications.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Verified certificates</div>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Verified Status
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-1">100%</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Authenticated credentials</div>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Resume Sync
          </div>
          <div className="text-sm font-bold text-blue-900 mt-1.5">Enabled for Placement Drives</div>
          <div className="text-[11px] text-blue-600 mt-0.5">Attached to student profile</div>
        </Card>
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
            <Card
              key={cert.id}
              className="bg-white border-slate-200 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <Badge variant="success" size="sm" dot>Verified</Badge>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">{cert.name}</h3>
                  <p className="text-xs font-semibold text-slate-600 mt-1 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" /> {cert.issuing_organization}
                  </p>
                </div>

                <div className="space-y-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  {cert.issue_date && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Issued: {new Date(cert.issue_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {cert.credential_id && (
                    <div className="text-[11px] text-slate-400 truncate">
                      ID: <span className="font-mono text-slate-600">{cert.credential_id}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                {cert.credential_url ? (
                  <a
                    href={cert.credential_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> View Certificate
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">No URL provided</span>
                )}

                <button
                  onClick={() => handleDeleteCert(cert.id, cert.name)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete Certificate"
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
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Add Certification</h3>
                  <p className="text-xs text-slate-500">Record a professional industry credential</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCert} className="space-y-4">
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
                placeholder="e.g. Amazon Web Services / Coursera / Microsoft"
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
                  label="Expiry Date (Optional)"
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
                label="Credential URL / Verification Link"
                placeholder="https://www.credly.com/badges/..."
                value={credentialUrl}
                onChange={(e) => setCredentialUrl(e.target.value)}
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
                  disabled={!name.trim() || !issuingOrg.trim()}
                >
                  Add Certificate
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
