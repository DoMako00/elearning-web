import { useEffect, useRef, useState, type MouseEvent } from "react";
import {
  ArrowRight,
  Bookmark,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import anatomyImage from "../../../Assets/dashboard/human-anatomy.webp";
import histologyImage from "../../../Assets/dashboard/histology-basics.webp";
import physiologyImage from "../../../Assets/dashboard/medical-physiology.webp";
import biochemistryImage from "../../../Assets/dashboard/biochemistry-essentials.webp";
import "./RecommendedCourses.css";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../../hooks/useToast";
import { ToastNotification } from "../ToastNotification";
import type { StudentCourseItem } from "../../../features/student/api/studentCoursesApi";
import { useStudentSavedCourses, useToggleStudentSavedCourse } from "../../../features/student/api/useStudentLearning";

interface RecommendedCoursesProps {
  courses?: readonly StudentCourseItem[];
  loading?: boolean;
  error?: boolean;
}

function isEnrolledCourse(course: StudentCourseItem) {
  return course.access?.isEnrolled === true;
}

/** Opening is decided only by the server's access.canOpen flag. */
function canOpenCourse(course: StudentCourseItem) {
  return course.access?.canOpen === true;
}

function imageForCourse(course: StudentCourseItem) {
  const source = `${course.code} ${course.title}`.toLowerCase();
  if (source.includes("bio")) return biochemistryImage;
  if (source.includes("phys")) return physiologyImage;
  if (source.includes("histo")) return histologyImage;
  return anatomyImage;
}

// No relevance model exists, so courses are listed in a neutral order
// (by semester, then title) instead of an invented ranking.
function orderedCourses(courses: readonly StudentCourseItem[]) {
  return [...courses].sort((a, b) =>
    (a.academicSemester?.semesterNumber ?? 0) - (b.academicSemester?.semesterNumber ?? 0)
    || a.title.localeCompare(b.title));
}

export function RecommendedCourses({ courses = [], loading = false, error = false }: RecommendedCoursesProps) {
  const navigate = useNavigate();
  const displayCourses = useMemoSafeCourses(courses).filter((course) => !isEnrolledCourse(course));
  const savedCoursesQuery = useStudentSavedCourses();
  const toggleSavedCourse = useToggleStudentSavedCourse();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(displayCourses.length > 2);
  const rowRef = useRef<HTMLDivElement>(null);
  const { toastMessage, toastTone, showToast } = useToast();

  const checkScroll = () => {
    if (rowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [displayCourses.length]);

  const toggleBookmark = (course: StudentCourseItem, saved: boolean, e?: MouseEvent) => {
    e?.stopPropagation();
    toggleSavedCourse.mutate({ courseId: course.courseId, saved }, {
      onSuccess: () => showToast(saved ? `Saved "${course.title}"` : `Removed "${course.title}" from saved courses`),
      onError: (error) => showToast(error.message || "Saved courses could not be updated.", "error"),
    });
  };

  const handleScrollPrev = () => {
    if (rowRef.current) {
      const container = rowRef.current;
      const courseCard = container.querySelector<HTMLElement>(".recommended-course");
      const scrollAmount = courseCard ? (courseCard.offsetWidth + 14) * 2 : container.clientWidth * 0.75;
      container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    }
  };

  const handleScrollNext = () => {
    if (rowRef.current) {
      const container = rowRef.current;
      const courseCard = container.querySelector<HTMLElement>(".recommended-course");
      const scrollAmount = courseCard ? (courseCard.offsetWidth + 14) * 2 : container.clientWidth * 0.75;
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const openOrExplain = (course: StudentCourseItem) => {
    if (canOpenCourse(course)) {
      navigate(`/my-courses/${encodeURIComponent(course.courseId)}`, { state: { courseTitle: course.title, courseId: course.courseId } });
      return;
    }
    showLockedSubjectMessage(course.title);
  };

  const showLockedSubjectMessage = (title: string) => {
    showToast(`"${title}" is recommended. Subscribe or get enrolled before opening its lessons.`, "info");
  };

  return (
    <section className="recommended-card" aria-labelledby="recommended-title">
      <ToastNotification message={toastMessage} tone={toastTone} />
      <header className="recommended-header">
        <h2 id="recommended-title">Recommended subjects</h2>
        <button type="button" className="recommended-view-all cursor-pointer" onClick={() => navigate("/explore")}>
          <span>View all</span>
          <ArrowRight aria-hidden="true" />
        </button>
      </header>

      <div className="recommended-carousel-wrap">
        {canScrollLeft && (
          <button
            type="button"
            onClick={handleScrollPrev}
            className="recommended-prev"
            aria-label="Show previous subjects"
          >
            <ChevronLeft aria-hidden="true" />
          </button>
        )}

        <div className="recommended-row" ref={rowRef} onScroll={checkScroll}>
          {loading ? <p className="recommended-state" role="status">Loading recommended courses…</p> : null}
          {!loading && error ? <p className="recommended-state" role="alert">Recommended courses could not be loaded.</p> : null}
          {!loading && !error && displayCourses.length === 0 ? <p className="recommended-state" role="status">No recommended courses are available for your placement yet.</p> : null}
          {!loading && !error && displayCourses.map((course) => {
            const isBookmarked = savedCoursesQuery.data?.some((savedCourse) => savedCourse.courseId === course.courseId) ?? false;
            const subtitle = `${course.academicInstitution.name} • ${course.academicLevel.title} • ${course.academicSemester.title}`;
            return (
              <article
                className="recommended-course cursor-pointer transition-all hover:shadow-md"
                key={course.courseId}
                onClick={() => openOrExplain(course)}
                tabIndex={0}
                role="link"
                aria-label={canOpenCourse(course) ? `Open ${course.title}` : `${course.title} (not enrolled)`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openOrExplain(course); }
                }}
              >
                <div className="recommended-course-media">
                  <img
                    src={imageForCourse(course)}
                    alt={`${course.title} subject illustration`}
                    loading="lazy"
                    decoding="async"
                  />
                  <button
                    type="button"
                    onClick={(e) => toggleBookmark(course, !isBookmarked, e)}
                    disabled={savedCoursesQuery.isLoading || savedCoursesQuery.isError || toggleSavedCourse.isPending}
                    className={`recommended-bookmark ${isBookmarked ? "recommended-bookmark--active" : ""}`}
                    aria-label={isBookmarked ? `Remove bookmark for ${course.title}` : `Bookmark ${course.title}`}
                    aria-pressed={isBookmarked}
                    data-bookmarked={isBookmarked}
                  >
                    <Bookmark className={isBookmarked ? "fill-current" : ""} aria-hidden="true" />
                  </button>
                </div>
                <div className="recommended-course-copy">
                  <div className="recommended-title-wrap">
                    <h3 title={course.title}>{course.title}</h3>
                  </div>
                  <p className="recommended-course-subtitle" title={subtitle}>{subtitle}</p>
                  <div className="recommended-course-footer">
                    <span className="recommended-course-level" title={course.unitLabel}>
                      {course.unitLabel}
                    </span>
                    <span className="recommended-course-separator" aria-hidden="true">•</span>
                    <span className="recommended-course-lessons">{course.lessonCount} Lessons</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {canScrollRight && (
          <button
            type="button"
            onClick={handleScrollNext}
            className="recommended-next"
            aria-label="Show more subjects"
          >
            <ChevronRight aria-hidden="true" />
          </button>
        )}
      </div>
    </section>
  );
}

function useMemoSafeCourses(courses: readonly StudentCourseItem[]) {
  const [ordered, setOrdered] = useState<StudentCourseItem[]>(() => orderedCourses(courses));

  useEffect(() => {
    setOrdered(orderedCourses(courses));
  }, [courses]);

  return ordered;
}
