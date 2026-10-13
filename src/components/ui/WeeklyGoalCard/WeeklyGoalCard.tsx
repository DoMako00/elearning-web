import { useState } from "react";
import { SlidersHorizontal, X, Check, Clock, Target, Zap } from "lucide-react";
import fireAsset from "../../../Assets/fire.webp";
import { useToast } from "../../../hooks/useToast";
import { ToastNotification } from "../ToastNotification";
import type { WeeklyGoalCardProps } from "./weekly-goal-card.types";
import "./WeeklyGoalCard.css";

const WEEK_DAYS_INFO = ["S", "M", "T", "W", "T", "F", "S"] as const;

const RING_SIZE = 120;
const RING_RADIUS = 50;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const PRESETS = [
  { hours: 6,  label: "6h",  sublabel: "Light" },
  { hours: 10, label: "10h", sublabel: "Moderate" },
  { hours: 15, label: "15h", sublabel: "Recommended" },
  { hours: 20, label: "20h", sublabel: "Intensive" },
];

interface ProgressRingProps {
  percentage: number | null;
  isCompletedOrExceeded: boolean;
}

function ProgressRing({ percentage, isCompletedOrExceeded }: ProgressRingProps) {
  const progressOffset = RING_CIRCUMFERENCE * (1 - Math.min(percentage ?? 0, 100) / 100);

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
          {percentage === null ? "—" : `${percentage}%`}
        </span>
        <span className="mt-2 text-[13px] font-normal leading-none text-(--color-text-secondary)">
          {percentage === null ? "activity unavailable" : isCompletedOrExceeded ? "Goal Reached! 🎉" : "of weekly goal"}
        </span>
      </div>
    </div>
  );
}

/** First-time "Set your goal" CTA shown when no goal has been configured. */
function SetGoalPrompt({ onSet }: { onSet: (hours: number) => void }) {
  const [selected, setSelected] = useState(15);

  return (
    <div className="weekly-goal-setup">
      <div className="weekly-goal-setup__icon" aria-hidden="true">
        <Target strokeWidth={1.5} />
      </div>
      <h3 className="weekly-goal-setup__heading">Set your weekly goal</h3>
      <p className="weekly-goal-setup__sub">Choose how many hours you want to study each week.</p>

      <div className="weekly-goal-setup__presets">
        {PRESETS.map((p) => (
          <button
            key={p.hours}
            type="button"
            className={`weekly-goal-setup__preset${selected === p.hours ? " weekly-goal-setup__preset--active" : ""}`}
            onClick={() => setSelected(p.hours)}
            aria-pressed={selected === p.hours}
          >
            <span className="weekly-goal-setup__preset-hours">{p.label}</span>
            <span className="weekly-goal-setup__preset-sub">{p.sublabel}</span>
          </button>
        ))}
      </div>

      <div className="weekly-goal-setup__slider-wrap">
        <input
          type="range"
          min="4"
          max="35"
          step="1"
          value={selected}
          onChange={(e) => setSelected(Number(e.target.value))}
          className="weekly-goal-setup__slider"
          aria-label={`Weekly goal: ${selected} hours`}
        />
        <div className="weekly-goal-setup__slider-labels">
          <span>4h</span>
          <span className="weekly-goal-setup__slider-val">{selected}h / week</span>
          <span>35h</span>
        </div>
      </div>

      <button
        type="button"
        className="weekly-goal-setup__cta"
        onClick={() => onSet(selected)}
      >
        <Zap size={14} aria-hidden="true" />
        <span>Start tracking</span>
      </button>
    </div>
  );
}

export function WeeklyGoalCard({
  completedHours: initialCompletedHours,
  targetHours: initialTargetHours = 12,
  completedDays,
  goalSet: initialGoalSet = false,
  onGoalSet,
}: WeeklyGoalCardProps) {
  const [targetHours, setTargetHours] = useState(initialTargetHours);
  const [goalSet, setGoalSet] = useState(initialGoalSet);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sliderValue, setSliderValue] = useState(initialTargetHours);
  const { toastMessage, showToast } = useToast();

  const safeCompletedHours = initialCompletedHours === undefined ? null : Math.max(0, initialCompletedHours);
  const safeTargetHours = Math.max(1, targetHours);
  const percentage = safeCompletedHours === null ? null : Math.round((safeCompletedHours / safeTargetHours) * 100);
  const isGoalMet = percentage !== null && percentage >= 100;
  const progressDescription = safeCompletedHours === null ? `Weekly goal: activity unavailable, target ${safeTargetHours} hours` : `Weekly goal: ${safeCompletedHours} of ${safeTargetHours} hours completed, ${percentage} percent`;

  const handleSaveGoal = () => {
    setTargetHours(sliderValue);
    setIsModalOpen(false);
    showToast(`Weekly goal updated to ${sliderValue} hours/week!`);
  };

  const handleFirstGoalSet = (hours: number) => {
    setTargetHours(hours);
    setGoalSet(true);
    onGoalSet?.(hours);
    showToast(`Weekly goal set to ${hours} hours/week! 🎯`);
  };

  return (
    <article
      className="weekly-goal-card relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-(--color-border-subtle) bg-(--color-surface) p-4 sm:p-5"
      aria-label={goalSet ? progressDescription : "Set your weekly study goal"}
    >
      <ToastNotification message={toastMessage} />

      <header className="weekly-goal-header flex h-8 shrink-0 items-center justify-between">
        <h2 className="text-base font-semibold leading-[1.2] text-(--color-text-primary)">
          Weekly Goal
        </h2>
        {goalSet && (
          <button
            type="button"
            onClick={() => {
              setSliderValue(targetHours);
              setIsModalOpen(true);
            }}
            className="weekly-goal-options grid size-8.5 place-items-center rounded-(--border-radius-media) border border-(--color-border-subtle) bg-(--color-surface) text-(--color-text-primary) hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus-ring) focus-visible:ring-offset-2 cursor-pointer"
            aria-label="Edit weekly goal"
          >
            <SlidersHorizontal size={16} strokeWidth={2} aria-hidden="true" />
          </button>
        )}
      </header>

      {/* ── First-time state ── */}
      {!goalSet ? (
        <div className="weekly-goal-body flex min-h-0 flex-1 flex-col items-center justify-center">
          <SetGoalPrompt onSet={handleFirstGoalSet} />
        </div>
      ) : (
        <>
          <div className="weekly-goal-body flex min-h-0 flex-1 flex-col items-center pt-3">
            <ProgressRing
              percentage={percentage}
              isCompletedOrExceeded={isGoalMet}
            />
            <p className="weekly-goal-hours mt-2.5 text-[14px] font-semibold leading-5 text-(--color-text-primary)">
              {safeCompletedHours === null ? "—" : safeCompletedHours} / {safeTargetHours} hours
            </p>
            <p className="weekly-goal-message mt-1 text-[13px] font-normal leading-4.5 text-(--color-text-secondary)">
              {safeCompletedHours === null ? "Activity unavailable" : isGoalMet ? "Goal crushed!" : "Keep it up!"}
              <img className="weekly-goal-fire" src={fireAsset} alt="" aria-hidden="true" />
            </p>
          </div>

          <div className="weekly-goal-days mt-3 grid w-full shrink-0 grid-cols-7" aria-label={completedDays ? "Weekly activity" : "Weekly activity unavailable"}>
            {WEEK_DAYS_INFO.map((day, index) => (
              <div key={`${day}-${index}`} className="flex flex-col items-center" aria-hidden="true">
                <span className={`size-2.75 rounded-full ${completedDays?.[index] ? "bg-(--color-brand)" : "border-[1.5px] border-[#94a3b8] bg-(--color-surface)"}`} />
                <span className="mt-1 text-12px font-semibold leading-4 text-[#374151]">{day}</span>
              </div>
            ))}
          </div>
          {completedDays ? null : <p className="sr-only" role="status">Daily study activity is unavailable.</p>}
        </>
      )}

      {/* Edit Goal Modal (only shown after goal is set) */}
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