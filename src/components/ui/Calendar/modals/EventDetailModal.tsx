import { X, Clock, Trash2, ExternalLink } from "lucide-react";
import type { CalendarEvent } from "../calendar.types";

interface EventDetailModalProps {
  event: CalendarEvent;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export function EventDetailModal({ event, onClose, onDelete }: EventDetailModalProps) {
  return (
    <div className="calendar-modal-backdrop" onClick={onClose}>
      <div
        className="calendar-modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="event-details-title"
      >
        <div className="calendar-modal__header">
          <h2 id="event-details-title" className="calendar-modal__title">
            {event.title}
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

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#087f55" }}>
            <Clock size={16} />
            <span style={{ fontSize: "14px", fontWeight: 600 }}>
              {event.date} • {event.displayTime}
            </span>
          </div>
          {event.courseTitle && (
            <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>
              {event.courseTitle}
            </p>
          )}
          {event.description && (
            <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#374151", lineHeight: 1.5 }}>
              {event.description}
            </p>
          )}
        </div>

        <div className="calendar-modal__actions">
          <button
            type="button"
            className="calendar-modal__btn-danger"
            onClick={() => onDelete(event.id)}
          >
            <Trash2 size={14} style={{ marginRight: "4px" }} />
            Delete
          </button>
          {event.locationOrUrl && (
            <button
              type="button"
              className="calendar-modal__btn-primary"
              onClick={() => {
                window.open(event.locationOrUrl, "_blank", "noopener,noreferrer");
              }}
            >
              <ExternalLink size={14} style={{ marginRight: "4px" }} />
              Join Meeting
            </button>
          )}
          <button type="button" className="calendar-modal__btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
