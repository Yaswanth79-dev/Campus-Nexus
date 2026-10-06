import React, { ReactNode } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function StudentLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout role="student">{children}</DashboardLayout>;
}
