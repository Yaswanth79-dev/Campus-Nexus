'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Tables } from '@/types/database';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
      <PageHeader
        title="Projects Repository"
        description="Showcase software projects, open-source repositories, team innovations, and receive faculty review."
        breadcrumbs={[
          { label: 'Student Portal', href: '/student/dashboard' },
          { label: 'Projects' },
        ]}
        actions={
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Add New Project
          </Button>
        }
      />

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Projects</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{projects.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">In portfolio</div>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-1">
            {projects.filter((p) => p.status === 'Completed').length}
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Production / Shipped</div>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> In Development
          </div>
          <div className="text-2xl font-black text-blue-900 mt-1">
            {projects.filter((p) => p.status === 'In Progress').length}
          </div>
          <div className="text-[11px] text-blue-600 mt-0.5">Active builds</div>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Faculty Reviewed
          </div>
          <div className="text-2xl font-black text-purple-900 mt-1">
            {projects.filter((p) => p.is_reviewed).length}
          </div>
          <div className="text-[11px] text-purple-600 mt-0.5">With faculty feedback</div>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="p-4 bg-white border-slate-200">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search projects by title or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {['All', 'Completed', 'In Progress', 'Planning'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-1 sm:flex-none ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </Card>

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
            <Card
              key={proj.id}
              className="bg-white border-slate-200 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-snug">{proj.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Added {new Date(proj.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {getStatusBadge(proj.status)}
                </div>

                <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                  {proj.description}
                </p>

                {/* Tech Stack Chips */}
                {proj.technologies && proj.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {proj.technologies.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Team Members */}
                {proj.team_members && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Team: {proj.team_members}</span>
                  </div>
                )}

                {/* Faculty Feedback Section */}
                {proj.faculty_feedback && (
                  <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-100 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-purple-800 font-bold">
                      <MessageSquareQuote className="w-4 h-4" /> Faculty Mentor Feedback
                    </div>
                    <p className="text-purple-950 leading-relaxed">{proj.faculty_feedback}</p>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {proj.github_url && (
                    <a
                      href={proj.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-blue-600 transition-colors"
                    >
                      <Code2 className="w-3.5 h-3.5" /> Repository
                    </a>
                  )}
                  {proj.demo_url && (
                    <a
                      href={proj.demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Live Demo
                    </a>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteProject(proj.id, proj.title)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete Project"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <Card className="w-full max-w-lg bg-white shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Add Project</h3>
                  <p className="text-xs text-slate-500">Document a software build or capstone work</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddProject} className="space-y-4">
              <Input
                label="Project Title"
                required
                placeholder="e.g. AI-Powered Medical Diagnosis Hub"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description</label>
                <textarea
                  rows={3}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Overview of project objectives, architecture, algorithms used, and real-world impact..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <Input
                label="Technologies Used (Comma-separated)"
                placeholder="Next.js, Python, FastAPI, PostgreSQL, Docker"
                value={techStackInput}
                onChange={(e) => setTechStackInput(e.target.value)}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="GitHub Repository URL"
                  leadingIcon={<Code2 className="w-4 h-4" />}
                  placeholder="https://github.com/user/repo"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                />
                <Input
                  label="Live Demo URL (Optional)"
                  leadingIcon={<ExternalLink className="w-4 h-4" />}
                  placeholder="https://myproject.vercel.app"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Team Members (Optional)"
                  placeholder="e.g. Alex, Maya, Yashwanth"
                  value={teamMembers}
                  onChange={(e) => setTeamMembers(e.target.value)}
                />
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Project Status</label>
                  <select
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Planning">Planning</option>
                  </select>
                </div>
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
                  disabled={!title.trim()}
                >
                  Save Project
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
