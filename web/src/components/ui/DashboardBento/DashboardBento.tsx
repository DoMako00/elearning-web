import { useMemo, useState } from "react";
import { Sparkles, X } from "lucide-react";
import robotAsset from "../../../Assets/dashboard/doctor-robot.webp";
import { AILearningGuide } from "../AILearningGuide";
import ContinueLearning from "../Continue_Learning/continue_learning";
import { MyProgress } from "../MyProgress";
import { RecommendedCourses } from "../RecommendedCourses";
import { Upcoming } from "../Upcoming";
import { WeeklyGoalCard } from "../WeeklyGoalCard";
import { YourStreak } from "../YourStreak";
import type { UpcomingItem } from "../Upcoming/upcoming.types";
import type { StudentCourseItem } from "../../../features/student/api/studentCoursesApi";
import "./DashboardBento.css";

export interface DashboardBentoProps {
  courses?: readonly StudentCourseItem[];
}

function buildAvailableSubjectItems(courses: readonly StudentCourseItem[]): UpcomingItem[] {
  return courses.slice(0, 5).map((course) => ({
    id: course.courseId,
    title: course.title,
    time: `${course.lessonCount} lessons available`,
    iconType: "assignment",
    tag: course.unitLabel,
  }));
}

export function DashboardBento({ courses = [] }: DashboardBentoProps) {
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
          <WeeklyGoalCard />
        </div>
      </div>

      <div className="dashboard-bento__row dashboard-bento__row--middle">
        <div className="dashboard-bento__slot dashboard-bento__slot--progress">
          <MyProgress
            completionPercentage={0}
            monthlyGrowth={0}
            growthLabel="until lesson progress starts"
            chartData={[0, 0, 0, 0, 0, 0, 0, 0]}
          />
        </div>
        <div className="dashboard-bento__slot dashboard-bento__slot--upcoming">
          <Upcoming
            title="Available subjects"
            count={availableSubjectItems.length}
            items={availableSubjectItems}
          />
        </div>
        <div className="dashboard-bento__slot dashboard-bento__slot--streak">
          <YourStreak />
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
