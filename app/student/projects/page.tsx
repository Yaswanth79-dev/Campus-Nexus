'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Tables } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Code,
  Plus,
  Code2,
  ExternalLink,
  Users,
  CheckCircle2,
  Clock,
  MessageSquareQuote,
  Trash2,
  Search,
  Sparkles,
  FolderGit2,
} from 'lucide-react';

type Project = Tables<'student_projects'>;

export default function StudentProjectsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [techStackInput, setTechStackInput] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [teamMembers, setTeamMembers] = useState('');
  const [status, setStatus] = useState<'Planning' | 'In Progress' | 'Completed'>('In Progress');

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('student_projects')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (err: any) {
      console.error('Error fetching projects:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    setIsSubmitting(true);
    try {
      const techArray = techStackInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const supabase = getSupabaseBrowserClient();
      const { error } = await (supabase.from('student_projects') as any).insert({
        student_id: user.id,
        title: title.trim(),
        description: description.trim(),
        technologies: techArray,
        github_url: githubUrl.trim() || null,
        demo_url: demoUrl.trim() || null,
        team_members: teamMembers.trim() || null,
        status,
        is_reviewed: false,
      });

      if (error) throw error;

      toast({
        type: 'success',
        title: 'Project Added',
        message: `"${title}" has been saved to your project repository.`,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setTechStackInput('');
      setGithubUrl('');
      setDemoUrl('');
      setTeamMembers('');
      setStatus('In Progress');
      setIsModalOpen(false);

      await fetchProjects();
    } catch (err: any) {
      console.error('Error adding project:', err);
      toast({
        type: 'error',
        title: 'Failed to add project',
        message: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async (projectId: string, projTitle: string) => {
    if (!confirm(`Delete project "${projTitle}"?`)) return;

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from('student_projects').delete().eq('id', projectId);
      if (error) throw error;

      toast({
        type: 'success',
        title: 'Project Deleted',
        message: `"${projTitle}" was deleted.`,
      });
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message,
      });
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'Completed':
        return <Badge variant="success" size="sm" dot>Completed</Badge>;
      case 'In Progress':
        return <Badge variant="blue" size="sm" dot>In Progress</Badge>;
      default:
        return <Badge variant="default" size="sm">Planning</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Premium Editorial Hero */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-4 pb-8 mb-4 border-b border-slate-200/60">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1 block">Student Portal • Projects</span>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Projects Repository
          </h1>
          <p className="text-base text-slate-500 mt-2 max-w-2xl leading-relaxed">
            Showcase software projects, open-source repositories, team innovations, and receive faculty review.
          </p>
        </div>
        <div className="w-full md:w-auto">
          <Button variant="primary" size="md" className="w-full" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Add New Project
          </Button>
        </div>
      </div>

      {/* KPI Typographic Blocks */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 py-6 mb-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1.5">Total Projects</span>
          <div className="text-4xl font-black text-slate-900 tracking-tighter">{projects.length}</div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">In portfolio</div>
        </div>

        <div className="lg:border-l border-slate-200/60 lg:pl-8">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1.5">Completed</span>
          <div className="text-4xl font-black text-emerald-600 tracking-tighter">
            {projects.filter((p) => p.status === 'Completed').length}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1">Production / Shipped</div>
        </div>

        <div className="lg:border-l border-slate-200/60 lg:pl-8">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1.5">In Development</span>
          <div className="text-4xl font-black text-blue-600 tracking-tighter">
            {projects.filter((p) => p.status === 'In Progress').length}
          </div>
          <div className="text-[11px] text-blue-600 font-bold mt-1">Active builds</div>
        </div>

        <div className="lg:border-l border-slate-200/60 lg:pl-8">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1.5">Faculty Reviewed</span>
          <div className="text-4xl font-black text-purple-600 tracking-tighter">
            {projects.filter((p) => p.is_reviewed).length}
          </div>
          <div className="text-[11px] text-purple-600 font-bold mt-1">With feedback</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white rounded-2xl sm:rounded-3xl border border-slate-200/70 p-4 shadow-xs">
        <div className="w-full sm:w-80">
          <Input
            leadingIcon={<Search className="w-4 h-4" />}
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            showClear
            onClear={() => setSearchQuery('')}
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['All', 'Completed', 'In Progress', 'Planning'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Projects List */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="lg" message="Loading project repository..." />
        </div>
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={<FolderGit2 className="w-10 h-10 text-blue-500" />}
          title={projects.length === 0 ? "No Projects Added Yet" : "No Matching Projects"}
          description={projects.length === 0
            ? "Document your semester projects, hackathon prototypes, or capstone works to build an impressive portfolio."
            : "Try adjusting your search query or status filter."
          }
          actionLabel="Add Your First Project"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProjects.map((proj) => (
            <div
              key={proj.id}
              className="bg-white rounded-[24px] border border-slate-200/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)] flex flex-col justify-between overflow-hidden hover:border-slate-300 transition-all"
            >
              <div className="p-6 sm:p-8 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight leading-snug">{proj.title}</h3>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">
                      Added {new Date(proj.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {getStatusBadge(proj.status)}
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">
                  {proj.description}
                </p>

                {/* Tech Stack Chips */}
                {proj.technologies && proj.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {proj.technologies.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-slate-100/80 text-[10px] font-bold text-slate-700 uppercase tracking-wider"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Team Members */}
                {proj.team_members && (
                  <div className="flex items-center gap-2 pt-1">
                    <div className="p-1.5 bg-slate-50 rounded-md text-slate-400">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-600">Team: {proj.team_members}</span>
                  </div>
                )}

                {/* Faculty Feedback Section */}
                {proj.faculty_feedback && (
                  <div className="p-5 rounded-[16px] bg-indigo-50/50 border border-indigo-100/50 mt-4 relative">
                    <MessageSquareQuote className="w-8 h-8 text-indigo-200 absolute top-4 right-4 opacity-50" />
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-2">
                      Faculty Feedback
                    </div>
                    <p className="text-sm font-medium text-slate-700 leading-relaxed relative z-10">{proj.faculty_feedback}</p>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="px-6 sm:px-8 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {proj.github_url && (
                    <a
                      href={proj.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      <Code2 className="w-4 h-4" /> Repo
                    </a>
                  )}
                  {proj.demo_url && (
                    <a
                      href={proj.demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" /> Live Demo
                    </a>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteProject(proj.id, proj.title)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  title="Delete Project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-[24px] shadow-2xl p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">Add Project</h3>
                <p className="text-xs text-slate-500 mt-1">Document a software build or capstone work</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddProject} className="space-y-5">
              <Input
                label="Project Title"
                required
                placeholder="e.g. AI-Powered Medical Diagnosis Hub"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />

              <Textarea
                label="Description"
                required
                rows={3}
                placeholder="Overview of project objectives, architecture, algorithms used..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <Input
                label="Technologies (Comma-separated)"
                placeholder="Next.js, Python, PostgreSQL"
                value={techStackInput}
                onChange={(e) => setTechStackInput(e.target.value)}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="GitHub Repo URL"
                  leadingIcon={<Code2 className="w-4 h-4" />}
                  placeholder="https://github.com/..."
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                />
                <Input
                  label="Live Demo URL"
                  leadingIcon={<ExternalLink className="w-4 h-4" />}
                  placeholder="https://..."
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Team Members"
                  placeholder="e.g. Alex, Maya"
                  value={teamMembers}
                  onChange={(e) => setTeamMembers(e.target.value)}
                />
                <Select
                  label="Status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Planning">Planning</option>
                </Select>
              </div>

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
                  Save Project
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
