import type { EventType } from "./calendar.types";
import { FileText, Video, Clock, User, Bell, BookOpen, CalendarDays, GraduationCap } from "lucide-react";
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
  reminder: { label: "Reminder", icon: Bell },
  academic_event: { label: "Academic Event", icon: CalendarDays },
  course_release: { label: "Course Release", icon: BookOpen },
  exam: { label: "Exam", icon: GraduationCap },
  holiday: { label: "Holiday", icon: CalendarDays },
};

export function formatHour(h: number): string {
  if (h === 0 || h === 24) return "12 AM";
  if (h === 12) return "12 PM";
  if (h > 12) return `${h - 12} PM`;
  return `${h} AM`;
}

/** Convert a Cairo wall-clock date/time to an ISO instant without relying on the browser's local timezone. */
export function cairoDateTimeToIso(date: string, time: string): string {
  const target = Date.parse(`${date}T${time}:00Z`);
  let candidate = target;
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(candidate)).map((part) => [part.type, part.value]));
    const shown = Date.parse(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:00Z`);
    const delta = target - shown;
    if (delta === 0) break;
    candidate += delta;
  }
  return new Date(candidate).toISOString();
}

export function cairoDateTimeParts(value: string): { date: string; time: string } {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(value)).map((part) => [part.type, part.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
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
