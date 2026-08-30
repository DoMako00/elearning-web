import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
  Plus,
  Video,
  FileText,
  Clock,
  User,
  ExternalLink,
  CalendarCheck,
  X,
  Trash2,
  Calendar as CalendarIcon,
  CheckCircle2,
} from "lucide-react";
import {
  INITIAL_CALENDAR_EVENTS,
  INITIAL_AGENDA_ITEMS,
  INITIAL_STUDY_GOAL,
  INITIAL_REMINDERS,
} from "./calendar.data";
import type {
  CalendarEvent,
  EventType,
  CalendarViewMode,
  AgendaItem,
  ReminderItem,
  StudyGoalProgress,
} from "./calendar.types";
import "./Calendar.css";

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

const EVENT_TYPE_CONFIG: Record<
  EventType,
  { label: string; icon: React.ComponentType<{ className?: string; size?: number }> }
> = {
  quiz: { label: "Quiz", icon: FileText },
  live_session: { label: "Live Session", icon: Video },
  assignment: { label: "Assignment", icon: FileText },
  office_hours: { label: "Office Hours", icon: User },
  study_block: { label: "Study Block", icon: Clock },
};

function formatHour(h: number): string {
  if (h === 12) return "12 PM";
  if (h > 12) return `${h - 12} PM`;
  return `${h} AM`;
}

function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

export function CalendarWorkspace() {
  const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_CALENDAR_EVENTS);
  const [agendaItems] = useState<AgendaItem[]>(INITIAL_AGENDA_ITEMS);
  const [reminders, setReminders] = useState<ReminderItem[]>(INITIAL_REMINDERS);
  const [studyGoal, setStudyGoal] = useState<StudyGoalProgress>(INITIAL_STUDY_GOAL);

  const [viewMode, setViewMode] = useState<CalendarViewMode>("week");
  const [activeDate, setActiveDate] = useState<Date>(new Date(2026, 7, 30)); // Aug 30, 2026
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterTypes, setFilterTypes] = useState<Record<EventType, boolean>>({
    quiz: true,
    live_session: true,
    assignment: true,
    office_hours: true,
    study_block: true,
  });

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [newEventDraft, setNewEventDraft] = useState<Partial<CalendarEvent>>({
    type: "quiz",
    startTime: "10:00",
    endTime: "11:00",
    date: "2026-08-30",
  });

  const [isEditGoalModalOpen, setIsEditGoalModalOpen] = useState(false);
  const [targetGoalInput, setTargetGoalInput] = useState<number>(studyGoal.targetHours);

  const [isAddReminderModalOpen, setIsAddReminderModalOpen] = useState(false);
  const [newReminderTitle, setNewReminderTitle] = useState("");
  const [newReminderType, setNewReminderType] = useState<"assignment" | "goal" | "quiz">("assignment");

  // Drag and Drop state
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  // Live current time (updates every minute)
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tick = setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    if (isFilterOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFilterOpen]);

  // Drag and drop event handlers
  const handleDragStart = (e: React.DragEvent, eventId: string) => {
    e.stopPropagation();
    setDraggedEventId(eventId);
    e.dataTransfer.setData("text/plain", eventId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedEventId(null);
    setDragOverTarget(null);
  };

  // Helper to check if two time ranges overlap on the same date
  const hasTimeConflict = (
    date: string,
    startMinutes: number,
    endMinutes: number,
    excludeEventId?: string
  ): boolean => {
    return events.some((evt) => {
      if (evt.id === excludeEventId || evt.date !== date) return false;
      const [sH, sM] = evt.startTime.split(":").map(Number);
      const [eH, eM] = evt.endTime.split(":").map(Number);
      const evtStart = sH * 60 + sM;
      const evtEnd = eH * 60 + eM;
      // Overlap condition: start < otherEnd && end > otherStart
      return startMinutes < evtEnd && endMinutes > evtStart;
    });
  };

  // Move event to a new date and hour in Week View (with conflict prevention)
  const handleDropWeekCell = (e: React.DragEvent, targetDate: string, targetHour: number) => {
    e.preventDefault();
    e.stopPropagation();
    const eventId = e.dataTransfer.getData("text/plain") || draggedEventId;
    if (!eventId) return;

    const targetEvent = events.find((evt) => evt.id === eventId);
    if (!targetEvent) return;

    const [sH, sM] = targetEvent.startTime.split(":").map(Number);
    const [eH, eM] = targetEvent.endTime.split(":").map(Number);
    const durationMinutes = (eH * 60 + eM) - (sH * 60 + sM);

    const newStartMinutes = targetHour * 60 + sM;
    const newEndMinutes = newStartMinutes + durationMinutes;

    // Check for overlap conflict
    if (hasTimeConflict(targetDate, newStartMinutes, newEndMinutes, eventId)) {
      alert("⚠️ Time conflict: An event is already scheduled during this time slot.");
      setDraggedEventId(null);
      setDragOverTarget(null);
      return;
    }

    const newSH = Math.floor(newStartMinutes / 60);
    const newSM = newStartMinutes % 60;
    const newEH = Math.floor(newEndMinutes / 60);
    const newEM = newEndMinutes % 60;

    const startTime = `${String(newSH).padStart(2, "0")}:${String(newSM).padStart(2, "0")}`;
    const endTime = `${String(newEH).padStart(2, "0")}:${String(newEM).padStart(2, "0")}`;
    const displayTime = `${formatHour(newSH)} - ${formatHour(newEH)}`;

    setEvents((prev) =>
      prev.map((evt) =>
        evt.id === eventId
          ? { ...evt, date: targetDate, startTime, endTime, displayTime }
          : evt
      )
    );

    setDraggedEventId(null);
    setDragOverTarget(null);
  };

  // Move event to a new date in Month View (with conflict prevention)
  const handleDropMonthCell = (e: React.DragEvent, targetDate: string) => {
    e.preventDefault();
    e.stopPropagation();
    const eventId = e.dataTransfer.getData("text/plain") || draggedEventId;
    if (!eventId) return;

    const targetEvent = events.find((evt) => evt.id === eventId);
    if (!targetEvent) return;

    const [sH, sM] = targetEvent.startTime.split(":").map(Number);
    const [eH, eM] = targetEvent.endTime.split(":").map(Number);
    const startMinutes = sH * 60 + sM;
    const endMinutes = eH * 60 + eM;

    if (hasTimeConflict(targetDate, startMinutes, endMinutes, eventId)) {
      alert("⚠️ Time conflict: An event is already scheduled at this time on that date.");
      setDraggedEventId(null);
      setDragOverTarget(null);
      return;
    }

    setEvents((prev) =>
      prev.map((evt) => (evt.id === eventId ? { ...evt, date: targetDate } : evt))
    );

    setDraggedEventId(null);
    setDragOverTarget(null);
  };

  const weekDays = useMemo(() => {
    const curr = new Date(activeDate);
    const day = curr.getDay();
    const diffToMon = (day + 6) % 7;
    const monday = new Date(curr);
    monday.setDate(curr.getDate() - diffToMon);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  }, [activeDate]);

  // Compute 35 or 42 grid cells dynamically for the active month (Monday to Sunday)
  const monthDays = useMemo(() => {
    const year = activeDate.getFullYear();
    const month = activeDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Days in current month
    const totalDaysInMonth = lastDayOfMonth.getDate();

    // Day of week of first day (0=Sun, 1=Mon... -> adjust to Monday as 0)
    const firstDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;

    // Previous month days to fill before the 1st
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const cells: {
      date: Date;
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    // 1. Previous month leading days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const d = new Date(year, month - 1, dayNum);
      const dateStr = d.toISOString().split("T")[0];
      cells.push({
        date: d,
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // 2. Current month days
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDay = today.getDate();

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const d = new Date(year, month, day);
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const isToday = year === todayYear && month === todayMonth && day === todayDay;
      cells.push({
        date: d,
        dateStr,
        dayNumber: day,
        isCurrentMonth: true,
        isToday,
      });
    }

    // 3. Next month trailing days to complete 5 or 6 weeks (35 or 42 cells)
    const targetCellCount = cells.length > 35 ? 42 : 35;
    let nextMonthDay = 1;
    while (cells.length < targetCellCount) {
      const d = new Date(year, month + 1, nextMonthDay);
      const dateStr = d.toISOString().split("T")[0];
      cells.push({
        date: d,
        dateStr,
        dayNumber: nextMonthDay,
        isCurrentMonth: false,
        isToday: false,
      });
      nextMonthDay++;
    }

    return cells;
  }, [activeDate]);

  const dateRangeLabel = useMemo(() => {
    const start = weekDays[0];
    const end = weekDays[6];
    const startMonth = start.toLocaleDateString("en-US", { month: "short" });
    const endMonth = end.toLocaleDateString("en-US", { month: "short" });
    const year = end.getFullYear();

    if (viewMode === "month") {
      return activeDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }

    if (startMonth === endMonth) {
      return `${startMonth} ${start.getDate()} – ${end.getDate()}, ${year}`;
    }
    return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}, ${year}`;
  }, [weekDays, viewMode, activeDate]);

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

  const filteredEvents = useMemo(() => {
    return events.filter((evt) => filterTypes[evt.type]);
  }, [events, filterTypes]);
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventDraft.title || !newEventDraft.date) return;

    const startMinutes = parseTimeToMinutes(newEventDraft.startTime || "09:00");
    const endMinutes = parseTimeToMinutes(newEventDraft.endTime || "10:00");

    if (endMinutes <= startMinutes) {
      alert("⚠️ End time must be later than start time.");
      return;
    }

    if (hasTimeConflict(newEventDraft.date, startMinutes, endMinutes)) {
      alert("⚠️ Time conflict: An event is already scheduled during this time slot.");
      return;
    }

    const displayStart = formatHour(Math.floor(startMinutes / 60));
    const displayEnd = formatHour(Math.floor(endMinutes / 60));

    const created: CalendarEvent = {
      id: `evt-${Date.now()}`,
      title: newEventDraft.title,
      type: newEventDraft.type || "quiz",
      date: newEventDraft.date,
      startTime: newEventDraft.startTime || "09:00",
      endTime: newEventDraft.endTime || "10:00",
      displayTime: `${displayStart} - ${displayEnd}`,
      courseTitle: newEventDraft.courseTitle || "General Curriculum",
      description: newEventDraft.description || "",
      locationOrUrl: newEventDraft.locationOrUrl || "",
    };

    setEvents((prev) => [...prev, created]);
    setIsNewEventModalOpen(false);
    setNewEventDraft({ type: "quiz", startTime: "10:00", endTime: "11:00", date: "2025-05-14" });
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setSelectedEvent(null);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const newTarget = Math.max(1, targetGoalInput);
    const newPct = Math.min(100, Math.round((studyGoal.completedHours / newTarget) * 100));
    setStudyGoal((prev) => ({
      ...prev,
      targetHours: newTarget,
      weeklyPercentage: newPct,
    }));
    setIsEditGoalModalOpen(false);
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderTitle.trim()) return;

    const newRem: ReminderItem = {
      id: `rem-${Date.now()}`,
      title: newReminderTitle.trim(),
      dateLabel: "Upcoming this week",
      type: newReminderType,
      completed: false,
    };
    setReminders((prev) => [...prev, newRem]);
    setNewReminderTitle("");
    setIsAddReminderModalOpen(false);
  };

  return (
    <div className="calendar-container">
      <header className="calendar-page-header">
        <span className="calendar-page-header__kicker">YOUR SCHEDULE</span>
        <h1 className="calendar-page-header__title">Calendar</h1>
        <p className="calendar-page-header__subtitle">
          Plan your week, stay consistent, and reach your goals.
        </p>
      </header>

      {/* Main Layout: Left Calendar Grid + Right Widgets */}
      <div className="calendar-layout">
        {/* Left Section */}
        <section className="calendar-main-card" aria-label="Schedule calendar">
          {/* Top Controls Toolbar */}
          <div className="calendar-toolbar">
            <div className="calendar-toolbar__left">
              <button
                type="button"
                className="calendar-toolbar__btn-today"
                onClick={handleToday}
                aria-label="Jump to current active week"
              >
                Today
              </button>

              <div className="calendar-toolbar__nav-group" role="group" aria-label="Calendar Navigation">
                <button
                  type="button"
                  className="calendar-toolbar__nav-btn"
                  onClick={handlePrev}
                  aria-label="Previous period"
                >
                  <ChevronLeft size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="calendar-toolbar__nav-btn"
                  onClick={handleNext}
                  aria-label="Next period"
                >
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              </div>

              <button
                type="button"
                className="calendar-toolbar__date-title"
                onClick={() => setViewMode((m) => (m === "week" ? "month" : "week"))}
                aria-label="Change calendar range view"
              >
                <span>{dateRangeLabel}</span>
                <ChevronDown size={16} aria-hidden="true" />
              </button>
            </div>

            <div className="calendar-toolbar__right">
              {/* View toggle */}
              <div className="calendar-view-toggle" role="tablist" aria-label="Calendar View Mode">
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === "week"}
                  className={`calendar-view-toggle__btn ${viewMode === "week" ? "calendar-view-toggle__btn--active" : ""}`}
                  onClick={() => setViewMode("week")}
                >
                  Week
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === "month"}
                  className={`calendar-view-toggle__btn ${viewMode === "month" ? "calendar-view-toggle__btn--active" : ""}`}
                  onClick={() => setViewMode("month")}
                >
                  Month
                </button>
              </div>

              {/* Filter Button */}
              <div style={{ position: "relative" }} ref={filterRef}>
                <button
                  type="button"
                  className={`calendar-toolbar__filter-btn ${isFilterOpen ? "calendar-toolbar__filter-btn--active" : ""}`}
                  onClick={() => setIsFilterOpen((prev) => !prev)}
                  aria-label="Filter events by category"
                  aria-expanded={isFilterOpen}
                >
                  <SlidersHorizontal size={16} aria-hidden="true" />
                </button>

                {isFilterOpen && (
                  <div className="calendar-filter-popover" role="dialog" aria-label="Filter Options">
                    <p className="calendar-filter-popover__title">Event Categories</p>
                    {(Object.keys(EVENT_TYPE_CONFIG) as EventType[]).map((type) => (
                      <label key={type} className="calendar-filter-option">
                        <input
                          type="checkbox"
                          checked={filterTypes[type]}
                          onChange={(e) =>
                            setFilterTypes((prev) => ({ ...prev, [type]: e.target.checked }))
                          }
                        />
                        <span>{EVENT_TYPE_CONFIG[type].label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Week Grid View */}
          {viewMode === "week" ? (
            <div className="calendar-grid-wrapper">
              <div className="calendar-grid">
                {/* Header corner cell */}
                <div className="calendar-grid__cell-header-corner">GMT-5</div>

                {/* Day Header Cells */}
                {weekDays.map((d, index) => {
                  const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
                  const dayNum = d.getDate();
                  const isWednesdayToday = index === 2; // Wed May 14 highlighted
                  return (
                    <div
                      key={index}
                      className={`calendar-grid__day-header ${
                        isWednesdayToday ? "calendar-grid__day-header--today" : ""
                      }`}
                    >
                      <span className="calendar-grid__day-name">{dayName}</span>
                      <span className="calendar-grid__day-number">{dayNum}</span>
                    </div>
                  );
                })}

                {/* Grid Rows per Hour */}
                {HOURS.map((hour) => (
                  <div key={hour} className="calendar-grid__body-row">
                    {/* Time label */}
                    <div className="calendar-grid__time-label">{formatHour(hour)}</div>

                    {/* 7 Columns for each day */}
                    {weekDays.map((dayDate, dayIdx) => {
                      const dateStr = dayDate.toISOString().split("T")[0];
                      // Find events starting in this hour on this day
                      const cellEvents = filteredEvents.filter((evt) => {
                        if (evt.date !== dateStr) return false;
                        const [evtHour] = evt.startTime.split(":").map(Number);
                        return evtHour === hour;
                      });

                      // Real current-time line: check if this cell is today's date AND this hour
                      const nowDateStr = currentTime.toISOString().split("T")[0];
                      const nowHour = currentTime.getHours();
                      const nowMinute = currentTime.getMinutes();
                      const showCurrentTimeLine = dateStr === nowDateStr && hour === nowHour;
                      // % offset within the 50px slot (CSS variable)
                      const timeLineTopPct = (nowMinute / 60) * 100;

                      const cellKey = `week-${dateStr}-${hour}`;
                      const isDragOver = dragOverTarget === cellKey;

                      return (
                        <div
                          key={dayIdx}
                          className={`calendar-grid__cell ${isDragOver ? "calendar-grid__cell--drag-over" : ""}`}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                            if (dragOverTarget !== cellKey) setDragOverTarget(cellKey);
                          }}
                          onDragLeave={() => {
                            if (dragOverTarget === cellKey) setDragOverTarget(null);
                          }}
                          onDrop={(e) => handleDropWeekCell(e, dateStr, hour)}
                          onClick={() => {
                            setNewEventDraft({
                              date: dateStr,
                              startTime: `${hour < 10 ? `0${hour}` : hour}:00`,
                              endTime: `${hour + 1 < 10 ? `0${hour + 1}` : hour + 1}:00`,
                              type: "quiz",
                            });
                            setIsNewEventModalOpen(true);
                          }}
                        >
                          {showCurrentTimeLine && (
                            <div
                              className="calendar-current-time-line"
                              style={{ top: `${timeLineTopPct}%` }}
                              title={`Current time: ${String(nowHour).padStart(2,"0")}:${String(nowMinute).padStart(2,"0")}`}
                            />
                          )}

                          {cellEvents.map((evt) => {
                            const [sH, sM] = evt.startTime.split(":").map(Number);
                            const [eH, eM] = evt.endTime.split(":").map(Number);
                            const durationMinutes = (eH * 60 + eM) - (sH * 60 + sM);
                            // 64px per hour
                            const heightPx = Math.max(48, Math.round((durationMinutes / 60) * 64) - 4);
                            const topPx = Math.round((sM / 60) * 64);
                            const IconComponent = EVENT_TYPE_CONFIG[evt.type]?.icon || FileText;
                            const isBeingDragged = draggedEventId === evt.id;

                            return (
                              <button
                                key={evt.id}
                                type="button"
                                draggable
                                onDragStart={(e) => handleDragStart(e, evt.id)}
                                onDragEnd={handleDragEnd}
                                className={`calendar-event-card calendar-event-card--${evt.type} ${
                                  isBeingDragged ? "calendar-event-card--dragging" : ""
                                }`}
                                style={{
                                  top: `${topPx}px`,
                                  height: `${heightPx}px`,
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEvent(evt);
                                }}
                                title="Drag to reschedule date & time"
                              >
                                <div className="calendar-event-card__header">
                                  <IconComponent size={12} className="calendar-event-card__icon" />
                                  <span className="calendar-event-card__title">{evt.title}</span>
                                </div>
                                <span className="calendar-event-card__time">{evt.displayTime}</span>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Month Grid View */
            <div className="calendar-month-grid">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="calendar-month-grid__header-cell">
                  {d}
                </div>
              ))}
              {/* Render dynamic days for the active month */}
              {monthDays.map((cell, i) => {
                const dayEvents = filteredEvents.filter((e) => e.date === cell.dateStr);
                const cellKey = `month-${cell.dateStr}`;
                const isDragOver = dragOverTarget === cellKey;

                return (
                  <div
                    key={`${cell.dateStr}-${i}`}
                    className={`calendar-month-grid__day-cell ${
                      !cell.isCurrentMonth ? "calendar-month-grid__day-cell--other-month" : ""
                    } ${cell.isToday ? "calendar-month-grid__day-cell--today" : ""} ${
                      isDragOver ? "calendar-month-grid__day-cell--drag-over" : ""
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      if (dragOverTarget !== cellKey) setDragOverTarget(cellKey);
                    }}
                    onDragLeave={() => {
                      if (dragOverTarget === cellKey) setDragOverTarget(null);
                    }}
                    onDrop={(e) => handleDropMonthCell(e, cell.dateStr)}
                    onClick={() => {
                      setNewEventDraft({
                        date: cell.dateStr,
                        startTime: "10:00",
                        endTime: "11:00",
                        type: "quiz",
                      });
                      setIsNewEventModalOpen(true);
                    }}
                  >
                    <div className="calendar-month-grid__day-top">
                      <span className="calendar-month-grid__day-num">
                        {cell.dayNumber}
                      </span>
                    </div>
                    {dayEvents.slice(0, 3).map((evt) => {
                      const isBeingDragged = draggedEventId === evt.id;
                      return (
                        <div
                          key={evt.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, evt.id)}
                          onDragEnd={handleDragEnd}
                          className={`calendar-month-pill calendar-event-card--${evt.type} ${
                            isBeingDragged ? "calendar-month-pill--dragging" : ""
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(evt);
                          }}
                          title="Drag to move to another day"
                        >
                          <span>{evt.title}</span>
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <span style={{ fontSize: "10px", color: "#6b7280", fontWeight: 700 }}>
                        +{dayEvents.length - 3} more
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom Bar: Legend & Add to Calendar */}
          <div className="calendar-bottom-bar">
            <div className="calendar-legend" role="list" aria-label="Event Legend">
              <div className="calendar-legend__item" role="listitem">
                <span className="calendar-legend__dot calendar-legend__dot--quiz" />
                <span>Quiz</span>
              </div>
              <div className="calendar-legend__item" role="listitem">
                <span className="calendar-legend__dot calendar-legend__dot--live_session" />
                <span>Live Session</span>
              </div>
              <div className="calendar-legend__item" role="listitem">
                <span className="calendar-legend__dot calendar-legend__dot--assignment" />
                <span>Assignment</span>
              </div>
              <div className="calendar-legend__item" role="listitem">
                <span className="calendar-legend__dot calendar-legend__dot--office_hours" />
                <span>Office Hours</span>
              </div>
              <div className="calendar-legend__item" role="listitem">
                <span className="calendar-legend__dot calendar-legend__dot--study_block" />
                <span>Study Block</span>
              </div>
            </div>

            <button
              type="button"
              className="calendar-btn-add"
              onClick={() => {
                setNewEventDraft({
                  date: "2025-05-14",
                  startTime: "10:00",
                  endTime: "11:00",
                  type: "quiz",
                });
                setIsNewEventModalOpen(true);
              }}
              aria-label="Add new schedule item"
            >
              <span>Add to calendar</span>
              <CalendarCheck size={18} aria-hidden="true" />
            </button>
          </div>
        </section>

        {/* Right Section: Widgets */}
        <aside className="calendar-sidebar">
          {/* Widget 1: Today's Agenda */}
          <div className="calendar-widget" aria-labelledby="widget-agenda-title">
            <div className="calendar-widget__header">
              <h2 id="widget-agenda-title" className="calendar-widget__title">
                Today&apos;s agenda
              </h2>
              <button
                type="button"
                className="calendar-widget__icon-btn"
                onClick={() => {
                  setNewEventDraft({
                    date: "2025-05-14",
                    startTime: "12:00",
                    endTime: "13:00",
                    type: "quiz",
                  });
                  setIsNewEventModalOpen(true);
                }}
                aria-label="Add item to today's agenda"
              >
                <CalendarIcon size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="calendar-agenda-list" role="list">
              {agendaItems.map((item) => {
                const IconComponent = EVENT_TYPE_CONFIG[item.type]?.icon || FileText;
                return (
                  <div key={item.id} className="calendar-agenda-item" role="listitem">
                    <span className="calendar-agenda-item__time">{item.time}</span>
                    <div
                      className={`calendar-agenda-item__icon-wrap calendar-agenda-item__icon-wrap--${item.type}`}
                    >
                      <IconComponent size={16} aria-hidden="true" />
                    </div>
                    <div className="calendar-agenda-item__details">
                      <h3 className="calendar-agenda-item__title">{item.title}</h3>
                      <p className="calendar-agenda-item__subtitle">{item.subtitle}</p>
                    </div>
                    {item.hasAction && (
                      <button
                        type="button"
                        className="calendar-agenda-item__btn-join"
                        onClick={() => {
                          if (item.linkUrl) {
                            window.open(item.linkUrl, "_blank", "noopener,noreferrer");
                          }
                        }}
                      >
                        {item.actionLabel || "Join"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              className="calendar-widget__link"
              onClick={() => setViewMode("week")}
            >
              <span>View full agenda</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>

          {/* Widget 2: Study Goal Progress */}
          <div className="calendar-widget" aria-labelledby="widget-goal-title">
            <div className="calendar-widget__header">
              <h2 id="widget-goal-title" className="calendar-widget__title">
                Study goal progress
              </h2>
              <button
                type="button"
                className="calendar-widget__link"
                style={{ padding: "2px 8px" }}
                onClick={() => {
                  setTargetGoalInput(studyGoal.targetHours);
                  setIsEditGoalModalOpen(true);
                }}
              >
                Edit
              </button>
            </div>

            <div className="calendar-goal-card">
              {/* Donut chart */}
              <div className="calendar-goal-donut">
                <svg width="76" height="76" viewBox="0 0 76 76" role="img" aria-label={`Study goal ${studyGoal.weeklyPercentage}% completed`}>
                  <circle
                    cx="38"
                    cy="38"
                    r="30"
                    fill="none"
                    stroke="#e5ebe7"
                    strokeWidth="7"
                  />
                  <circle
                    cx="38"
                    cy="38"
                    r="30"
                    fill="none"
                    stroke="#087f55"
                    strokeWidth="7"
                    strokeDasharray={2 * Math.PI * 30}
                    strokeDashoffset={2 * Math.PI * 30 * (1 - studyGoal.weeklyPercentage / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="calendar-goal-donut__text">
                  <span className="calendar-goal-donut__pct">{studyGoal.weeklyPercentage}%</span>
                  <span className="calendar-goal-donut__label">of weekly goal</span>
                </div>
              </div>

              <div className="calendar-goal-stats">
                <h3 className="calendar-goal-stats__hours">
                  {studyGoal.completedHours} / {studyGoal.targetHours} hours
                </h3>
                <p className="calendar-goal-stats__sub">Keep it up! 🔥</p>
              </div>
            </div>

            {/* Streak dots */}
            <div className="calendar-streak-row" aria-label="Daily study goal completion streak">
              {studyGoal.streakDays.map((st, i) => (
                <div key={i} className="calendar-streak-day">
                  <span className="calendar-streak-day__label">{st.day}</span>
                  <span
                    className={`calendar-streak-day__dot ${
                      st.completed ? "calendar-streak-day__dot--active" : ""
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Widget 3: Reminders */}
          <div className="calendar-widget" aria-labelledby="widget-reminders-title">
            <div className="calendar-widget__header">
              <h2 id="widget-reminders-title" className="calendar-widget__title">
                Reminders
              </h2>
              <button
                type="button"
                className="calendar-widget__icon-btn"
                onClick={() => setIsAddReminderModalOpen(true)}
                aria-label="Add new reminder"
              >
                <Plus size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="calendar-reminder-list" role="list">
              {reminders.map((rem) => {
                const IconComponent =
                  rem.type === "quiz"
                    ? FileText
                    : rem.type === "goal"
                    ? CheckCircle2
                    : FileText;

                return (
                  <div key={rem.id} className="calendar-reminder-item" role="listitem">
                    <div
                      className={`calendar-reminder-item__icon-wrap calendar-reminder-item__icon-wrap--${rem.type}`}
                    >
                      <IconComponent size={14} aria-hidden="true" />
                    </div>
                    <div className="calendar-reminder-item__details">
                      <h3 className="calendar-reminder-item__title">{rem.title}</h3>
                      <p className="calendar-reminder-item__date">{rem.dateLabel}</p>
                    </div>
                    <span
                      className={`calendar-reminder-item__badge calendar-reminder-item__badge--${rem.type}`}
                    >
                      {rem.type}
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              className="calendar-widget__link"
              onClick={() => setIsAddReminderModalOpen(true)}
            >
              <span>View all reminders</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </aside>
      </div>

      {/* =====================================================================
          Interactive Modals
         ===================================================================== */}

      {/* Modal 1: Event Details */}
      {selectedEvent && (
        <div className="calendar-modal-backdrop" onClick={() => setSelectedEvent(null)}>
          <div
            className="calendar-modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="event-details-title"
          >
            <div className="calendar-modal__header">
              <h2 id="event-details-title" className="calendar-modal__title">
                {selectedEvent.title}
              </h2>
              <button
                type="button"
                className="calendar-modal__close-btn"
                onClick={() => setSelectedEvent(null)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#087f55" }}>
                <Clock size={16} />
                <span style={{ fontSize: "14px", fontWeight: 600 }}>
                  {selectedEvent.date} • {selectedEvent.displayTime}
                </span>
              </div>
              {selectedEvent.courseTitle && (
                <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>
                  {selectedEvent.courseTitle}
                </p>
              )}
              {selectedEvent.description && (
                <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#374151", lineHeight: 1.5 }}>
                  {selectedEvent.description}
                </p>
              )}
            </div>

            <div className="calendar-modal__actions">
              <button
                type="button"
                className="calendar-modal__btn-danger"
                onClick={() => handleDeleteEvent(selectedEvent.id)}
              >
                <Trash2 size={14} style={{ marginRight: "4px" }} />
                Delete
              </button>
              {selectedEvent.locationOrUrl && (
                <button
                  type="button"
                  className="calendar-modal__btn-primary"
                  onClick={() => {
                    window.open(selectedEvent.locationOrUrl, "_blank", "noopener,noreferrer");
                  }}
                >
                  <ExternalLink size={14} style={{ marginRight: "4px" }} />
                  Join Meeting
                </button>
              )}
              <button
                type="button"
                className="calendar-modal__btn-secondary"
                onClick={() => setSelectedEvent(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Add New Event */}
      {isNewEventModalOpen && (
        <div className="calendar-modal-backdrop" onClick={() => setIsNewEventModalOpen(false)}>
          <form
            className="calendar-modal-content"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreateEvent}
            role="dialog"
            aria-labelledby="add-event-title"
          >
            <div className="calendar-modal__header">
              <h2 id="add-event-title" className="calendar-modal__title">
                Add Event to Calendar
              </h2>
              <button
                type="button"
                className="calendar-modal__close-btn"
                onClick={() => setIsNewEventModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="calendar-form-group">
              <label htmlFor="evt-title">Event Title</label>
              <input
                id="evt-title"
                type="text"
                required
                placeholder="e.g. Read Quiz, Live Session..."
                value={newEventDraft.title || ""}
                onChange={(e) => setNewEventDraft((p) => ({ ...p, title: e.target.value }))}
                autoFocus
              />
            </div>

            <div className="calendar-form-group">
              <label htmlFor="evt-type">Category</label>
              <select
                id="evt-type"
                value={newEventDraft.type}
                onChange={(e) =>
                  setNewEventDraft((p) => ({ ...p, type: e.target.value as EventType }))
                }
              >
                <option value="quiz">Quiz (Green)</option>
                <option value="live_session">Live Session (Blue)</option>
                <option value="assignment">Assignment (Purple)</option>
                <option value="office_hours">Office Hours (Violet)</option>
                <option value="study_block">Study Block (Amber)</option>
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="calendar-form-group">
                <label htmlFor="evt-date">Date</label>
                <input
                  id="evt-date"
                  type="date"
                  required
                  value={newEventDraft.date || "2025-05-14"}
                  onChange={(e) => setNewEventDraft((p) => ({ ...p, date: e.target.value }))}
                />
              </div>
              <div className="calendar-form-group">
                <label htmlFor="evt-start">Start Time</label>
                <input
                  id="evt-start"
                  type="time"
                  required
                  value={newEventDraft.startTime || "10:00"}
                  onChange={(e) => setNewEventDraft((p) => ({ ...p, startTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="calendar-form-group">
              <label htmlFor="evt-desc">Description / Notes</label>
              <textarea
                id="evt-desc"
                rows={2}
                placeholder="Optional topic details or syllabus reference..."
                value={newEventDraft.description || ""}
                onChange={(e) => setNewEventDraft((p) => ({ ...p, description: e.target.value }))}
              />
            </div>

            <div className="calendar-modal__actions">
              <button
                type="button"
                className="calendar-modal__btn-secondary"
                onClick={() => setIsNewEventModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="calendar-modal__btn-primary">
                Save Event
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 3: Edit Study Goal */}
      {isEditGoalModalOpen && (
        <div className="calendar-modal-backdrop" onClick={() => setIsEditGoalModalOpen(false)}>
          <form
            className="calendar-modal-content"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSaveGoal}
            role="dialog"
            aria-labelledby="edit-goal-title"
          >
            <div className="calendar-modal__header">
              <h2 id="edit-goal-title" className="calendar-modal__title">
                Edit Weekly Study Goal
              </h2>
              <button
                type="button"
                className="calendar-modal__close-btn"
                onClick={() => setIsEditGoalModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="calendar-form-group">
              <label htmlFor="target-hours">Weekly Target (Hours)</label>
              <input
                id="target-hours"
                type="number"
                min="1"
                max="60"
                value={targetGoalInput}
                onChange={(e) => setTargetGoalInput(Number(e.target.value))}
                autoFocus
              />
            </div>

            <div className="calendar-modal__actions">
              <button
                type="button"
                className="calendar-modal__btn-secondary"
                onClick={() => setIsEditGoalModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="calendar-modal__btn-primary">
                Update Goal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 4: Add Reminder */}
      {isAddReminderModalOpen && (
        <div className="calendar-modal-backdrop" onClick={() => setIsAddReminderModalOpen(false)}>
          <form
            className="calendar-modal-content"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleAddReminder}
            role="dialog"
            aria-labelledby="add-reminder-title"
          >
            <div className="calendar-modal__header">
              <h2 id="add-reminder-title" className="calendar-modal__title">
                Add New Reminder
              </h2>
              <button
                type="button"
                className="calendar-modal__close-btn"
                onClick={() => setIsAddReminderModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="calendar-form-group">
              <label htmlFor="rem-title">Reminder Title</label>
              <input
                id="rem-title"
                type="text"
                required
                placeholder="e.g. Weekly Goal Check-in..."
                value={newReminderTitle}
                onChange={(e) => setNewReminderTitle(e.target.value)}
                autoFocus
              />
            </div>

            <div className="calendar-form-group">
              <label htmlFor="rem-type">Type</label>
              <select
                id="rem-type"
                value={newReminderType}
                onChange={(e) =>
                  setNewReminderType(e.target.value as "assignment" | "goal" | "quiz")
                }
              >
                <option value="assignment">Assignment</option>
                <option value="goal">Goal</option>
                <option value="quiz">Quiz</option>
              </select>
            </div>

            <div className="calendar-modal__actions">
              <button
                type="button"
                className="calendar-modal__btn-secondary"
                onClick={() => setIsAddReminderModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="calendar-modal__btn-primary">
                Add Reminder
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
