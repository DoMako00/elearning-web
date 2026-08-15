import { AlertCircle, LoaderCircle, RefreshCw } from "lucide-react";
import type { RouteObject } from "react-router-dom";
import { useDashboardEnrollment } from "../dashboard/useDashboardEnrollment";
import { AppShell } from "../../components/layout/AppShell";
import { DashboardBento } from "../../components/ui/DashboardBento";
import { EmptyLearningState } from "../../components/ui/EmptyLearningState";
import { SearchBar } from "../../components/ui/SearchBar";
import { UserHeaderActions } from "../../components/ui/UserHeaderActions";
import "./student-dashboard.css";

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

function DashboardContent() {
  const { status, enrolledCourses, retry } = useDashboardEnrollment();

  if (status === "loading") return <DashboardLoadingState />;
  if (status === "error") return <DashboardErrorState onRetry={retry} />;

  return enrolledCourses.length > 0 ? <DashboardBento /> : <EmptyLearningState />;
}

function StudentHeaderPreview() {
  return (
    <div className="student-dashboard">
      <header
        className="student-dashboard__header"
        aria-label="Student dashboard header"
      >
        <div className="student-dashboard__search">
          <SearchBar />
        </div>
        <div className="student-dashboard__actions">
          <UserHeaderActions
            avatarSrc="https://i.pravatar.cc/112?img=47"
            avatarAlt="Juliana"
            hasNotification
          />
        </div>
      </header>
      <div className="student-dashboard__content">
        <DashboardContent />
      </div>
    </div>
  );
}

export const studentRoutes: RouteObject[] = [
  {
    path: "/",
    element: (
      <AppShell>
        <StudentHeaderPreview />
      </AppShell>
    ),
  },
];
