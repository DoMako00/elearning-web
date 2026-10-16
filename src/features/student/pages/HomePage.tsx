import { AlertCircle, RefreshCw } from "lucide-react";
import { useDashboardEnrollment } from "../hooks/useDashboardEnrollment";
import { HomeDashboard, HomeDashboardSkeletonV2 } from "../components/HomeDashboard/HomeDashboard";
import { HomeOnboarding } from "../components/HomeDashboard/HomeOnboarding";

function DashboardLoadingState() {
  return <HomeDashboardSkeletonV2 />;
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

  if (status === "loading") return <DashboardLoadingState />;
  if (status === "error") return <DashboardErrorState onRetry={retry} />;

  return enrolledCourses.length > 0 ? (
    <HomeDashboard courses={courses} />
  ) : (
    <HomeOnboarding />
  );
}
