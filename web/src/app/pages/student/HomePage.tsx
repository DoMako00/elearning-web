import { AlertCircle, LoaderCircle, RefreshCw } from "lucide-react";
import { useDashboardEnrollment } from "../../dashboard/useDashboardEnrollment";
import { DashboardBento } from "../../../components/ui/DashboardBento";
import { EmptyLearningState } from "../../../components/ui/EmptyLearningState";

function DashboardLoadingState() {
  return (
    <section className="dashboard-feedback dashboard-feedback--loading" aria-label="Loading learning dashboard" aria-busy="true">
      <span className="dashboard-feedback__spinner" aria-hidden="true"><LoaderCircle /></span>
      <div>
        <h1>Loading your learning dashboard</h1>
        <p>We&apos;re checking your course enrollments.</p>
      </div>
    </section>
  );
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
  const { status, enrolledCourses, retry } = useDashboardEnrollment();

  if (status === "loading") return <DashboardLoadingState />;
  if (status === "error") return <DashboardErrorState onRetry={retry} />;

  return enrolledCourses.length > 0 ? <DashboardBento /> : <EmptyLearningState />;
}
