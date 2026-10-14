import type { CalendarEvent } from "../../../components/ui/Calendar/calendar.types";
import type { StudentCalendarItemDto } from "./studentCalendarApi";

function cairoParts(value: string): { date: string; time: string } {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(value)).map((part) => [part.type, part.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

export function mapStudentCalendarItem(item: StudentCalendarItemDto): CalendarEvent {
  const start = cairoParts(item.startsAt);
  const end = item.endsAt ? cairoParts(item.endsAt) : null;
  const endTime = end?.time ?? `${String((Number(start.time.slice(0, 2)) + 1) % 24).padStart(2, "0")}:${start.time.slice(3)}`;
  const formatter = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Cairo", hour: "numeric", minute: "2-digit" });
  const displayTime = `${formatter.format(new Date(item.startsAt))} - ${item.endsAt ? formatter.format(new Date(item.endsAt)) : formatter.format(new Date(Date.parse(item.startsAt) + 3_600_000))}`;
  return { id: item.id, source: item.source, version: item.version, editable: item.editable, title: item.title, type: item.type, date: start.date, endDate: end?.date ?? start.date, startTime: start.time, endTime, displayTime, description: item.description ?? undefined, courseTitle: item.courseTitle ?? undefined, status: item.status === "completed" ? "completed" : "upcoming" };
}
