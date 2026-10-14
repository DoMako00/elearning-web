import React from "react";
import fireAsset from "../../../Assets/fire.webp";

// SVG circle sizing & circumference matching desktop (2 * PI * r)
const RING_SIZE = 100;
const RING_RADIUS = 40;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export interface MobileWeeklyGoalProps {
  completedLessons: number;
  targetLessons: number | null;
  weekDays: readonly { date: string; completedLessons: number }[];
  currentDate: string;
  onEdit?: () => void;
}

/**
 * Shared mobile Weekly Study Goal card.
 * Reused identically between HomeScreen and CalendarScreen
 * to prevent duplicate ring math implementations.
 */
export const MobileWeeklyStudyGoal: React.FC<MobileWeeklyGoalProps> = ({
  completedLessons,
  targetLessons,
  weekDays,
  currentDate,
  onEdit: _onEdit,
}) => {
  const safeCompleted = Math.max(0, completedLessons);
  const goalPercentage = targetLessons ? Math.min(100, Math.round((safeCompleted / targetLessons) * 100)) : 0;
  const progressOffset = RING_CIRCUMFERENCE * (1 - Math.min(goalPercentage, 100) / 100);

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-100/80 p-4 sm:p-5 shadow-xs flex items-center justify-between gap-4">
      {/* Left: SVG Progress Ring */}
      <div className="relative w-20 h-20 sm:w-22 sm:h-22 shrink-0 flex items-center justify-center">
        <svg
          className="w-full h-full -rotate-90"
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          role="img"
          aria-label={targetLessons ? `Weekly lesson goal progress: ${goalPercentage}%` : "No weekly lesson goal set"}
        >
          <circle
            cx="50"
            cy="50"
            r={RING_RADIUS}
            className="text-slate-100"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r={RING_RADIUS}
            className="text-emerald-500 transition-all duration-700"
            strokeWidth="8"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={progressOffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-base sm:text-lg font-black text-slate-900 leading-none">
            {targetLessons ? `${goalPercentage}%` : "—"}
          </span>
          <span className="text-[8.5px] text-slate-400 font-semibold mt-0.5">
            weekly goal
          </span>
        </div>
      </div>

      {/* Center: Persisted weekly lesson progress */}
      <div className="flex-1 min-w-0 pl-1">
        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
          {safeCompleted} / {targetLessons ?? "—"} lessons
        </h3>
        <div className="flex items-center gap-1 mt-1">
          <span className="text-xs font-semibold text-slate-600">{targetLessons ? "Completed this week" : "Set a weekly goal"}</span>
          {targetLessons !== null && <img src={fireAsset} alt="" aria-hidden="true" className="w-3.5 h-3.5 inline-block" />}
        </div>
      </div>

      {/* Right: 7-bar mini chart */}
      <div className="flex items-end gap-2.5 shrink-0 h-14">
        {weekDays.map((day) => {
          const label = new Intl.DateTimeFormat("en-US", { weekday: "narrow", timeZone: "UTC" }).format(new Date(`${day.date}T00:00:00Z`));
          const isToday = day.date === currentDate;
          const fillPct = targetLessons ? Math.min(100, Math.round(day.completedLessons * 100 / targetLessons)) : day.completedLessons > 0 ? 100 : 0;
          return <div key={day.date} className="flex flex-col items-center gap-1.5">
            <div className="w-2 sm:w-2.5 h-10 bg-slate-100 rounded-full flex flex-col justify-end overflow-hidden">
              <div
                className={`w-full rounded-full transition-all duration-300 ${
                  isToday ? "bg-emerald-600" : "bg-emerald-500/80"
                }`}
                style={{ height: `${fillPct}%` }}
              />
            </div>
            <span
              className={`text-[9.5px] leading-none font-bold ${
                isToday ? "text-slate-900 font-extrabold" : "text-slate-400"
              }`}
            >
              {label}
            </span>
          </div>
        })}
      </div>
    </div>
  );
};
