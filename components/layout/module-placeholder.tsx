import React, { ReactNode } from 'react';
import { PageHeader, BreadcrumbItem } from './page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { UserRole, normalizeRole } from '@/types/roles';

export interface ModulePlaceholderProps {
  title: string;
  description: string;
  role: UserRole | string;
  moduleName: string;
  icon?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
}

export function ModulePlaceholder({
  title,
  description,
  role,
  moduleName,
  icon,
  breadcrumbs,
  actions,
}: ModulePlaceholderProps) {
  const normRole = normalizeRole(role) || 'student';
  const roleBase = normRole.toLowerCase();
  const roleDisplay = normRole === 'hod' ? 'HOD' : normRole === 'faculty' ? 'Faculty' : 'Student';

  const defaultBreadcrumbs: BreadcrumbItem[] = breadcrumbs || [
    { label: `${roleDisplay} Portal`, href: `/${roleBase}/dashboard` },
    { label: title },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={defaultBreadcrumbs}
        actions={actions}
      />

      <EmptyState
        icon={icon}
        title={`${moduleName} Module`}
        description={`The ${moduleName} module is structured for Phase 3 implementation. Schemas, tables, and workflows will be integrated seamlessly with Supabase.`}
        actionLabel="Back to Dashboard"
        actionHref={`/${roleBase}/dashboard`}
      />
    </div>
  );
}
