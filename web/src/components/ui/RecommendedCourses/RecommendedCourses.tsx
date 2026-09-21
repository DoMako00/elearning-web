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

interface RecommendedCoursesProps {
  courses?: readonly StudentCourseItem[];
}

function imageForCourse(course: StudentCourseItem) {
  const source = `${course.code} ${course.title}`.toLowerCase();
  if (source.includes("bio")) return biochemistryImage;
  if (source.includes("phys")) return physiologyImage;
  if (source.includes("histo")) return histologyImage;
  return anatomyImage;
}

function orderedCourses(courses: readonly StudentCourseItem[]) {
  return [...courses].sort((a, b) => {
    const aIsBio = /bio|biochem/i.test(`${a.code} ${a.title}`);
    const bIsBio = /bio|biochem/i.test(`${b.code} ${b.title}`);
    if (aIsBio !== bIsBio) return aIsBio ? -1 : 1;
    return a.title.localeCompare(b.title);
  });
}

export function RecommendedCourses({ courses = [] }: RecommendedCoursesProps) {
  const navigate = useNavigate();
  const displayCourses = useMemoSafeCourses(courses);
  const [bookmarkedCourses, setBookmarkedCourses] = useState<Record<string, boolean>>({});
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(displayCourses.length > 2);
  const rowRef = useRef<HTMLDivElement>(null);
  const { toastMessage, showToast } = useToast();

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

  const toggleBookmark = (title: string, e?: MouseEvent) => {
    e?.stopPropagation();
    const isCurrentlyBookmarked = !!bookmarkedCourses[title];
    setBookmarkedCourses((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
    showToast(isCurrentlyBookmarked ? `Removed "${title}" from saved subjects` : `"${title}" saved`);
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

  return (
    <section className="recommended-card" aria-labelledby="recommended-title">
      <ToastNotification message={toastMessage} />
      <header className="recommended-header">
        <h2 id="recommended-title">Your Elite Year 1 Subjects</h2>
        <button type="button" className="recommended-view-all cursor-pointer" onClick={() => navigate("/my-courses")}>
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
          {displayCourses.map((course) => {
            const isBookmarked = !!bookmarkedCourses[course.title];
            const subtitle = `${course.academicInstitution.name} • ${course.academicLevel.title} • ${course.academicSemester.title}`;
            return (
              <article
                className="recommended-course cursor-pointer transition-all hover:shadow-md"
                key={course.courseId}
                onClick={() => navigate(`/my-courses/${course.courseId}`)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") navigate(`/my-courses/${course.courseId}`);
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
                    onClick={(e) => toggleBookmark(course.title, e)}
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
