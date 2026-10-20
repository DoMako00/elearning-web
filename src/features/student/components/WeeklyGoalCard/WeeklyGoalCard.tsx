import { useEffect, useState } from "react";
import { SlidersHorizontal, X, Check, Target, Zap } from "lucide-react";
import fireAsset from "../../../../Assets/fire.webp";
import { ProgressRing } from "../../../../components/ui/ProgressRing";
import type { WeeklyGoalCardProps } from "./weekly-goal-card.types";
import "./WeeklyGoalCard.css";

const WEEK_DAYS_INFO = ["S", "M", "T", "W", "T", "F", "S"] as const;

const PRESETS = [3, 5, 7, 10];

interface WeeklyGoalRingProps {
  percentage: number | null;
  isCompletedOrExceeded: boolean;
}

function WeeklyGoalRing({ percentage, isCompletedOrExceeded }: WeeklyGoalRingProps) {
  return (
    <div
      className={`weekly-goal-ring relative size-39.5 shrink-0 ${
        isCompletedOrExceeded ? "weekly-goal-ring--pulse" : ""
      }`}
      aria-hidden="true"
    >
      <ProgressRing
        size={120}
        radius={50}
        percentage={percentage ?? 0}
        strokeWidth={8}
        className="size-full rotate-[-82deg]"
      />

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
function SetGoalPrompt({ onSet, saving, disabled }: { onSet: (lessons: number) => void; saving: boolean; disabled: boolean }) {
  const [selected, setSelected] = useState(5);

  return (
    <div className="weekly-goal-setup">
      <div className="weekly-goal-setup__icon" aria-hidden="true">
        <Target strokeWidth={1.5} />
      </div>
      <h3 className="weekly-goal-setup__heading">Set your weekly goal</h3>
      <p className="weekly-goal-setup__sub">Choose how many lessons you want to complete each week.</p>

      <div className="weekly-goal-setup__presets">
          {PRESETS.map((lessons) => (
          <button
            key={lessons}
            type="button"
            className={`weekly-goal-setup__preset${selected === lessons ? " weekly-goal-setup__preset--active" : ""}`}
            onClick={() => setSelected(lessons)}
            aria-pressed={selected === lessons}
          >
            <span className="weekly-goal-setup__preset-hours">{lessons}</span>
            <span className="weekly-goal-setup__preset-sub">lessons/week</span>
          </button>
        ))}
      </div>

      <div className="weekly-goal-setup__slider-wrap">
        <input
          type="range"
          min="1"
          max="100"
          step="1"
          value={selected}
          onChange={(e) => setSelected(Number(e.target.value))}
          className="weekly-goal-setup__slider"
          aria-label={`Weekly goal: ${selected} lessons`}
        />
        <div className="weekly-goal-setup__slider-labels">
          <span>1</span>
          <span className="weekly-goal-setup__slider-val">{selected} lessons / week</span>
          <span>100</span>
        </div>
      </div>

      <button
        type="button"
        className="weekly-goal-setup__cta"
        onClick={() => onSet(selected)}
        disabled={disabled || saving}
      >
        <Zap size={14} aria-hidden="true" />
        <span>{saving ? "Saving…" : "Save weekly goal"}</span>
      </button>
    </div>
  );
}

export function WeeklyGoalCard({
  completedLessons,
  targetLessons,
  completedDays,
  goalSet,
  loading = false,
  saving = false,
  error = null,
  onGoalSet,
  loadError = null,
  onRetry,
}: WeeklyGoalCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sliderValue, setSliderValue] = useState(targetLessons ?? 5);
  const hasGoal = goalSet ?? (targetLessons !== null && targetLessons !== undefined);
  useEffect(() => { if (targetLessons !== null && targetLessons !== undefined) setSliderValue(targetLessons); }, [targetLessons]);

  const safeCompletedLessons = completedLessons === undefined ? null : Math.max(0, completedLessons);
  const safeTargetLessons = targetLessons == null ? null : Math.max(1, targetLessons);
  const percentage = safeCompletedLessons === null || safeTargetLessons === null ? null : Math.round((safeCompletedLessons / safeTargetLessons) * 100);
  const isGoalMet = percentage !== null && percentage >= 100;
  const progressDescription = safeCompletedLessons === null ? "Weekly lesson progress is unavailable" : safeTargetLessons === null ? "No weekly lesson goal has been set" : `Weekly goal: ${safeCompletedLessons} of ${safeTargetLessons} lessons completed, ${percentage} percent`;

  const handleSaveGoal = () => {
    onGoalSet?.(sliderValue);
    setIsModalOpen(false);
  };

  const handleFirstGoalSet = (lessons: number) => {
    onGoalSet?.(lessons);
  };

  return (
    <article
      className="weekly-goal-card relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-(--color-border-subtle) bg-(--color-surface) p-4 sm:p-5"
      aria-label={hasGoal ? progressDescription : "Set your weekly lesson goal"}
    >

      <header className="weekly-goal-header flex h-8 shrink-0 items-center justify-between">
        <h2 className="text-base font-semibold leading-[1.2] text-(--color-text-primary)">
          Weekly Goal
        </h2>
        {hasGoal && (
          <button
            type="button"
            onClick={() => {
              setSliderValue(targetLessons ?? 5);
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
      {loading ? <p className="weekly-goal-body" role="status">Loading weekly learning data…</p> : loadError ? (
        <div className="weekly-goal-body flex min-h-0 flex-1 flex-col items-center justify-center gap-3 text-center" role="alert">
          <p className="text-sm text-rose-700">{loadError}</p>
          {onRetry ? (
            <button type="button" onClick={onRetry} className="min-h-11 rounded-xl border border-(--color-border-subtle) px-4 text-sm font-semibold text-(--color-text-primary) hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus-ring)">
              Try again
            </button>
          ) : null}
        </div>
      ) : !hasGoal ? (
        <div className="weekly-goal-body flex min-h-0 flex-1 flex-col items-center justify-center">
          <SetGoalPrompt onSet={handleFirstGoalSet} saving={saving} disabled={loading} />
          {error ? <p className="mt-2 text-xs text-rose-700" role="alert">{error}</p> : null}
        </div>
      ) : (
        <>
          <div className="weekly-goal-body flex min-h-0 flex-1 flex-col items-center pt-3">
            <WeeklyGoalRing
              percentage={percentage}
              isCompletedOrExceeded={isGoalMet}
            />
            <p className="weekly-goal-hours mt-2.5 text-[14px] font-semibold leading-5 text-(--color-text-primary)">
              {safeCompletedLessons === null || safeTargetLessons === null ? "—" : `${safeCompletedLessons} / ${safeTargetLessons} lessons`}
            </p>
            <p className="weekly-goal-message mt-1 text-[13px] font-normal leading-4.5 text-(--color-text-secondary)">
              {safeCompletedLessons === null ? "Activity unavailable" : safeTargetLessons === null ? "Choose a goal to track progress" : isGoalMet ? "Goal reached" : "Keep it up!"}
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
          {error ? <p className="mt-2 text-xs text-rose-700" role="alert">{error}</p> : null}
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
                <Target className="size-5 text-(--color-brand,#20a862)" />
                <h3 className="text-base font-bold text-slate-900">Set Weekly Lesson Goal</h3>
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
                {sliderValue} <span className="text-lg font-medium text-slate-500">lessons/week</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Set a target for completed lessons this Monday-to-Sunday week.
              </p>

              <div className="mt-6 px-2">
                <input
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={sliderValue}
                  onChange={(e) => setSliderValue(Number(e.target.value))}
                  className="w-full accent-(--color-brand,#20a862) cursor-pointer"
                />
                <div className="flex justify-between text-[11px] font-medium text-slate-400 mt-1">
                  <span>1</span>
                  <span>5 (Suggested)</span>
                  <span>100</span>
                </div>
              </div>

              <div className="flex justify-center gap-2 mt-4">
                {PRESETS.map((preset) => (
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
                    {preset}
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
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-(--color-brand,#20a862) py-2.5 text-xs font-semibold text-white shadow-sm hover:opacity-90"
              >
                <Check className="size-4" />
                <span>{saving ? "Saving…" : "Save Goal"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
