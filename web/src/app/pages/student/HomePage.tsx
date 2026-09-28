import { AlertCircle, RefreshCw } from "lucide-react";
import { useDashboardEnrollment } from "../../dashboard/useDashboardEnrollment";
import { useAuth } from "../../providers/AuthProvider";
import { DashboardBento } from "../../../components/ui/DashboardBento";
import { EmptyLearningState } from "../../../components/ui/EmptyLearningState";

import { HomeDashboardSkeleton } from "../../../components/ui/Skeleton";

function DashboardLoadingState() {
  return <HomeDashboardSkeleton />;
}

function DashboardErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="dashboard-feedback dashboard-feedback--error" aria-labelledby="dashboard-error-title">
      <span className="dashboard-feedback__error-icon" aria-hidden="true"><AlertCircle /></span>
      <div>
        <h1 id="dashboard-error-title">We couldn&apos;t load your learning dashboard</h1>
        <p>Please check your connection and try again.</p>
      </div>
      <button type="button" onClick={onRetry}><RefreshCw aria-hidden="true" /><span>Try again</span></button>
    </section>
  );
}

export function HomePage() {
  const { status, enrolledCourses, courses, retry } = useDashboardEnrollment();
  const auth = useAuth();

  if (status === "loading") return <DashboardLoadingState />;
  if (status === "error") return <DashboardErrorState onRetry={retry} />;

  return enrolledCourses.length > 0 ? <DashboardBento courses={courses} /> : <EmptyLearningState topics={courses.map((course) => course.title)} isAuthenticated={auth.status === "authenticated"} />;
}
