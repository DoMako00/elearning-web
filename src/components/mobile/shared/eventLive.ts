import type { CalendarEvent } from "../../ui/Calendar/calendar.types";

/**
 * Mobile-specific live status computation:
 * Returns true when event.type === 'live_session' AND current Egypt time (now)
 * falls between event start and event end (or endDate if set).
 *
 * Only live_session events can display the "Live" pill.
 */
export function isEventLive(event: CalendarEvent, now: Date): boolean {
  if (event.type !== "live_session") {
    return false;
  }

  // Parse event start date and time
  const startDateStr = event.date;
  const endDateStr = event.endDate || event.date;

  const [startH, startM] = event.startTime.split(":").map(Number);
  const [endH, endM] = event.endTime.split(":").map(Number);

  // Build target Date instances in local representation matching the YYYY-MM-DD strings
  const [sYear, sMonth, sDay] = startDateStr.split("-").map(Number);
  const [eYear, eMonth, eDay] = endDateStr.split("-").map(Number);

  const eventStart = new Date(sYear, sMonth - 1, sDay, startH, startM, 0, 0);
  const eventEnd = new Date(eYear, eMonth - 1, eDay, endH, endM, 0, 0);

  const nowTime = now.getTime();
  return nowTime >= eventStart.getTime() && nowTime <= eventEnd.getTime();
}
