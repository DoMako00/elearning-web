import React, { useState, useMemo, useRef, useEffect } from "react";
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
  cairoDateTimeToIso,
} from "./calendar-helpers";
import { useStudentCalendar, useStudentCalendarMutations } from "../../../features/student/api/useStudentCalendar";
import { useSetWeeklyLessonGoal, useStudentLearningPreferences, useStudentProgress } from "../../../features/student/api/useStudentLearning";
import { mapStudentCalendarItem } from "../../../features/student/api/studentCalendarMapper";
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
  // ── View / navigation state ──────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<CalendarViewMode>("week");
  const [activeDate, setActiveDate] = useState<Date>(new Date());
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterTypes, setFilterTypes] = useState<Record<EventType, boolean>>({
    quiz: true,
    live_session: true,
    assignment: true,
    office_hours: true,
    study_block: true,
    reminder: true,
    academic_event: true,
    course_release: true,
    exam: true,
    holiday: true,
  });

  // ── Modal state ──────────────────────────────────────────────────────────────
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [newEventDraft, setNewEventDraft] = useState<Partial<CalendarEvent>>({
    type: "study_block",
    startTime: "10:00",
    endTime: "11:00",
    date: getEgyptNow().dateStr,
  });

  const [isEditGoalModalOpen, setIsEditGoalModalOpen] = useState(false);
  const [targetGoalInput, setTargetGoalInput] = useState<number>(1);

  const [isAddReminderModalOpen, setIsAddReminderModalOpen] = useState(false);
  const [newReminderTitle, setNewReminderTitle] = useState("");
  const [newReminderDate, setNewReminderDate] = useState(getEgyptNow().dateStr);
  const [newReminderTime, setNewReminderTime] = useState("10:00");
  const [mutationError, setMutationError] = useState<string | null>(null);

  // ── Drag-and-drop state ──────────────────────────────────────────────────────
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  // ── Clock / time-zone ────────────────────────────────────────────────────────
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const egyptNow = useMemo(() => getEgyptNow(), [currentTime]);

  const filterRef = useRef<HTMLDivElement>(null);

  const queryRange = useMemo(() => {
    const start = new Date(activeDate);
    if (viewMode === "week") {
      const diffToMonday = (start.getDay() + 6) % 7;
      start.setDate(start.getDate() - diffToMonday);
    } else {
      start.setDate(1);
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    }
    const end = new Date(start);
    end.setDate(start.getDate() + (viewMode === "week" ? 7 : 42));
    return { from: formatLocalDate(start), to: formatLocalDate(end) };
  }, [activeDate, viewMode]);
  const calendarQuery = useStudentCalendar(queryRange.from, queryRange.to);
  const progressQuery = useStudentProgress();
  const preferencesQuery = useStudentLearningPreferences();
  const calendarMutations = useStudentCalendarMutations();
  const weeklyGoalMutation = useSetWeeklyLessonGoal();
  const events = useMemo(() => (calendarQuery.data ?? []).map(mapStudentCalendarItem), [calendarQuery.data]);
  const currentDate = egyptNow.dateStr;
  const agendaItems = useMemo<AgendaItem[]>(() => events
    .filter((event) => event.date === currentDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .map((event) => ({ id: event.id, time: event.displayTime.split(" - ")[0] ?? event.startTime, title: event.title, subtitle: event.courseTitle ?? "", type: event.type })), [events, currentDate]);
  const reminders = useMemo<ReminderItem[]>(() => events
    .filter((event) => event.type === "reminder" && event.editable)
    .map((event) => ({ id: event.id, title: event.title, dateLabel: `${event.date} · ${event.displayTime}`, type: "reminder", completed: event.status === "completed" })), [events]);
  const progress = progressQuery.data;
  const goalValue = preferencesQuery.data?.weeklyLessonGoal ?? progress?.weeklyGoalLessons ?? null;
  const studyGoal = useMemo<StudyGoalProgress>(() => {
    const completed = progress?.weeklyCompletedLessons ?? 0;
    const weeklyPercentage = goalValue ? Math.min(100, Math.round(completed * 100 / goalValue)) : 0;
    const days = progress?.weekDays ?? [];
    const labels = ["M", "T", "W", "T", "F", "S", "S"] as const;
    return { completedLessons: completed, targetLessons: goalValue, weeklyPercentage, streakDays: labels.map((day, index) => ({ day, completed: (days[index]?.completedLessons ?? 0) > 0, isCurrent: days[index]?.date === currentDate })) };
  }, [progress, goalValue, currentDate]);

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
    const event = events.find((item) => item.id === eventId);
    if (!event?.editable || !event.version) { e.preventDefault(); return; }
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
    if (!existing?.editable || !existing.version) return;

    const [startH, startM] = existing.startTime.split(":").map(Number);
    const [endH, endM] = existing.endTime.split(":").map(Number);
    const durationMinutes = endH * 60 + endM - (startH * 60 + startM);

    const newStartH = targetHour;
    const newStartM = startM;
    const newEndMinutes = newStartH * 60 + newStartM + durationMinutes;

    const nextDate = new Date(`${targetDate}T00:00:00`);
    const normalizedStartHour = newStartH % 24;
    if (newStartH >= 24) nextDate.setDate(nextDate.getDate() + 1);
    const normalizedDate = formatLocalDate(nextDate);
    const newStartStr = `${String(normalizedStartHour).padStart(2, "0")}:${String(newStartM).padStart(2, "0")}`;
    const endHH = Math.floor(newEndMinutes / 60);
    const endMM = newEndMinutes % 60;
    if (hasTimeConflict(targetDate, newStartH * 60 + newStartM, newEndMinutes, eventId)) {
      alert("⚠️ Time conflict: An event is already scheduled at this time on that date.");
      setDraggedEventId(null);
      setDragOverTarget(null);
      return;
    }

    const endDate = new Date(`${normalizedDate}T00:00:00`);
    if (endHH >= 24) endDate.setDate(endDate.getDate() + Math.floor(endHH / 24));
    void calendarMutations.update.mutateAsync({ id: existing.id, expectedVersion: existing.version, startsAt: cairoDateTimeToIso(normalizedDate, newStartStr), endsAt: cairoDateTimeToIso(formatLocalDate(endDate), `${String(endHH % 24).padStart(2, "0")}:${String(endMM).padStart(2, "0")}`) }).catch((error: unknown) => setMutationError(error instanceof Error ? error.message : "Calendar item could not be moved."));

    setDraggedEventId(null);
    setDragOverTarget(null);
  };

  const handleDropMonthCell = (e: React.DragEvent, targetDate: string) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData("text/plain") || draggedEventId;
    if (!eventId) return;

    const existing = events.find((evt) => evt.id === eventId);
    if (!existing?.editable || !existing.version) return;

    const startMinutes = parseTimeToMinutes(existing.startTime);
    const endMinutes = parseTimeToMinutes(existing.endTime);

    if (hasTimeConflict(targetDate, startMinutes, endMinutes, eventId)) {
      alert("⚠️ Time conflict: An event is already scheduled at this time on that date.");
      setDraggedEventId(null);
      setDragOverTarget(null);
      return;
    }

    const duration = Math.max(0, parseTimeToMinutes(existing.endTime) - parseTimeToMinutes(existing.startTime));
    const start = cairoDateTimeToIso(targetDate, existing.startTime);
    const totalEndMinutes = parseTimeToMinutes(existing.startTime) + duration;
    const endDate = new Date(`${targetDate}T00:00:00`);
    endDate.setDate(endDate.getDate() + Math.floor(totalEndMinutes / 1440));
    const endTime = `${String(Math.floor((totalEndMinutes % 1440) / 60)).padStart(2, "0")}:${String(totalEndMinutes % 60).padStart(2, "0")}`;
    void calendarMutations.update.mutateAsync({ id: existing.id, expectedVersion: existing.version, startsAt: start, endsAt: cairoDateTimeToIso(formatLocalDate(endDate), endTime) }).catch((error: unknown) => setMutationError(error instanceof Error ? error.message : "Calendar item could not be moved."));

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
  const handleCreateEvent = async (e: React.FormEvent) => {
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

    setMutationError(null);
    try {
      await calendarMutations.create.mutateAsync({ id: crypto.randomUUID(), itemType: "study_block", title: newEventDraft.title.trim(), description: newEventDraft.description?.trim() || null, startsAt: cairoDateTimeToIso(newEventDraft.date, newEventDraft.startTime || "09:00"), endsAt: cairoDateTimeToIso(newEventDraft.date, newEventDraft.endTime || "10:00") });
      setIsNewEventModalOpen(false);
      setNewEventDraft({ type: "study_block", startTime: "10:00", endTime: "11:00", date: currentDate });
    } catch (error) { setMutationError(error instanceof Error ? error.message : "Calendar item could not be saved."); }
  };

  const handleDeleteEvent = async (id: string) => {
    const event = events.find((item) => item.id === id);
    if (!event?.editable || !event.version) return;
    setMutationError(null);
    try { await calendarMutations.update.mutateAsync({ id, expectedVersion: event.version, status: "cancelled" }); setSelectedEvent(null); }
    catch (error) { setMutationError(error instanceof Error ? error.message : "Calendar item could not be cancelled."); }
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setMutationError(null);
    try { await weeklyGoalMutation.mutateAsync({ weeklyLessonGoal: Math.max(1, Math.min(100, targetGoalInput)), expectedVersion: preferencesQuery.data?.version ?? null }); setIsEditGoalModalOpen(false); }
    catch (error) { setMutationError(error instanceof Error ? error.message : "Weekly goal could not be saved."); }
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderTitle.trim()) return;
    setMutationError(null);
    try { await calendarMutations.create.mutateAsync({ id: crypto.randomUUID(), itemType: "reminder", title: newReminderTitle.trim(), description: null, startsAt: cairoDateTimeToIso(newReminderDate, newReminderTime), endsAt: null }); setNewReminderTitle(""); setIsAddReminderModalOpen(false); }
    catch (error) { setMutationError(error instanceof Error ? error.message : "Reminder could not be saved."); }
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
      {mutationError && <p role="alert" className="calendar-inline-error">{mutationError}</p>}
      {calendarQuery.isLoading && <p role="status" className="calendar-inline-status">Loading your calendar…</p>}
      {calendarQuery.isError && <p role="alert" className="calendar-inline-error">{calendarQuery.error instanceof Error ? calendarQuery.error.message : "Your calendar could not be loaded."} <button type="button" onClick={() => void calendarQuery.refetch()}>Retry</button></p>}
      {progressQuery.isError && <p role="alert" className="calendar-inline-error">Study progress is temporarily unavailable.</p>}
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
              setNewEventDraft({ ...draft, type: "study_block" });
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
            setNewEventDraft({ date: currentDate, startTime: "12:00", endTime: "13:00", type: "study_block" });
            setIsNewEventModalOpen(true);
          }}
          onViewFullAgenda={() => setViewMode("week")}
          onEditGoal={() => {
            setTargetGoalInput(goalValue ?? 1);
            setIsEditGoalModalOpen(true);
          }}
          onAddReminder={() => { setNewReminderDate(currentDate); setIsAddReminderModalOpen(true); }}
          onViewAllReminders={() => { setNewReminderDate(currentDate); setIsAddReminderModalOpen(true); }}
        />
      </div>

      {/* =====================================================================
          Interactive Modals
         ===================================================================== */}

      {/* Modal 1: Event Details */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          canEdit={selectedEvent.editable}
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
          date={newReminderDate}
          time={newReminderTime}
          onClose={() => setIsAddReminderModalOpen(false)}
          onSubmit={handleAddReminder}
          onTitleChange={setNewReminderTitle}
          onDateChange={setNewReminderDate}
          onTimeChange={setNewReminderTime}
        />
      )}
    </div>
  );
}
