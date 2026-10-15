import { AlertCircle, RefreshCw } from "lucide-react";
import { useDashboardEnrollment } from "../hooks/useDashboardEnrollment";
import { useAuth } from "../../../app/providers/AuthProvider";
import { DashboardBento } from "../components/DashboardBento";
import { EmptyLearningState } from "../components/EmptyLearningState";

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
  const { status, courses, retry } = useDashboardEnrollment();
  const auth = useAuth();

  if (status === "loading") return <DashboardLoadingState />;
  if (status === "error") return <DashboardErrorState onRetry={retry} />;

  if (auth.status === "authenticated") {
    // New Students still need the real assignment, recommendation, and zero-progress widgets.
    return <DashboardBento courses={courses} />;
  }

  return (
    <EmptyLearningState
      topics={courses.map((course: { title: string }) => course.title)}
      isAuthenticated={false}
    />
  );
}
