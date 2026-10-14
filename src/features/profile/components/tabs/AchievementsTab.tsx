import React from "react";
import {
  Flame,
  Snowflake,
  Trophy,
  Award,
  Sparkles,
  Lock,
  CheckCircle2,
  Download,
  ExternalLink,
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
  certificates: import("../../../student/api/studentLearningApi").StudentCertificateSummaryDto[];
  certificateActionId: string | null;
  certificateError: string | null;
  onOpenCertificate: (certificateId: string) => void;
  onDownloadCertificate: (certificateId: string) => void;
}

export const AchievementsTab: React.FC<AchievementsTabProps> = ({
  profile,
  milestones,
  stats,
  certificates,
  certificateActionId,
  certificateError,
  onOpenCertificate,
  onDownloadCertificate,
}) => {
  // SVG Ring Progress Calculations
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const hasWeeklyGoal = stats.weeklyTargetLessons !== null;
  const freezePasses = stats.streakFreezePassesRemaining;
  const weeklyPercentage = hasWeeklyGoal
    ? Math.min(100, Math.round(((stats.weeklyCompletedLessons ?? 0) / (stats.weeklyTargetLessons || 1)) * 100))
    : 0;
  const strokeOffset = circumference - (circumference * weeklyPercentage) / 100;
  const hasXpData = profile.level !== null && profile.xp !== null && profile.nextLevelXp !== null;
  const xpPercentage = hasXpData ? Math.min(100, Math.round((profile.xp! / profile.nextLevelXp!) * 100)) : 0;

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
              <span>{stats.currentStreakDays === null ? "NO DATA" : stats.currentStreakDays > 0 ? "ACTIVE" : "INACTIVE"}</span>
            </span>
          </div>

          <div className="my-2 flex items-baseline gap-2.5">
            <span className="text-4xl font-black text-gray-900 tracking-tight">
              {stats.currentStreakDays ?? "—"}
            </span>
            <span className="text-sm font-bold text-gray-700">days streak 🔥</span>
          </div>

          <p className="text-xs sm:text-[13px] text-gray-600 font-medium">
            Best record: <strong className="text-gray-900 font-bold">{stats.bestStreakRecord === null ? "—" : `${stats.bestStreakRecord} days`}</strong>
          </p>

          {freezePasses !== null && <div className="mt-2.5 pt-2.5 border-t border-emerald-100/80 flex items-center justify-between text-xs sm:text-[13px]">
            <div className="flex items-center gap-1.5 text-emerald-950 font-bold">
              <Snowflake className="size-3.5 text-cyan-600" />
              <span>Freeze passes:</span>
            </div>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((pass) => (
                <span
                  key={pass}
                  className={`size-2.5 rounded-full ${
                    pass <= freezePasses
                      ? "bg-cyan-500 shadow-xs ring-1 ring-cyan-300"
                      : "bg-gray-200"
                  }`}
                  title={
                    pass <= freezePasses
                      ? "Freeze pass ready"
                      : "Freeze pass used"
                  }
                />
              ))}
              <span className="ml-1 text-xs font-black text-gray-800">
                {freezePasses}/3
              </span>
            </div>
          </div>}
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
              {hasWeeklyGoal ? `${weeklyPercentage}% Achieved` : "No goal set"}
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
              <span className="text-lg font-black text-gray-900 leading-none">{hasWeeklyGoal ? stats.weeklyCompletedLessons ?? 0 : "—"}</span>
              <span className="text-[10px] text-gray-500 uppercase font-bold mt-0.5">{hasWeeklyGoal ? `of ${stats.weeklyTargetLessons} lessons` : "goal not set"}</span>
            </div>
          </div>

          <p className="text-xs sm:text-[13px] text-gray-600 font-medium text-center">
            {hasWeeklyGoal ? <><strong className="text-gray-900 font-bold">{Math.max(0, (stats.weeklyTargetLessons ?? 0) - (stats.weeklyCompletedLessons ?? 0))} lessons remaining</strong> to weekly goal</> : "Set a weekly lesson goal from your learning dashboard."}
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
                <span>{profile.level === null ? "Not tracked" : `Level ${profile.level}`}</span>
              </span>
            </div>

            <div className="mt-2.5 flex items-center justify-between">
              <div>
                <p className="text-2xl font-black text-gray-900 tracking-tight leading-none">
                  {profile.xp === null ? "—" : profile.xp.toLocaleString()} {profile.xp !== null && <span className="text-sm font-bold text-emerald-600">XP</span>}
                </p>
                <p className="text-xs sm:text-sm font-bold text-emerald-700 mt-1">
                  {profile.rankTitle || "XP and rank are not currently tracked."}
                </p>
              </div>
              <div className="grid size-11 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
                <Trophy className="size-6 text-amber-600" />
              </div>
            </div>
          </div>

          {hasXpData && <div className="mt-2.5 pt-2.5 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs font-bold text-gray-600 mb-1.5">
              <span>Next: Level {profile.level! + 1}</span>
              <span className="text-emerald-700 font-black">{Math.max(0, profile.nextLevelXp! - profile.xp!)} XP needed</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-linear-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                style={{ width: `${xpPercentage}%` }}
              />
            </div>
          </div>}
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
              {milestones.filter((m) => m.earned).length}
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
                    badge.tier === "gold" || badge.tier === null ? (
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
                      {badge.tier ?? "Award"}
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
          {milestones.length === 0 && <p className="col-span-full rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-6 text-center text-sm text-gray-500">No persisted achievement awards are available yet.</p>}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-4 lg:p-5 shadow-xs flex flex-col gap-3 shrink-0" aria-labelledby="issued-certificates-heading">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 id="issued-certificates-heading" className="text-sm sm:text-base lg:text-lg font-black text-gray-900 tracking-tight">Issued Certificates</h2>
            <p className="mt-1 text-xs text-gray-500">Only certificates issued to your account can be opened or downloaded.</p>
          </div>
          <Award className="size-5 shrink-0 text-emerald-600" />
        </div>
        {certificateError && <p className="text-sm text-rose-600" role="alert">{certificateError}</p>}
        <div className="space-y-2">
          {certificates.filter(certificate => certificate.status === "issued").map(certificate => <div key={certificate.id} className="flex flex-col gap-3 rounded-xl border border-emerald-100 bg-emerald-50/30 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0"><h3 className="truncate text-sm font-extrabold text-gray-900">{certificate.courseTitle}</h3><p className="mt-1 text-xs text-gray-600">Credential {certificate.credentialCode} · Issued {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(certificate.issuedAt))}</p></div>
            <div className="flex shrink-0 gap-2"><button type="button" className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-emerald-800 disabled:opacity-50" onClick={() => onOpenCertificate(certificate.id)} disabled={certificateActionId === certificate.id}>{certificateActionId === certificate.id ? <span className="size-3 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" /> : <ExternalLink size={13} />}Open</button><button type="button" className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50" onClick={() => onDownloadCertificate(certificate.id)} disabled={certificateActionId === certificate.id}>{certificateActionId === certificate.id ? <span className="size-3 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Download size={13} />}Download SVG</button></div>
          </div>)}
          {certificates.every(certificate => certificate.status !== "issued") && <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-5 text-center text-sm text-gray-500">No issued certificates are available yet.</p>}
        </div>
      </section>
    </div>
  );
};
