import type { EventType } from "./calendar.types";
import { FileText, Video, Clock, User, Bell, BookOpen, CalendarDays, GraduationCap } from "lucide-react";
import type React from "react";

// Hours shown in the week/day time grid (24-h wrapping starting at 8 AM).
// Midnight is hour 0 — the mapper emits "00:xx" for events after midnight.
export const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6, 7];

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

const MINUTES_PER_DAY = 1440;

function dayDifference(fromDate: string, toDate: string): number {
  const from = Date.parse(`${fromDate}T00:00:00Z`);
  const to = Date.parse(`${toDate}T00:00:00Z`);
  return Number.isFinite(from) && Number.isFinite(to) ? Math.round((to - from) / 86_400_000) : 0;
}

/** Real duration of an event, including blocks that run past midnight.
 * Never returns a zero or negative length. */
export function eventDurationMinutes(event: { date: string; endDate?: string; startTime: string; endTime: string }): number {
  const days = event.endDate ? dayDifference(event.date, event.endDate) : 0;
  let duration = days * MINUTES_PER_DAY + parseTimeToMinutes(event.endTime) - parseTimeToMinutes(event.startTime);
  if (duration <= 0) duration += MINUTES_PER_DAY; // ends next day but endDate was not supplied
  return duration > 0 ? duration : 60;
}

/** Date + minutes offset (may exceed one day) → wall-clock date and HH:mm. */
export function shiftWallClock(date: string, minutesFromMidnight: number): { date: string; time: string } {
  const dayOffset = Math.floor(minutesFromMidnight / MINUTES_PER_DAY);
  const within = ((minutesFromMidnight % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const base = new Date(`${date}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() + dayOffset);
  const day = base.toISOString().slice(0, 10);
  return { date: day, time: `${String(Math.floor(within / 60)).padStart(2, "0")}:${String(within % 60).padStart(2, "0")}` };
}

/** Moves a date by whole months, clamping the day (Jan 31 + 1 month → Feb 28/29). */
export function addMonthsClamped(date: Date, months: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1, date.getHours(), date.getMinutes());
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), lastDay));
  return target;
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
