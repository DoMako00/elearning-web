import ContinueLearning from "../Continue_Learning/continue_learning";
import { MyProgress } from "../MyProgress";
import { Upcoming } from "../Upcoming";
import { WeeklyGoalCard } from "../WeeklyGoalCard";
import { YourStreak } from "../YourStreak";
import "./DashboardBento.css";

interface BentoPlaceholderProps {
  className: string;
}

function BentoPlaceholder({ className }: BentoPlaceholderProps) {
  return (
    <div
      className={"dashboard-bento__placeholder " + className}
      aria-hidden="true"
    />
  );
}

export function DashboardBento() {
  return (
    <section className="dashboard-bento" aria-label="Learning dashboard">
      <div className="dashboard-bento__row dashboard-bento__row--top">
        <div className="dashboard-bento__slot dashboard-bento__slot--continue">
          <ContinueLearning />
        </div>
        <BentoPlaceholder className="dashboard-bento__slot--ai" />
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
        <BentoPlaceholder className="dashboard-bento__slot--recommended" />
      </div>
    </section>
  );
}
