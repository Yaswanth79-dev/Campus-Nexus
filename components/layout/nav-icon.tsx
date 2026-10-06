import React from 'react';
import {
  LayoutDashboard,
  User,
  Layers,
  Code,
  Award,
  FileCheck,
  Briefcase,
  Compass,
  Target,
  Sparkles,
  Lightbulb,
  BookOpen,
  MessageSquare,
  Bell,
  Settings,
  Users,
  GraduationCap,
  AlertCircle,
  Megaphone,
  BarChart3,
  HeartHandshake,
  FileText,
} from 'lucide-react';

export function getNavIcon(iconName: string, className = 'w-4 h-4 shrink-0') {
  switch (iconName) {
    case 'LayoutDashboard':
      return <LayoutDashboard className={className} />;
    case 'User':
      return <User className={className} />;
    case 'Layers':
      return <Layers className={className} />;
    case 'Code':
      return <Code className={className} />;
    case 'Award':
      return <Award className={className} />;
    case 'FileCheck':
      return <FileCheck className={className} />;
    case 'Briefcase':
      return <Briefcase className={className} />;
    case 'Compass':
      return <Compass className={className} />;
    case 'Target':
      return <Target className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'Lightbulb':
      return <Lightbulb className={className} />;
    case 'BookOpen':
      return <BookOpen className={className} />;
    case 'MessageSquare':
      return <MessageSquare className={className} />;
    case 'Bell':
      return <Bell className={className} />;
    case 'Settings':
      return <Settings className={className} />;
    case 'Users':
      return <Users className={className} />;
    case 'GraduationCap':
      return <GraduationCap className={className} />;
    case 'AlertCircle':
      return <AlertCircle className={className} />;
    case 'Megaphone':
      return <Megaphone className={className} />;
    case 'BarChart3':
      return <BarChart3 className={className} />;
    case 'HeartHandshake':
      return <HeartHandshake className={className} />;
    case 'FileText':
      return <FileText className={className} />;
    default:
      return <LayoutDashboard className={className} />;
  }
}
