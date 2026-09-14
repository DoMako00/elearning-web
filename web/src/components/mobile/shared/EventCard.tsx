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

export const EventCard: React.FC<EventCardProps> = ({ event, now, onSelect }) => {
  const styleConfig = EVENT_STYLE_MAP[event.type] || EVENT_STYLE_MAP.quiz;
  const IconComponent = styleConfig.icon;
  const isLive = isEventLive(event, now);

  // Time range formatting: if displayTime is "9:00 - 10:30 AM", we can present start and end times cleanly
  const [startTimeDisplay, endTimeDisplay] = React.useMemo(() => {
    if (event.displayTime && event.displayTime.includes("-")) {
      const parts = event.displayTime.split("-").map((s: string) => s.trim());
      return [parts[0], parts[1]];
    }
    return [event.startTime, event.endTime];
  }, [event.displayTime, event.startTime, event.endTime]);

  return (
    <button
      type="button"
      onClick={() => onSelect(event)}
      className="w-full text-left bg-white rounded-2xl border border-slate-100 shadow-2xs hover:border-slate-200 active:scale-[0.99] transition-all p-3.5 sm:p-4 flex items-center gap-3.5 relative overflow-hidden group cursor-pointer"
    >
      {/* Left accent indicator bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl"
        style={{ backgroundColor: styleConfig.accentColor }}
      />

      {/* Left column: stacked start and end times */}
      <div className="flex flex-col items-start justify-center shrink-0 w-18 pl-1">
        <span className="text-xs font-black text-slate-800 tracking-tight leading-tight">
          {startTimeDisplay}
        </span>
        <span className="text-[11px] font-medium text-slate-400 leading-tight mt-0.5">
          {endTimeDisplay}
        </span>
      </div>

      {/* Vertical divider */}
      <div className="h-9 w-px bg-slate-100 shrink-0" />

      {/* Center column: Icon chip, title, and description/course */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center gap-1.5 mb-1">
          <div
            className="size-5 rounded-md flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: styleConfig.chipBg,
              borderColor: styleConfig.chipBorder,
              color: styleConfig.chipText,
            }}
          >
            <IconComponent className="size-3 stroke-[2.2]" />
          </div>
          <span
            className="text-[10px] font-bold uppercase tracking-wider truncate"
            style={{ color: styleConfig.chipText }}
          >
            {styleConfig.label}
          </span>
        </div>

        <h4
          className="text-sm font-bold truncate leading-snug"
          style={{ color: styleConfig.titleColor }}
        >
          {event.title}
        </h4>

        <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
          {event.courseTitle || event.description || "General schedule item"}
        </p>
      </div>

      {/* Right column: "Live" status pill if live, plus chevron */}
      <div className="flex items-center gap-2 shrink-0">
        {isLive && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider animate-pulse shadow-xs">
            <span className="size-1.5 rounded-full bg-white" />
            Live
          </span>
        )}
        <ChevronRight className="size-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
      </div>
    </button>
  );
};
