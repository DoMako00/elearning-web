import { AlertCircle, RefreshCw } from "lucide-react";
import { useDashboardEnrollment } from "../hooks/useDashboardEnrollment";
import type { ClassifiedStudentApiError } from "../api/studentApiErrors";
import { useAuth } from "../../../app/providers/AuthProvider";
import { DashboardBento } from "../components/DashboardBento";
import { EmptyLearningState } from "../components/EmptyLearningState";
import { HomeDashboardSkeleton } from "../../../components/ui/Skeleton";

function DashboardLoadingState() {
  return <HomeDashboardSkeleton />;
}

function DashboardErrorState({ error, onRetry }: { error?: ClassifiedStudentApiError; onRetry: () => void }) {
  // Membership/scope rejections are not connectivity problems; retrying them
  // cannot help, so only transient failures offer "Try again".
  const retryable = !error || error.kind === "unavailable" || error.kind === "unknown";
  return (
    <section className="dashboard-feedback dashboard-feedback--error" aria-labelledby="dashboard-error-title" role="alert">
      <span className="dashboard-feedback__error-icon" aria-hidden="true"><AlertCircle /></span>
      <div>
        <h1 id="dashboard-error-title">{error && error.kind !== "unavailable" ? error.title : "We couldn’t load your learning dashboard"}</h1>
        <p>{error?.message ?? "Please check your connection and try again."}</p>
      </div>
      {retryable ? <button type="button" onClick={onRetry}><RefreshCw aria-hidden="true" /><span>Try again</span></button> : null}
    </section>
  );
}

export function HomePage() {
  const { status, courses, error, retry } = useDashboardEnrollment();
  const auth = useAuth();

  if (status === "loading") return <DashboardLoadingState />;
  if (status === "error") return <DashboardErrorState error={error} onRetry={retry} />;

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
