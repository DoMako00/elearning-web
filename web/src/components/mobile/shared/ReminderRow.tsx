import React from "react";
import { FileText, CheckCircle2, ChevronRight } from "lucide-react";
import type { ReminderItem } from "../../ui/Calendar/calendar.types";

export interface ReminderRowProps {
  reminder: ReminderItem;
  onClick?: (reminder: ReminderItem) => void;
}

const REMINDER_CONFIG: Record<
  ReminderItem["type"],
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    bg: string;
    border: string;
    text: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  assignment: {
    label: "Assignment",
    icon: FileText,
    bg: "bg-purple-50",
    border: "border-purple-200/60",
    text: "text-purple-700",
    badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
    badgeText: "Assignment",
  },
  goal: {
    label: "Goal",
    icon: CheckCircle2,
    bg: "bg-emerald-50",
    border: "border-emerald-200/60",
    text: "text-emerald-700",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    badgeText: "Goal",
  },
  quiz: {
    label: "Quiz",
    icon: FileText,
    bg: "bg-amber-50",
    border: "border-amber-200/60",
    text: "text-amber-700",
    badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
    badgeText: "Quiz",
  },
};

export const ReminderRow: React.FC<ReminderRowProps> = ({ reminder, onClick }) => {
  const config = REMINDER_CONFIG[reminder.type] || REMINDER_CONFIG.assignment;
  const IconComponent = config.icon;

  return (
    <div
      onClick={() => onClick?.(reminder)}
      className="w-full bg-white rounded-2xl border border-slate-100/80 shadow-2xs hover:border-slate-200 transition-all p-3.5 flex items-center justify-between gap-3 group cursor-pointer"
    >
      {/* Left icon circle */}
      <div
        className={`size-9 rounded-xl flex items-center justify-center shrink-0 border ${config.bg} ${config.border} ${config.text}`}
      >
        <IconComponent className="size-4 stroke-[2.2]" />
      </div>

      {/* Middle: Title & Date Subtext */}
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold text-slate-900 truncate leading-snug">
          {reminder.title}
        </h4>
        <p className="text-[11px] font-medium text-slate-400 mt-0.5">
          {reminder.dateLabel}
        </p>
      </div>

      {/* Right: Colored type pill + chevron */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${config.badgeBg}`}
        >
          {reminder.type}
        </span>
        <ChevronRight className="size-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
      </div>
    </div>
  );
};
