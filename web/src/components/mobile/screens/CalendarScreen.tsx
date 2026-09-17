import React, { useState, useMemo, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  CalendarCheck,
} from "lucide-react";
import { TopAppBar } from "../TopAppBar";
import {
  HeroBand,
  DocsOnlyBanner,
  SectionHeader,
  EventCard,
  EventDetailSheet,
  AddEventSheet,
  ReminderRow,
  MobileWeeklyStudyGoal,
} from "../shared";
import {
  INITIAL_CALENDAR_EVENTS,
  INITIAL_REMINDERS,
  type CalendarEvent,
  type CalendarViewMode,
  type ReminderItem,
  getEgyptNow,
  formatLocalDate,
} from "../../ui/Calendar";

/**
 * KNOWN DESKTOP ISSUES (documented for future cross-platform cleanup):
 * 1. Calendar's Study Goal ring duplicates Home's WeeklyGoalCard instead of reusing it (desktop-side fix needed).
 *    -> Fixed on mobile: Both HomeScreen and CalendarScreen reuse MobileWeeklyStudyGoal.
 * 2. Calendar's activeDate initializes to a hardcoded date instead of new Date() (desktop-side fix needed).
 *    -> Fixed on mobile: activeDate defaults to actual new Date() on mount.
 * 3. Reminders data is entirely disconnected from Assignments/quiz data (both platforms — should eventually
 *    derive from real deadlines rather than a static parallel list).
 */

export const CalendarScreen: React.FC = () => {
  // 1. View mode & date state (defaults to real current date on mount, not hardcoded August 2026)
  const [viewMode, setViewMode] = useState<CalendarViewMode>("week");
  const [activeDate, setActiveDate] = useState<Date>(() => new Date());

  // 2. Events & reminders state (seeded directly from shared desktop data)
  const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_CALENDAR_EVENTS);
  const [reminders] = useState<ReminderItem[]>(INITIAL_REMINDERS);

  // 3. Selection & detail modal state
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 4. Egypt now tick for live status and current time line (60s tick interval)
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60_000);
    return () => clearInterval(timer);
  }, []);

  const egyptNow = useMemo(() => getEgyptNow(), [currentTime]);

  // Toast auto-clear
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Selected date string (YYYY-MM-DD)
  const activeDateStr = useMemo(() => formatLocalDate(activeDate), [activeDate]);

  // Days of the week (Monday to Sunday) containing activeDate
  const weekDays = useMemo(() => {
    const curr = new Date(activeDate);
    const day = curr.getDay();
    const diffToMon = (day + 6) % 7;
    const monday = new Date(curr);
    monday.setDate(curr.getDate() - diffToMon);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  }, [activeDate]);

  // Month grid cells computation (Mon to Sun)
  const monthDays = useMemo(() => {
    const year = activeDate.getFullYear();
    const month = activeDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const totalDays = lastDayOfMonth.getDate();
    const firstDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const cells: {
      date: Date;
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      eventCount: number;
    }[] = [];

    // Leading days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const d = new Date(year, month - 1, dayNum);
      const dateStr = formatLocalDate(d);
      const count = events.filter((e) => e.date === dateStr).length;
      cells.push({
        date: d,
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === egyptNow.dateStr,
        isSelected: dateStr === activeDateStr,
        eventCount: count,
      });
    }

    // Days of current month
    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, month, day);
      const dateStr = formatLocalDate(d);
      const count = events.filter((e) => e.date === dateStr).length;
      cells.push({
        date: d,
        dateStr,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: dateStr === egyptNow.dateStr,
        isSelected: dateStr === activeDateStr,
        eventCount: count,
      });
    }

    // Trailing days to finish full rows (35 or 42 cells)
    const targetCellCount = cells.length > 35 ? 42 : 35;
    let nextMonthDay = 1;
    while (cells.length < targetCellCount) {
      const d = new Date(year, month + 1, nextMonthDay);
      const dateStr = formatLocalDate(d);
      const count = events.filter((e) => e.date === dateStr).length;
      cells.push({
        date: d,
        dateStr,
        dayNumber: nextMonthDay,
        isCurrentMonth: false,
        isToday: dateStr === egyptNow.dateStr,
        isSelected: dateStr === activeDateStr,
        eventCount: count,
      });
      nextMonthDay++;
    }

    return cells;
  }, [activeDate, events, egyptNow.dateStr, activeDateStr]);

  // Date range label for header/navigation bar
  const dateHeaderLabel = useMemo(() => {
    if (viewMode === "month") {
      return activeDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
    const start = weekDays[0];
    const end = weekDays[6];
    const startMonth = start.toLocaleDateString("en-US", { month: "short" });
    const endMonth = end.toLocaleDateString("en-US", { month: "short" });
    const year = end.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${start.getDate()} – ${end.getDate()}, ${year}`;
    }
    return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}, ${year}`;
  }, [viewMode, activeDate, weekDays]);

  // Navigation handlers
  const handlePrev = () => {
    const next = new Date(activeDate);
    if (viewMode === "week") {
      next.setDate(next.getDate() - 7);
    } else {
      next.setMonth(next.getMonth() - 1);
    }
    setActiveDate(next);
  };

  const handleNext = () => {
    const next = new Date(activeDate);
    if (viewMode === "week") {
      next.setDate(next.getDate() + 7);
    } else {
      next.setMonth(next.getMonth() + 1);
    }
    setActiveDate(next);
  };

  const handleToday = () => {
    setActiveDate(new Date());
  };

  // Agenda events for the selected day, sorted chronologically by startTime
  const selectedDayEvents = useMemo(() => {
    return events
      .filter((evt) => evt.date === activeDateStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [events, activeDateStr]);

  // Formatted selected day label, e.g. "Tue, Sep 1, 2026"
  const selectedDayLabel = useMemo(() => {
    return activeDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [activeDate]);

  // Event interaction
  const handleEventSelect = (evt: CalendarEvent) => {
    setSelectedEvent(evt);
    setIsDetailOpen(true);
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    setToastMessage("Event removed from schedule");
  };

  const handleAddEvent = (newEvent: CalendarEvent) => {
    setEvents((prev) => [...prev, newEvent]);
    // Switch to the day of the new event so the user sees it immediately
    const [y, m, d] = newEvent.date.split("-").map(Number);
    setActiveDate(new Date(y, m - 1, d));
    setViewMode("week");
    setToastMessage(`"${newEvent.title}" added to your calendar`);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
      {/* 1. TopAppBar (variant="main") */}
      <TopAppBar variant="main" />

      {/* Main scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/* 2. HeroBand */}
        <HeroBand
          eyebrow="ACADEMIC SCHEDULE"
          heading="Calendar"
          subtitle="Plan your study, stay consistent."
          banner={<DocsOnlyBanner variant="compact" />}
          illustration={
            <div className="relative w-28 h-24 flex items-center justify-center">
              <div className="size-18 rounded-2xl bg-emerald-100/70 border border-emerald-200/80 flex items-center justify-center text-emerald-700 shadow-xs">
                <CalendarIcon className="size-9 stroke-[1.8]" />
              </div>
            </div>
          }
        />

        {/* Inner Content Container */}
        <div className="px-4 pt-2 pb-10 space-y-6 max-w-lg mx-auto">
          {/* 3. Toolbar & View Toggle */}
          <div className="bg-white rounded-3xl border border-slate-100/80 p-3.5 sm:p-4 shadow-xs space-y-3.5">
            {/* Top row: View toggle on left, Today + Nav arrows on right */}
            <div className="flex items-center justify-between gap-2">
              {/* 2-Segment View Mode Toggle (Week / Month) */}
              <div
                className="flex items-center p-1 rounded-2xl bg-slate-100/90 border border-slate-200/50"
                role="tablist"
                aria-label="Calendar view mode"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === "week"}
                  onClick={() => setViewMode("week")}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "week"
                      ? "bg-white text-emerald-600 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Week
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === "month"}
                  onClick={() => setViewMode("month")}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "month"
                      ? "bg-white text-emerald-600 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Month
                </button>
              </div>

              {/* In Month view, show current Month Year label */}
              {viewMode === "month" && (
                <span className="text-xs font-extrabold text-slate-800 truncate px-1">
                  {dateHeaderLabel}
                </span>
              )}

              {/* Today button + Nav arrows cluster */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleToday}
                  className="px-3.5 py-1.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-extrabold border border-slate-200/80 shadow-2xs transition-all active:scale-95 cursor-pointer"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="size-8 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
                  aria-label="Previous period"
                >
                  <ChevronLeft className="size-4 stroke-[2.5]" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="size-8 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
                  aria-label="Next period"
                >
                  <ChevronRight className="size-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* 4. Week View: Horizontal day strip (Mon-Sun) inside bordered grid */}
            {viewMode === "week" && (
              <div className="grid grid-cols-7 border border-slate-200/70 rounded-2xl overflow-hidden divide-x divide-slate-100 bg-white">
                {weekDays.map((d, index) => {
                  const dateStr = formatLocalDate(d);
                  const isSelected = dateStr === activeDateStr;
                  const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
                  const dayNumber = d.getDate();
                  const hasEvents = events.some((e) => e.date === dateStr);

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setActiveDate(d)}
                      className={`flex flex-col items-center justify-center py-2.5 px-0.5 transition-all cursor-pointer relative ${
                        isSelected
                          ? "bg-emerald-100/70 text-slate-900 font-extrabold"
                          : "hover:bg-slate-50/80 text-slate-800 font-bold"
                      }`}
                    >
                      <span
                        className={`text-[11px] font-semibold ${
                          isSelected ? "text-slate-700" : "text-slate-500"
                        }`}
                      >
                        {dayName}
                      </span>
                      <span className="text-sm font-black mt-0.5">{dayNumber}</span>

                      {/* Dot indicator under days with scheduled events */}
                      <span
                        className={`size-1.5 rounded-full mt-1 transition-colors ${
                          hasEvents
                            ? isSelected
                              ? "bg-emerald-700"
                              : "bg-emerald-600"
                            : "bg-transparent"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            )}

            {/* 5. Month View: Compact 7-column calendar grid */}
            {viewMode === "month" && (
              <div className="space-y-1.5 pt-1">
                <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 tracking-wider">
                  <span>M</span>
                  <span>T</span>
                  <span>W</span>
                  <span>T</span>
                  <span>F</span>
                  <span>S</span>
                  <span>S</span>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {monthDays.map((cell, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        // Tapping a date sets activeDate and funnels back into Week view
                        setActiveDate(cell.date);
                        setViewMode("week");
                      }}
                      className={`h-9 sm:h-10 rounded-xl flex flex-col items-center justify-center relative transition-all cursor-pointer text-xs ${
                        cell.isSelected
                          ? "bg-emerald-600 text-white font-extrabold shadow-2xs"
                          : cell.isToday
                          ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-200"
                          : cell.isCurrentMonth
                          ? "text-slate-700 hover:bg-slate-50 font-medium"
                          : "text-slate-300 font-normal"
                      }`}
                    >
                      <span>{cell.dayNumber}</span>
                      {cell.eventCount > 0 && (
                        <span
                          className={`size-1 rounded-full absolute bottom-1 ${
                            cell.isSelected ? "bg-white" : "bg-emerald-500"
                          }`}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 6. Agenda List for the Selected Day */}
          <section aria-label="Day Agenda" className="space-y-3.5">
            {/* Header: Date with Today prefix on left, events count on right */}
            <div className="flex items-center justify-between px-0.5">
              <h3 className="text-sm font-black text-slate-900 tracking-tight">
                {activeDateStr === egyptNow.dateStr ? "Today · " : ""}
                {selectedDayLabel}
              </h3>
              <span className="text-xs font-bold text-emerald-600">
                {selectedDayEvents.length === 1
                  ? "1 event"
                  : `${selectedDayEvents.length} events`}
              </span>
            </div>

            {selectedDayEvents.length > 0 ? (
              <div className="space-y-3">
                {selectedDayEvents.map((evt, idx) => (
                  <EventCard
                    key={evt.id}
                    event={evt}
                    now={currentTime}
                    onSelect={handleEventSelect}
                    isLast={idx === selectedDayEvents.length - 1}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 shadow-2xs">
                <div className="size-10 rounded-2xl bg-slate-50 text-slate-400 mx-auto flex items-center justify-center mb-2">
                  <CalendarCheck className="size-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">No events today</h4>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Enjoy your free time or schedule a study block.
                </p>
              </div>
            )}

            {/* 7. "Add to calendar" card button — opens AddEventSheet */}
            <button
              type="button"
              onClick={() => setIsAddEventOpen(true)}
              className="w-full bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between shadow-2xs hover:shadow-xs active:scale-[0.99] transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="size-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Plus className="size-4 stroke-[2.5]" />
                </div>
                <span className="text-xs font-bold text-emerald-700 group-hover:text-emerald-800">
                  Add to calendar
                </span>
              </div>
              <ChevronRight className="size-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
            </button>
          </section>

          {/* 8. Study Goal Progress (Exact reuse of mobile WeeklyGoalCard ring) */}
          <section aria-label="Study Goal Progress">
            <SectionHeader
              title="Study Goal Progress"
              actionLabel="Edit"
              onAction={() => setToastMessage("Goal editing coming soon")}
            />
            <MobileWeeklyStudyGoal completedHours={9} targetHours={12} />
          </section>

          {/* 9. Reminders Section */}
          <section aria-label="Reminders">
            <SectionHeader
              title="Reminders"
              actionLabel="View all"
              onAction={() => setToastMessage("Full reminders list coming soon")}
            />
            <div className="space-y-2.5">
              {reminders.map((rem) => (
                <ReminderRow
                  key={rem.id}
                  reminder={rem}
                  onClick={(r) => setToastMessage(`Reminder: ${r.title}`)}
                />
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Interactive BottomSheet for Event Details */}
      <EventDetailSheet
        event={selectedEvent}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedEvent(null);
        }}
        onDelete={handleDeleteEvent}
      />

      {/* Add Event BottomSheet */}
      <AddEventSheet
        isOpen={isAddEventOpen}
        onClose={() => setIsAddEventOpen(false)}
        defaultDate={activeDateStr}
        onAddEvent={handleAddEvent}
      />

      {/* Feedback Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-slate-900/90 backdrop-blur-md text-white text-xs font-semibold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
