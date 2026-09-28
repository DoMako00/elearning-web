import React from "react";
import { Clock, BookOpen, Trash2, Monitor } from "lucide-react";
import type { CalendarEvent } from "../../ui/Calendar/calendar.types";
import { BottomSheet } from "./BottomSheet";
import { EVENT_STYLE_MAP } from "./EventCard";

export interface EventDetailSheetProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (eventId: string) => void;
}

export const EventDetailSheet: React.FC<EventDetailSheetProps> = ({
  event,
  isOpen,
  onClose,
  onDelete,
}) => {
  if (!event) return null;

  const styleConfig = EVENT_STYLE_MAP[event.type] || EVENT_STYLE_MAP.quiz;
  const IconComponent = styleConfig.icon;

  const handleDelete = () => {
    if (onDelete) {
      onDelete(event.id);
    }
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Event Details">
      <div className="space-y-4 pb-2">
        {/* Category & Status Header */}
        <div className="flex items-center justify-between gap-2">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border"
            style={{
              backgroundColor: styleConfig.chipBg,
              borderColor: styleConfig.chipBorder,
              color: styleConfig.chipText,
            }}
          >
            <IconComponent className="size-3.5" />
            {styleConfig.label}
          </span>

          {event.status && (
            <span className="text-[11px] font-semibold text-slate-500 capitalize bg-slate-100 px-2 py-0.5 rounded-md">
              {event.status}
            </span>
          )}
        </div>

        {/* Title */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 leading-snug">
            {event.title}
          </h3>
          {event.courseTitle && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium mt-1">
              <BookOpen className="size-3.5 text-slate-400 shrink-0" />
              <span>{event.courseTitle}</span>
            </div>
          )}
        </div>

        {/* Date and Time info block */}
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
          <Clock className="size-4 text-emerald-600 shrink-0" />
          <div className="text-xs font-semibold">
            <span>{event.date}</span>
            <span className="mx-1.5 text-slate-300">•</span>
            <span>{event.displayTime || `${event.startTime} - ${event.endTime}`}</span>
          </div>
        </div>

        {/* Description / Notes (only if set, exactly matching desktop modal) */}
        {event.description && (
          <div className="p-3 rounded-xl bg-white border border-slate-100">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Notes & Overview
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {event.description}
            </p>
          </div>
        )}

        {/* Docs-only Live Session join link fallback:
            Instead of desktop's "Join Meeting" button that opens video/URL,
            show an informational row: "Join from desktop to attend this live session". */}
        {event.locationOrUrl && (
          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/60 flex items-start gap-2.5">
            <Monitor className="size-4.5 text-blue-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-bold text-blue-900">
                Desktop-Only Live Session
              </h5>
              <p className="text-[11px] text-blue-700/90 font-medium leading-normal mt-0.5">
                Join from desktop to attend this live session. Mobile app is dedicated to readings, syllabus, and study docs.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex items-center gap-3">
          {onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all cursor-pointer"
            >
              <Trash2 className="size-3.5" />
              <span>Delete Event</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="flex-1 inline-flex items-center justify-center py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-98 text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};
