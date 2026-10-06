import { UserRole } from './roles';

export interface NavItem {
  title: string;
  href: string;
  icon: string; // Lucide icon identifier
  badge?: string | number;
  badgeVariant?: 'default' | 'primary' | 'warning' | 'danger' | 'success';
  isExternal?: boolean;
  disabled?: boolean;
  description?: string;
  section?: 'main' | 'development' | 'engagement' | 'management' | 'system';
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export interface RoleNavigation {
  role: UserRole;
  portalTitle: string;
  portalSubtitle: string;
  items: NavItem[];
}
