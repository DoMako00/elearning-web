import { FileText, CalendarCheck } from "lucide-react";
import type { CalendarEvent, CalendarViewMode } from "./calendar.types";
import { HOURS, EVENT_TYPE_CONFIG, formatHour, formatLocalDate } from "./calendar-helpers";

interface MonthCell {
  date: Date;
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

interface EgyptNow {
  dateStr: string;
  hour: number;
  minute: number;
}

interface CalendarGridViewProps {
  viewMode: CalendarViewMode;
  weekDays: Date[];
  monthDays: MonthCell[];
  filteredEvents: CalendarEvent[];
  egyptNow: EgyptNow;
  draggedEventId: string | null;
  dragOverTarget: string | null;
  onDragStart: (e: React.DragEvent, eventId: string) => void;
  onDragEnd: () => void;
  onDropWeekCell: (e: React.DragEvent, dateStr: string, hour: number) => void;
  onDropMonthCell: (e: React.DragEvent, dateStr: string) => void;
  onSetDragOverTarget: (target: string | null) => void;
  onSelectEvent: (event: CalendarEvent) => void;
  onOpenNewEvent: (draft: Partial<CalendarEvent>) => void;
}

export function CalendarGridView({
  viewMode,
  weekDays,
  monthDays,
  filteredEvents,
  egyptNow,
  draggedEventId,
  dragOverTarget,
  onDragStart,
  onDragEnd,
  onDropWeekCell,
  onDropMonthCell,
  onSetDragOverTarget,
  onSelectEvent,
  onOpenNewEvent,
}: CalendarGridViewProps) {
  return (
    <>
      {/* Week Grid View */}
      {viewMode === "week" ? (
        <div className="calendar-grid-wrapper">
          <div className="calendar-grid">
            {/* Header corner cell */}
            <div className="calendar-grid__cell-header-corner">GMT+3</div>

            {/* Day Header Cells */}
            {weekDays.map((d, index) => {
              const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
              const dayNum = d.getDate();
              const dDateStr = formatLocalDate(d);
              const isToday = dDateStr === egyptNow.dateStr;
              return (
                <div
                  key={index}
                  className={`calendar-grid__day-header ${
                    isToday ? "calendar-grid__day-header--today" : ""
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
                  const dateStr = formatLocalDate(dayDate);
                  const cellEvents = filteredEvents.filter((evt) => {
                    if (evt.date !== dateStr) return false;
                    const [evtHour] = evt.startTime.split(":").map(Number);
                    return evtHour === hour;
                  });

                  const showCurrentTimeLine = dateStr === egyptNow.dateStr && hour === egyptNow.hour;
                  const timeLineTopPct = (egyptNow.minute / 60) * 100;
                  const cellKey = `week-${dateStr}-${hour}`;
                  const isDragOver = dragOverTarget === cellKey;

                  return (
                    <div
                      key={dayIdx}
                      className={`calendar-grid__cell ${isDragOver ? "calendar-grid__cell--drag-over" : ""}`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        if (dragOverTarget !== cellKey) onSetDragOverTarget(cellKey);
                      }}
                      onDragLeave={() => {
                        if (dragOverTarget === cellKey) onSetDragOverTarget(null);
                      }}
                      onDrop={(e) => onDropWeekCell(e, dateStr, hour)}
                      onClick={() => {
                        onOpenNewEvent({
                          date: dateStr,
                          startTime: `${hour < 10 ? `0${hour}` : hour}:00`,
                          endTime: `${hour + 1 < 10 ? `0${hour + 1}` : hour + 1}:00`,
                          type: "quiz",
                        });
                      }}
                    >
                      {showCurrentTimeLine && (
                        <div
                          className="calendar-current-time-line"
                          style={{ top: `${timeLineTopPct}%` }}
                          title={`Current time (Cairo): ${String(egyptNow.hour).padStart(2, "0")}:${String(egyptNow.minute).padStart(2, "0")}`}
                        />
                      )}

                      {cellEvents.map((evt) => {
                        const [sH, sM] = evt.startTime.split(":").map(Number);
                        const [eH, eM] = evt.endTime.split(":").map(Number);
                        const durationMinutes = eH * 60 + eM - (sH * 60 + sM);
                        const heightPx = Math.max(48, Math.round((durationMinutes / 60) * 54) - 4);
                        const topPx = Math.round((sM / 60) * 54);
                        const IconComponent = EVENT_TYPE_CONFIG[evt.type]?.icon || FileText;
                        const isBeingDragged = draggedEventId === evt.id;

                        return (
                          <button
                            key={evt.id}
                            type="button"
                            draggable
                            onDragStart={(e) => onDragStart(e, evt.id)}
                            onDragEnd={onDragEnd}
                            className={`calendar-event-card calendar-event-card--${evt.type} ${
                              isBeingDragged ? "calendar-event-card--dragging" : ""
                            }`}
                            style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectEvent(evt);
                            }}
                            title={`${evt.title} (${evt.displayTime})${evt.description ? `\n${evt.description}` : ""}`}
                          >
                            <div className="calendar-event-card__header">
                              <IconComponent size={12} className="calendar-event-card__icon" />
                              <span className="calendar-event-card__title">{evt.title}</span>
                            </div>
                            <span className="calendar-event-card__time">{evt.displayTime}</span>
                            {evt.description && (
                              <span className="calendar-event-card__desc">{evt.description}</span>
                            )}
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
                  if (dragOverTarget !== cellKey) onSetDragOverTarget(cellKey);
                }}
                onDragLeave={() => {
                  if (dragOverTarget === cellKey) onSetDragOverTarget(null);
                }}
                onDrop={(e) => onDropMonthCell(e, cell.dateStr)}
                onClick={() => {
                  onOpenNewEvent({
                    date: cell.dateStr,
                    startTime: "10:00",
                    endTime: "11:00",
                    type: "quiz",
                  });
                }}
              >
                <div className="calendar-month-grid__day-top">
                  <span className="calendar-month-grid__day-num">{cell.dayNumber}</span>
                </div>
                {dayEvents.slice(0, 3).map((evt) => {
                  const isBeingDragged = draggedEventId === evt.id;
                  return (
                    <div
                      key={evt.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, evt.id)}
                      onDragEnd={onDragEnd}
                      className={`calendar-month-pill calendar-event-card--${evt.type} ${
                        isBeingDragged ? "calendar-month-pill--dragging" : ""
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(evt);
                      }}
                      title={`${evt.title}${evt.description ? ` - ${evt.description}` : ""}`}
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
          onClick={() =>
            onOpenNewEvent({
              date: "2025-05-14",
              startTime: "10:00",
              endTime: "11:00",
              type: "quiz",
            })
          }
          aria-label="Add new schedule item"
        >
          <span>Add to calendar</span>
          <CalendarCheck size={18} aria-hidden="true" />
        </button>
      </div>
    </>
  );
}
