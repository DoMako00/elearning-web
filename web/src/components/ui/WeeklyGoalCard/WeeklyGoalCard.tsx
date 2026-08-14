import { SlidersHorizontal } from "lucide-react";
import fireAsset from "../../../Assets/fire.png";
import type { WeeklyGoalCardProps } from "./weekly-goal-card.types";
import "./WeeklyGoalCard.css";

const WEEK_DAYS = ["S", "M", "T", "W", "T", "F", "S"] as const;
const DEFAULT_COMPLETED_DAYS = [true, true, true, true, true, true, false];

const RING_SIZE = 120;
const RING_RADIUS = 50;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

interface ProgressRingProps {
  percentage: number;
}

function ProgressRing({ percentage }: ProgressRingProps) {
  const progressOffset = RING_CIRCUMFERENCE * (1 - percentage / 100);

  return (
    <div className="weekly-goal-ring relative size-[158px] shrink-0" aria-hidden="true">
      <svg
        className="size-full rotate-[-82deg]"
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        fill="none"
      >
        <circle
          cx="60"
          cy="60"
          r={RING_RADIUS}
          stroke="var(--color-surface-hover)"
          strokeWidth="8"
        />
        <circle
          cx="60"
          cy="60"
          r={RING_RADIUS}
          stroke="var(--color-brand)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={progressOffset}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[30px] font-semibold leading-none text-[var(--color-text-primary)]">
          {percentage}%
        </span>
        <span className="mt-2 text-[13px] font-normal leading-none text-[var(--color-text-secondary)]">
          of weekly goal
        </span>
      </div>
    </div>
  );
}

export function WeeklyGoalCard({
  completedHours = 9,
  targetHours = 12,
  completedDays = DEFAULT_COMPLETED_DAYS,
}: WeeklyGoalCardProps) {
  const safeCompletedHours = Math.max(0, completedHours);
  const safeTargetHours = Math.max(0, targetHours);
  const percentage =
    safeTargetHours === 0
      ? 0
      : Math.round(
          Math.min(100, Math.max(0, (safeCompletedHours / safeTargetHours) * 100)),
        );
  const progressDescription = `Weekly goal: ${safeCompletedHours} of ${safeTargetHours} hours completed, ${percentage} percent`;

  return (
    <article
      className="weekly-goal-card flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-[16px] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] pb-[18px] pl-[30px] pr-6 pt-6"
      aria-label={progressDescription}
    >
      <header className="weekly-goal-header flex h-[34px] shrink-0 items-center justify-between">
        <h2 className="text-base font-semibold leading-[1.2] text-[var(--color-text-primary)]">
          Weekly Goal
        </h2>
        <button
          type="button"
          className="weekly-goal-options grid size-[34px] place-items-center rounded-[10px] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2"
          aria-label="Weekly goal options"
        >
          <SlidersHorizontal size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      </header>

      <div className="weekly-goal-body flex min-h-0 flex-1 flex-col items-center pt-4">
        <ProgressRing percentage={percentage} />
        <p className="weekly-goal-hours mt-[13px] text-[14px] font-semibold leading-5 text-[var(--color-text-primary)]">
          {safeCompletedHours} / {safeTargetHours} hours
        </p>
        <p className="weekly-goal-message mt-[5px] text-[13px] font-normal leading-[18px] text-[var(--color-text-secondary)]">
          Keep it up!
          <img className="weekly-goal-fire" src={fireAsset} alt="" aria-hidden="true" />
        </p>
      </div>

      <div className="weekly-goal-days mt-4 grid w-full shrink-0 grid-cols-7">
        {WEEK_DAYS.map((day, index) => {
          const isCompleted = completedDays[index] ?? false;

          return (
            <div key={`${day}-${index}`} className="flex flex-col items-center">
              <span
                className={
                  isCompleted
                    ? "size-[11px] rounded-full bg-[var(--color-brand)]"
                    : "size-[11px] rounded-full border-[1.5px] border-[#b8c1ca] bg-[var(--color-surface)]"
                }
                aria-hidden="true"
              />
              <span className="mt-1.5 text-[12px] font-normal leading-4 text-[var(--color-text-secondary)]">
                {day}
              </span>
            </div>
          );
        })}
      </div>
    </article>
  );
}
