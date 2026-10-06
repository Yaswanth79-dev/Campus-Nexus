import React, { ReactNode } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function HODLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout role="hod">{children}</DashboardLayout>;
}
