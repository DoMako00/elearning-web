import { useMemo, useState } from "react";
import { Sparkles, X, TrendingUp } from "lucide-react";
import robotAsset from "../../../../Assets/dashboard/doctor-robot.webp";
import { AILearningGuide } from "../../../../components/ui/AILearningGuide";
import ContinueLearning from "../../../../components/ui/Continue_Learning/continue_learning";
import { MyProgress } from "../../../../components/ui/MyProgress";
import { RecommendedCourses } from "../../../../components/ui/RecommendedCourses";
import { Upcoming } from "../../../../components/ui/Upcoming";
import { WeeklyGoalCard } from "../WeeklyGoalCard";
import { YourStreak } from "../YourStreak";
import type { UpcomingItem } from "../../../../components/ui/Upcoming/upcoming.types";
import type { StudentCourseItem } from "../../api/studentCoursesApi";
import "./DashboardBento.css";

export interface DashboardBentoProps {
  courses?: readonly StudentCourseItem[];
  /**
   * Whether the user has completed at least one study session.
   * When false, data-dependent cards (MyProgress) show a first-session
   * placeholder instead of empty/broken states.
   */
  hasSession?: boolean;
}

function canOpenCourse(course: StudentCourseItem) {
  return course.access?.isEnrolled === true;
}

function buildAvailableSubjectItems(courses: readonly StudentCourseItem[]): UpcomingItem[] {
  return courses.filter(canOpenCourse).slice(0, 5).map((course) => ({
    id: course.courseId,
    title: course.title,
    time: `${course.lessonCount} lessons available`,
    iconType: "assignment",
    tag: course.unitLabel,
  }));
}

/** Shown in place of MyProgress before the user's first session. */
function NoSessionProgressCard() {
  return (
    <div className="no-session-card" role="status" aria-label="Start your first session to unlock progress tracking">
      <p className="no-session-card__title">My Progress</p>
      <div className="no-session-card__icon" aria-hidden="true">
        <TrendingUp strokeWidth={1.5} />
      </div>
      <p className="no-session-card__sub">Complete your first study session to start tracking your progress.</p>
      <div className="no-session-card__dots" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="no-session-card__dot" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

export function DashboardBento({ courses = [], hasSession = false }: DashboardBentoProps) {
  const [isAIOpen, setIsAIOpen] = useState(false);
  const availableSubjectItems = useMemo(() => buildAvailableSubjectItems(courses), [courses]);

  return (
    <section className="dashboard-bento" aria-label="Learning dashboard">
      <h1 className="sr-only">Student Home Dashboard</h1>
      <div className="dashboard-bento__row dashboard-bento__row--top">
        <div className="dashboard-bento__slot dashboard-bento__slot--continue">
          <ContinueLearning courses={courses} />
        </div>
        <div className="dashboard-bento__slot dashboard-bento__slot--ai">
          <AILearningGuide />
        </div>
        <div className="dashboard-bento__slot dashboard-bento__slot--weekly">
          {/* goalSet=false triggers the "Set your goal" first-time state */}
          <WeeklyGoalCard goalSet={false} />
        </div>
      </div>

      <div className="dashboard-bento__row dashboard-bento__row--middle">
        <div className="dashboard-bento__slot dashboard-bento__slot--progress">
          {hasSession
            ? <MyProgress />
            : <NoSessionProgressCard />}
        </div>
        <div className="dashboard-bento__slot dashboard-bento__slot--upcoming">
          <Upcoming
            title="Available subjects"
            count={availableSubjectItems.length}
            items={availableSubjectItems}
          />
        </div>
        <div className="dashboard-bento__slot dashboard-bento__slot--streak">
          {/* streakDays=0 until backend data is available */}
          <YourStreak streakDays={0} totalMilestones={5} completedMilestones={0} />
        </div>
      </div>

      <div className="dashboard-bento__row dashboard-bento__row--bottom">
        <div className="dashboard-bento__slot dashboard-bento__slot--recommended">
          <RecommendedCourses courses={courses} />
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
