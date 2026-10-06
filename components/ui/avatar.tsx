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
            'rounded-full object-cover border border-slate-200 shadow-xs',
            sizeClasses[size],
            className
          )}
        />
      ) : (
        <div
          className={cn(
            'flex items-center justify-center rounded-full font-semibold select-none shadow-xs border',
            role === 'student' && 'bg-blue-100 text-blue-800 border-blue-200',
            role === 'faculty' && 'bg-indigo-100 text-indigo-800 border-indigo-200',
            role === 'hod' && 'bg-slate-900 text-white border-slate-800',
            !role && 'bg-slate-100 text-slate-700 border-slate-200',
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
            'absolute bottom-0 right-0 rounded-full ring-2 ring-white',
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
