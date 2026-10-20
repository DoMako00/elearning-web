import { useMemo, useState } from "react";
import { Sparkles, X } from "lucide-react";
import robotAsset from "../../../../Assets/dashboard/doctor-robot.webp";
import { AILearningGuide } from "../../../../components/ui/AILearningGuide";
import ContinueLearning from "../../../../components/ui/Continue_Learning/continue_learning";
import { MyProgress } from "../../../../components/ui/MyProgress";
import { RecommendedCourses } from "../../../../components/ui/RecommendedCourses";
import { Upcoming } from "../../../../components/ui/Upcoming";
import { WeeklyGoalCard } from "../WeeklyGoalCard";
import { YourStreak } from "../YourStreak";
import { useStudentLearningPreferences, useStudentProgress, useSetWeeklyLessonGoal } from "../../api/useStudentLearning";
import { useStudentAssignments } from "../../api/useStudentAssignments";
import { useStudentExploreCourses } from "../../hooks/useDashboardEnrollment";
import type { StudentAssignmentDto } from "../../api/studentAssignmentsApi";
import type { UpcomingItem } from "../../../../components/ui/Upcoming/upcoming.types";
import type { StudentCourseItem } from "../../api/studentCoursesApi";
import "./DashboardBento.css";

export interface DashboardBentoProps {
  courses?: readonly StudentCourseItem[];
}

function buildAssignmentItems(assignments: readonly StudentAssignmentDto[] = []): UpcomingItem[] {
  return assignments
    .filter((assignment) => assignment.status === "open")
    .slice()
    .sort((a, b) => {
      const aDue = a.dueAt ? Date.parse(a.dueAt) : Number.POSITIVE_INFINITY;
      const bDue = b.dueAt ? Date.parse(b.dueAt) : Number.POSITIVE_INFINITY;
      return aDue - bDue || a.title.localeCompare(b.title);
    })
    .slice(0, 5)
    .map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      time: assignment.dueAt
        ? `Due ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(assignment.dueAt))}`
        : "No due date",
      iconType: "assignment",
      tag: assignment.courseTitle ?? "General assignment",
      href: `/assignments/${encodeURIComponent(assignment.id)}`,
    }));
}

export function DashboardBento({ courses = [] }: DashboardBentoProps) {
  const [isAIOpen, setIsAIOpen] = useState(false);
  const progress = useStudentProgress();
  const preferences = useStudentLearningPreferences();
  const setWeeklyGoal = useSetWeeklyLessonGoal();
  const assignments = useStudentAssignments();
  const exploration = useStudentExploreCourses();
  const assignmentItems = useMemo(() => buildAssignmentItems(assignments.data), [assignments.data]);
  const progressValues = progress.data?.weekDays.length
    ? progress.data.weekDays.map((day) => day.completedLessons)
    : [0, 0, 0, 0, 0, 0, 0];

  return (
    <section className="dashboard-bento" aria-label="Learning dashboard">
      <h1 className="sr-only">Student Home Dashboard</h1>
      <div className="dashboard-bento__row dashboard-bento__row--top">
        <div className="dashboard-bento__slot dashboard-bento__slot--continue">
          <ContinueLearning courses={courses} progress={progress.data} progressLoading={progress.isLoading} progressError={progress.isError} />
        </div>
        <div className="dashboard-bento__slot dashboard-bento__slot--ai">
          <AILearningGuide />
        </div>
        <div className="dashboard-bento__slot dashboard-bento__slot--weekly">
          <WeeklyGoalCard
            completedLessons={progress.data?.weeklyCompletedLessons}
            targetLessons={preferences.data?.weeklyLessonGoal ?? null}
            completedDays={progress.data?.weekDays.map((day) => day.completedLessons > 0)}
            goalSet={preferences.data?.weeklyLessonGoal !== null && preferences.data?.weeklyLessonGoal !== undefined}
            loading={progress.isLoading || preferences.isLoading}
            loadError={preferences.isError && !preferences.data ? "Your weekly goal couldn't be loaded." : null}
            onRetry={() => void preferences.refetch()}
            saving={setWeeklyGoal.isPending}
            error={setWeeklyGoal.error instanceof Error ? "Weekly goal could not be saved. Refresh and try again." : null}
            onGoalSet={(lessons) => {
              // Never write without the server version of the preferences we read.
              if (!preferences.data) return;
              setWeeklyGoal.mutate({ weeklyLessonGoal: lessons, expectedVersion: preferences.data.version });
            }}
          />
        </div>
      </div>

      <div className="dashboard-bento__row dashboard-bento__row--middle">
        <div className="dashboard-bento__slot dashboard-bento__slot--progress">
          <MyProgress
            completionPercentage={progress.data?.completionPercent}
            chartData={progressValues}
            chartUnit="lesson"
            hasProgress={(progress.data?.totalCompletedLessons ?? 0) > 0}
            loading={progress.isLoading}
            error={progress.isError}
          />
        </div>
        <div className="dashboard-bento__slot dashboard-bento__slot--upcoming">
          <Upcoming
            title="Assignments"
            count={assignmentItems.length}
            items={assignmentItems}
            actionPath="/assignments"
            actionLabel="View Assignments"
            loading={assignments.isLoading}
            errorMessage={assignments.isError ? "Assignments could not be loaded. Please try again." : undefined}
            emptyMessage="No open assignments right now."
          />
        </div>
        <div className="dashboard-bento__slot dashboard-bento__slot--streak">
          {/* streakDays=0 until backend data is available */}
          <YourStreak />
        </div>
      </div>

      <div className="dashboard-bento__row dashboard-bento__row--bottom">
        <div className="dashboard-bento__slot dashboard-bento__slot--recommended">
          <RecommendedCourses
            courses={exploration.data ?? []}
            loading={exploration.isLoading}
            error={exploration.isError}
          />
        </div>
      </div>

      <button
        type="button"
        className="ai-guide-floating-btn"
        onClick={() => setIsAIOpen((prev) => !prev)}
        aria-label="Open AI Learning Guide"
        aria-expanded={isAIOpen}
      >
        <span className="ai-guide-floating-sparkle" aria-hidden="true">
          <Sparkles />
        </span>
        <img
          src={robotAsset}
          alt=""
          aria-hidden="true"
          className="ai-guide-floating-robot"
        />
        <span className="ai-guide-floating-badge">AI Guide</span>
      </button>

      {isAIOpen && (
        <div className="ai-guide-modal-overlay" onClick={() => setIsAIOpen(false)}>
          <div className="ai-guide-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="ai-guide-modal-close"
              onClick={() => setIsAIOpen(false)}
              aria-label="Close AI Learning Guide"
            >
              <X aria-hidden="true" />
            </button>
            <div className="ai-guide-modal-inner">
              <AILearningGuide />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
