/**
 * CAMPUS NEXUS - Role Definitions
 * Database Role Enum matches PostgreSQL: 'student' | 'faculty' | 'hod'
 */

export type UserRole = 'student' | 'faculty' | 'hod';

export interface RoleConfig {
  role: UserRole;
  displayName: string;
  badgeLabel: string;
  badgeVariant: 'student' | 'faculty' | 'hod';
  defaultRoute: string;
  description: string;
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  student: {
    role: 'student',
    displayName: 'Student',
    badgeLabel: 'IT Student',
    badgeVariant: 'student',
    defaultRoute: '/student/dashboard',
    description: 'Track skills, projects, certifications, internships, mentoring, and opportunities.',
  },
  faculty: {
    role: 'faculty',
    displayName: 'Faculty Member',
    badgeLabel: 'Faculty Mentor',
    badgeVariant: 'faculty',
    defaultRoute: '/faculty/dashboard',
    description: 'Mentor assigned students, review innovation ideas, address concerns, and post opportunities.',
  },
  hod: {
    role: 'hod',
    displayName: 'Head of Department',
    badgeLabel: 'HOD / Department Admin',
    badgeVariant: 'hod',
    defaultRoute: '/hod/dashboard',
    description: 'Department-wide analytics, mentoring supervision, feedback review, and strategic reporting.',
  },
};

export const ALLOWED_ROLES: UserRole[] = ['student', 'faculty', 'hod'];

export function normalizeRole(role: unknown): UserRole | null {
  if (typeof role !== 'string') return null;
  const lower = role.toLowerCase().trim();
  if (lower === 'student' || lower === 'faculty' || lower === 'hod') {
    return lower as UserRole;
  }
  return null;
}

export function isValidRole(role: unknown): role is UserRole {
  return normalizeRole(role) !== null;
}
