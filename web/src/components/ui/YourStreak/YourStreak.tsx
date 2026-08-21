import { useId } from "react";
import { Check } from "lucide-react";
import fireAsset from "../../../Assets/fire.webp";
import trophyAsset from "../../../Assets/trophy.webp";
import type { YourStreakProps } from "./your-streak.types";
import "./YourStreak.css";

export function YourStreak({
  streakDays = 12,
  completedMilestones = 7,
  totalMilestones = 8,
  message = "Consistency is the key to mastery!",
  trophySrc = trophyAsset,
  onViewBadges,
}: YourStreakProps) {
  const titleId = useId();
  const safeStreakDays = Math.max(0, Math.floor(streakDays));
  const safeTotalMilestones = Math.max(1, Math.floor(totalMilestones));
  const safeCompletedMilestones = Math.min(
    safeTotalMilestones,
    Math.max(0, Math.floor(completedMilestones)),
  );
  const milestonesLabel =
    safeCompletedMilestones +
    " of " +
    safeTotalMilestones +
    " streak milestones completed";

  return (
    <article className="your-streak-card" aria-labelledby={titleId}>
      <div className="your-streak-left">
        <header className="your-streak-header">
          <img className="your-streak-fire" src={fireAsset} alt="" aria-hidden="true" />
          <h2 id={titleId}>Your Streak</h2>
        </header>

        <div className="your-streak-stats">
          <strong>{safeStreakDays}</strong>
          <span>days in a row</span>
        </div>

        <div
          className="your-streak-indicators"
          role="img"
          aria-label={milestonesLabel}
        >
          {Array.from({ length: safeTotalMilestones }, (_, index) => {
            const isCompleted = index < safeCompletedMilestones;

            return (
              <span
                key={index}
                className={
                  isCompleted
                    ? "your-streak-indicator your-streak-indicator--complete"
                    : "your-streak-indicator your-streak-indicator--incomplete"
                }
                aria-hidden="true"
              >
                {isCompleted ? <Check strokeWidth={2.4} /> : null}
              </span>
            );
          })}
        </div>

        <p className="your-streak-message">{message}</p>
      </div>

      <div className="your-streak-right">
        <img
          className="your-streak-trophy"
          src={trophySrc}
          alt=""
          aria-hidden="true"
          draggable="false"
        />

        <button
          type="button"
          className="your-streak-badges-button"
          onClick={onViewBadges}
        >
          View Badges
        </button>
      </div>
    </article>
  );
}
