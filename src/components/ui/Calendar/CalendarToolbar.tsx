import React from "react";
import { ChevronLeft, ChevronRight, ChevronDown, SlidersHorizontal } from "lucide-react";
import type { EventType, CalendarViewMode } from "./calendar.types";
import { EVENT_TYPE_CONFIG } from "./calendar-helpers";

interface CalendarToolbarProps {
  viewMode: CalendarViewMode;
  dateRangeLabel: string;
  isFilterOpen: boolean;
  filterTypes: Record<EventType, boolean>;
  filterRef: React.RefObject<HTMLDivElement | null>;
  onToday: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleWeekMonth: () => void;
  onSetViewMode: (mode: CalendarViewMode) => void;
  onToggleFilter: () => void;
  onFilterChange: (type: EventType, checked: boolean) => void;
}

export function CalendarToolbar({
  viewMode,
  dateRangeLabel,
  isFilterOpen,
  filterTypes,
  filterRef,
  onToday,
  onPrev,
  onNext,
  onToggleWeekMonth,
  onSetViewMode,
  onToggleFilter,
  onFilterChange,
}: CalendarToolbarProps) {
  return (
    <div className="calendar-toolbar">
      <div className="calendar-toolbar__left">
        <button
          type="button"
          className="calendar-toolbar__btn-today"
          onClick={onToday}
          aria-label="Jump to current active week"
        >
          Today
        </button>

        <div className="calendar-toolbar__nav-group" role="group" aria-label="Calendar Navigation">
          <button
            type="button"
            className="calendar-toolbar__nav-btn"
            onClick={onPrev}
            aria-label="Previous period"
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="calendar-toolbar__nav-btn"
            onClick={onNext}
            aria-label="Next period"
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          className="calendar-toolbar__date-title"
          onClick={onToggleWeekMonth}
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
            onClick={() => onSetViewMode("week")}
          >
            Week
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "month"}
            className={`calendar-view-toggle__btn ${viewMode === "month" ? "calendar-view-toggle__btn--active" : ""}`}
            onClick={() => onSetViewMode("month")}
          >
            Month
          </button>
        </div>

        {/* Filter Button */}
        <div style={{ position: "relative" }} ref={filterRef}>
          <button
            type="button"
            className={`calendar-toolbar__filter-btn ${isFilterOpen ? "calendar-toolbar__filter-btn--active" : ""}`}
            onClick={onToggleFilter}
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
                    onChange={(e) => onFilterChange(type, e.target.checked)}
                  />
                  <span>{EVENT_TYPE_CONFIG[type].label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
