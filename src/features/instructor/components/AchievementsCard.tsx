import React from "react";
import { Award, ArrowUpRight, Medal, BookmarkCheck } from "lucide-react";
import type { Achievement } from "../../../types/instructor";

interface AchievementsCardProps {
  achievements: Achievement[];
}

export const AchievementsCard: React.FC<AchievementsCardProps> = ({
  achievements,
}) => {
  const getBadgeIcon = (type: Achievement["type"]) => {
    switch (type) {
      case "fellowship":
        return (
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <Medal className="w-4 h-4" />
          </div>
        );
      case "award":
        return (
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
            <Award className="w-4 h-4" />
          </div>
        );
      case "certificate":
        return (
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <BookmarkCheck className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-2xs overflow-hidden shrink-0 lg:flex-1 lg:min-h-0 lg:flex lg:flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-2.5 shrink-0">
        <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
          <Award className="w-4 h-4 text-emerald-600" />
          <span>Achievements & Certifications</span>
        </div>

        <button
          type="button"
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>View all</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* List */}
      <div className="space-y-2.5 lg:flex-1 lg:min-h-0 lg:overflow-y-auto">
        {achievements.map((item) => (
          <div
            key={item.id}
            className="flex items-start justify-between gap-3 text-xs"
          >
            <div className="flex items-start gap-2.5 min-w-0">
              {getBadgeIcon(item.type)}
              <div className="min-w-0">
                <h4 className="font-bold text-slate-900 text-xs sm:text-[13px] leading-snug truncate">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {item.organization}
                </p>
              </div>
            </div>

            <span className="text-xs font-semibold text-slate-400 shrink-0">
              {item.year}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
