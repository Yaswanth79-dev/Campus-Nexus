export interface StatCardData {
  id: string;
  title: string;
  value: string | number;
  subtext?: string;
  change?: {
    value: string;
    trend: 'up' | 'down' | 'neutral';
    period?: string;
  };
  icon: string;
  variant?: 'default' | 'blue' | 'indigo' | 'emerald' | 'amber' | 'rose';
  href?: string;
}

export interface ProgressItem {
  id: string;
  label: string;
  percentage: number;
  target?: string;
  category?: string;
  statusColor?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'announcement' | 'mentoring' | 'opportunity' | 'grievance' | 'system';
  actionUrl?: string;
}

export interface OpportunityItem {
  id: string;
  title: string;
  organization: string;
  type: 'Internship' | 'Hackathon' | 'Workshop' | 'Placement Drive' | 'Certification';
  deadline: string;
  tag: string;
  location?: string;
  stipend?: string;
}

export interface MentoringSessionItem {
  id: string;
  studentName?: string;
  facultyName?: string;
  date: string;
  topic: string;
  status: 'Scheduled' | 'Completed' | 'Action Needed';
  notesCount?: number;
}
