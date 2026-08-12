import { SlidersHorizontal } from "lucide-react";
import type { WeeklyGoalCardProps } from "./weekly-goal-card.types";

const WEEK_DAYS = ["S", "M", "T", "W", "T", "F", "S"] as const;
const DEFAULT_COMPLETED_DAYS = [true, true, true, true, true, true, false];

const RING_SIZE = 220;
const RING_RADIUS = 92;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

interface ProgressRingProps {
  percentage: number;
}

function ProgressRing({ percentage }: ProgressRingProps) {
  const progressOffset = RING_CIRCUMFERENCE * (1 - percentage / 100);

  return (
    <div className="relative grid size-[180px] place-items-center" aria-hidden="true">
      <svg
        className="size-full -rotate-90"
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        fill="none"
      >
        <circle
          cx="110"
          cy="110"
          r={RING_RADIUS}
          stroke="var(--color-surface-hover)"
          strokeWidth="12"
        />
        <circle
          cx="110"
          cy="110"
          r={RING_RADIUS}
          stroke="var(--color-brand)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={progressOffset}
        />
      </svg>

      <div className="absolute inset-0 grid place-content-center text-center">
        <span className="text-[35px] font-bold leading-none text-[var(--color-text-primary)]">
          {percentage}%
        </span>
        <span className="mt-2 text-[13px] font-medium leading-none text-[var(--color-text-secondary)]">
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
      className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-[15px] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-6 pb-[18px] pt-5"
      aria-label={progressDescription}
    >
      <header className="flex h-8 shrink-0 items-center justify-between">
        <h2 className="text-base font-semibold leading-[22px] text-[var(--color-text-primary)]">
          Weekly Goal
        </h2>
        <button
          type="button"
          className="grid size-8 place-items-center rounded-[10px] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2"
          aria-label="Weekly goal options"
        >
          <SlidersHorizontal size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      </header>

      <div className="mt-2.5 flex shrink-0 justify-center">
        <ProgressRing percentage={percentage} />
      </div>

      <div className="mt-3 shrink-0 text-center">
        <p className="text-[15px] font-semibold leading-5 text-[var(--color-text-primary)]">
          {safeCompletedHours} / {safeTargetHours} hours
        </p>
        <p className="mt-1 text-[13px] font-medium leading-5 text-[var(--color-text-secondary)]">
          Keep it up! <span aria-hidden="true">🔥</span>
        </p>
      </div>

      <div className="mt-4 grid shrink-0 grid-cols-7">
        {WEEK_DAYS.map((day, index) => {
          const isCompleted = completedDays[index] ?? false;

          return (
            <div key={`${day}-${index}`} className="flex flex-col items-center">
              <span
                className={
                  isCompleted
                    ? "size-3 rounded-full bg-[var(--color-brand)]"
                    : "size-3 rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface)]"
                }
                aria-hidden="true"
              />
              <span className="mt-2 text-[12px] font-medium leading-4 text-[var(--color-text-secondary)]">
                {day}
              </span>
            </div>
          );
        })}
      </div>
    </article>
  );
}
