import React from "react";
import { ArrowRight } from "lucide-react";

export interface AssignmentProgressRingProps {
  completed: number;
  inProgress: number;
  notStarted: number;
  total: number;
  onViewStats?: () => void;
}

/**
 * Mobile 3-segment donut ring for assignment progress:
 * - Completed (submitted + graded) -> Emerald #20a862
 * - In progress -> Mint #7ee0b0
 * - Not started -> Light Slate #d5ddd8
 */
export const AssignmentProgressRing: React.FC<AssignmentProgressRingProps> = ({
  completed,
  inProgress,
  notStarted,
  total,
  onViewStats,
}) => {
  const radius = 46;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;

  const completedPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const inProgressPct = total > 0 ? Math.round((inProgress / total) * 100) : 0;
  const notStartedPct = total > 0 ? Math.round((notStarted / total) * 100) : 0;

  const completedLen = total > 0 ? (completed / total) * circumference : 0;
  const inProgressLen = total > 0 ? (inProgress / total) * circumference : 0;
  const notStartedLen = total > 0 ? (notStarted / total) * circumference : 0;

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-100/80 p-4 sm:p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5">
        <h3 className="text-sm font-extrabold text-slate-900">Your progress</h3>
        <button
          type="button"
          onClick={onViewStats}
          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
        >
          <span>View all stats</span>
          <ArrowRight className="size-3.5" />
        </button>
      </div>

      {/* Body: Donut + Legend */}
      <div className="flex items-center justify-between gap-4">
        {/* 3-segment SVG Donut */}
        <div className="relative size-26 shrink-0 flex items-center justify-center">
          <svg className="size-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
            {/* Background base circle */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#eef3f0"
              strokeWidth={stroke}
            />
            {/* 1. Completed segment */}
            {completedLen > 0 && (
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="#20a862"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${completedLen} ${circumference}`}
              />
            )}
            {/* 2. In progress segment */}
            {inProgressLen > 0 && (
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="#7ee0b0"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${inProgressLen} ${circumference}`}
                strokeDashoffset={-completedLen}
              />
            )}
            {/* 3. Not started segment */}
            {notStartedLen > 0 && (
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="#d5ddd8"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${notStartedLen} ${circumference}`}
                strokeDashoffset={-(completedLen + inProgressLen)}
              />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-lg font-black text-slate-900 leading-none">
              {total}
            </span>
            <span className="text-[9px] text-slate-400 font-bold mt-0.5">
              Total
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Completed */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="size-2 rounded-full bg-[#20a862] shrink-0" />
              <span className="text-slate-600 font-semibold truncate">Completed</span>
              <b className="text-slate-900 font-bold ml-1">{completed}</b>
            </div>
            <span className="text-slate-400 font-bold ml-2">{completedPct}%</span>
          </div>

          {/* In progress */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="size-2 rounded-full bg-[#7ee0b0] shrink-0" />
              <span className="text-slate-600 font-semibold truncate">In progress</span>
              <b className="text-slate-900 font-bold ml-1">{inProgress}</b>
            </div>
            <span className="text-slate-400 font-bold ml-2">{inProgressPct}%</span>
          </div>

          {/* Not started */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="size-2 rounded-full bg-[#d5ddd8] shrink-0" />
              <span className="text-slate-600 font-semibold truncate">Not started</span>
              <b className="text-slate-900 font-bold ml-1">{notStarted}</b>
            </div>
            <span className="text-slate-400 font-bold ml-2">{notStartedPct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
