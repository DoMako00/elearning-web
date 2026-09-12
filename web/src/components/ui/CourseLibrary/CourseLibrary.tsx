import {
  ArrowRight,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Grid2X2,
  List,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { COURSE_CATEGORY_TABS, INITIAL_COURSES } from "./courses.data";
import "./CourseLibrary.css";

interface CourseLibraryProps {
  statusFilter?: "in-progress" | "completed" | "saved";
  searchQuery?: string;
  sortBy?: "opened" | "progress" | "title";
  bookmarked: Record<string, boolean>;
  selectedCourseId: string;
  onSelectCourse: (courseId: string) => void;
  onToggleBookmark: (courseId: string) => void;
  onClearSearch?: () => void;
}

export function CourseLibrary({
  statusFilter = "in-progress",
  searchQuery = "",
  sortBy = "opened",
  bookmarked,
  selectedCourseId,
  onSelectCourse,
  onToggleBookmark,
  onClearSearch,
}: CourseLibraryProps) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [localSearch, setLocalSearch] = useState<string>("");

  const viewportRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Combine top search and local search
  const effectiveQuery = (searchQuery || localSearch).toLowerCase().trim();

  // Filtered courses based on status tabs, categories, and search
  const filteredCourses = useMemo(() => {
    return INITIAL_COURSES.filter((course) => {
      // 1. Status Filter
      if (statusFilter === "in-progress" && course.status !== "in-progress") return false;
      if (statusFilter === "completed" && course.status !== "completed") return false;
      if (statusFilter === "saved" && !bookmarked[course.id]) return false;

      // 2. Category Filter
      if (categoryFilter !== "all" && course.categoryId !== categoryFilter) return false;

      // 3. Search query
      if (effectiveQuery) {
        return (
          course.title.toLowerCase().includes(effectiveQuery) ||
          course.category.toLowerCase().includes(effectiveQuery) ||
          course.subtitle.toLowerCase().includes(effectiveQuery) ||
          course.level.toLowerCase().includes(effectiveQuery)
        );
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === "progress") return b.progress - a.progress;
      if (sortBy === "title") return a.title.localeCompare(b.title);
      return 0;
    });
  }, [statusFilter, categoryFilter, effectiveQuery, bookmarked, sortBy]);

  const checkScroll = () => {
    if (viewportRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = viewportRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    if (viewMode === "grid") {
      checkScroll();
    }
  }, [viewMode, filteredCourses.length]);

  useEffect(() => {
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  const showPrevCourses = () => {
    if (viewportRef.current) {
      const card = viewportRef.current.querySelector<HTMLElement>(".course-library__card");
      const scrollAmount = card ? (card.offsetWidth + 16) * 1.5 : viewportRef.current.clientWidth * 0.75;
      viewportRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    }
  };

  const showNextCourses = () => {
    if (viewportRef.current) {
      const card = viewportRef.current.querySelector<HTMLElement>(".course-library__card");
      const scrollAmount = card ? (card.offsetWidth + 16) * 1.5 : viewportRef.current.clientWidth * 0.75;
      viewportRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section className={`course-library course-library--${viewMode}`} aria-labelledby="course-library-title">
      <header className="course-library__header">
        <div className="flex items-center gap-3">
          <h2 id="course-library-title">Course library</h2>
          <span className="text-xs font-semibold text-[#64748b] bg-[#f1f5f3] px-2.5 py-0.5 rounded-full">
            {filteredCourses.length} {filteredCourses.length === 1 ? "module" : "modules"}
          </span>
        </div>

        <div className="course-library__toolbar" aria-label="Course library view controls">
          {/* Explore-styled Category Buttons in the Header Toolbar */}
          <div className="course-library-categories__track" role="tablist">
            {COURSE_CATEGORY_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = categoryFilter === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`course-library-category-tab ${isActive ? "is-active" : ""}`}
                  onClick={() => setCategoryFilter(tab.id)}
                >
                  {Icon && <Icon className="course-library-category-tab__icon" aria-hidden="true" />}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="course-library__view-toggle" role="group" aria-label="Course view">
            <button
              type="button"
              className={viewMode === "grid" ? "is-active" : ""}
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
            >
              <Grid2X2 aria-hidden="true" />
            </button>
            <button
              type="button"
              className={viewMode === "list" ? "is-active" : ""}
              onClick={() => setViewMode("list")}
              aria-label="List view"
              aria-pressed={viewMode === "list"}
            >
              <List aria-hidden="true" />
            </button>
          </div>

          <label className="course-library__filter">
            <Search aria-hidden="true" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              aria-label="Search and filter courses"
              placeholder="Filter list..."
            />
            {localSearch ? (
              <button
                type="button"
                className="course-library__filter-clear"
                onClick={() => setLocalSearch("")}
                aria-label="Clear filter"
              >
                <X aria-hidden="true" />
              </button>
            ) : (
              <SlidersHorizontal aria-hidden="true" />
            )}
          </label>
        </div>
      </header>

      {filteredCourses.length === 0 ? (
        <div className="course-library__empty">
          <p>
            No courses found {effectiveQuery ? `matching "${effectiveQuery}"` : `in "${statusFilter}"`}
          </p>
          {(effectiveQuery || categoryFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch("");
                setCategoryFilter("all");
                onClearSearch?.();
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      ) : viewMode === "list" ? (
        <div className="course-library__list" role="list">
          {filteredCourses.map((course) => {
            const isSelected = selectedCourseId === course.id;
            const isSaved = !!bookmarked[course.id];

            return (
              <article
                className={`course-library__list-item transition-all cursor-pointer ${
                  isSelected ? "ring-2 ring-[#24ad68] bg-[#f7fdf9]" : ""
                }`}
                key={course.id}
                aria-label={course.title}
                onClick={() => onSelectCourse(course.id)}
              >
                <div className={`course-library__list-art course-library__art--${course.art}`}>
                  <span><course.Icon aria-hidden="true" /></span>
                </div>
                <div className="course-library__list-content">
                  <div className="course-library__list-header">
                    <h3 title={course.title}>
                      {course.title} {isSelected && <span className="text-[10px] text-[#24ad68] font-bold ml-1">● Active</span>}
                    </h3>
                    <p>{course.subtitle}</p>
                    <div className="course-library__list-tags">
                      <em>{course.category}</em>
                      <em>{course.level}</em>
                    </div>
                  </div>
                  <p className="course-library__list-opened">{course.opened}</p>
                </div>
                <div className="course-library__list-progress-wrap">
                  <div className="course-library__progress">
                    <i><b style={{ width: `${course.progress}%` }} /></i>
                    <strong>{course.progress}%</strong>
                  </div>
                </div>
                <div className="course-library__list-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className={`course-library__list-bookmark cursor-pointer ${isSaved ? "is-saved" : ""}`}
                    onClick={() => onToggleBookmark(course.id)}
                    aria-label={`Save ${course.title}`}
                  >
                    <Bookmark aria-hidden="true" className={isSaved ? "fill-current text-[#16a34a]" : ""} />
                  </button>
                  <button
                    type="button"
                    className="course-library__list-arrow cursor-pointer"
                    aria-label={`Open ${course.title}`}
                    onClick={() => navigate(`/my-courses/${course.slug}`)}
                  >
                    <ArrowRight aria-hidden="true" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="course-library__carousel">
          {canScrollLeft && (
            <button
              type="button"
              className="course-library__prev"
              onClick={showPrevCourses}
              aria-label="Show previous courses"
            >
              <ChevronLeft aria-hidden="true" />
            </button>
          )}

          <div
            ref={viewportRef}
            className="course-library__viewport"
            tabIndex={0}
            aria-label="Course library carousel"
            onScroll={checkScroll}
          >
            <div className="course-library__track">
              {filteredCourses.map((course) => {
                const isSelected = selectedCourseId === course.id;
                const isSaved = !!bookmarked[course.id];

                return (
                  <article
                    className={`course-library__card transition-all cursor-pointer ${
                      isSelected ? "ring-2 ring-[#24ad68] shadow-md" : ""
                    }`}
                    key={course.id}
                    aria-label={course.title}
                    onClick={() => onSelectCourse(course.id)}
                  >
                    <div className={`course-library__art course-library__art--${course.art}`}>
                      <img src={course.image} alt="" />
                      <span><course.Icon aria-hidden="true" /></span>
                      <div>
                        <em>{course.category}</em>
                        <em>{course.level}</em>
                      </div>
                      <button
                        type="button"
                        className={`cursor-pointer ${isSaved ? "is-bookmarked" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleBookmark(course.id);
                        }}
                        aria-label={`Save ${course.title}`}
                      >
                        <Bookmark aria-hidden="true" className={isSaved ? "fill-current text-white" : ""} />
                      </button>
                    </div>
                    <div className="course-library__card-body">
                      <div className="flex items-center justify-between">
                        <h3 title={course.title}>{course.title}</h3>
                        {isSelected && (
                          <span className="text-[10px] text-[#16a34a] font-bold bg-[#eefaf2] px-1.5 py-0.5 rounded">
                            Focusing
                          </span>
                        )}
                      </div>
                      <p>{course.subtitle}</p>
                      <div className="course-library__progress">
                        <i><b style={{ width: `${course.progress}%` }} /></i>
                        <strong>{course.progress}%</strong>
                      </div>
                      <footer>
                        <span>{course.opened}</span>
                        <button
                          type="button"
                          className="cursor-pointer"
                          aria-label={`Open ${course.title}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/my-courses/${course.slug}`);
                          }}
                        >
                          <ArrowRight aria-hidden="true" />
                        </button>
                      </footer>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {canScrollRight && filteredCourses.length > 2 && (
            <button
              type="button"
              className="course-library__next"
              onClick={showNextCourses}
              aria-label="Show more courses"
            >
              <ChevronRight aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </section>
  );
}
