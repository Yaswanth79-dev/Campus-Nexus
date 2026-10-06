import { NavItem, RoleNavigation } from '@/types/navigation';
import { UserRole } from '@/types/roles';

export const STUDENT_NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/student/dashboard',
    icon: 'LayoutDashboard',
    section: 'main',
  },
  {
    title: 'My Profile',
    href: '/student/profile',
    icon: 'User',
    section: 'main',
  },
  {
    title: 'Skills',
    href: '/student/skills',
    icon: 'Layers',
    section: 'development',
  },
  {
    title: 'Projects',
    href: '/student/projects',
    icon: 'Code',
    section: 'development',
  },
  {
    title: 'Learning Hub',
    href: '/student/learning',
    icon: 'GraduationCap',
    badge: 'Credits',
    badgeVariant: 'primary',
    section: 'development',
  },
  {
    title: 'Achievements',
    href: '/student/achievements',
    icon: 'Award',
    section: 'development',
  },
  {
    title: 'Certifications',
    href: '/student/certifications',
    icon: 'FileCheck',
    section: 'development',
  },
  {
    title: 'Internships',
    href: '/student/internships',
    icon: 'Briefcase',
    section: 'development',
  },
  {
    title: 'Career',
    href: '/student/career',
    icon: 'Compass',
    section: 'development',
  },
  {
    title: 'Skill Gap',
    href: '/student/skill-gap',
    icon: 'Target',
    section: 'development',
  },
  {
    title: 'Opportunities',
    href: '/student/opportunities',
    icon: 'Sparkles',
    badge: 'New',
    badgeVariant: 'success',
    section: 'engagement',
  },
  {
    title: 'Innovation Hub',
    href: '/student/innovation',
    icon: 'Lightbulb',
    section: 'engagement',
  },
  {
    title: 'Resources',
    href: '/student/resources',
    icon: 'BookOpen',
    section: 'engagement',
  },
  {
    title: 'Feedback & Grievances',
    href: '/student/feedback',
    icon: 'MessageSquare',
    section: 'engagement',
  },
  {
    title: 'Notifications',
    href: '/student/notifications',
    icon: 'Bell',
    badge: '2',
    badgeVariant: 'default',
    section: 'system',
  },
  {
    title: 'Settings',
    href: '/student/settings',
    icon: 'Settings',
    section: 'system',
  },
];

export const FACULTY_NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/faculty/dashboard',
    icon: 'LayoutDashboard',
    section: 'main',
  },
  {
    title: 'My Students',
    href: '/faculty/students',
    icon: 'Users',
    badge: '24',
    badgeVariant: 'primary',
    section: 'main',
  },
  {
    title: 'Mentoring',
    href: '/faculty/mentoring',
    icon: 'GraduationCap',
    section: 'development',
  },
  {
    title: 'Student Concerns',
    href: '/faculty/concerns',
    icon: 'AlertCircle',
    badge: '2',
    badgeVariant: 'warning',
    section: 'development',
  },
  {
    title: 'Resources',
    href: '/faculty/resources',
    icon: 'BookOpen',
    section: 'engagement',
  },
  {
    title: 'Opportunities',
    href: '/faculty/opportunities',
    icon: 'Sparkles',
    section: 'engagement',
  },
  {
    title: 'Innovation Hub',
    href: '/faculty/innovation',
    icon: 'Lightbulb',
    badge: '4',
    badgeVariant: 'primary',
    section: 'engagement',
  },
  {
    title: 'Announcements',
    href: '/faculty/announcements',
    icon: 'Megaphone',
    section: 'engagement',
  },
  {
    title: 'Notifications',
    href: '/faculty/notifications',
    icon: 'Bell',
    badge: '5',
    badgeVariant: 'default',
    section: 'system',
  },
  {
    title: 'Settings',
    href: '/faculty/settings',
    icon: 'Settings',
    section: 'system',
  },
];

export const HOD_NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/hod/dashboard',
    icon: 'LayoutDashboard',
    section: 'main',
  },
  {
    title: 'Analytics',
    href: '/hod/analytics',
    icon: 'BarChart3',
    section: 'main',
  },
  {
    title: 'Students',
    href: '/hod/students',
    icon: 'Users',
    section: 'management',
  },
  {
    title: 'Faculty',
    href: '/hod/faculty',
    icon: 'GraduationCap',
    section: 'management',
  },
  {
    title: 'Mentoring',
    href: '/hod/mentoring',
    icon: 'HeartHandshake',
    section: 'management',
  },
  {
    title: 'Feedback & Grievances',
    href: '/hod/feedback',
    icon: 'MessageSquare',
    badge: '3 Open',
    badgeVariant: 'danger',
    section: 'management',
  },
  {
    title: 'Opportunities',
    href: '/hod/opportunities',
    icon: 'Sparkles',
    section: 'engagement',
  },
  {
    title: 'Innovation Hub',
    href: '/hod/innovation',
    icon: 'Lightbulb',
    section: 'engagement',
  },
  {
    title: 'Resources',
    href: '/hod/resources',
    icon: 'BookOpen',
    section: 'engagement',
  },
  {
    title: 'Announcements',
    href: '/hod/announcements',
    icon: 'Megaphone',
    section: 'engagement',
  },
  {
    title: 'Reports',
    href: '/hod/reports',
    icon: 'FileText',
    section: 'management',
  },
  {
    title: 'Notifications',
    href: '/hod/notifications',
    icon: 'Bell',
    section: 'system',
  },
  {
    title: 'Settings',
    href: '/hod/settings',
    icon: 'Settings',
    section: 'system',
  },
];

export const ROLE_NAVIGATION_MAP: Record<UserRole, RoleNavigation> = {
  student: {
    role: 'student',
    portalTitle: 'Student Portal',
    portalSubtitle: 'Development & Skills',
    items: STUDENT_NAV_ITEMS,
  },
  faculty: {
    role: 'faculty',
    portalTitle: 'Faculty Portal',
    portalSubtitle: 'Mentoring & Guidance',
    items: FACULTY_NAV_ITEMS,
  },
  hod: {
    role: 'hod',
    portalTitle: 'Department Head',
    portalSubtitle: 'Intelligence & Governance',
    items: HOD_NAV_ITEMS,
  },
};
