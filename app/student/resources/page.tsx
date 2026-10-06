'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Tables } from '@/types/database';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import {
  BookOpen,
  Download,
  ExternalLink,
  Search,
  FileText,
  Bookmark,
  Layers,
} from 'lucide-react';

type Resource = Tables<'department_resources'>;

const CATEGORIES = ['All', 'Syllabus', 'Lecture Notes', 'Lab Manual', 'Reference Book', 'E-Learning', 'Past Papers'] as const;

export default function StudentResourcesPage() {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchResources = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('department_resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResources(data || []);
    } catch (err: any) {
      console.error('Error fetching resources:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const filteredResources = resources.filter((res) => {
    const matchesCat = selectedCategory === 'All' || res.category === selectedCategory;
    const matchesSearch =
      res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (res.subject && res.subject.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Department Academic & Learning Resources"
        description="Access verified curriculum syllabi, faculty lecture notes, laboratory manuals, and previous year examination papers."
        breadcrumbs={[
          { label: 'Student Portal', href: '/student/dashboard' },
          { label: 'Resources' },
        ]}
      />

      {/* Search & Filter */}
      <Card className="p-4 bg-white border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search by title or subject (e.g. Operating Systems)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                  selectedCategory === c
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Resources List */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="lg" message="Loading department resources..." />
        </div>
      ) : filteredResources.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-10 h-10 text-blue-500" />}
          title="No Resources Available"
          description="Faculty members and HOD regularly upload reference materials, lecture slides, and question banks here."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredResources.map((res) => (
            <Card
              key={res.id}
              className="bg-white border-slate-200 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="p-5 space-y-3">
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

              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  {new Date(res.created_at).toLocaleDateString()}
                </span>

                <a
                  href={res.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download / View
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
