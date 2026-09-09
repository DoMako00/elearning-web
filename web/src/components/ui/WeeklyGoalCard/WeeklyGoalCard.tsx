import { useState } from "react";
import { SlidersHorizontal, X, Check, Clock } from "lucide-react";
import fireAsset from "../../../Assets/fire.webp";
import { useToast } from "../../../hooks/useToast";
import { ToastNotification } from "../ToastNotification";
import type { WeeklyGoalCardProps } from "./weekly-goal-card.types";
import "./WeeklyGoalCard.css";

const WEEK_DAYS_INFO = [
  { day: "S", full: "Sunday", hours: 1.5 },
  { day: "M", full: "Monday", hours: 2.0 },
  { day: "T", full: "Tuesday", hours: 1.5 },
  { day: "W", full: "Wednesday", hours: 2.5 },
  { day: "T", full: "Thursday", hours: 1.0 },
  { day: "F", full: "Friday", hours: 0.5 },
  { day: "S", full: "Saturday", hours: 0.0 },
] as const;

const DEFAULT_COMPLETED_DAYS = [true, true, true, true, true, true, false];

const RING_SIZE = 120;
const RING_RADIUS = 50;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

interface ProgressRingProps {
  percentage: number;
  isCompletedOrExceeded: boolean;
}

function ProgressRing({ percentage, isCompletedOrExceeded }: ProgressRingProps) {
  const progressOffset = RING_CIRCUMFERENCE * (1 - Math.min(percentage, 100) / 100);

  return (
    <div
      className={`weekly-goal-ring relative size-39.5 shrink-0 ${
        isCompletedOrExceeded ? "weekly-goal-ring--pulse" : ""
      }`}
      aria-hidden="true"
    >
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
        <span className="text-[30px] font-semibold leading-none text-(--color-text-primary)">
          {percentage}%
        </span>
        <span className="mt-2 text-[13px] font-normal leading-none text-(--color-text-secondary)">
          {isCompletedOrExceeded ? "Goal Reached! 🎉" : "of weekly goal"}
        </span>
      </div>
    </div>
  );
}

export function WeeklyGoalCard({
  completedHours: initialCompletedHours = 9,
  targetHours: initialTargetHours = 12,
  completedDays = DEFAULT_COMPLETED_DAYS,
}: WeeklyGoalCardProps) {
  const [targetHours, setTargetHours] = useState(initialTargetHours);
  const [completedHours] = useState(initialCompletedHours);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sliderValue, setSliderValue] = useState(initialTargetHours);
  const [hoveredDayIndex, setHoveredDayIndex] = useState<number | null>(null);
  const { toastMessage, showToast } = useToast();

  const safeCompletedHours = Math.max(0, completedHours);
  const safeTargetHours = Math.max(1, targetHours);
  const percentage = Math.round((safeCompletedHours / safeTargetHours) * 100);
  const isGoalMet = percentage >= 100;
  const progressDescription = `Weekly goal: ${safeCompletedHours} of ${safeTargetHours} hours completed, ${percentage} percent`;

  const handleSaveGoal = () => {
    setTargetHours(sliderValue);
    setIsModalOpen(false);
    showToast(`Weekly goal updated to ${sliderValue} hours/week!`);
  };

  return (
    <article
      className="weekly-goal-card relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-(--color-border-subtle) bg-(--color-surface) p-4 sm:p-5"
      aria-label={progressDescription}
    >
      <ToastNotification message={toastMessage} />

      <header className="weekly-goal-header flex h-8 shrink-0 items-center justify-between">
        <h2 className="text-base font-semibold leading-[1.2] text-(--color-text-primary)">
          Weekly Goal
        </h2>
        <button
          type="button"
          onClick={() => {
            setSliderValue(targetHours);
            setIsModalOpen(true);
          }}
          className="weekly-goal-options grid size-8.5 place-items-center rounded-(--border-radius-media) border border-(--color-border-subtle) bg-(--color-surface) text-(--color-text-primary) hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus-ring) focus-visible:ring-offset-2 cursor-pointer"
          aria-label="Set weekly goal"
        >
          <SlidersHorizontal size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      </header>

      <div className="weekly-goal-body flex min-h-0 flex-1 flex-col items-center pt-3">
        <ProgressRing
          percentage={percentage}
          isCompletedOrExceeded={isGoalMet}
        />
        <p className="weekly-goal-hours mt-2.5 text-[14px] font-semibold leading-5 text-(--color-text-primary)">
          {safeCompletedHours} / {safeTargetHours} hours
        </p>
        <p className="weekly-goal-message mt-1 text-[13px] font-normal leading-4.5 text-(--color-text-secondary)">
          {isGoalMet ? "Goal crushed!" : "Keep it up!"}
          <img className="weekly-goal-fire" src={fireAsset} alt="" aria-hidden="true" />
        </p>
      </div>

      {/* Days with Interactive Tooltips */}
      <div className="weekly-goal-days mt-3 grid w-full shrink-0 grid-cols-7">
        {WEEK_DAYS_INFO.map((item, index) => {
          const isCompleted = completedDays[index] ?? false;
          const isHovered = hoveredDayIndex === index;

          return (
            <div
              key={`${item.day}-${index}`}
              className="relative flex flex-col items-center cursor-pointer group"
              onMouseEnter={() => setHoveredDayIndex(index)}
              onMouseLeave={() => setHoveredDayIndex(null)}
              tabIndex={0}
              role="button"
              aria-label={`${item.full}: ${item.hours} hours recorded`}
            >
              {/* Tooltip */}
              {isHovered && (
                <div className="absolute -top-9 z-20 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[11px] font-medium text-white shadow-lg pointer-events-none animate-in fade-in zoom-in-95 duration-100">
                  {item.full}: {item.hours} hrs
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                </div>
              )}

              <span
                className={
                  isCompleted
                    ? "size-2.75 rounded-full bg-(--color-brand) shadow-[0_0_0_1.5px_#d1fae5] transition-transform group-hover:scale-125"
                    : "size-2.75 rounded-full border-[1.5px] border-[#94a3b8] bg-(--color-surface) transition-transform group-hover:scale-125"
                }
                aria-hidden="true"
              />
              <span className="mt-1 text-12px font-semibold leading-4 text-[#374151]">
                {item.day}
              </span>
            </div>
          );
        })}
      </div>

      {/* Set Weekly Goal Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsModalOpen(false)}
          role="dialog"
          aria-label="Set Weekly Goal Modal"
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="size-5 text-(--color-brand,#20a862)" />
                <h3 className="text-base font-bold text-slate-900">Set Weekly Goal</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="py-5 text-center">
              <div className="text-4xl font-extrabold text-(--color-brand,#20a862)">
                {sliderValue} <span className="text-lg font-medium text-slate-500">hrs/week</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Aim for a realistic study pace to maintain continuous progress.
              </p>

              {/* Slider */}
              <div className="mt-6 px-2">
                <input
                  type="range"
                  min="4"
                  max="35"
                  step="1"
                  value={sliderValue}
                  onChange={(e) => setSliderValue(Number(e.target.value))}
                  className="w-full accent-(--color-brand,#20a862) cursor-pointer"
                />
                <div className="flex justify-between text-[11px] font-medium text-slate-400 mt-1">
                  <span>4h (Light)</span>
                  <span>15h (Recommended)</span>
                  <span>35h (Intensive)</span>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex justify-center gap-2 mt-4">
                {[8, 12, 15, 20].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setSliderValue(preset)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                      sliderValue === preset
                        ? "bg-(--color-brand,#20a862) text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {preset}h
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveGoal}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-(--color-brand,#20a862) py-2.5 text-xs font-semibold text-white shadow-sm hover:opacity-90"
              >
                <Check className="size-4" />
                <span>Save Goal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
