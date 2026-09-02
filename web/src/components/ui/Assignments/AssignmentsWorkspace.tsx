import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Bookmark,
  CalendarDays,
  Check,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react";
import {
  ASSIGNMENT_DEADLINES,
  ASSIGNMENT_FEEDBACK,
  ASSIGNMENT_ITEMS,
} from "./assignments.data";
import type {
  AssignmentFilter,
  AssignmentItem,
  AssignmentSort,
  AssignmentStatus,
  AssignmentUrgency,
} from "./assignments.types";
import "./Assignments.css";

const PAGE_SIZE = 6;

const FILTERS: { id: AssignmentFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "in-progress", label: "In progress" },
  { id: "submitted", label: "Submitted" },
  { id: "graded", label: "Graded" },
];

const SORT_OPTIONS: { id: AssignmentSort; label: string }[] = [
  { id: "due", label: "Due date" },
  { id: "title", label: "Title A–Z" },
  { id: "points", label: "Points" },
];

function statusLabel(status: AssignmentStatus) {
  if (status === "in-progress") return "In progress";
  if (status === "submitted") return "Submitted";
  if (status === "graded") return "Graded";
  return "Not started";
}

function actionLabel(status: AssignmentStatus) {
  if (status === "in-progress") return "Continue";
  if (status === "submitted") return "View submission";
  if (status === "graded") return "View feedback";
  return "Start assignment";
}

function urgencyClass(urgency: AssignmentUrgency) {
  return `assignments-urgency assignments-urgency--${urgency}`;
}

function ProgressDonut({
  completed,
  inProgress,
  notStarted,
  total,
}: {
  completed: number;
  inProgress: number;
  notStarted: number;
  total: number;
}) {
  const radius = 54;
  const stroke = 12;
  const circumference = 2 * Math.PI * radius;
  const completedLen = (completed / total) * circumference;
  const inProgressLen = (inProgress / total) * circumference;
  const notStartedLen = (notStarted / total) * circumference;

  return (
    <svg className="assignments-donut" viewBox="0 0 140 140" aria-hidden="true">
      <g transform="rotate(-90 70 70)">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#eef3f0" strokeWidth={stroke} />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="#20a862"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${completedLen} ${circumference}`}
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="#7ee0b0"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${inProgressLen} ${circumference}`}
          strokeDashoffset={-completedLen}
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="#d5ddd8"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${notStartedLen} ${circumference}`}
          strokeDashoffset={-(completedLen + inProgressLen)}
        />
      </g>
      <text x="70" y="66" textAnchor="middle" className="assignments-donut__value">
        {total}
      </text>
      <text x="70" y="84" textAnchor="middle" className="assignments-donut__label">
        Total
      </text>
    </svg>
  );
}

function AssignmentCard({
  item,
  bookmarked,
  onToggleBookmark,
}: {
  item: AssignmentItem;
  bookmarked: boolean;
  onToggleBookmark: () => void;
}) {
  return (
    <article className="assignment-card">
      <div className="assignment-card__left">
        <span className={`assignment-card__category assignment-card__category--${item.categoryTone}`}>
          {item.category}
        </span>

        <div className="assignment-card__body">
          <div className="assignment-card__art" aria-hidden="true">
            <img src={item.image} alt="" />
          </div>

          <div className="assignment-card__info">
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <div className="assignment-card__meta">
              <span className="assignment-card__due">
                <CalendarDays aria-hidden="true" />
                {item.dueLabel}
              </span>
              <span className={urgencyClass(item.urgency)}>{item.relativeLabel}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="assignment-card__right">
        <div className="assignment-card__header">
          <span className={`assignment-card__status assignment-card__status--${item.status}`}>
            {statusLabel(item.status)}
          </span>
          <button
            type="button"
            className={`assignment-card__bookmark${bookmarked ? " is-saved" : ""}`}
            aria-label={bookmarked ? `Remove bookmark from ${item.title}` : `Bookmark ${item.title}`}
            aria-pressed={bookmarked}
            onClick={onToggleBookmark}
          >
            <Bookmark aria-hidden="true" className={bookmarked ? "fill-current" : ""} />
          </button>
        </div>

<div style={{ display: "flex", flexDirection:"column", gap: "4px" }}>
  
          <span className="assignment-card__points">{item.points} points</span>
          <div className="assignment-card__progress" aria-hidden={item.status !== "in-progress" || typeof item.progress !== "number"}>
            {item.status === "in-progress" && typeof item.progress === "number" ? (
              <>
                <i><b style={{ width: `${item.progress}%` }} /></i>
                <strong>{item.progress}%</strong>
              </>
            ) : (
              <i className="assignment-card__progress-placeholder" />
            )}
          </div>
</div>

        <button type="button" className={`assignment-card__action assignment-card__action--${item.status}`}>
          {actionLabel(item.status)}
        </button>
      </div>
    </article>
  );
}

export function AssignmentsWorkspace() {
  const [filter, setFilter] = useState<AssignmentFilter>("all");
  const [sortBy, setSortBy] = useState<AssignmentSort>("due");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({
    "asg-1": true,
    "asg-4": true,
  });
  const sortRef = useRef<HTMLDivElement>(null);

  const counts = useMemo(() => {
    const inProgress = ASSIGNMENT_ITEMS.filter((item) => item.status === "in-progress").length;
    const submitted = ASSIGNMENT_ITEMS.filter((item) => item.status === "submitted").length;
    const graded = ASSIGNMENT_ITEMS.filter((item) => item.status === "graded").length;
    const notStarted = ASSIGNMENT_ITEMS.filter((item) => item.status === "not-started").length;
    return {
      all: ASSIGNMENT_ITEMS.length,
      "in-progress": inProgress,
      submitted,
      graded,
      notStarted,
      completed: submitted + graded,
    };
  }, []);

  const visibleItems = useMemo(() => {
    const filtered =
      filter === "all"
        ? ASSIGNMENT_ITEMS
        : ASSIGNMENT_ITEMS.filter((item) => item.status === filter);

    const statusRank = (status: AssignmentStatus) =>
      status === "submitted" || status === "graded" ? 1 : 0;

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "points") return b.points - a.points;
      const byOpen = statusRank(a.status) - statusRank(b.status);
      if (byOpen !== 0) return byOpen;
      return a.dueAt.localeCompare(b.dueAt);
    });

    return showAll ? sorted : sorted.slice(0, PAGE_SIZE);
  }, [filter, sortBy, showAll]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleBookmark = (id: string) => {
    setBookmarked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const totalForFilter = filter === "all" ? counts.all : counts[filter];
  const showingFrom = visibleItems.length === 0 ? 0 : 1;
  const showingTo = visibleItems.length;
  const sortLabel = SORT_OPTIONS.find((option) => option.id === sortBy)?.label ?? "Due date";

  return (
    <div className="assignments-workspace">
      <div className="assignments-main">
        {/* <header className="assignments-heading">
          <div>
            <h1 id="assignments-title">Assignments</h1>
            <p>Stay on track, complete your tasks, and master medicine.</p>
          </div>
        </header> */}

        <div className="assignments-toolbar">
          <div className="assignments-filters" role="tablist" aria-label="Assignment status">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={filter === item.id}
                className={`assignments-filter${filter === item.id ? " is-active" : ""}`}
                onClick={() => {
                  setFilter(item.id);
                  setShowAll(false);
                }}
              >
                {item.label} <b>({counts[item.id]})</b>
              </button>
            ))}
          </div>

          <div className="assignments-toolbar__tools">
            <div className="relative" ref={sortRef}>
              <button
                type="button"
                className="assignments-sort"
                aria-haspopup="listbox"
                aria-expanded={isSortOpen}
                onClick={() => setIsSortOpen((open) => !open)}
              >
                Sort by: {sortLabel}
                <ChevronDown aria-hidden="true" className={isSortOpen ? "rotate-180" : ""} />
              </button>
              {isSortOpen ? (
                <ul className="assignments-sort-menu" role="listbox" aria-label="Sort options">
                  {SORT_OPTIONS.map((option) => (
                    <li
                      key={option.id}
                      role="option"
                      aria-selected={sortBy === option.id}
                      className={sortBy === option.id ? "is-active" : ""}
                      onClick={() => {
                        setSortBy(option.id);
                        setIsSortOpen(false);
                      }}
                    >
                      {option.label}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <button type="button" className="assignments-filter-icon" aria-label="More filters">
              <SlidersHorizontal aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="assignments-grid" aria-label="Assignment list">
          {visibleItems.map((item) => (
            <AssignmentCard
              key={item.id}
              item={item}
              bookmarked={Boolean(bookmarked[item.id])}
              onToggleBookmark={() => toggleBookmark(item.id)}
            />
          ))}
        </div>
        <footer className="assignments-footer">
          <span>
            Showing {showingFrom}–{showingTo} of {totalForFilter} assignments
          </span>
          {totalForFilter > PAGE_SIZE ? (
            <button type="button" onClick={() => setShowAll((value) => !value)}>
              {showAll ? "Show fewer" : "View all assignments"} <ArrowRight aria-hidden="true" />
            </button>
          ) : null}
        </footer>

      </div>

      <aside className="assignments-rail" aria-label="Assignment insights">
        <section className="assignments-widget">
          <h2>Upcoming deadlines</h2>
          <ul className="assignments-deadlines">
            {ASSIGNMENT_DEADLINES.map((deadline) => (
              <li key={deadline.id}>
                <img src={deadline.image} alt="" />
                <div>
                  <b>{deadline.title}</b>
                  <small>{deadline.dueLabel}</small>
                </div>
                <span className={urgencyClass(deadline.urgency)}>{deadline.relativeLabel}</span>
              </li>
            ))}
          </ul>
          <button type="button" className="assignments-widget__link">
            View calendar <ArrowRight aria-hidden="true" />
          </button>
        </section>

        <section className="assignments-widget assignments-widget--progress">
          <h2>Your progress</h2>
          <div className="assignments-progress">
            <ProgressDonut
              completed={counts.completed}
              inProgress={counts["in-progress"]}
              notStarted={counts.notStarted}
              total={counts.all}
            />
            <ul>
              <li>
                <i className="dot dot--completed" />
                <div>
                  Completed <b>{counts.completed}</b>
                </div>
                <span>{Math.round((counts.completed / counts.all) * 100)}%</span>
              </li>
              <li>
                <i className="dot dot--progress" />
                <div>
                  In progress <b>{counts["in-progress"]}</b>
                </div>
                <span>{Math.round((counts["in-progress"] / counts.all) * 100)}%</span>
              </li>
              <li>
                <i className="dot dot--idle" />
                <div>
                  Not started <b>{counts.notStarted}</b>
                </div>
                <span>{Math.round((counts.notStarted / counts.all) * 100)}%</span>
              </li>
            </ul>
          </div>
          <button type="button" className="assignments-widget__link">
            View all stats <ArrowRight aria-hidden="true" />
          </button>
        </section>

        <section className="assignments-widget">
          <h2>Recent feedback</h2>
          <ul className="assignments-feedback">
            {ASSIGNMENT_FEEDBACK.map((item) => (
              <li key={item.id}>
                <span className="assignments-feedback__icon" aria-hidden="true">
                  <Check />
                </span>
                <div>
                  <b>{item.title}</b>
                  <p>{item.comment}</p>
                  <small>{item.timeAgo}</small>
                </div>
                <strong>{item.score}</strong>
              </li>
            ))}
          </ul>
          <button type="button" className="assignments-widget__link">
            View all feedback <ArrowRight aria-hidden="true" />
          </button>
        </section>
      </aside>
    </div>
  );
}
