import React from "react";
import { X } from "lucide-react";

interface AddReminderModalProps {
  title: string;
  reminderType: "assignment" | "goal" | "quiz";
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onTitleChange: (value: string) => void;
  onTypeChange: (value: "assignment" | "goal" | "quiz") => void;
}

export function AddReminderModal({
  title,
  reminderType,
  onClose,
  onSubmit,
  onTitleChange,
  onTypeChange,
}: AddReminderModalProps) {
  return (
    <div className="calendar-modal-backdrop" onClick={onClose}>
      <form
        className="calendar-modal-content"
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
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
            onClick={onClose}
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
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            autoFocus
          />
        </div>

        <div className="calendar-form-group">
          <label htmlFor="rem-type">Type</label>
          <select
            id="rem-type"
            value={reminderType}
            onChange={(e) => onTypeChange(e.target.value as "assignment" | "goal" | "quiz")}
          >
            <option value="assignment">Assignment</option>
            <option value="goal">Goal</option>
            <option value="quiz">Quiz</option>
          </select>
        </div>

        <div className="calendar-modal__actions">
          <button type="button" className="calendar-modal__btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="calendar-modal__btn-primary">
            Add Reminder
          </button>
        </div>
      </form>
    </div>
  );
}
