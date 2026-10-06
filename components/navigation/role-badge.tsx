import React from 'react';
import { UserRole, ROLE_CONFIGS, normalizeRole } from '@/types/roles';
import { Badge } from '@/components/ui/badge';

export interface RoleBadgeProps {
  role: UserRole | string;
  showDot?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function RoleBadge({ role, showDot = true, size = 'md', className }: RoleBadgeProps) {
  const norm = normalizeRole(role) || 'student';
  const config = ROLE_CONFIGS[norm];

  return (
    <Badge
      variant={config?.badgeVariant || 'default'}
      size={size}
      dot={showDot}
      className={className}
    >
      {config?.badgeLabel || norm.toUpperCase()}
    </Badge>
  );
}
