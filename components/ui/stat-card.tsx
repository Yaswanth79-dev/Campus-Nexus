import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Users,
  Code,
  Award,
  Briefcase,
  Layers,
  GraduationCap,
  MessageSquare,
  ShieldAlert,
  Lightbulb,
  BookOpen,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { StatCardData } from '@/types/dashboard';

// Dynamic icon mapper for string icon names
export function getDashboardIcon(iconName: string, className = 'w-5 h-5') {
  switch (iconName.toLowerCase()) {
    case 'users':
      return <Users className={className} />;
    case 'code':
    case 'projects':
      return <Code className={className} />;
    case 'award':
    case 'certifications':
    case 'achievements':
      return <Award className={className} />;
    case 'briefcase':
    case 'internships':
    case 'career':
      return <Briefcase className={className} />;
    case 'layers':
    case 'skills':
      return <Layers className={className} />;
    case 'graduation-cap':
    case 'mentoring':
    case 'students':
    case 'faculty':
      return <GraduationCap className={className} />;
    case 'message-square':
    case 'concerns':
    case 'feedback':
      return <MessageSquare className={className} />;
    case 'shield-alert':
    case 'alerts':
      return <ShieldAlert className={className} />;
    case 'lightbulb':
    case 'innovation':
    case 'ideas':
      return <Lightbulb className={className} />;
    case 'book-open':
    case 'resources':
      return <BookOpen className={className} />;
    case 'check-circle':
    case 'readiness':
      return <CheckCircle2 className={className} />;
    case 'calendar':
    case 'sessions':
      return <Calendar className={className} />;
    default:
      return <Sparkles className={className} />;
  }
}

export function StatCard({
  title,
  value,
  subtext,
  change,
  icon,
  variant = 'default',
  href,
}: StatCardData) {
  const iconElement = getDashboardIcon(icon, 'w-5 h-5 stroke-[2.2]');

  const iconBgClasses = {
    default: 'bg-slate-100 text-slate-800 ring-1 ring-slate-200/70 shadow-xs',
    blue: 'bg-blue-50/90 text-blue-600 ring-1 ring-blue-200/70 shadow-[0_2px_8px_rgba(37,99,235,0.12)]',
    indigo: 'bg-indigo-50/90 text-indigo-600 ring-1 ring-indigo-200/70 shadow-[0_2px_8px_rgba(79,70,229,0.12)]',
    emerald: 'bg-emerald-50/90 text-emerald-600 ring-1 ring-emerald-200/70 shadow-[0_2px_8px_rgba(16,185,129,0.12)]',
    amber: 'bg-amber-50/90 text-amber-700 ring-1 ring-amber-200/70 shadow-[0_2px_8px_rgba(217,119,6,0.12)]',
    rose: 'bg-rose-50/90 text-rose-600 ring-1 ring-rose-200/70 shadow-[0_2px_8px_rgba(225,29,72,0.12)]',
  };

  const CardWrapper = href ? 'a' : 'div';

  return (
    <CardWrapper
      href={href}
      className={cn(
        'group relative flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-slate-200/70 bg-white/95 backdrop-blur-md p-6 sm:p-7',
        'shadow-[0_1px_3px_rgba(15,23,42,0.03),0_8px_24px_-4px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.95)]',
        'transition-all duration-300',
        href && 'hover:-translate-y-1 hover:shadow-[0_14px_36px_-6px_rgba(15,23,42,0.08),0_4px_16px_rgba(99,102,241,0.06)] hover:border-indigo-200/90 cursor-pointer'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <div className="mt-2.5 flex items-baseline gap-2.5">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              {value}
            </span>
            {change && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1',
                  change.trend === 'up' && 'bg-emerald-50 text-emerald-700 ring-emerald-200/60',
                  change.trend === 'down' && 'bg-rose-50 text-rose-700 ring-rose-200/60',
                  change.trend === 'neutral' && 'bg-slate-100 text-slate-600 ring-slate-200/60'
                )}
              >
                {change.trend === 'up' && <TrendingUp className="w-3.5 h-3.5 stroke-[2.2]" />}
                {change.trend === 'down' && <TrendingDown className="w-3.5 h-3.5 stroke-[2.2]" />}
                {change.trend === 'neutral' && <Minus className="w-3.5 h-3.5 stroke-[2.2]" />}
                {change.value}
              </span>
            )}
          </div>
        </div>

        <div
          className={cn(
            'rounded-2xl p-3 shrink-0 transition-transform duration-300 group-hover:scale-105',
            iconBgClasses[variant]
          )}
        >
          {iconElement}
        </div>
      </div>

      {subtext && (
        <p className="mt-4 text-xs text-slate-500 flex items-center gap-1.5 border-t border-slate-100/80 pt-3 leading-normal">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
          <span>{subtext}</span>
        </p>
      )}
    </CardWrapper>
  );
}
