import React from "react";
import { X } from "lucide-react";

interface EditStudyGoalModalProps {
  targetGoalInput: number;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onTargetChange: (value: number) => void;
}

export function EditStudyGoalModal({
  targetGoalInput,
  onClose,
  onSubmit,
  onTargetChange,
}: EditStudyGoalModalProps) {
  return (
    <div className="calendar-modal-backdrop" onClick={onClose}>
      <form
        className="calendar-modal-content"
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
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
            onClick={onClose}
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
            onChange={(e) => onTargetChange(Number(e.target.value))}
            autoFocus
          />
        </div>

        <div className="calendar-modal__actions">
          <button type="button" className="calendar-modal__btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="calendar-modal__btn-primary">
            Update Goal
          </button>
        </div>
      </form>
    </div>
  );
}
