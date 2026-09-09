import { useId, useState } from "react";
import { Check, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [showTooltip, setShowTooltip] = useState(false);

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

  const handleBadgesClick = () => {
    if (onViewBadges) {
      onViewBadges();
    } else {
      navigate('/profile?tab=achievements');
    }
  };

  return (
    <article className="your-streak-card relative" aria-labelledby={titleId}>
      <div className="your-streak-left">
        <header
          className="your-streak-header relative cursor-pointer inline-flex items-center gap-2"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <img className="your-streak-fire transition-transform hover:scale-110" src={fireAsset} alt="" aria-hidden="true" />
          <h2 id={titleId}>Your Streak</h2>

          {/* Interactive Streak Rules Tooltip */}
          {showTooltip && (
            <div className="absolute left-0 -top-16 z-30 w-64 rounded-xl bg-slate-900 p-2.5 text-xs text-white shadow-xl pointer-events-none animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-0.5">
                <Info className="size-3.5" />
                <span>Streak Rules</span>
              </div>
              <p className="text-[11px] text-slate-200 leading-tight">
                Study 5 more minutes today to maintain your {safeStreakDays}-day streak! 4 streak freezes remaining.
              </p>
              <div className="absolute -bottom-1.5 left-6 border-4 border-transparent border-t-slate-900" />
            </div>
          )}
        </header>

        <div className="your-streak-stats">
          <strong>{safeStreakDays}</strong>
          <span>days in a row</span>
        </div>

        <div
          className="your-streak-indicators cursor-pointer"
          role="img"
          aria-label={milestonesLabel}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {Array.from({ length: safeTotalMilestones }, (_, index) => {
            const isCompleted = index < safeCompletedMilestones;

            return (
              <span
                key={index}
                className={
                  isCompleted
                    ? "your-streak-indicator your-streak-indicator--complete hover:scale-125 transition-transform"
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
          className="your-streak-badges-button cursor-pointer"
          onClick={handleBadgesClick}
        >
          View Badges
        </button>
      </div>
    </article>
  );
}
