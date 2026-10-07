import { LearningManagement } from '@/app/components/learning/LearningManagement';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function FacultyLearningPage() {
  return (
    <DashboardLayout role="hod">
      <div className="p-6 max-w-6xl mx-auto">
        <LearningManagement />
      </div>
    </DashboardLayout>
  );
}
