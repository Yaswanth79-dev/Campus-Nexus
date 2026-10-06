import React, { ReactNode } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function FacultyLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout role="faculty">{children}</DashboardLayout>;
}
