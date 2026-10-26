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
  Award,
  CheckCircle2,
  Lock,
  ChevronRight,
  TrendingUp,
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
      icon: <GraduationCap className="w-6 h-6 text-blue-600 stroke-[2.2]" />,
      badgeColor: 'student' as const,
      route: '/student/dashboard',
      features: ['Skill Gap Analysis', 'Project Repository', 'Verified Credentials', 'Career Milestones'],
      accentGradient: 'from-blue-600 to-indigo-600',
      lightBg: 'bg-blue-50/70',
    },
    {
      role: 'faculty' as UserRole,
      title: 'Faculty Portal',
      subtitle: 'Mentoring & Guidance Hub',
      description:
        'Manage assigned mentees, track student progress, address concerns, post opportunities, and review innovation ideas.',
      icon: <Users className="w-6 h-6 text-indigo-600 stroke-[2.2]" />,
      badgeColor: 'faculty' as const,
      route: '/faculty/dashboard',
      features: ['Assigned Mentees', 'Mentoring Sessions', 'Student Concerns', 'Idea Review Hub'],
      accentGradient: 'from-indigo-600 to-purple-600',
      lightBg: 'bg-indigo-50/70',
    },
    {
      role: 'hod' as UserRole,
      title: 'HOD Department Portal',
      subtitle: 'Intelligence & Governance Hub',
      description:
        'Department-wide analytics, mentoring supervision, feedback review, resource allocation, and strategic reports.',
      icon: <BarChart3 className="w-6 h-6 text-slate-900 stroke-[2.2]" />,
      badgeColor: 'hod' as const,
      route: '/hod/dashboard',
      features: ['Department Analytics', 'Grievance Redressal', 'Accreditation Reports', 'Readiness Index'],
      accentGradient: 'from-slate-900 to-indigo-950',
      lightBg: 'bg-slate-100/70',
    },
  ];

  const departmentStats = [
    { label: 'Active IT Students', value: '520+', icon: <GraduationCap className="w-5 h-5 text-blue-600" />, trend: '+14% growth' },
    { label: 'Faculty Mentors', value: '42', icon: <Users className="w-5 h-5 text-indigo-600" />, trend: '1:12 ratio' },
    { label: 'Verified Projects', value: '185+', icon: <Code className="w-5 h-5 text-emerald-600" />, trend: '100% evaluated' },
    { label: 'Industry Readiness', value: '94.8%', icon: <Award className="w-5 h-5 text-amber-600" />, trend: 'Top tier' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-600 selection:text-white relative overflow-hidden">
      {/* Background Decorative Ambient Gradients */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-200/25 via-blue-100/15 to-transparent blur-3xl -z-10" />
      <div className="pointer-events-none absolute top-96 -left-32 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl -z-10" />
      <div className="pointer-events-none absolute top-96 -right-32 w-96 h-96 bg-purple-300/10 rounded-full blur-3xl -z-10" />

      {/* Top Banner Navigation */}
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur-xl sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-blue-600 text-white shadow-[0_2px_10px_rgba(79,70,229,0.3)]">
              <Cpu className="w-5 h-5 text-white stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg">
                  Campus Nexus
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  IT Dept Portal
                </span>
              </div>
              <p className="hidden md:block text-xs text-slate-500 font-medium">
                Student Development &amp; Department Intelligence System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && role ? (
              <Link href={ROLE_CONFIGS[role]?.defaultRoute || '/student/dashboard'}>
                <Button variant="accent" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Enter My Portal
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    Portal Sign In
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 w-full">
        <div className="text-center max-w-4xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-indigo-200/80 shadow-[0_2px_8px_rgba(79,70,229,0.08)] text-indigo-800 text-xs font-semibold mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Institutional Intelligence • Supabase Auth &amp; PostgreSQL RLS</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-[1.1] sm:leading-[1.1]">
            Empowering IT Talent Through{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-800 bg-clip-text text-transparent">
              Mentoring &amp; Intelligence
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            A unified institutional operating system for the Information Technology Department—connecting
            Students, Faculty Mentors, and Department Leadership.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link href="/login">
              <Button size="lg" variant="accent" rightIcon={<ArrowRight className="w-4 h-4" />} className="w-full sm:w-auto px-7 py-3 text-sm font-bold shadow-md">
                Launch Portal Workspace
              </Button>
            </Link>
            <a href="#roles">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto px-6 py-3 text-sm font-semibold">
                Explore Portals
              </Button>
            </a>
          </div>

          {/* Workflow Diagram Banner */}
          <div className="mt-10 inline-flex flex-wrap items-center justify-center gap-2 text-xs font-bold text-slate-700 bg-white/90 backdrop-blur-md px-5 py-3 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-blue-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Student Skill Growth
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-indigo-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" /> Faculty Mentoring &amp; Endorsement
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-900" /> HOD Governance &amp; Insights
            </span>
          </div>
        </div>

        {/* Live Department Metrics Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {departmentStats.map((stat) => (
            <div
              key={stat.label}
              className="p-5 rounded-2xl sm:rounded-3xl border border-slate-200/70 bg-white/90 backdrop-blur-md shadow-[0_1px_3px_rgba(15,23,42,0.03),0_6px_20px_-4px_rgba(15,23,42,0.04)]"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{stat.label}</span>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">{stat.icon}</div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{stat.value}</div>
              <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <TrendingUp className="w-3 h-3" />
                <span>{stat.trend}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Role Portal Cards Section */}
        <div id="roles" className="mb-20">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Integrated Multi-Role Architecture
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Select your role to access dedicated tools, dashboards, and workflows
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {rolePortals.map((portal) => (
              <Card
                key={portal.role}
                hoverable
                className="flex flex-col justify-between p-7 border-slate-200/80 bg-white/95 relative overflow-hidden group shadow-[0_4px_24px_-4px_rgba(15,23,42,0.04)]"
              >
                <div>
                  <div className="flex items-start justify-between mb-5">
                    <div className={portal.lightBg + " p-3.5 rounded-2xl border border-slate-200/60 shadow-xs transition-transform duration-300 group-hover:scale-105"}>
                      {portal.icon}
                    </div>
                    <Badge variant={portal.badgeColor} size="sm" dot>
                      {ROLE_CONFIGS[portal.role].badgeLabel}
                    </Badge>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">{portal.title}</h3>
                  <p className="text-xs font-semibold text-indigo-600 mb-3">{portal.subtitle}</p>
                  <p className="text-sm text-slate-600 leading-relaxed mb-6 font-normal">
                    {portal.description}
                  </p>

                  <div className="space-y-2.5 border-t border-slate-100/90 pt-5 mb-6">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Core Workflows:
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      {portal.features.map((feat) => (
                        <div
                          key={feat}
                          className="text-xs text-slate-700 flex items-center gap-2 font-medium"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 stroke-[2.5]" />
                          <span>{feat}</span>
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
        </div>

        {/* Foundation Architecture Highlights */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/80 p-8 sm:p-10 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.03)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
            <div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2.5 tracking-tight">
                <ShieldCheck className="w-6 h-6 text-indigo-600 stroke-[2.2]" />
                Institutional Security &amp; Database Foundations
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Engineered with Zero-Trust principles, encrypted sessions, and Row Level Security.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200/70">
              <Lock className="w-3.5 h-3.5" />
              <span>RLS Verified &amp; Certified</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
            <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/60 hover:bg-white transition-all">
              <div className="font-bold text-slate-900 flex items-center gap-2 mb-1.5">
                <Code className="w-4 h-4 text-blue-600" /> Next.js App Router
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                SSR-ready architecture with Next.js edge middleware token validation.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/60 hover:bg-white transition-all">
              <div className="font-bold text-slate-900 flex items-center gap-2 mb-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> PostgreSQL RLS
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                Strict Row Level Security policies protecting personal and academic records.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/60 hover:bg-white transition-all">
              <div className="font-bold text-slate-900 flex items-center gap-2 mb-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" /> Supabase Auth
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                Secure credentials validation, automatic profile synchronization, and anti-tamper guards.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/60 hover:bg-white transition-all">
              <div className="font-bold text-slate-900 flex items-center gap-2 mb-1.5">
                <BookOpen className="w-4 h-4 text-amber-600" /> Role-Based Routing
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                Dynamic role determination and automatic routing upon successful verification.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div>
              <span className="font-bold text-slate-800">Campus Nexus</span>
              <span className="text-slate-400 ml-1.5">• Information Technology Department Portal</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-slate-400 font-medium">
            <span>Next.js 16</span>
            <span>•</span>
            <span>PostgreSQL &amp; RLS</span>
            <span>•</span>
            <span>Supabase Auth</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

