import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  Filter,
  SlidersHorizontal,
  TrendingUp,
} from "lucide-react";
import { useStudentAssignments } from "../../../features/student/api/useStudentAssignments";
import { mapStudentAssignment } from "../../../features/student/api/studentAssignmentMapper";
import { StudentWorkNavigation } from "../../../features/student/components/StudentWorkNavigation";
import { ASSIGNMENT_ITEMS } from "./assignments.data";
import {
  EmptyState,
  AssignmentsEmptyIllustration,
} from "../EmptyState";
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

function actionLabel(status: AssignmentStatus, actionable = true) {
  if (status === "submitted") return "View submission";
  if (status === "graded") return "View feedback";
  if (!actionable) return "View details";
  if (status === "in-progress") return "Continue";
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
  const completedLen = total > 0 ? (completed / total) * circumference : 0;
  const inProgressLen = total > 0 ? (inProgress / total) * circumference : 0;
  const notStartedLen = total > 0 ? (notStarted / total) * circumference : 0;

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
  onOpenDetail,
}: {
  item: AssignmentItem;
  onOpenDetail: () => void;
}) {
  return (
    <article className="assignment-card" onClick={onOpenDetail} style={{ cursor: "pointer" }}>
      <div className="assignment-card__left">
        <span className={`assignment-card__category assignment-card__category--${item.categoryTone}`}>
          {item.category}
        </span>

        <div className="assignment-card__body">
          <div className="assignment-card__art" aria-hidden="true">
            {item.image ? <img src={item.image} alt="" /> : <span className="assignment-card__art-placeholder">A</span>}
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
        </div>

        <div className="assignment-card__stats">
          <div className="assignment-card__points">{item.points != null ? `${item.points} pts` : "Ungraded"}</div>
          {item.status === "in-progress" ? (
            <div className="assignment-card__progress">
              <i>
                <b style={{ width: `${item.progress ?? 0}%` }} />
              </i>
              <strong>{item.progress ?? 0}%</strong>
            </div>
          ) : (
            <span className="assignment-card__progress-placeholder" />
          )}
        </div>

        <button
          type="button"
          className={`assignment-card__action assignment-card__action--${item.status}`}
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail();
          }}
        >
          {actionLabel(item.status, item.actionable)}
        </button>
      </div>
    </article>
  );
}

export interface AssignmentsWorkspaceProps {
  /** DEV preview state switcher for testing empty/filtered/partial states */
  devState?: "auto" | "true-empty" | "filtered-in-progress" | "filtered-submitted" | "filtered-graded" | "partial-rail" | "populated";
}

export function AssignmentsWorkspace({ devState = "auto" }: AssignmentsWorkspaceProps) {
  const navigate = useNavigate();
  const assignmentsQuery = useStudentAssignments();
  
  // Base raw items
  const rawItems = useMemo(
    () => (assignmentsQuery.data ?? []).map((assignment) => mapStudentAssignment(assignment)),
    [assignmentsQuery.data]
  );

  // Apply dev state overrides when running in DEV mode
  const items = useMemo(() => {
    if (import.meta.env.DEV && devState !== "auto") {
      if (devState === "true-empty") return [];
      if (devState === "partial-rail") {
        // Return assignments that are not started (no deadlines, no feedback)
        return rawItems.length > 0
          ? rawItems.slice(0, 2).map((item) => ({ ...item, status: "not-started" as const, actionable: false }))
          : [
              { ...ASSIGNMENT_ITEMS[0], actionable: false, status: "not-started" as const },
              { ...ASSIGNMENT_ITEMS[1], actionable: false, status: "not-started" as const },
            ];
      }
      if (devState.startsWith("filtered-")) {
        const base = rawItems.length > 0 ? rawItems : ASSIGNMENT_ITEMS;
        const targetFilter = devState.replace("filtered-", "");
        // Filter out the selected category so it has 0 matches (filtered empty)
        return base.filter((item) => item.status !== targetFilter);
      }
    }
    return rawItems;
  }, [devState, rawItems]);

  const [filter, setFilter] = useState<AssignmentFilter>(() => {
    if (import.meta.env.DEV && devState.startsWith("filtered-")) {
      const parsed = devState.replace("filtered-", "") as AssignmentFilter;
      return parsed;
    }
    return "all";
  });

  const [sortBy, setSortBy] = useState<AssignmentSort>("due");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const handleOpenDetail = (item: AssignmentItem) => {
    navigate(`/assignments/${encodeURIComponent(item.id)}`);
  };

  const counts = useMemo(() => {
    const inProgress = items.filter((item) => item.status === "in-progress").length;
    const submitted = items.filter((item) => item.status === "submitted").length;
    const graded = items.filter((item) => item.status === "graded").length;
    const notStarted = items.filter((item) => item.status === "not-started").length;
    return {
      all: items.length,
      "in-progress": inProgress,
      submitted,
      graded,
      notStarted,
      completed: submitted + graded,
    };
  }, [items]);

  const visibleItems = useMemo(() => {
    const filtered =
      filter === "all"
        ? items
        : items.filter((item) => item.status === filter);

    const statusRank = (status: AssignmentStatus) =>
      status === "submitted" || status === "graded" ? 1 : 0;

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "points") return (b.points ?? -1) - (a.points ?? -1);
      const byOpen = statusRank(a.status) - statusRank(b.status);
      if (byOpen !== 0) return byOpen;
      return a.dueAt.localeCompare(b.dueAt);
    });

    return showAll ? sorted : sorted.slice(0, PAGE_SIZE);
  }, [filter, items, sortBy, showAll]);

  const deadlines = useMemo(
    () =>
      items
        .filter((item) => item.actionable && !item.isOverdue && item.dueAt.startsWith("2"))
        .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
        .slice(0, 4),
    [items]
  );

  const feedback = useMemo(() => {
    if (import.meta.env.DEV && devState === "partial-rail") {
      return [];
    }
    return (assignmentsQuery.data ?? []).filter((item) => item.submission?.status === "reviewed");
  }, [assignmentsQuery.data, devState]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasAny = items.length > 0;
  const hasMatches = visibleItems.length > 0;
  const totalForFilter = filter === "all" ? counts.all : counts[filter];
  const showingFrom = visibleItems.length === 0 ? 0 : 1;
  const showingTo = visibleItems.length;
  const sortLabel = SORT_OPTIONS.find((option) => option.id === sortBy)?.label ?? "Due date";

  // Filtered empty copy mapping per specification table
  const getFilteredEmptyCopy = () => {
    if (filter === "in-progress") {
      return {
        title: "Nothing in progress",
        description: "Open an assignment from the full list to get started.",
        action: "View all assignments",
      };
    }
    if (filter === "submitted") {
      return {
        title: "Nothing submitted yet",
        description: "Work you've handed in will wait here for review.",
        action: "View all assignments",
      };
    }
    if (filter === "graded") {
      return {
        title: "No grades yet",
        description: "Graded work and instructor feedback will appear here after review.",
        action: "View all assignments",
      };
    }
    return {
      title: "No matches",
      description: "Try different filters.",
      action: "Clear filters",
    };
  };

  const filteredCopy = getFilteredEmptyCopy();

  return (
    <div className={`assignments-workspace${!hasAny ? " assignments-workspace--true-empty" : ""}`}>
      <div className="assignments-main">
        {/* Toolbar region */}
        <div className="assignments-toolbar">
          <div className="assignments-toolbar__main">
            {/* Always keep the Assignments | Assessments toggle */}
            <StudentWorkNavigation />

            {/* Status pills: hidden on true empty */}
            {hasAny && (
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
            )}
          </div>

          {/* Sort & filter tools: hidden on true empty */}
          {hasAny && (
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
          )}
        </div>

        {/* Content list or empty state */}
        <div
          className={`assignments-grid${!hasAny ? " assignments-grid--empty" : ""}`}
          aria-label="Assignment list"
        >
          {assignmentsQuery.isLoading ? (
            <p role="status" className="assignments-empty-state assignments-empty-state--loading">
              Loading assignments…
            </p>
          ) : assignmentsQuery.isError ? (
            <div role="alert" className="assignments-empty-state">
              <p>
                {assignmentsQuery.error instanceof Error
                  ? assignmentsQuery.error.message
                  : "Assignments could not be loaded."}
              </p>
              <button type="button" onClick={() => void assignmentsQuery.refetch()}>
                Try again
              </button>
            </div>
          ) : !hasAny ? (
            /* True Empty Hero: Full main area centered with handcrafted illustration */
            <EmptyState
              size="page"
              illustration={<AssignmentsEmptyIllustration />}
              title="No assignments yet"
              description="When your instructors post assignments, they'll appear here with deadlines and grading status."
              actions={
                <>
                  <button
                    type="button"
                    className="gl-empty-btn gl-empty-btn--primary"
                    onClick={() => navigate("/my-courses")}
                  >
                    <BookOpen aria-hidden="true" />
                    Go to My Courses
                  </button>
                  <button
                    type="button"
                    className="gl-empty-btn gl-empty-btn--secondary"
                    onClick={() => navigate("/calendar")}
                  >
                    <CalendarDays aria-hidden="true" />
                    Open calendar
                  </button>
                </>
              }
            />
          ) : !hasMatches ? (
            /* Filtered Empty: Compact EmptyState in list region */
            <div className="assignments-filtered-empty-wrapper">
              <EmptyState
                size="card"
                icon={<Filter aria-hidden="true" />}
                title={filteredCopy.title}
                description={filteredCopy.description}
                actions={
                  <button
                    type="button"
                    className="gl-empty-btn gl-empty-btn--secondary"
                    onClick={() => {
                      setFilter("all");
                      setShowAll(false);
                    }}
                  >
                    {filteredCopy.action}
                  </button>
                }
              />
            </div>
          ) : (
            visibleItems.map((item) => (
              <AssignmentCard
                key={item.id}
                item={item}
                onOpenDetail={() => handleOpenDetail(item)}
              />
            ))
          )}
        </div>

        {/* Footer: hidden on true empty */}
        {hasAny && (
          <footer className="assignments-footer">
            <span>
              {!hasMatches
                ? `Showing 0 of ${counts.all} assignments`
                : `Showing ${showingFrom}–${showingTo} of ${totalForFilter} assignments`}
            </span>
            {hasMatches && totalForFilter > PAGE_SIZE ? (
              <button type="button" onClick={() => setShowAll((value) => !value)}>
                {showAll ? "Show fewer" : "View all assignments"} <ArrowRight aria-hidden="true" />
              </button>
            ) : null}
          </footer>
        )}
      </div>

      {/* Right Rail: unmounted completely on true empty */}
      {hasAny && (
        <aside className="assignments-rail" aria-label="Assignment insights">
          {/* Widget 1: Upcoming deadlines */}
          <section className="assignments-widget">
            <h2>Upcoming deadlines</h2>
            {deadlines.length > 0 ? (
              <ul className="assignments-deadlines">
                {deadlines.map((deadline) => (
                  <li key={deadline.id}>
                    <div>
                      <b>{deadline.title}</b>
                      <small>{deadline.dueLabel}</small>
                    </div>
                    <span className={urgencyClass(deadline.urgency)}>{deadline.relativeLabel}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                size="card"
                icon={<CalendarDays aria-hidden="true" />}
                title="No upcoming deadlines"
                description="You're all caught up."
              />
            )}
            <button
              type="button"
              className="assignments-widget__link"
              onClick={() => navigate("/calendar")}
            >
              View calendar <ArrowRight aria-hidden="true" />
            </button>
          </section>

          {/* Widget 2: Your progress */}
          <section className="assignments-widget assignments-widget--progress">
            <h2>Your progress</h2>
            {counts.all > 0 ? (
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
                    <span>{counts.all ? Math.round((counts.completed / counts.all) * 100) : 0}%</span>
                  </li>
                  <li>
                    <i className="dot dot--progress" />
                    <div>
                      In progress <b>{counts["in-progress"]}</b>
                    </div>
                    <span>{counts.all ? Math.round((counts["in-progress"] / counts.all) * 100) : 0}%</span>
                  </li>
                  <li>
                    <i className="dot dot--idle" />
                    <div>
                      Not started <b>{counts.notStarted}</b>
                    </div>
                    <span>{counts.all ? Math.round((counts.notStarted / counts.all) * 100) : 0}%</span>
                  </li>
                </ul>
              </div>
            ) : (
              <EmptyState
                size="card"
                icon={<TrendingUp aria-hidden="true" />}
                title="No assignment activity"
                description="Activity will appear as you start working."
              />
            )}
            <button
              type="button"
              className="assignments-widget__link"
              onClick={() => navigate("/profile?tab=activity")}
            >
              View all stats <ArrowRight aria-hidden="true" />
            </button>
          </section>

          {/* Widget 3: Recent feedback */}
          <section className="assignments-widget">
            <h2>Recent feedback</h2>
            {feedback.length > 0 ? (
              <ul className="assignments-feedback">
                {feedback.map((item) => (
                  <li key={item.id}>
                    <span className="assignments-feedback__icon" aria-hidden="true">
                      <Check />
                    </span>
                    <div>
                      <b>{item.title}</b>
                      <p>{item.submission?.feedback ?? "Reviewed by your instructor."}</p>
                      <small>
                        {item.submission?.submittedAt
                          ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
                              new Date(item.submission.submittedAt)
                            )
                          : ""}
                      </small>
                    </div>
                    <strong>{item.submission?.score ?? "—"}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                size="card"
                icon={<Check aria-hidden="true" />}
                title="No feedback yet"
                description="Reviewed work will show up here."
              />
            )}
            <button
              type="button"
              className="assignments-widget__link"
              disabled={feedback.length === 0}
            >
              View all feedback <ArrowRight aria-hidden="true" />
            </button>
          </section>
        </aside>
      )}
    </div>
  );
}

export default AssignmentsWorkspace;
