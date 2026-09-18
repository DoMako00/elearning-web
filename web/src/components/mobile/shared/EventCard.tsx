import React from "react";
import { FileText, Video, User, Clock, ChevronRight } from "lucide-react";
import type { CalendarEvent, EventType } from "../../ui/Calendar/calendar.types";
import { isEventLive } from "./eventLive";

export interface EventCardProps {
  event: CalendarEvent;
  now: Date;
  onSelect: (event: CalendarEvent) => void;
}

/**
 * Exact visual mapping matching desktop Calendar.css:
 * - quiz: bg #ebfaf1, border #c4eed5, text #087f55
 * - live_session: bg #eff6ff, border #dbeafe, text #1d4ed8
 * - assignment: bg #f5f3ff, border #ede9fe, text #6d28d9
 * - office_hours: bg #faf5ff, border #f3e8ff, text #7e22ce
 * - study_block: bg #fffbeb, border #fef3c7, text #b45309
 */
export const EVENT_STYLE_MAP: Record<
  EventType,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    chipBg: string;
    chipBorder: string;
    chipText: string;
    titleColor: string;
  }
> = {
  quiz: {
    label: "Quiz",
    icon: FileText,
    accentColor: "#087f55",
    chipBg: "#ebfaf1",
    chipBorder: "#c4eed5",
    chipText: "#087f55",
    titleColor: "#087f55",
  },
  live_session: {
    label: "Live Session",
    icon: Video,
    accentColor: "#1d4ed8",
    chipBg: "#eff6ff",
    chipBorder: "#dbeafe",
    chipText: "#1d4ed8",
    titleColor: "#1d4ed8",
  },
  assignment: {
    label: "Assignment",
    icon: FileText,
    accentColor: "#6d28d9",
    chipBg: "#f5f3ff",
    chipBorder: "#ede9fe",
    chipText: "#6d28d9",
    titleColor: "#6d28d9",
  },
  office_hours: {
    label: "Office Hours",
    icon: User,
    accentColor: "#7e22ce",
    chipBg: "#faf5ff",
    chipBorder: "#f3e8ff",
    chipText: "#7e22ce",
    titleColor: "#7e22ce",
  },
  study_block: {
    label: "Study Block",
    icon: Clock,
    accentColor: "#b45309",
    chipBg: "#fffbeb",
    chipBorder: "#fef3c7",
    chipText: "#b45309",
    titleColor: "#b45309",
  },
};

export const EventCard: React.FC<EventCardProps & { isLast?: boolean }> = ({
  event,
  now,
  onSelect,
  isLast = false,
}) => {
  const isLive = isEventLive(event, now);

  // Time formatting: "9:00 AM", "10:30 AM"
  const [startTimeDisplay, endTimeDisplay] = React.useMemo(() => {
    if (event.displayTime && event.displayTime.includes("-")) {
      const parts = event.displayTime.split("-").map((s: string) => s.trim());
      return [parts[0], parts[1]];
    }
    return [event.startTime, event.endTime];
  }, [event.displayTime, event.startTime, event.endTime]);

  // Design tokens matching target screenshot:
  // Live Session / blue: bg-blue-50/60, text-blue-600, border-blue-100/50, dot bg-blue-500
  // Anatomy / blue lecture: bg-blue-50/60, text-blue-600, border-blue-100/50, dot bg-blue-500
  // Personal Study / amber: bg-amber-50/60, text-amber-700, border-amber-100/50, dot bg-amber-500
  // Quiz / green: bg-emerald-50/60, text-emerald-700, border-emerald-100/50, dot bg-emerald-500
  // Office Hours / purple: bg-purple-50/60, text-purple-700, border-purple-100/50, dot bg-purple-500
  const visualConfig = React.useMemo(() => {
    switch (event.type) {
      case "live_session":
        return {
          cardBg: "bg-blue-50/50 hover:bg-blue-50/80 border-blue-100/60",
          dotColor: "bg-blue-600 ring-4 ring-blue-100/70",
          iconColor: "text-blue-600",
          titleColor: "text-blue-950",
          icon: Video,
        };
      case "study_block":
        return {
          cardBg: "bg-amber-50/50 hover:bg-amber-50/80 border-amber-100/60",
          dotColor: "bg-amber-500 ring-4 ring-amber-100/70",
          iconColor: "text-amber-600",
          titleColor: "text-amber-950",
          icon: Clock,
        };
      case "quiz":
        return {
          cardBg: "bg-emerald-50/50 hover:bg-emerald-50/80 border-emerald-100/60",
          dotColor: "bg-emerald-600 ring-4 ring-emerald-100/70",
          iconColor: "text-emerald-600",
          titleColor: "text-emerald-950",
          icon: FileText,
        };
      case "office_hours":
        return {
          cardBg: "bg-purple-50/50 hover:bg-purple-50/80 border-purple-100/60",
          dotColor: "bg-purple-600 ring-4 ring-purple-100/70",
          iconColor: "text-purple-600",
          titleColor: "text-purple-950",
          icon: User,
        };
      case "assignment":
      default:
        return {
          cardBg: "bg-indigo-50/50 hover:bg-indigo-50/80 border-indigo-100/60",
          dotColor: "bg-indigo-600 ring-4 ring-indigo-100/70",
          iconColor: "text-indigo-600",
          titleColor: "text-indigo-950",
          icon: FileText,
        };
    }
  }, [event.type]);

  const IconComp = visualConfig.icon;

  return (
    <div className="flex items-stretch gap-2.5 sm:gap-3 group">
      {/* 1. Left Time Column */}
      <div className="flex flex-col items-start justify-start pt-3 shrink-0 w-16 text-left">
        <span className="text-xs font-black text-slate-700 tracking-tight leading-tight">
          {startTimeDisplay}
        </span>
        {endTimeDisplay && (
          <span className="text-[11px] font-semibold text-slate-400 leading-tight mt-0.5">
            {endTimeDisplay}
          </span>
        )}
      </div>

      {/* 2. Timeline spine with node dot */}
      <div className="relative flex flex-col items-center shrink-0 w-3">
        {/* Continuous background track line */}
        {!isLast && (
          <div className="absolute top-4.5 bottom-0 w-0.5 bg-slate-100" />
        )}
        <div className="absolute -top-3.5 bottom-0 w-0.5 bg-slate-100" />

        {/* Timeline node bullet dot */}
        <div
          className={`size-2.5 rounded-full z-10 mt-3.5 shrink-0 ${visualConfig.dotColor} transition-transform group-hover:scale-125`}
        />
      </div>

      {/* 3. Event Card Bubble */}
      <button
        type="button"
        onClick={() => onSelect(event)}
        className={`flex-1 text-left rounded-2xl sm:rounded-3xl border p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs active:scale-[0.99] transition-all cursor-pointer ${visualConfig.cardBg}`}
      >
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Leading Icon */}
          <div className="pt-0.5 shrink-0">
            <IconComp className={`size-5 stroke-2 ${visualConfig.iconColor}`} />
          </div>

          {/* Title & Description */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4
                className={`text-sm font-extrabold truncate leading-tight ${visualConfig.titleColor}`}
              >
                {event.title}
              </h4>
              {isLive && (
                <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[9.5px] font-black uppercase tracking-wider shrink-0 shadow-xs animate-pulse">
                  Live
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed mt-1">
              {event.description || event.courseTitle || "Scheduled academic session"}
            </p>
          </div>
        </div>

        {/* Trailing chevron */}
        <div className="shrink-0 pl-1">
          <ChevronRight className="size-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
        </div>
      </button>
    </div>
  );
};
