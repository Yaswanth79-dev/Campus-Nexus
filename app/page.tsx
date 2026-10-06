'use client';

import React from 'react';
import Link from 'next/link';
import {
  Cpu,
  GraduationCap,
  Users,
  BarChart3,
  ArrowRight,
  ShieldCheck,
  Code,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ROLE_CONFIGS, UserRole } from '@/types/roles';

export default function HomePage() {
  const { role, isAuthenticated } = useAuth();

  const rolePortals = [
    {
      role: 'student' as UserRole,
      title: 'Student Portal',
      subtitle: 'Development & Skills Hub',
      description:
        'Track skills, showcase projects, log verified certifications, apply for internships, and receive faculty mentoring.',
      icon: <GraduationCap className="w-6 h-6 text-blue-600" />,
      badgeColor: 'student' as const,
      route: '/student/dashboard',
      features: ['Skill Gap Analysis', 'Project Repository', 'Verified Credentials', 'Career Milestones'],
    },
    {
      role: 'faculty' as UserRole,
      title: 'Faculty Portal',
      subtitle: 'Mentoring & Guidance Hub',
      description:
        'Manage assigned mentees, track student progress, address concerns, post opportunities, and review innovation ideas.',
      icon: <Users className="w-6 h-6 text-indigo-600" />,
      badgeColor: 'faculty' as const,
      route: '/faculty/dashboard',
      features: ['Assigned Mentees', 'Mentoring Sessions', 'Student Concerns', 'Idea Review Hub'],
    },
    {
      role: 'hod' as UserRole,
      title: 'HOD Department Portal',
      subtitle: 'Intelligence & Governance Hub',
      description:
        'Department-wide analytics, mentoring supervision, feedback review, resource allocation, and strategic reports.',
      icon: <BarChart3 className="w-6 h-6 text-slate-900" />,
      badgeColor: 'hod' as const,
      route: '/hod/dashboard',
      features: ['Department Analytics', 'Grievance Redressal', 'Accreditation Reports', 'Readiness Index'],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Banner */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
              <Cpu className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                Campus Nexus
              </span>
              <span className="hidden sm:inline-block text-xs text-slate-500 ml-2 font-medium">
                Student Development & Intelligence Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && role ? (
              <Link href={ROLE_CONFIGS[role]?.defaultRoute || '/student/dashboard'}>
                <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Enter Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Sign In to Portal
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Phase 2: Database Architecture + Supabase Auth + RLS Security
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight sm:leading-none">
            Empowering IT Talent Through Mentoring & Department Intelligence
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            A unified internal portal for the Information Technology Department bridging Students,
            Faculty Mentors, and Department Leadership.
          </p>

          {/* Workflow Diagram Badge */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-slate-700 bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs max-w-2xl mx-auto">
            <span className="text-blue-600">Student Development</span>
            <span className="text-slate-400">→</span>
            <span className="text-indigo-600">Faculty Mentoring</span>
            <span className="text-slate-400">→</span>
            <span className="text-slate-900">Department Insights</span>
            <span className="text-slate-400">→</span>
            <span className="text-emerald-600">Better Student Development</span>
          </div>
        </div>

        {/* Role Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-16">
          {rolePortals.map((portal) => (
            <Card
              key={portal.role}
              hoverable
              className="flex flex-col justify-between p-6 sm:p-7 border-slate-200 bg-white relative overflow-hidden group"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 group-hover:scale-105 transition-transform">
                    {portal.icon}
                  </div>
                  <Badge variant={portal.badgeColor} size="sm">
                    {ROLE_CONFIGS[portal.role].badgeLabel}
                  </Badge>
                </div>

                <h3 className="text-xl font-bold text-slate-900">{portal.title}</h3>
                <p className="text-xs font-semibold text-slate-500 mb-3">{portal.subtitle}</p>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  {portal.description}
                </p>

                <div className="space-y-2 border-t border-slate-100 pt-4 mb-6">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Key Focus Areas:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {portal.features.map((feat) => (
                      <div
                        key={feat}
                        className="text-xs text-slate-700 flex items-center gap-1.5 font-medium"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        {feat}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link href={isAuthenticated && role === portal.role ? portal.route : '/login'}>
                  <Button
                    className="w-full"
                    variant={portal.role === 'hod' ? 'primary' : portal.role === 'faculty' ? 'primary' : 'accent'}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Access {portal.title}
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>

        {/* Foundation Architecture Highlights */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Security & Database Foundations
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="font-semibold text-slate-900 flex items-center gap-2 mb-1">
                <Code className="w-4 h-4 text-blue-600" /> Next.js App Router
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                SSR-ready architecture with Next.js edge middleware session verification.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="font-semibold text-slate-900 flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> PostgreSQL RLS
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Strict Row Level Security policies protecting personal and academic records.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="font-semibold text-slate-900 flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-indigo-600" /> Supabase Auth
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Secure credentials validation, automatic profile creation trigger, and anti-tamper guards.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="font-semibold text-slate-900 flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-amber-600" /> Role-Based Routing
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Automatic role determination from database profiles upon sign-in.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Campus Nexus</span>
            <span>— Institutional Student Development & Mentoring Portal</span>
          </div>
          <div>Phase 2 • Built with Next.js, PostgreSQL, Tailwind & Supabase Auth</div>
        </div>
      </footer>
    </div>
  );
}
