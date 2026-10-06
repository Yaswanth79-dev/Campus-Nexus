'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Tables } from '@/types/database';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Target,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  BookOpen,
  Cpu,
  Brain,
  Shield,
  Cloud,
  Database,
  Smartphone,
} from 'lucide-react';

interface CareerBenchmark {
  role: string;
  icon: any;
  description: string;
  requiredSkills: { name: string; category: string; importance: 'Essential' | 'Recommended' }[];
}

const CAREER_TRACKS: CareerBenchmark[] = [
  {
    role: 'Full-Stack Cloud Engineer',
    icon: Cloud,
    description: 'Design and deploy modern distributed web applications with Next.js, microservices, and serverless cloud architectures.',
    requiredSkills: [
      { name: 'TypeScript', category: 'Programming Languages', importance: 'Essential' },
      { name: 'Next.js & React', category: 'Web Development', importance: 'Essential' },
      { name: 'PostgreSQL', category: 'Database', importance: 'Essential' },
      { name: 'Cloud Architecture (AWS/GCP)', category: 'Cloud & DevOps', importance: 'Essential' },
      { name: 'Docker & Containers', category: 'Cloud & DevOps', importance: 'Essential' },
      { name: 'REST & GraphQL APIs', category: 'Web Development', importance: 'Recommended' },
      { name: 'CI/CD Pipelines', category: 'Cloud & DevOps', importance: 'Recommended' },
      { name: 'Redis / Caching', category: 'Database', importance: 'Recommended' },
    ],
  },
  {
    role: 'AI / Machine Learning Engineer',
    icon: Brain,
    description: 'Build predictive models, natural language processing pipelines, and neural networks using modern AI frameworks.',
    requiredSkills: [
      { name: 'Python', category: 'Programming Languages', importance: 'Essential' },
      { name: 'Data Structures & Algorithms', category: 'Computer Science', importance: 'Essential' },
      { name: 'PyTorch / TensorFlow', category: 'AI / ML', importance: 'Essential' },
      { name: 'Data Science & Pandas', category: 'Data Science', importance: 'Essential' },
      { name: 'Mathematics & Linear Algebra', category: 'Data Science', importance: 'Essential' },
      { name: 'Model Deployment (FastAPI/Docker)', category: 'Cloud & DevOps', importance: 'Recommended' },
      { name: 'Vector Databases', category: 'Database', importance: 'Recommended' },
      { name: 'LLM Prompt Engineering', category: 'AI / ML', importance: 'Recommended' },
    ],
  },
  {
    role: 'Cybersecurity & Defense Specialist',
    icon: Shield,
    description: 'Secure enterprise networks, perform ethical penetration testing, and analyze digital vulnerabilities.',
    requiredSkills: [
      { name: 'Network Security & TCP/IP', category: 'Cybersecurity', importance: 'Essential' },
      { name: 'Linux System Administration', category: 'Operating Systems', importance: 'Essential' },
      { name: 'Python / Bash Scripting', category: 'Programming Languages', importance: 'Essential' },
      { name: 'Vulnerability Assessment', category: 'Cybersecurity', importance: 'Essential' },
      { name: 'Cryptography & PKI', category: 'Cybersecurity', importance: 'Recommended' },
      { name: 'Web Application Security (OWASP)', category: 'Cybersecurity', importance: 'Recommended' },
    ],
  },
  {
    role: 'Data Engineer & Analytics Architect',
    icon: Database,
    description: 'Architect big data streaming pipelines, data warehouses, and automated ETL transformation systems.',
    requiredSkills: [
      { name: 'SQL & Database Optimization', category: 'Database', importance: 'Essential' },
      { name: 'Python', category: 'Programming Languages', importance: 'Essential' },
      { name: 'Apache Spark / Distributed Data', category: 'Data Science', importance: 'Essential' },
      { name: 'Data Warehousing (Snowflake/BigQuery)', category: 'Database', importance: 'Essential' },
      { name: 'ETL Pipeline Design', category: 'Data Science', importance: 'Recommended' },
      { name: 'Kafka / Realtime Streaming', category: 'Cloud & DevOps', importance: 'Recommended' },
    ],
  },
];

export default function StudentSkillGapPage() {
  const { user } = useAuth();
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSkills() {
      if (!user) return;
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase
          .from('student_skills')
          .select('*')
          .eq('student_id', user.id);

        if (data) {
          const list = data as Tables<'student_skills'>[];
          setUserSkills(list.map((s) => s.skill_name.toLowerCase()));
        }
      } catch (err) {
        console.error('Error fetching user skills:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSkills();
  }, [user]);

  const activeTrack = CAREER_TRACKS[selectedTrackIndex];

  // Calculate Match & Missing Skills
  const matchEvaluation = activeTrack.requiredSkills.map((req) => {
    const hasSkill = userSkills.some((s) => s.includes(req.name.toLowerCase()) || req.name.toLowerCase().includes(s));
    return { ...req, hasSkill };
  });

  const acquiredCount = matchEvaluation.filter((m) => m.hasSkill).length;
  const matchPercentage = Math.round((acquiredCount / activeTrack.requiredSkills.length) * 100);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Skill Gap Analyzer & Industry Benchmark"
        description="Compare your current verified skills against industry benchmarks for high-demand tech roles to find improvement areas."
        breadcrumbs={[
          { label: 'Student Portal', href: '/student/dashboard' },
          { label: 'Skill Gap' },
        ]}
      />

      {/* Role Track Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CAREER_TRACKS.map((track, idx) => {
          const Icon = track.icon;
          const isSelected = selectedTrackIndex === idx;

          return (
            <div
              key={track.role}
              onClick={() => setSelectedTrackIndex(idx)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-[1.02]'
                  : 'bg-white border-slate-200 hover:border-blue-300 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${isSelected ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm leading-tight">{track.role}</h3>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs font-semibold">
                <span className={isSelected ? 'text-blue-100' : 'text-slate-500'}>Benchmark</span>
                <span className={isSelected ? 'text-white' : 'text-blue-600'}>
                  {track.requiredSkills.length} Skills
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
          <Card className="p-6 bg-white border-slate-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Track Compatibility</span>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">{activeTrack.role}</h2>
                <p className="text-xs text-slate-500 mt-1 max-w-lg">{activeTrack.description}</p>
              </div>

              <div className="text-right">
                <div className="text-3xl font-black text-blue-600">{matchPercentage}%</div>
                <div className="text-xs font-semibold text-slate-500">Benchmark Match</div>
              </div>
            </div>

            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mt-4">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  matchPercentage >= 70 ? 'bg-emerald-500' : matchPercentage >= 40 ? 'bg-blue-600' : 'bg-amber-500'
                }`}
                style={{ width: `${matchPercentage}%` }}
              />
            </div>

            <div className="flex justify-between text-xs text-slate-500 font-medium mt-2">
              <span>{acquiredCount} of {activeTrack.requiredSkills.length} skills verified</span>
              <span>{matchPercentage >= 70 ? '🟢 Strong Alignment' : '🟡 Recommended Learning Needed'}</span>
            </div>
          </Card>

          {/* Required Skills Matrix */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600" /> Required Technical Competencies
              </CardTitle>
              <CardDescription>Comparison against your recorded technical portfolio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {matchEvaluation.map((skill, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                    skill.hasSkill
                      ? 'bg-emerald-50/40 border-emerald-200 text-slate-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      skill.hasSkill ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                    }`}>
                      {skill.hasSkill ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="text-[10px]">✕</span>}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{skill.name}</div>
                      <div className="text-[11px] text-slate-500">{skill.category}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      skill.importance === 'Essential' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {skill.importance}
                    </span>
                    <span className={`text-xs font-semibold ${
                      skill.hasSkill ? 'text-emerald-700' : 'text-slate-400'
                    }`}>
                      {skill.hasSkill ? 'Acquired' : 'Gap'}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

        </div>

        {/* Right Column: Recommended Action Track */}
        <div className="space-y-6">

          <Card className="border-indigo-200 bg-linear-to-b from-indigo-50/50 to-white">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-indigo-950">
                <Sparkles className="w-4 h-4 text-indigo-600" /> Bridge the Gap
              </CardTitle>
              <CardDescription>Recommended actions to reach 100% industry readiness</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2.5">
                <div className="p-3 rounded-lg bg-white border border-indigo-100 text-xs space-y-1">
                  <div className="font-bold text-slate-900">1. Complete Learning Hub Tests</div>
                  <p className="text-slate-600">Take assessment tests for missing skills to earn credits and prove proficiency.</p>
                  <Link href="/student/learning" className="text-blue-600 font-semibold inline-flex items-center gap-1 mt-1 hover:underline">
                    Go to Learning Hub <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="p-3 rounded-lg bg-white border border-indigo-100 text-xs space-y-1">
                  <div className="font-bold text-slate-900">2. Build a Capstone Project</div>
                  <p className="text-slate-600">Apply the required tech stack in a project repository and request faculty review.</p>
                  <Link href="/student/projects" className="text-blue-600 font-semibold inline-flex items-center gap-1 mt-1 hover:underline">
                    Add Project <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="p-3 rounded-lg bg-white border border-indigo-100 text-xs space-y-1">
                  <div className="font-bold text-slate-900">3. Earn Industry Certification</div>
                  <p className="text-slate-600">Target cloud credentials (AWS / GCP / Azure) to certify domain knowledge.</p>
                  <Link href="/student/certifications" className="text-blue-600 font-semibold inline-flex items-center gap-1 mt-1 hover:underline">
                    Add Certifications <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
