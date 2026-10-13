import React from "react";
import { X } from "lucide-react";
import type { CalendarEvent, EventType } from "../calendar.types";

interface CreateEventModalProps {
  draft: Partial<CalendarEvent>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onDraftChange: (patch: Partial<CalendarEvent>) => void;
}

export function CreateEventModal({
  draft,
  onClose,
  onSubmit,
  onDraftChange,
}: CreateEventModalProps) {
  return (
    <div className="calendar-modal-backdrop" onClick={onClose}>
      <form
        className="calendar-modal-content"
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
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
            onClick={onClose}
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
            value={draft.title || ""}
            onChange={(e) => onDraftChange({ title: e.target.value })}
            autoFocus
          />
        </div>

        <div className="calendar-form-group">
          <label htmlFor="evt-type">Category</label>
          <select
            id="evt-type"
            value={draft.type}
            onChange={(e) => onDraftChange({ type: e.target.value as EventType })}
          >
            <option value="quiz">Quiz (Green)</option>
            <option value="live_session">Live Session (Blue)</option>
            <option value="assignment">Assignment (Purple)</option>
            <option value="office_hours">Office Hours (Violet)</option>
            <option value="study_block">Study Block (Amber)</option>
          </select>
        </div>

        <div className="calendar-form-group">
          <label htmlFor="evt-date">Date</label>
          <input
            id="evt-date"
            type="date"
            required
            value={draft.date || "2026-08-30"}
            onChange={(e) => onDraftChange({ date: e.target.value })}
          />
        </div>

        {/* Time Range: Start Time & End Time */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div className="calendar-form-group">
            <label htmlFor="evt-start">Start Time</label>
            <input
              id="evt-start"
              type="time"
              required
              value={draft.startTime || "10:00"}
              onChange={(e) => onDraftChange({ startTime: e.target.value })}
            />
          </div>
          <div className="calendar-form-group">
            <label htmlFor="evt-end">End Time</label>
            <input
              id="evt-end"
              type="time"
              required
              value={draft.endTime || "11:00"}
              onChange={(e) => onDraftChange({ endTime: e.target.value })}
            />
          </div>
        </div>

        <div className="calendar-form-group">
          <label htmlFor="evt-desc">Description / Notes</label>
          <textarea
            id="evt-desc"
            rows={2}
            placeholder="Optional topic details or syllabus reference..."
            value={draft.description || ""}
            onChange={(e) => onDraftChange({ description: e.target.value })}
          />
        </div>

        <div className="calendar-modal__actions">
          <button type="button" className="calendar-modal__btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="calendar-modal__btn-primary">
            Save Event
          </button>
        </div>
      </form>
    </div>
  );
}
