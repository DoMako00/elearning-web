import React, { useState, useMemo, useRef, useEffect } from "react";
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
import {
  formatLocalDate,
  getEgyptNow,
  parseTimeToMinutes,
  formatHour,
} from "./calendar-helpers";
import { CalendarToolbar } from "./CalendarToolbar";
import { CalendarGridView } from "./CalendarGridView";
import { CalendarSidebar } from "./CalendarSidebar";
import { EventDetailModal } from "./modals/EventDetailModal";
import { CreateEventModal } from "./modals/CreateEventModal";
import { EditStudyGoalModal } from "./modals/EditStudyGoalModal";
import { AddReminderModal } from "./modals/AddReminderModal";
import "./Calendar.css";

// Re-export the two utility functions that external code may import directly.
export { formatLocalDate, getEgyptNow };

export function CalendarWorkspace() {
  // ── Data state ──────────────────────────────────────────────────────────────
  const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_CALENDAR_EVENTS);
  const [agendaItems] = useState<AgendaItem[]>(INITIAL_AGENDA_ITEMS);
  const [reminders, setReminders] = useState<ReminderItem[]>(INITIAL_REMINDERS);
  const [studyGoal, setStudyGoal] = useState<StudyGoalProgress>(INITIAL_STUDY_GOAL);

  // ── View / navigation state ──────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<CalendarViewMode>("week");
  const [activeDate, setActiveDate] = useState<Date>(new Date(2026, 7, 31)); // Aug 31, 2026
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterTypes, setFilterTypes] = useState<Record<EventType, boolean>>({
    quiz: true,
    live_session: true,
    assignment: true,
    office_hours: true,
    study_block: true,
  });

  // ── Modal state ──────────────────────────────────────────────────────────────
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

  // ── Drag-and-drop state ──────────────────────────────────────────────────────
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  // ── Clock / time-zone ────────────────────────────────────────────────────────
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const egyptNow = useMemo(() => getEgyptNow(), [currentTime]);

  const filterRef = useRef<HTMLDivElement>(null);

  // ── Effects ──────────────────────────────────────────────────────────────────
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

  // ── Drag handlers ─────────────────────────────────────────────────────────────
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

  // ── Conflict check ────────────────────────────────────────────────────────────
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
      return startMinutes < evtEnd && endMinutes > evtStart;
    });
  };

  // ── Drop handlers ─────────────────────────────────────────────────────────────
  const handleDropWeekCell = (e: React.DragEvent, targetDate: string, targetHour: number) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData("text/plain") || draggedEventId;
    if (!eventId) return;

    const existing = events.find((evt) => evt.id === eventId);
    if (!existing) return;

    const [startH, startM] = existing.startTime.split(":").map(Number);
    const [endH, endM] = existing.endTime.split(":").map(Number);
    const durationMinutes = endH * 60 + endM - (startH * 60 + startM);

    const newStartH = targetHour;
    const newStartM = startM;
    const newEndMinutes = newStartH * 60 + newStartM + durationMinutes;

    const newStartStr = `${String(newStartH).padStart(2, "0")}:${String(newStartM).padStart(2, "0")}`;
    const endHH = Math.floor(newEndMinutes / 60);
    const endMM = newEndMinutes % 60;
    const newEndStr = `${String(endHH).padStart(2, "0")}:${String(endMM).padStart(2, "0")}`;

    if (hasTimeConflict(targetDate, newStartH * 60 + newStartM, newEndMinutes, eventId)) {
      alert("⚠️ Time conflict: An event is already scheduled at this time on that date.");
      setDraggedEventId(null);
      setDragOverTarget(null);
      return;
    }

    const displayStart = formatHour(newStartH);
    const displayEnd = formatHour(endHH);

    setEvents((prev) =>
      prev.map((evt) =>
        evt.id === eventId
          ? {
              ...evt,
              date: targetDate,
              startTime: newStartStr,
              endTime: newEndStr,
              displayTime: `${displayStart} - ${displayEnd}`,
            }
          : evt
      )
    );

    setDraggedEventId(null);
    setDragOverTarget(null);
  };

  const handleDropMonthCell = (e: React.DragEvent, targetDate: string) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData("text/plain") || draggedEventId;
    if (!eventId) return;

    const existing = events.find((evt) => evt.id === eventId);
    if (!existing) return;

    const startMinutes = parseTimeToMinutes(existing.startTime);
    const endMinutes = parseTimeToMinutes(existing.endTime);

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

  // ── Derived / computed values ─────────────────────────────────────────────────
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

  // 35 or 42 grid cells for the active month (Monday to Sunday layout)
  const monthDays = useMemo(() => {
    const year = activeDate.getFullYear();
    const month = activeDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const totalDaysInMonth = lastDayOfMonth.getDate();
    const firstDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const cells: {
      date: Date;
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const d = new Date(year, month - 1, dayNum);
      const dateStr = formatLocalDate(d);
      cells.push({ date: d, dateStr, dayNumber: dayNum, isCurrentMonth: false, isToday: dateStr === egyptNow.dateStr });
    }

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const d = new Date(year, month, day);
      const dateStr = formatLocalDate(d);
      cells.push({ date: d, dateStr, dayNumber: day, isCurrentMonth: true, isToday: dateStr === egyptNow.dateStr });
    }

    const targetCellCount = cells.length > 35 ? 42 : 35;
    let nextMonthDay = 1;
    while (cells.length < targetCellCount) {
      const d = new Date(year, month + 1, nextMonthDay);
      const dateStr = formatLocalDate(d);
      cells.push({ date: d, dateStr, dayNumber: nextMonthDay, isCurrentMonth: false, isToday: dateStr === egyptNow.dateStr });
      nextMonthDay++;
    }

    return cells;
  }, [activeDate, egyptNow.dateStr]);

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

  const filteredEvents = useMemo(
    () => events.filter((evt) => filterTypes[evt.type]),
    [events, filterTypes]
  );

  // ── Event CRUD handlers ───────────────────────────────────────────────────────
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
    setNewEventDraft({ type: "quiz", startTime: "10:00", endTime: "11:00", date: "2026-08-30" });
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setSelectedEvent(null);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const newTarget = Math.max(1, targetGoalInput);
    const newPct = Math.min(100, Math.round((studyGoal.completedHours / newTarget) * 100));
    setStudyGoal((prev) => ({ ...prev, targetHours: newTarget, weeklyPercentage: newPct }));
    setIsEditGoalModalOpen(false);
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderTitle.trim()) return;

    setReminders((prev) => [
      ...prev,
      {
        id: `rem-${Date.now()}`,
        title: newReminderTitle.trim(),
        dateLabel: "Upcoming this week",
        type: newReminderType,
        completed: false,
      },
    ]);
    setNewReminderTitle("");
    setIsAddReminderModalOpen(false);
  };

  // ── Nav helpers ───────────────────────────────────────────────────────────────
  const handlePrev = () => {
    const next = new Date(activeDate);
    if (viewMode === "week") next.setDate(next.getDate() - 7);
    else next.setMonth(next.getMonth() - 1);
    setActiveDate(next);
  };

  const handleNext = () => {
    const next = new Date(activeDate);
    if (viewMode === "week") next.setDate(next.getDate() + 7);
    else next.setMonth(next.getMonth() + 1);
    setActiveDate(next);
  };

  const handleToday = () => setActiveDate(new Date());

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="calendar-container">
      {/* Main Layout: Left Calendar Grid + Right Widgets */}
      <div className="calendar-layout">
        {/* Left Section */}
        <section className="calendar-main-card" aria-label="Schedule calendar">
          <CalendarToolbar
            viewMode={viewMode}
            dateRangeLabel={dateRangeLabel}
            isFilterOpen={isFilterOpen}
            filterTypes={filterTypes}
            filterRef={filterRef}
            onToday={handleToday}
            onPrev={handlePrev}
            onNext={handleNext}
            onToggleWeekMonth={() => setViewMode((m) => (m === "week" ? "month" : "week"))}
            onSetViewMode={setViewMode}
            onToggleFilter={() => setIsFilterOpen((prev) => !prev)}
            onFilterChange={(type, checked) =>
              setFilterTypes((prev) => ({ ...prev, [type]: checked }))
            }
          />

          <CalendarGridView
            viewMode={viewMode}
            weekDays={weekDays}
            monthDays={monthDays}
            filteredEvents={filteredEvents}
            egyptNow={egyptNow}
            draggedEventId={draggedEventId}
            dragOverTarget={dragOverTarget}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDropWeekCell={handleDropWeekCell}
            onDropMonthCell={handleDropMonthCell}
            onSetDragOverTarget={setDragOverTarget}
            onSelectEvent={setSelectedEvent}
            onOpenNewEvent={(draft) => {
              setNewEventDraft(draft);
              setIsNewEventModalOpen(true);
            }}
          />
        </section>

        {/* Right Section: Widgets */}
        <CalendarSidebar
          agendaItems={agendaItems}
          studyGoal={studyGoal}
          reminders={reminders}
          onOpenNewEventForToday={() => {
            setNewEventDraft({ date: "2025-05-14", startTime: "12:00", endTime: "13:00", type: "quiz" });
            setIsNewEventModalOpen(true);
          }}
          onViewFullAgenda={() => setViewMode("week")}
          onEditGoal={() => {
            setTargetGoalInput(studyGoal.targetHours);
            setIsEditGoalModalOpen(true);
          }}
          onAddReminder={() => setIsAddReminderModalOpen(true)}
          onViewAllReminders={() => setIsAddReminderModalOpen(true)}
        />
      </div>

      {/* =====================================================================
          Interactive Modals
         ===================================================================== */}

      {/* Modal 1: Event Details */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onDelete={handleDeleteEvent}
        />
      )}

      {/* Modal 2: Add New Event */}
      {isNewEventModalOpen && (
        <CreateEventModal
          draft={newEventDraft}
          onClose={() => setIsNewEventModalOpen(false)}
          onSubmit={handleCreateEvent}
          onDraftChange={(patch) => setNewEventDraft((p) => ({ ...p, ...patch }))}
        />
      )}

      {/* Modal 3: Edit Study Goal */}
      {isEditGoalModalOpen && (
        <EditStudyGoalModal
          targetGoalInput={targetGoalInput}
          onClose={() => setIsEditGoalModalOpen(false)}
          onSubmit={handleSaveGoal}
          onTargetChange={setTargetGoalInput}
        />
      )}

      {/* Modal 4: Add Reminder */}
      {isAddReminderModalOpen && (
        <AddReminderModal
          title={newReminderTitle}
          reminderType={newReminderType}
          onClose={() => setIsAddReminderModalOpen(false)}
          onSubmit={handleAddReminder}
          onTitleChange={setNewReminderTitle}
          onTypeChange={setNewReminderType}
        />
      )}
    </div>
  );
}
