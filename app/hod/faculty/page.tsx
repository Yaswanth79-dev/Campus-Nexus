'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Tables } from '@/types/database';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import {
  GraduationCap,
  Users,
  Building,
  Mail,
  Phone,
  Briefcase,
  BookOpen,
} from 'lucide-react';

interface FacultyRecord {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  department: string;
  faculty: Tables<'faculty'> | null;
  menteeCount: number;
}

export default function HodFacultyPage() {
  const { user } = useAuth();
  const [facultyList, setFacultyList] = useState<FacultyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFaculty = useCallback(async () => {
    if (!user) return;
    try {
      const supabase = getSupabaseBrowserClient();
      const dept = user.department || 'IT';

      // 1. Fetch profiles in same department with role = 'faculty'
      const { data: profData, error: pErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'faculty')
        .eq('department', dept)
        .order('full_name', { ascending: true });

      if (pErr) throw pErr;

      if (profData && profData.length > 0) {
        const pList = profData as Tables<'profiles'>[];
        const facultyIds = pList.map((p) => p.id);

        const [fRes, mRes] = await Promise.all([
          supabase.from('faculty').select('*').in('id', facultyIds),
          supabase.from('faculty_mentor_assignments').select('faculty_id').in('faculty_id', facultyIds),
        ]);

        const fList = (fRes.data as Tables<'faculty'>[]) || [];
        const fMap = new Map<string, Tables<'faculty'>>(fList.map((f) => [f.id, f]));

        const mList = (mRes.data as { faculty_id: string }[]) || [];
        const menteeCounts = new Map<string, number>();
        mList.forEach((m) => {
          menteeCounts.set(m.faculty_id, (menteeCounts.get(m.faculty_id) || 0) + 1);
        });

        const combined: FacultyRecord[] = pList.map((p) => ({
          id: p.id,
          full_name: p.full_name,
          email: p.email,
          phone: p.phone,
          department: p.department,
          faculty: fMap.get(p.id) || null,
          menteeCount: menteeCounts.get(p.id) || 0,
        }));

        setFacultyList(combined);
      } else {
        setFacultyList([]);
      }
    } catch (err: any) {
      console.error('Error fetching faculty roster:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFaculty();
  }, [fetchFaculty]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${user?.department || 'IT'} Department Faculty Roster`}
        description={`Manage instructional staff, research specializations, office hours, and mentorship workloads for ${user?.department || 'IT'}.`}
        breadcrumbs={[
          { label: 'HOD Portal', href: '/hod/dashboard' },
          { label: 'Faculty' },
        ]}
      />

      {/* Faculty List */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="lg" message="Loading department faculty..." />
        </div>
      ) : facultyList.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="w-10 h-10 text-indigo-500" />}
          title="No Faculty Members Found"
          description="No faculty instructional staff are assigned to this department."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {facultyList.map((f) => (
            <Card
              key={f.id}
              className="bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Avatar name={f.full_name} role="faculty" size="lg" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-base leading-tight truncate">
                      {f.full_name}
                    </h3>
                    <p className="text-xs text-indigo-600 font-semibold mt-0.5">
                      {f.faculty?.designation || 'Assistant Professor'}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{f.email}</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {f.faculty?.specialization && (
                    <div>
                      <span className="font-semibold text-slate-700">Domain:</span> {f.faculty.specialization}
                    </div>
                  )}
                  {f.faculty?.qualification && (
                    <div>
                      <span className="font-semibold text-slate-700">Degree:</span> {f.faculty.qualification}
                    </div>
                  )}
                  {f.faculty?.office_location && (
                    <div className="text-slate-500 text-[11px] pt-1">
                      Office: {f.faculty.office_location}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-1 pt-3 border-t border-slate-100 flex items-center justify-between">
                <Badge variant="faculty" size="sm">
                  {f.department} Faculty
                </Badge>
                <span className="text-xs font-bold text-slate-700">
                  {f.menteeCount} Assigned Mentees
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
