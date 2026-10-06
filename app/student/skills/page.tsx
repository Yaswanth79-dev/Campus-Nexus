'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Tables, TablesInsert } from '@/types/database';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
  Award,
  Sparkles,
  Search,
  Filter,
  Flame,
  Check,
} from 'lucide-react';

type Skill = Tables<'student_skills'>;

const SKILL_CATEGORIES = [
  'Programming Languages',
  'Web Development',
  'App Development',
  'AI / ML',
  'Cloud & DevOps',
  'Cybersecurity',
  'Data Science',
  'Database',
  'UI/UX Design',
  'Other',
] as const;

const PROFICIENCY_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const;

export default function StudentSkillsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // New Skill Form State
  const [newSkillName, setNewSkillName] = useState('');
  const [newCategory, setNewCategory] = useState<string>(SKILL_CATEGORIES[0]);
  const [newProficiency, setNewProficiency] = useState<'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'>('Intermediate');

  const fetchSkills = useCallback(async () => {
    if (!user) return;
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('student_skills')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSkills(data || []);
    } catch (err: unknown) {
      console.error('Error fetching skills:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const init = async () => {
      await fetchSkills();
    };
    init();
  }, [fetchSkills]);

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newSkillName.trim()) return;

    setIsSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const insertPayload: TablesInsert<'student_skills'> = {
        student_id: user.id,
        skill_name: newSkillName.trim(),
        category: newCategory,
        proficiency: newProficiency,
        is_endorsed: false,
      };
      
      const { error } = await supabase
        .from('student_skills')
        .insert(insertPayload as never);

      if (error) throw error;

      toast({
        type: 'success',
        title: 'Skill Added',
        message: `${newSkillName} added to your technical skills portfolio.`,
      });

      setNewSkillName('');
      setIsModalOpen(false);
      await fetchSkills();
    } catch (err: unknown) {
      console.error('Error adding skill:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      toast({
        type: 'error',
        title: 'Failed to add skill',
        message: errorMessage || 'Something went wrong.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSkill = async (skillId: string, skillName: string) => {
    if (!confirm(`Are you sure you want to remove ${skillName}?`)) return;

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from('student_skills')
        .delete()
        .eq('id', skillId);

      if (error) throw error;

      toast({
        type: 'success',
        title: 'Skill Removed',
        message: `${skillName} has been removed.`,
      });

      setSkills((prev) => prev.filter((s) => s.id !== skillId));
    } catch (err: unknown) {
      console.error('Error deleting skill:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      toast({
        type: 'error',
        title: 'Delete Failed',
        message: errorMessage,
      });
    }
  };

  const filteredSkills = skills.filter((s) => {
    const matchesSearch = s.skill_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getProficiencyColor = (level: string) => {
    switch (level) {
      case 'Expert': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Advanced': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Intermediate': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const stats = {
    total: skills.length,
    advancedOrExpert: skills.filter((s) => s.proficiency === 'Advanced' || s.proficiency === 'Expert').length,
    endorsed: skills.filter((s) => s.is_endorsed).length,
    categories: new Set(skills.map((s) => s.category)).size,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Technical & Domain Skills"
        description="Showcase programming languages, frameworks, developer tools, and verified faculty endorsements."
        breadcrumbs={[
          { label: 'Student Portal', href: '/student/dashboard' },
          { label: 'Skills' },
        ]}
        actions={
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Add New Skill
          </Button>
        }
      />

      {/* Metrics Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Skills</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.total}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Across {stats.categories} categories</div>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-blue-500" /> Advanced / Expert
          </div>
          <div className="text-2xl font-black text-blue-900 mt-1">{stats.advancedOrExpert}</div>
          <div className="text-[11px] text-blue-600 mt-0.5">High proficiency skills</div>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-purple-500" /> Endorsed Skills
          </div>
          <div className="text-2xl font-black text-purple-900 mt-1">{stats.endorsed}</div>
          <div className="text-[11px] text-purple-600 mt-0.5">Verified by faculty</div>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> Benchmark Level
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-1">Tier 1</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">
            Sem {user?.semester ?? 1} {user?.department || 'IT'} Ready
          </div>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 bg-white border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search skills (e.g. Python, Docker)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Chips Horizontal Scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                selectedCategory === 'All'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({skills.length})
            </button>
            {SKILL_CATEGORIES.map((cat) => {
              const count = skills.filter((s) => s.category === cat).length;
              if (count === 0 && selectedCategory !== cat) return null;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 flex items-center gap-1 ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{cat}</span>
                  <span className="text-[10px] opacity-75">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Skills Grid */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="lg" message="Loading skills portfolio..." />
        </div>
      ) : filteredSkills.length === 0 ? (
        <EmptyState
          icon={<Layers className="w-10 h-10 text-blue-500" />}
          title={skills.length === 0 ? "No Skills Added Yet" : "No Matching Skills Found"}
          description={skills.length === 0 
            ? "Add your core programming languages, frameworks, and tools to showcase your technical proficiency."
            : "Try adjusting your search query or selected category filter."
          }
          actionLabel="Add Your First Skill"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredSkills.map((skill) => (
            <div
              key={skill.id}
              className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs hover:shadow-md hover:border-blue-200 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 text-base leading-tight group-hover:text-blue-600 transition-colors">
                      {skill.skill_name}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">{skill.category}</p>
                  </div>
                  {skill.is_endorsed && (
                    <span title="Endorsed by Faculty Mentor" className="shrink-0 p-1 rounded-md bg-purple-50 text-purple-600">
                      <Award className="w-4 h-4" />
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${getProficiencyColor(skill.proficiency)}`}>
                    {skill.proficiency}
                  </span>
                  {skill.is_endorsed && (
                    <span className="text-[10px] font-semibold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-full">
                      ✓ Endorsed
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  Added {new Date(skill.created_at).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleDeleteSkill(skill.id, skill.skill_name)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Remove skill"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Skill Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <Card className="w-full max-w-md bg-white shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Add Technical Skill</h3>
                  <p className="text-xs text-slate-500">Record a language, tool, or framework</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSkill} className="space-y-4">
              <Input
                label="Skill Name"
                required
                placeholder="e.g. Python, Docker, Next.js, PostgreSQL"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                autoFocus
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Category</label>
                <select
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                >
                  {SKILL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Proficiency Level</label>
                <div className="grid grid-cols-2 gap-2">
                  {PROFICIENCY_LEVELS.map((level) => (
                    <button
                      type="button"
                      key={level}
                      onClick={() => setNewProficiency(level)}
                      className={`p-2 rounded-lg border text-xs font-semibold flex items-center justify-between transition-all ${
                        newProficiency === level
                          ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{level}</span>
                      {newProficiency === level && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  ))}
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
                  disabled={!newSkillName.trim()}
                >
                  Add Skill
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
