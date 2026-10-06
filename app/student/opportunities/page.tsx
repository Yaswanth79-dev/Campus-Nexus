'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Tables } from '@/types/database';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Sparkles,
  ExternalLink,
  Calendar,
  Building,
  Filter,
  Search,
  CheckCircle2,
  Clock,
} from 'lucide-react';

type Opportunity = Tables<'opportunities'>;

const TYPES = ['All', 'Internship', 'Hackathon', 'Research', 'Scholarship', 'Workshop', 'Competition', 'Job'] as const;

export default function StudentOpportunitiesPage() {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOpportunities = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOpportunities(data || []);
    } catch (err: any) {
      console.error('Error fetching opportunities:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const filteredOpportunities = opportunities.filter((op) => {
    const matchesType = selectedType === 'All' || op.type === selectedType;
    const matchesSearch =
      op.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      op.company_or_org.toLowerCase().includes(searchQuery.toLowerCase()) ||
      op.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'Internship': return 'primary';
      case 'Hackathon': return 'warning';
      case 'Research': return 'student';
      case 'Job': return 'success';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Department Opportunities & Drives"
        description="Explore curated internships, national hackathons, faculty research openings, and industry scholarship drives."
        breadcrumbs={[
          { label: 'Student Portal', href: '/student/dashboard' },
          { label: 'Opportunities' },
        ]}
      />

      {/* Filter & Search */}
      <Card className="p-4 bg-white border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search by company, title, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                  selectedType === t
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Opportunities List */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="lg" message="Loading opportunities..." />
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="w-10 h-10 text-amber-500" />}
          title="No Opportunities Posted Yet"
          description="Check back soon! Faculty and department coordinators regularly post new internship drives, hackathons, and research openings."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOpportunities.map((op) => (
            <Card
              key={op.id}
              className="bg-white border-slate-200 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant={getTypeBadgeVariant(op.type) as any} size="sm">
                    {op.type}
                  </Badge>
                  {op.deadline && (
                    <span className="text-[11px] font-semibold text-amber-600 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md">
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

              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Posted {new Date(op.created_at).toLocaleDateString()}
                </span>

                {op.link_url && (
                  <a
                    href={op.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Apply Now <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
