import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  CheckCircle,
  HelpCircle,
  Video,
  TrendingUp,
  Activity,
} from "lucide-react";
import type {
  SubjectStudyDistribution,
  LearningTrendPoint,
  ProfileAnalyticsStats,
} from "../../types/profile.types";

interface ActivityAnalyticsTabProps {
  studyDistribution: SubjectStudyDistribution[];
  learningTrends: LearningTrendPoint[];
  stats: ProfileAnalyticsStats;
}

export const ActivityAnalyticsTab: React.FC<ActivityAnalyticsTabProps> = ({
  studyDistribution,
  learningTrends,
  stats,
}) => {
  // Generate 30-day activity matrix (GitHub-style consistency heatmap)
  const days30 = Array.from({ length: 30 }, (_, i) => {
    const dayNum = 30 - i;
    // Deterministic realistic learning pattern (streak active over last 14 days)
    const isStreakDay = dayNum <= 14;
    const intensity = isStreakDay
      ? dayNum % 4 === 0
        ? 4
        : dayNum % 3 === 0
        ? 3
        : 2
      : dayNum % 2 === 0
      ? 1
      : 0;
    const hours = intensity === 4 ? 3.5 : intensity === 3 ? 2.5 : intensity === 2 ? 1.5 : intensity === 1 ? 0.8 : 0;
    return {
      day: dayNum,
      intensity,
      hours,
      dateLabel: `Day ${dayNum} ago`,
    };
  }).reverse();

  return (
    <div className="flex-1 min-h-0 flex flex-col justify-start overflow-y-auto overflow-x-hidden pt-1 pb-4 gap-4">
      {/* 4 Top Performance Metric Cards (compact height, 2 cols on mobile/ipad, 4 cols on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
        {/* Metric 1 */}
        <div className="rounded-xl border border-gray-100 bg-white px-3.5 py-2 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600">Quiz Accuracy</span>
            <div className="grid size-6 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle className="size-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-1">
            <p className="text-xl font-black text-gray-900 tracking-tight leading-none">
              {stats.averageQuizAccuracy}%
            </p>
            <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
              <TrendingUp className="size-3" />
              <span>+4.2%</span>
            </p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="rounded-xl border border-gray-100 bg-white px-3.5 py-2 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600">Watch Hours</span>
            <div className="grid size-6 place-items-center rounded-lg bg-blue-50 text-blue-600">
              <Video className="size-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-1">
            <p className="text-xl font-black text-gray-900 tracking-tight leading-none">
              {stats.totalVideoWatchHours} <span className="text-xs font-semibold text-gray-500">hrs</span>
            </p>
            <p className="text-[11px] font-bold text-blue-600">
              42 lectures
            </p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="rounded-xl border border-gray-100 bg-white px-3.5 py-2 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600">Assignments</span>
            <div className="grid size-6 place-items-center rounded-lg bg-purple-50 text-purple-600">
              <Activity className="size-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-1">
            <p className="text-xl font-black text-gray-900 tracking-tight leading-none">
              {stats.completedAssignments}
            </p>
            <p className="text-[11px] font-bold text-purple-600">
              100% on-time
            </p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="rounded-xl border border-gray-100 bg-white px-3.5 py-2 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600">Questions Solved</span>
            <div className="grid size-6 place-items-center rounded-lg bg-amber-50 text-amber-600">
              <HelpCircle className="size-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-1">
            <p className="text-xl font-black text-gray-900 tracking-tight leading-none">
              {stats.totalQuestionsAnswered}
            </p>
            <p className="text-[11px] font-bold text-amber-600">
              Clinical cases
            </p>
          </div>
        </div>
      </div>

      {/* Learning Velocity Trend Area Chart (Transferred height for maximum visibility) */}
      <section
        className="rounded-2xl border border-gray-100 bg-white px-5 py-3.5 shadow-xs shrink-0"
        aria-labelledby="extended-trends-heading"
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <h2 id="extended-trends-heading" className="text-sm sm:text-base font-black text-gray-900 tracking-tight">
            Learning Velocity & Weekly Trends (Hours/Week)
          </h2>
          <div className="flex items-center gap-3.5 text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-emerald-500" />
              <span className="text-gray-800">Current</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-gray-300" />
              <span className="text-gray-500">Previous</span>
            </div>
          </div>
        </div>

        <div className="h-40 lg:h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={learningTrends} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="currentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#64748B", fontWeight: 600 }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#64748B", fontWeight: 600 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: "10px",
                  border: "1px solid #E2E8F0",
                  padding: "6px 10px",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              />
              <Area
                type="monotone"
                dataKey="currentHours"
                name="Current (Hrs)"
                stroke="#10B981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#currentGrad)"
              />
              <Area
                type="monotone"
                dataKey="previousHours"
                name="Previous (Hrs)"
                stroke="#94A3B8"
                strokeWidth={2}
                strokeDasharray="4 4"
                fill="none"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Row: Subject Distribution & 30-Day Consistency Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 shrink-0 items-stretch">
        
        {/* Subject Study Time Distribution (Expanded height to fill card space) */}
        <section
          className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs flex flex-col justify-between"
          aria-labelledby="distribution-heading"
        >
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <h2 id="distribution-heading" className="text-sm sm:text-base font-black text-gray-900 tracking-tight">
                Study Time by Subject Area
              </h2>
              <p className="text-xs text-gray-500 font-medium mb-3 mt-0.5">
                Active learning allocation across medical specialties.
              </p>
            </div>

            <div className="space-y-4 my-auto">
              {studyDistribution.map((item) => (
                <div key={item.subject} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-extrabold text-gray-800">{item.subject}</span>
                    <span className="font-black text-gray-900">
                      {item.hours} hrs <span className="font-medium text-gray-400">({item.percentage}%)</span>
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600 font-medium">
            <span>Cumulative Study:</span>
            <strong className="text-gray-900 font-black text-sm">92.0 Total Hours</strong>
          </div>
        </section>

        {/* Consistency Heatmap (GitHub-Style 30-Day Activity Matrix) */}
        <section
          className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs flex flex-col justify-between"
          aria-labelledby="consistency-matrix-heading"
        >
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <h2 id="consistency-matrix-heading" className="text-sm sm:text-base font-black text-gray-900 tracking-tight">
                Consistency Heatmap (30 Days)
              </h2>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                14-Day Streak Active
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mb-3 mt-0.5">
              Daily learning sessions, quiz completions, and active study frequency.
            </p>

            {/* Heatmap Grid */}
            <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
              {days30.map((d, index) => {
                const bgClass =
                  d.intensity === 4
                    ? "bg-emerald-600 text-white"
                    : d.intensity === 3
                    ? "bg-emerald-400 text-white"
                    : d.intensity === 2
                    ? "bg-emerald-200 text-emerald-950"
                    : d.intensity === 1
                    ? "bg-emerald-100/70 text-emerald-900"
                    : "bg-gray-100 text-gray-400";

                return (
                  <div
                    key={index}
                    className={`group relative aspect-square rounded-md flex items-center justify-center text-xs font-black transition-all hover:scale-110 cursor-pointer ${bgClass}`}
                  >
                    <span>{30 - index}</span>
                    {/* Hover tooltip */}
                    <div className="pointer-events-none absolute bottom-full mb-1 hidden group-hover:block z-20 whitespace-nowrap rounded-md bg-gray-900 px-2 py-0.5 text-[10px] font-semibold text-white shadow-md">
                      {d.hours > 0 ? `${d.hours} hrs studied` : "Rest day"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Less active</span>
            <div className="flex items-center gap-1.5">
              <span className="size-3 rounded bg-gray-100" />
              <span className="size-3 rounded bg-emerald-100" />
              <span className="size-3 rounded bg-emerald-200" />
              <span className="size-3 rounded bg-emerald-400" />
              <span className="size-3 rounded bg-emerald-600" />
            </div>
            <span>More active</span>
          </div>
        </section>

      </div>
    </div>
  );
};
