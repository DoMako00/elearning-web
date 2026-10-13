import type { EventType } from "./calendar.types";
import { FileText, Video, Clock, User } from "lucide-react";
import type React from "react";

// Hours shown in the week/day time grid (24-h wrapping starting at 8 AM)
export const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 1, 2, 3, 4, 5, 6, 7];

export const EVENT_TYPE_CONFIG: Record<
  EventType,
  { label: string; icon: React.ComponentType<{ className?: string; size?: number }> }
> = {
  quiz: { label: "Quiz", icon: FileText },
  live_session: { label: "Live Session", icon: Video },
  assignment: { label: "Assignment", icon: FileText },
  office_hours: { label: "Office Hours", icon: User },
  study_block: { label: "Study Block", icon: Clock },
};

export function formatHour(h: number): string {
  if (h === 0 || h === 24) return "12 AM";
  if (h === 12) return "12 PM";
  if (h > 12) return `${h - 12} PM`;
  return `${h} AM`;
}

export function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

/** Format a Date into YYYY-MM-DD using local calendar date parts. */
export function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Get current date string (YYYY-MM-DD) and 24h time in Egypt timezone (Africa/Cairo). */
export function getEgyptNow(): { dateStr: string; hour: number; minute: number } {
  const now = new Date();
  const dateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);

  const hourPart = parts.find((p) => p.type === "hour")?.value || "0";
  const minutePart = parts.find((p) => p.type === "minute")?.value || "0";

  return {
    dateStr,
    hour: parseInt(hourPart, 10) % 24,
    minute: parseInt(minutePart, 10),
  };
}
