import React from "react";
import { Calendar, ArrowUpRight } from "lucide-react";
import type { ScheduleItem } from "../../../types/instructor";

interface WeeklyScheduleCardProps {
  schedule: ScheduleItem[];
  onViewScheduleClick?: () => void;
}

export const WeeklyScheduleCard: React.FC<WeeklyScheduleCardProps> = ({
  schedule,
  onViewScheduleClick,
}) => {
  const getBadgeStyle = (type: ScheduleItem["type"]) => {
    switch (type) {
      case "Office Hours":
        return "text-emerald-700 bg-emerald-50/90 border-emerald-100";
      case "Course Meetings":
        return "text-blue-700 bg-blue-50/90 border-blue-100";
      case "Student Consultations":
        return "text-amber-700 bg-amber-50/90 border-amber-100";
      case "Research Supervision":
        return "text-purple-700 bg-purple-50/90 border-purple-100";
      default:
        return "text-slate-700 bg-slate-50 border-slate-100";
    }
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-2xs overflow-hidden flex flex-col shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span>Weekly Schedule / Office Hours</span>
        </div>

        <button
          type="button"
          onClick={onViewScheduleClick}
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>View schedule</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Schedule List */}
      <div className="divide-y divide-slate-50 mt-1">
        {schedule.map((slot) => (
          <div
            key={slot.id}
            className="py-2 flex items-center justify-between text-xs sm:text-[13px] hover:bg-slate-50 px-1 rounded transition-colors"
          >
            <div className="w-24 font-semibold text-slate-900 truncate">
              {slot.day}
            </div>

            <div className="text-slate-600 font-normal truncate flex-1 text-center">
              {slot.time}
            </div>

            <div className="text-right shrink-0">
              <span
                className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-medium border ${getBadgeStyle(
                  slot.type
                )}`}
              >
                {slot.type}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
