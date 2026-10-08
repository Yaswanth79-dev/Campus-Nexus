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
  const iconElement = getDashboardIcon(icon);

  const iconBgClasses = {
    default: 'bg-slate-100 text-slate-700',
    blue: 'bg-blue-50 text-blue-600 ring-1 ring-blue-100',
    indigo: 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100',
    amber: 'bg-amber-50 text-amber-600 ring-1 ring-amber-100',
    rose: 'bg-rose-50 text-rose-600 ring-1 ring-rose-100',
  };

  const CardWrapper = href ? 'a' : 'div';

  return (
    <CardWrapper
      href={href}
      className={cn(
        'group relative flex flex-col justify-between rounded-[24px] border border-slate-200/60 bg-white/95 backdrop-blur-sm p-6 sm:p-7 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] transition-all duration-300',
        href && 'hover:-translate-y-1 hover:shadow-[0_12px_32px_-4px_rgba(0,0,0,0.06)] hover:border-slate-300/80 cursor-pointer'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              {value}
            </span>
            {change && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold',
                  change.trend === 'up' && 'bg-emerald-50 text-emerald-700',
                  change.trend === 'down' && 'bg-rose-50 text-rose-700',
                  change.trend === 'neutral' && 'bg-slate-100 text-slate-600'
                )}
              >
                {change.trend === 'up' && <TrendingUp className="w-3 h-3" />}
                {change.trend === 'down' && <TrendingDown className="w-3 h-3" />}
                {change.trend === 'neutral' && <Minus className="w-3 h-3" />}
                {change.value}
              </span>
            )}
          </div>
        </div>

        <div className={cn('rounded-2xl p-3 shrink-0 transition-transform group-hover:scale-105 shadow-sm', iconBgClasses[variant])}>
          {iconElement}
        </div>
      </div>

      {subtext && (
        <p className="mt-3 text-xs text-slate-500 flex items-center gap-1 border-t border-slate-100 pt-2.5">
          {subtext}
        </p>
      )}
    </CardWrapper>
  );
}
