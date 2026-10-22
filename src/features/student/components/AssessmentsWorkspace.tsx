import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  Filter,
  SlidersHorizontal,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { studentAssessmentApi, type StudentAssessmentDto } from "../api/studentAssessmentApi";
import { StudentWorkNavigation } from "./StudentWorkNavigation";
import { EmptyState, AssessmentsEmptyIllustration } from "../../../components/ui/EmptyState";
import "../../../components/ui/Assignments/Assignments.css";
import "./AssessmentsWorkspace.css";

type AssessmentFilter = "all" | "available" | "in-progress" | "completed" | "upcoming" | "closed";
type AssessmentSort = "availability" | "title" | "duration";

const PAGE_SIZE = 6;

const FILTERS: { id: AssessmentFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "available", label: "Available" },
  { id: "in-progress", label: "In progress" },
  { id: "completed", label: "Completed" },
  { id: "upcoming", label: "Upcoming" },
  { id: "closed", label: "Unavailable" },
];

const SORT_OPTIONS: { id: AssessmentSort; label: string }[] = [
  { id: "availability", label: "Availability" },
  { id: "title", label: "Title A–Z" },
  { id: "duration", label: "Time limit" },
];

function isCompleted(item: StudentAssessmentDto) {
  return item.latestAttempt?.status === "submitted" || item.latestAttempt?.status === "scored";
}

function getFilterForItem(item: StudentAssessmentDto): Exclude<AssessmentFilter, "all"> {
  if (item.latestAttempt?.status === "in_progress") return "in-progress";
  if (isCompleted(item)) return "completed";
  if (item.status === "available" && item.attemptsUsed >= item.attemptsAllowed) return "closed";
  return item.status;
}

function formatDate(value: string | null, includeTime = true) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    ...(includeTime ? { timeStyle: "short" as const } : {}),
  }).format(date);
}

function availabilityLabel(item: StudentAssessmentDto) {
  if (item.status === "upcoming") {
    const opensAt = formatDate(item.availableFrom);
    return opensAt ? `Opens ${opensAt}` : "Upcoming";
  }
  if (item.status === "closed") {
    const closedAt = formatDate(item.availableUntil);
    return closedAt ? `Closed ${closedAt}` : "Availability closed";
  }
  const closesAt = formatDate(item.availableUntil);
  return closesAt ? `Closes ${closesAt}` : "Available now";
}

function statusLabel(item: StudentAssessmentDto) {
  if (item.latestAttempt?.status === "in_progress") return "In progress";
  if (item.latestAttempt?.status === "scored") return "Scored";
  if (item.latestAttempt?.status === "submitted") return "Submitted";
  if (item.status === "upcoming") return "Upcoming";
  if (item.status === "closed") return "Closed";
  if (item.attemptsUsed >= item.attemptsAllowed) return "No attempts left";
  return "Available";
}

function statusClass(item: StudentAssessmentDto) {
  if (item.latestAttempt?.status === "in_progress") return "in-progress";
  if (item.latestAttempt?.status === "scored") return "graded";
  if (item.latestAttempt?.status === "submitted") return "submitted";
  if (item.status === "available" && item.attemptsUsed >= item.attemptsAllowed) return "not-started";
  if (item.status === "available") return "in-progress";
  return "not-started";
}

function assessmentAction(item: StudentAssessmentDto) {
  if (item.latestAttempt?.status === "in_progress") return "Resume assessment";
  if (item.status === "available" && item.attemptsUsed < item.attemptsAllowed) {
    return isCompleted(item) ? "Start next attempt" : item.latestAttempt?.status === "expired" ? "Retry assessment" : "Start assessment";
  }
  if (isCompleted(item)) return "View result";
  if (item.status === "upcoming") return "Opens soon";
  if (item.status === "closed") return "Assessment closed";
  return "No attempts left";
}

function canOpenAssessment(item: StudentAssessmentDto) {
  return item.latestAttempt?.status === "in_progress"
    || isCompleted(item)
    || (item.status === "available" && item.attemptsUsed < item.attemptsAllowed);
}

function availabilityTimestamp(item: StudentAssessmentDto) {
  const value = item.status === "upcoming" ? item.availableFrom : item.availableUntil ?? item.availableFrom;
  const time = value ? new Date(value).getTime() : Number.MAX_SAFE_INTEGER;
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
}

function AssessmentProgressDonut({
  completed,
  inProgress,
  other,
  total,
}: {
  completed: number;
  inProgress: number;
  other: number;
  total: number;
}) {
  const radius = 54;
  const stroke = 12;
  const circumference = 2 * Math.PI * radius;
  const completedLen = total > 0 ? (completed / total) * circumference : 0;
  const inProgressLen = total > 0 ? (inProgress / total) * circumference : 0;
  const otherLen = total > 0 ? (other / total) * circumference : 0;

  return (
    <svg className="assignments-donut" viewBox="0 0 140 140" aria-hidden="true">
      <g transform="rotate(-90 70 70)">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#eef3f0" strokeWidth={stroke} />
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#20a862" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${completedLen} ${circumference}`} />
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#7ee0b0" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${inProgressLen} ${circumference}`} strokeDashoffset={-completedLen} />
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#d5ddd8" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${otherLen} ${circumference}`} strokeDashoffset={-(completedLen + inProgressLen)} />
      </g>
      <text x="70" y="66" textAnchor="middle" className="assignments-donut__value">{total}</text>
      <text x="70" y="84" textAnchor="middle" className="assignments-donut__label">Total</text>
    </svg>
  );
}

function AssessmentCard({ item }: { item: StudentAssessmentDto }) {
  const completed = isCompleted(item);
  const actionable = canOpenAssessment(item);
  const Icon = item.kind === "exam" ? ClipboardList : ClipboardCheck;
  const categoryTone = item.kind === "exam" ? "purple" : "green";
  const cardContent = (
    <>
      <div className="assignment-card__left">
        <span className={`assignment-card__category assignment-card__category--${categoryTone}`}>
          {item.kind}
        </span>
        <div className="assignment-card__body">
          <div className="assignment-card__art assessment-card__art" aria-hidden="true"><Icon /></div>
          <div className="assignment-card__info">
            <h3>{item.title}</h3>
            <p>{item.courseTitle ?? "Course details unavailable"}</p>
            <div className="assignment-card__meta">
              <span className="assignment-card__due">
                {item.status === "upcoming" || item.status === "closed" ? <CalendarDays aria-hidden="true" /> : <Clock3 aria-hidden="true" />}
                {availabilityLabel(item)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="assignment-card__right assessment-card__right">
        <div className="assignment-card__header">
          <span className={`assignment-card__status assignment-card__status--${statusClass(item)}`}>
            {statusLabel(item)}
          </span>
        </div>
        <div className="assessment-card__attempts">
          {completed && item.latestAttempt?.score !== null && item.latestAttempt?.score !== undefined
            ? `Score: ${item.latestAttempt.score}`
            : `${item.attemptsUsed}/${item.attemptsAllowed} attempts`}
          {item.timeLimitSeconds ? <small>{Math.round(item.timeLimitSeconds / 60)} min time limit</small> : null}
        </div>
        {actionable ? (
          <Link className={`assignment-card__action assessment-card__action${completed ? " assignment-card__action--graded" : ""}`} to={`/assessments/${encodeURIComponent(item.id)}`}>
            {assessmentAction(item)}
          </Link>
        ) : (
          <button type="button" className="assignment-card__action assessment-card__action" disabled>
            {assessmentAction(item)}
          </button>
        )}
      </div>
    </>
  );

  return <article className="assignment-card assessment-assignment-card">{cardContent}</article>;
}

export interface AssessmentsWorkspaceProps {
  devState?: "auto" | "true-empty" | "filtered-empty" | "partial-rail" | "populated";
}

export function AssessmentsWorkspace({ devState = "auto" }: AssessmentsWorkspaceProps) {
  const navigate = useNavigate();
  const auth = useAuth();
  const query = useQuery({
    queryKey: ["student", "assessments"],
    queryFn: ({ signal }) => studentAssessmentApi.list(signal),
    enabled: auth.status === "authenticated",
  });

  const rawItems = query.data ?? [];
  const items = useMemo(() => {
    if (import.meta.env.DEV && devState !== "auto") {
      if (devState === "true-empty") return [];
      if (devState === "partial-rail") {
        return rawItems.length > 0
          ? rawItems.slice(0, 2).map((item) => ({ ...item, status: "closed" as const }))
          : [];
      }
    }
    return rawItems;
  }, [devState, rawItems]);

  const [filter, setFilter] = useState<AssessmentFilter>("all");
  const [sortBy, setSortBy] = useState<AssessmentSort>("availability");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const counts = useMemo(() => {
    const result: Record<AssessmentFilter, number> = {
      all: items.length,
      available: 0,
      "in-progress": 0,
      completed: 0,
      upcoming: 0,
      closed: 0,
    };
    for (const item of items) result[getFilterForItem(item)] += 1;
    return result;
  }, [items]);

  const sortedItems = useMemo(() => {
    const filtered = filter === "all" ? items : items.filter((item) => getFilterForItem(item) === filter);
    return [...filtered].sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "duration") return (a.timeLimitSeconds ?? Number.MAX_SAFE_INTEGER) - (b.timeLimitSeconds ?? Number.MAX_SAFE_INTEGER);
      const priority = (item: StudentAssessmentDto) => {
        if (item.latestAttempt?.status === "in_progress") return 0;
        if (item.status === "available" && canOpenAssessment(item)) return 1;
        if (item.status === "upcoming") return 2;
        return 3;
      };
      return priority(a) - priority(b) || availabilityTimestamp(a) - availabilityTimestamp(b) || a.title.localeCompare(b.title);
    });
  }, [filter, items, sortBy]);

  const visibleItems = showAll ? sortedItems : sortedItems.slice(0, PAGE_SIZE);
  const upcomingItems = useMemo(
    () => items.filter((item) => item.status === "upcoming" || (item.status === "available" && canOpenAssessment(item)))
      .sort((a, b) => availabilityTimestamp(a) - availabilityTimestamp(b))
      .slice(0, 4),
    [items],
  );
  const results = useMemo(
    () => items.filter(isCompleted).sort((a, b) => {
      const aAt = a.latestAttempt?.submittedAt ? new Date(a.latestAttempt.submittedAt).getTime() : 0;
      const bAt = b.latestAttempt?.submittedAt ? new Date(b.latestAttempt.submittedAt).getTime() : 0;
      return bAt - aAt;
    }).slice(0, 4),
    [items],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) setIsSortOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasAny = items.length > 0;
  const hasMatches = visibleItems.length > 0;
  const completedCount = counts.completed;
  const inProgressCount = counts["in-progress"];
  const otherCount = Math.max(0, counts.all - completedCount - inProgressCount);
  const totalForFilter = counts[filter];
  const showingFrom = visibleItems.length === 0 ? 0 : 1;
  const showingTo = visibleItems.length;
  const sortLabel = SORT_OPTIONS.find((option) => option.id === sortBy)?.label ?? "Availability";

  return (
    <div className={`assignments-workspace assessments-workspace${!hasAny ? " assignments-workspace--true-empty" : ""}`}>
      <div className="assignments-main">
        <h1 id="assessments-title" className="assessment-sr-only">Assessments</h1>
        <div className="assignments-toolbar">
          <div className="assignments-toolbar__main">
            {/* Always keep the Assignments | Assessments toggle */}
            <StudentWorkNavigation />

            {/* Status pills: hidden on true empty */}
            {hasAny && (
              <div className="assignments-filters" role="tablist" aria-label="Assessment status">
                {FILTERS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    role="tab"
                    aria-selected={filter === option.id}
                    className={`assignments-filter${filter === option.id ? " is-active" : ""}`}
                    onClick={() => { setFilter(option.id); setShowAll(false); }}
                  >
                    {option.label} <b>({counts[option.id]})</b>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort & filter tools: hidden on true empty */}
          {hasAny && (
            <div className="assignments-toolbar__tools">
              <div className="assessment-sort-wrap relative" ref={sortRef}>
                <button type="button" className="assignments-sort" aria-haspopup="listbox" aria-expanded={isSortOpen} onClick={() => setIsSortOpen((open) => !open)}>
                  Sort by: {sortLabel}<ChevronDown aria-hidden="true" className={isSortOpen ? "rotate-180" : ""} />
                </button>
                {isSortOpen ? (
                  <ul className="assignments-sort-menu" role="listbox" aria-label="Sort assessments">
                    {SORT_OPTIONS.map((option) => (
                      <li key={option.id}>
                        <button type="button" role="option" aria-selected={sortBy === option.id} className={sortBy === option.id ? "is-active" : ""} onClick={() => { setSortBy(option.id); setIsSortOpen(false); }}>
                          {option.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <button type="button" className="assignments-filter-icon" aria-label="Assessment filters are not available yet" title="Assessment filters are not available yet" disabled>
                <SlidersHorizontal aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        <div className={`assignments-grid${!hasAny ? " assignments-grid--empty" : ""}`} aria-label="Assessment list">
          {query.isLoading ? (
            <p role="status" className="assignments-empty-state">Loading assessments…</p>
          ) : query.isError ? (
            <div role="alert" className="assignments-empty-state">
              <p>{query.error instanceof Error ? query.error.message : "Assessments could not be loaded."}</p>
              <button type="button" onClick={() => void query.refetch()}>Try again</button>
            </div>
          ) : !hasAny ? (
            /* True Empty Hero for Assessments */
            <EmptyState
              size="page"
              illustration={<AssessmentsEmptyIllustration />}
              title="No assessments yet"
              description="Quizzes and exams from your courses will appear here once they're scheduled."
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
            /* Filtered Empty */
            <div className="assignments-filtered-empty-wrapper">
              <EmptyState
                size="card"
                icon={<Filter aria-hidden="true" />}
                title="No matches"
                description="Try different filters."
                actions={
                  <button
                    type="button"
                    className="gl-empty-btn gl-empty-btn--secondary"
                    onClick={() => {
                      setFilter("all");
                      setShowAll(false);
                    }}
                  >
                    View all assessments
                  </button>
                }
              />
            </div>
          ) : (
            visibleItems.map((item) => <AssessmentCard key={item.id} item={item} />)
          )}
        </div>

        {/* Footer: hidden on true empty */}
        {hasAny && (
          <footer className="assignments-footer">
            <span>
              {!hasMatches
                ? `Showing 0 of ${counts.all} assessments`
                : `Showing ${showingFrom}–${showingTo} of ${totalForFilter} assessments`}
            </span>
            {hasMatches && totalForFilter > PAGE_SIZE ? (
              <button type="button" onClick={() => setShowAll((value) => !value)}>
                {showAll ? "Show fewer" : "View all assessments"} <ArrowRight aria-hidden="true" />
              </button>
            ) : null}
          </footer>
        )}
      </div>

      {/* Right Rail: unmounted on true empty */}
      {hasAny && (
        <aside className="assignments-rail" aria-label="Assessment insights">
          <section className="assignments-widget">
            <h2>Upcoming assessments</h2>
            {upcomingItems.length > 0 ? (
              <ul className="assignments-deadlines">
                {upcomingItems.map((item) => (
                  <li key={item.id}>
                    <span className="assessment-insight-icon" aria-hidden="true">{item.kind === "exam" ? <ClipboardList /> : <ClipboardCheck />}</span>
                    <div><b>{item.title}</b><small>{availabilityLabel(item)}</small></div>
                    <span className={`assignments-urgency ${item.status === "available" ? "assignments-urgency--done" : "assignments-urgency--later"}`}>
                      {item.latestAttempt?.status === "in_progress" ? "Resume" : item.status === "available" ? "Open" : "Upcoming"}
                    </span>
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
            <Link className="assignments-widget__link" to="/calendar">View calendar <ArrowRight aria-hidden="true" /></Link>
          </section>

          <section className="assignments-widget assignments-widget--progress">
            <h2>Your progress</h2>
            {counts.all > 0 ? (
              <div className="assignments-progress">
                <AssessmentProgressDonut completed={completedCount} inProgress={inProgressCount} other={otherCount} total={counts.all} />
                <ul>
                  <li><i className="dot dot--completed" /><div>Completed <b>{completedCount}</b></div><span>{counts.all ? Math.round((completedCount / counts.all) * 100) : 0}%</span></li>
                  <li><i className="dot dot--progress" /><div>In progress <b>{inProgressCount}</b></div><span>{counts.all ? Math.round((inProgressCount / counts.all) * 100) : 0}%</span></li>
                  <li><i className="dot dot--idle" /><div>Other <b>{otherCount}</b></div><span>{counts.all ? Math.round((otherCount / counts.all) * 100) : 0}%</span></li>
                </ul>
              </div>
            ) : (
              <EmptyState
                size="card"
                icon={<SlidersHorizontal aria-hidden="true" />}
                title="No assessment activity"
                description="Activity will appear as you start working."
              />
            )}
            <span className="assessment-progress-note">Based on assessment attempts recorded by your account.</span>
          </section>

          <section className="assignments-widget">
            <h2>Latest results</h2>
            {results.length > 0 ? (
              <ul className="assignments-feedback">
                {results.map((item) => (
                  <li key={item.id}>
                    <span className="assignments-feedback__icon" aria-hidden="true"><Check /></span>
                    <div>
                      <b>{item.title}</b>
                      <p>{item.latestAttempt?.status === "scored" ? "Scored assessment" : "Submitted for review"}</p>
                      <small>{formatDate(item.latestAttempt?.submittedAt ?? null, false) ?? "Submission date unavailable"}</small>
                    </div>
                    <strong>{item.latestAttempt?.score ?? "—"}</strong>
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
            <span className="assignments-widget__link assessment-static-link">Scores appear after an attempt is submitted.</span>
          </section>
        </aside>
      )}
    </div>
  );
}
