import { QuizManager } from '@/app/components/learning/QuizManager';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function FacultyQuizPage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout role="faculty">
      <div className="p-6 max-w-4xl mx-auto">
        <QuizManager moduleId={params.id} />
      </div>
    </DashboardLayout>
  );
}
