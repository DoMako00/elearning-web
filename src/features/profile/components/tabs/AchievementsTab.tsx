import React from "react";
import {
  Flame,
  Snowflake,
  Trophy,
  Award,
  Sparkles,
  Lock,
  CheckCircle2,
} from "lucide-react";
import type {
  MilestoneBadgeItem,
  ProfileAnalyticsStats,
  UserProfileData,
} from "../../types/profile.types";

interface AchievementsTabProps {
  profile: UserProfileData;
  milestones: MilestoneBadgeItem[];
  stats: ProfileAnalyticsStats;
}

export const AchievementsTab: React.FC<AchievementsTabProps> = ({
  profile,
  milestones,
  stats,
}) => {
  // SVG Ring Progress Calculations
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const weeklyPercentage = Math.min(
    100,
    Math.round((stats.weeklyCompletedHours / stats.weeklyTargetHours) * 100)
  );
  const strokeOffset = circumference - (circumference * weeklyPercentage) / 100;

  // XP Next level percentage
  const currentLevelBaseXp = (profile.level - 1) * 300;
  const xpInCurrentLevel = profile.xp - currentLevelBaseXp;
  const xpNeededForNext = profile.nextLevelXp - currentLevelBaseXp;
  const xpPercentage = Math.min(
    100,
    Math.round((xpInCurrentLevel / xpNeededForNext) * 100)
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col justify-start overflow-y-auto overflow-x-hidden pt-1 pb-4 gap-4">
      {/* Top Row: Gamification Metrics (responsive cols on small/tablet/desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 shrink-0">
        
        {/* Card 1: Streak Score Card */}
        <section
          className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-linear-to-br from-emerald-500/10 via-white to-emerald-50/50 p-4 lg:p-5 shadow-xs flex flex-col justify-between"
          aria-labelledby="streak-score-heading"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-[13px] font-extrabold uppercase tracking-wider text-emerald-800">
              Active Streak
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-800">
              <Flame className="size-3.5 fill-emerald-600 text-emerald-600 animate-pulse" />
              <span>ON FIRE</span>
            </span>
          </div>

          <div className="my-2 flex items-baseline gap-2.5">
            <span className="text-4xl font-black text-gray-900 tracking-tight">
              {stats.weeklyStreakDays}
            </span>
            <span className="text-sm font-bold text-gray-700">days streak 🔥</span>
          </div>

          <p className="text-xs sm:text-[13px] text-gray-600 font-medium">
            Best record: <strong className="text-gray-900 font-bold">{stats.bestStreakRecord} days</strong>
          </p>

          <div className="mt-2.5 pt-2.5 border-t border-emerald-100/80 flex items-center justify-between text-xs sm:text-[13px]">
            <div className="flex items-center gap-1.5 text-emerald-950 font-bold">
              <Snowflake className="size-3.5 text-cyan-600" />
              <span>Freeze passes:</span>
            </div>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((pass) => (
                <span
                  key={pass}
                  className={`size-2.5 rounded-full ${
                    pass <= stats.streakFreezePassesRemaining
                      ? "bg-cyan-500 shadow-xs ring-1 ring-cyan-300"
                      : "bg-gray-200"
                  }`}
                  title={
                    pass <= stats.streakFreezePassesRemaining
                      ? "Freeze pass ready"
                      : "Freeze pass used"
                  }
                />
              ))}
              <span className="ml-1 text-xs font-black text-gray-800">
                {stats.streakFreezePassesRemaining}/3
              </span>
            </div>
          </div>
        </section>

        {/* Card 2: Weekly Goal Tracker (Dynamic Progress Ring) */}
        <section
          className="flex flex-col items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 lg:p-5 shadow-xs"
          aria-labelledby="weekly-goal-heading"
        >
          <div className="w-full flex items-center justify-between">
            <h2 id="weekly-goal-heading" className="text-xs sm:text-[13px] font-extrabold uppercase tracking-wider text-gray-700">
              Weekly Goal Tracker
            </h2>
            <span className="text-xs sm:text-[13px] font-black text-emerald-600">
              {weeklyPercentage}% Achieved
            </span>
          </div>

          <div className="my-1.5 relative size-24 flex items-center justify-center">
            <svg className="size-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-gray-100"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-emerald-500 transition-all duration-1000 ease-out"
                strokeWidth="8"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
              />
            </svg>
            <div className="absolute flex flex-col items-center text-center">
              <span className="text-lg font-black text-gray-900 leading-none">
                {stats.weeklyCompletedHours}
              </span>
              <span className="text-[10px] text-gray-500 uppercase font-bold mt-0.5">
                of {stats.weeklyTargetHours}h
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-[13px] text-gray-600 font-medium text-center">
            <strong className="text-gray-900 font-bold">2.5 hrs remaining</strong> to weekly goal
          </p>
        </section>

        {/* Card 3: XP & Level Metrics */}
        <section
          className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4 lg:p-5 shadow-xs"
          aria-labelledby="xp-level-heading"
        >
          <div>
            <div className="flex items-center justify-between">
              <h2 id="xp-level-heading" className="text-xs sm:text-[13px] font-extrabold uppercase tracking-wider text-gray-700">
                XP & Rank
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-800">
                <Sparkles className="size-3 text-amber-600" />
                <span>Level {profile.level}</span>
              </span>
            </div>

            <div className="mt-2.5 flex items-center justify-between">
              <div>
                <p className="text-2xl font-black text-gray-900 tracking-tight leading-none">
                  {profile.xp.toLocaleString()} <span className="text-sm font-bold text-emerald-600">XP</span>
                </p>
                <p className="text-xs sm:text-sm font-bold text-emerald-700 mt-1">
                  {profile.rankTitle}
                </p>
              </div>
              <div className="grid size-11 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
                <Trophy className="size-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="mt-2.5 pt-2.5 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs font-bold text-gray-600 mb-1.5">
              <span>Next: Level {profile.level + 1}</span>
              <span className="text-emerald-700 font-black">{profile.nextLevelXp - profile.xp} XP needed</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-linear-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                style={{ width: `${xpPercentage}%` }}
              />
            </div>
          </div>
        </section>

      </div>

      {/* Milestone Badges Grid (Showcasing Earned and Locked Achievements) */}
      <section className="rounded-2xl border border-gray-100 bg-white p-4 lg:p-5 shadow-xs flex flex-col justify-between shrink-0">
        <div className="flex items-center justify-between gap-2 mb-2.5 shrink-0">
          <div>
            <h2 className="text-sm sm:text-base lg:text-lg font-black text-gray-900 tracking-tight">
              Milestone Badges & Honors
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs sm:text-[13px] font-bold text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
            <span>Unlocked:</span>
            <strong className="text-emerald-700 font-black">
              {milestones.filter((m) => m.earned).length} / {milestones.length}
            </strong>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 flex-1 min-h-0 items-stretch">
          {milestones.map((badge) => {
            const isEarned = badge.earned;
            return (
              <div
                key={badge.id}
                className={`relative flex items-start gap-3 rounded-xl border p-3 transition-all ${
                  isEarned
                    ? "border-emerald-100 bg-emerald-50/35 hover:border-emerald-300 hover:shadow-xs"
                    : "border-dashed border-gray-200 bg-gray-50/60 opacity-75"
                }`}
              >
                {/* Badge Icon Badge */}
                <div
                  className={`grid size-11 place-items-center rounded-xl shrink-0 shadow-xs ${
                    isEarned
                      ? badge.tier === "gold"
                        ? "bg-linear-to-tr from-amber-400 to-amber-200 text-amber-900"
                        : badge.tier === "diamond"
                        ? "bg-linear-to-tr from-cyan-400 to-blue-300 text-cyan-950"
                        : "bg-linear-to-tr from-emerald-500 to-teal-300 text-white"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {isEarned ? (
                    badge.tier === "gold" ? (
                      <Award className="size-5.5" />
                    ) : (
                      <Flame className="size-5.5" />
                    )
                  ) : (
                    <Lock className="size-4.5" />
                  )}
                </div>

                {/* Badge Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className={`text-xs sm:text-sm font-extrabold truncate ${isEarned ? "text-gray-900" : "text-gray-600"}`}>
                      {badge.title}
                    </h3>
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        isEarned
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-gray-200/80 text-gray-600"
                      }`}
                    >
                      {badge.tier}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 leading-tight mt-1 line-clamp-1 font-medium">
                    {badge.description}
                  </p>

                  {/* Progress Indicator or Earned Date */}
                  <div className="mt-1.5 pt-1.5 border-t border-gray-100">
                    {isEarned ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="size-3.5 text-emerald-600" />
                        <span>Unlocked in {badge.earnedDate}</span>
                      </span>
                    ) : (
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>
                            {badge.progressCurrent} / {badge.progressTarget}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{
                              width: `${
                                ((badge.progressCurrent || 0) /
                                  (badge.progressTarget || 1)) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
