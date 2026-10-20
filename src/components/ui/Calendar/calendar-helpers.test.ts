import { describe, expect, it } from "vitest";
import { addMonthsClamped, eventDurationMinutes, formatHour, HOURS, shiftWallClock } from "./calendar-helpers";
import { mapStudentCalendarItem } from "../../../features/student/api/studentCalendarMapper";

const ymd = (date: Date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

describe("week grid hours", () => {
  it("contains every hour exactly once, including midnight as 0", () => {
    expect(HOURS).toHaveLength(24);
    expect(new Set(HOURS).size).toBe(24);
    expect(HOURS).toContain(0);
    expect(HOURS).not.toContain(24);
    expect(formatHour(0)).toBe("12 AM");
  });

  it("puts an event at 00:30 Cairo time in the 0 hour row", () => {
    // 2026-10-20T21:30Z is 00:30 on 2026-10-21 in Africa/Cairo (UTC+3).
    const event = mapStudentCalendarItem({ id: "e1", source: "personal", type: "study_block", title: "Night study", startsAt: "2026-10-20T21:30:00Z", endsAt: "2026-10-20T22:30:00Z", description: null, courseTitle: null, status: "active", version: 1, editable: true });
    expect(event.date).toBe("2026-10-21");
    const [hour] = event.startTime.split(":").map(Number);
    expect(HOURS).toContain(hour);
  });
});

describe("addMonthsClamped", () => {
  it.each([
    [new Date(2026, 0, 31), 1, "2026-2-28"],
    [new Date(2028, 0, 31), 1, "2028-2-29"],
    [new Date(2026, 2, 31), -1, "2026-2-28"],
    [new Date(2026, 9, 30), 1, "2026-11-30"],
    [new Date(2026, 11, 31), 1, "2027-1-31"],
  ])("moves %s by %i month(s) without skipping a month", (date, delta, expected) => {
    expect(ymd(addMonthsClamped(date, delta))).toBe(expected);
  });
});

describe("overnight study blocks", () => {
  it("keeps the real length of a block that crosses midnight", () => {
    expect(eventDurationMinutes({ date: "2026-10-20", endDate: "2026-10-21", startTime: "23:00", endTime: "01:00" })).toBe(120);
    expect(eventDurationMinutes({ date: "2026-10-20", startTime: "23:00", endTime: "01:00" })).toBe(120);
    expect(eventDurationMinutes({ date: "2026-10-20", endDate: "2026-10-20", startTime: "10:00", endTime: "11:30" })).toBe(90);
  });

  it("never yields zero or negative durations", () => {
    expect(eventDurationMinutes({ date: "2026-10-20", endDate: "2026-10-20", startTime: "10:00", endTime: "10:00" })).toBeGreaterThan(0);
  });

  it("shifts wall-clock times across day and month boundaries", () => {
    expect(shiftWallClock("2026-10-31", 23 * 60 + 120)).toEqual({ date: "2026-11-01", time: "01:00" });
    expect(shiftWallClock("2026-10-20", 30 * 1440)).toEqual({ date: "2026-11-19", time: "00:00" });
  });
});
