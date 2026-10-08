'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Tables } from '@/types/database';
import {
  Target,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Cloud,
  Brain,
  Shield,
  Database,
  Briefcase
} from 'lucide-react';
import { Loader2 } from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  'Cloud': Cloud,
  'Brain': Brain,
  'Shield': Shield,
  'Database': Database,
};

type TrackSkill = Tables<'career_track_skills'>;
type CareerTrack = Tables<'career_tracks'> & { career_track_skills: TrackSkill[] };

export default function StudentSkillGapPage() {
  const { user } = useAuth();
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [careerTracks, setCareerTracks] = useState<CareerTrack[]>([]);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const supabase = getSupabaseBrowserClient();
        
        // Load User Skills
        const { data: skillsData, error: skillsError } = await supabase
          .from('student_skills')
          .select('*')
          .eq('student_id', user.id);

        if (skillsError) throw skillsError;
        if (skillsData) {
          const list = skillsData as Tables<'student_skills'>[];
          setUserSkills(list.map((s) => s.skill_name.toLowerCase()));
        }

        // Load Career Tracks
        const { data: tracksData, error: tracksError } = await supabase
          .from('career_tracks')
          .select(`
            *,
            career_track_skills (*)
          `)
          .eq('is_active', true)
          .order('name');

        if (tracksError) throw tracksError;
        if (tracksData) {
          setCareerTracks(tracksData as CareerTrack[]);
        }
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load skill gap data.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-slate-500 font-medium">Analyzing skill benchmarks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-200">
          <h3 className="font-bold">Error Loading Benchmarks</h3>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (careerTracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 max-w-md">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-bold text-slate-700">No Career Tracks Available</h3>
          <p className="text-sm text-slate-500 mt-2">Check back later as new industry benchmarks are added to the platform.</p>
        </div>
      </div>
    );
  }

  const activeTrack = careerTracks[selectedTrackIndex];

  // Calculate Match & Missing Skills
  const matchEvaluation = activeTrack.career_track_skills.map((req) => {
    const hasSkill = userSkills.some((s) => s.includes(req.skill_name.toLowerCase()) || req.skill_name.toLowerCase().includes(s));
    return { ...req, hasSkill };
  });

  const acquiredCount = matchEvaluation.filter((m) => m.hasSkill).length;
  const totalSkills = activeTrack.career_track_skills.length;
  const matchPercentage = totalSkills > 0 ? Math.round((acquiredCount / totalSkills) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="pt-4 pb-8 mb-4 border-b border-slate-200/60">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
          Intelligence & Benchmarks
        </h1>
        <p className="text-base text-slate-500 mt-2 max-w-2xl leading-relaxed">
          Compare your current verified skills against industry benchmarks for high-demand tech roles.
        </p>
      </div>

      {/* Role Track Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {careerTracks.map((track, idx) => {
          const Icon = track.icon_name && ICON_MAP[track.icon_name] ? ICON_MAP[track.icon_name] : Briefcase;
          const isSelected = selectedTrackIndex === idx;

          return (
              <div
                key={track.id}
                onClick={() => setSelectedTrackIndex(idx)}
                className={`p-5 rounded-[20px] border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white border-slate-200/60 hover:border-slate-300 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-500'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm leading-tight">{track.name}</h3>
                </div>
                <div className="mt-4 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                  <span className={isSelected ? 'text-slate-400' : 'text-slate-500'}>Benchmark</span>
                  <span className={isSelected ? 'text-white' : 'text-slate-900'}>
                    {track.career_track_skills.length} Skills
                  </span>
                </div>
              </div>
          );
        })}
      </div>

      {/* Main Analysis Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 Columns: Skill Breakdown */}
        <div className="lg:col-span-2 space-y-6">

          {/* Match Score Meter */}
          {/* Match Score Meter */}
          <section className="p-6 md:p-8 rounded-[24px] bg-white border border-slate-200/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1 block">Track Compatibility</span>
                <h2 className="text-2xl font-extrabold text-slate-900">{activeTrack.name}</h2>
                <p className="text-sm text-slate-500 mt-2 max-w-lg leading-relaxed">{activeTrack.description}</p>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-4xl md:text-5xl font-black text-indigo-600 tracking-tighter">{matchPercentage}%</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Match</div>
              </div>
            </div>

            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-6">
              <div
                className={`h-2 rounded-full transition-all duration-700 ease-out ${
                  matchPercentage >= 70 ? 'bg-emerald-500' : matchPercentage >= 40 ? 'bg-indigo-600' : 'bg-amber-500'
                }`}
                style={{ width: `${matchPercentage}%` }}
              />
            </div>

            <div className="flex justify-between text-xs text-slate-500 font-semibold mt-3">
              <span>{acquiredCount} of {totalSkills} skills verified</span>
              <span className={matchPercentage >= 70 ? 'text-emerald-600' : 'text-slate-500'}>
                {matchPercentage >= 70 ? 'Strong Alignment' : 'Learning Recommended'}
              </span>
            </div>
          </section>

          {/* Required Skills Matrix */}
          {/* Required Skills Matrix */}
          <section className="p-6 md:p-8 rounded-[24px] bg-white border border-slate-200/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)]">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900">Technical Competencies</h3>
              <p className="text-sm text-slate-500 mt-1">Comparison against your recorded technical portfolio</p>
            </div>
            
            <div className="space-y-3">
              {matchEvaluation.map((skill) => (
                <div
                  key={skill.id}
                  className={`p-4 rounded-[16px] border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    skill.hasSkill
                      ? 'bg-emerald-50/30 border-emerald-100/60 hover:border-emerald-200 text-slate-900'
                      : 'bg-slate-50 border-slate-200/60 hover:border-slate-300/80 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                      skill.hasSkill ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300 text-slate-300'
                    }`}>
                      {skill.hasSkill ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{skill.skill_name}</div>
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">{skill.category}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md ${
                      skill.target_level === 'Essential' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {skill.target_level}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Right Column: Recommended Action Track */}
        <div className="space-y-6">

          <section className="p-6 md:p-8 rounded-[24px] bg-slate-900 text-white shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Sparkles className="w-24 h-24 text-white" />
            </div>
            
            <div className="relative z-10">
              <div className="mb-6">
                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-300 block mb-1">Bridge the Gap</span>
                <h3 className="text-xl font-extrabold text-white">Recommended Actions</h3>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 rounded-[16px] bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="font-bold text-sm text-white">Complete Learning Hub Tests</div>
                  <p className="text-xs text-indigo-200 mt-1 mb-3">Take assessment tests for missing skills to earn credits and prove proficiency.</p>
                  <Link href="/student/learning" className="text-xs font-bold text-indigo-300 uppercase tracking-widest inline-flex items-center gap-1 hover:text-white transition-colors">
                    Go to Learning Hub <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="p-4 rounded-[16px] bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="font-bold text-sm text-white">Build a Capstone Project</div>
                  <p className="text-xs text-indigo-200 mt-1 mb-3">Apply the required tech stack in a project repository and request faculty review.</p>
                  <Link href="/student/projects" className="text-xs font-bold text-indigo-300 uppercase tracking-widest inline-flex items-center gap-1 hover:text-white transition-colors">
                    Add Project <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="p-4 rounded-[16px] bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="font-bold text-sm text-white">Earn Industry Certification</div>
                  <p className="text-xs text-indigo-200 mt-1 mb-3">Target cloud credentials to certify domain knowledge.</p>
                  <Link href="/student/certifications" className="text-xs font-bold text-indigo-300 uppercase tracking-widest inline-flex items-center gap-1 hover:text-white transition-colors">
                    Add Certifications <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}
