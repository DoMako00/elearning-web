import { AILearningGuide } from "../AILearningGuide";
import ContinueLearning from "../Continue_Learning/continue_learning";
import { MyProgress } from "../MyProgress";
import { RecommendedCourses } from "../RecommendedCourses";
import { Upcoming } from "../Upcoming";
import { WeeklyGoalCard } from "../WeeklyGoalCard";
import { YourStreak } from "../YourStreak";
import "./DashboardBento.css";

export function DashboardBento() {
  return (
    <section className="dashboard-bento" aria-label="Learning dashboard">
      <div className="dashboard-bento__row dashboard-bento__row--top">
        <div className="dashboard-bento__slot dashboard-bento__slot--continue">
          <ContinueLearning />
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
          <MyProgress />
        </div>
        <div className="dashboard-bento__slot dashboard-bento__slot--upcoming">
          <Upcoming />
        </div>
        <div className="dashboard-bento__slot dashboard-bento__slot--streak">
          <YourStreak />
        </div>
      </div>

      <div className="dashboard-bento__row dashboard-bento__row--bottom">
        <div className="dashboard-bento__slot dashboard-bento__slot--recommended">
          <RecommendedCourses />
        </div>
      </div>
    </section>
  );
}
