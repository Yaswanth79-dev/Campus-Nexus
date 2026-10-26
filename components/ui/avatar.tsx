import React from 'react';
import { getInitials } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { UserRole } from '@/types/roles';

export interface AvatarProps {
  name: string;
  src?: string;
  role?: UserRole;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showRoleIndicator?: boolean;
}

const sizeClasses = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
  xl: 'w-16 h-16 text-xl font-bold',
};

const roleIndicatorColors: Record<UserRole, string> = {
  student: 'bg-blue-500',
  faculty: 'bg-indigo-500',
  hod: 'bg-slate-900 ring-1 ring-white',
};

export function Avatar({
  name,
  src,
  role,
  size = 'md',
  className,
  showRoleIndicator = false,
}: AvatarProps) {
  const initials = getInitials(name);

  return (
    <div className="relative inline-flex shrink-0">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          className={cn(
            'rounded-full object-cover border border-slate-200/80 shadow-xs ring-1 ring-black/[0.04]',
            sizeClasses[size],
            className
          )}
        />
      ) : (
        <div
          className={cn(
            'flex items-center justify-center rounded-full font-bold select-none shadow-xs border',
            role === 'student' && 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-blue-400/40 shadow-[0_2px_8px_rgba(59,130,246,0.25)]',
            role === 'faculty' && 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white border-indigo-400/40 shadow-[0_2px_8px_rgba(79,70,229,0.25)]',
            role === 'hod' && 'bg-gradient-to-br from-slate-900 to-indigo-950 text-white border-slate-700 shadow-[0_2px_8px_rgba(15,23,42,0.3)]',
            !role && 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 border-slate-300',
            sizeClasses[size],
            className
          )}
        >
          {initials}
        </div>
      )}

      {showRoleIndicator && role && (
        <span
          title={role}
          className={cn(
            'absolute bottom-0 right-0 rounded-full ring-2 ring-white shadow-xs',
            size === 'sm' && 'w-2 h-2',
            size === 'md' && 'w-2.5 h-2.5',
            size === 'lg' && 'w-3 h-3',
            size === 'xl' && 'w-4 h-4',
            roleIndicatorColors[role]
          )}
        />
      )}
    </div>
  );
}
