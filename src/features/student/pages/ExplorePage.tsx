import { Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  ExploreCategories,
  ExploreCourses,
  ExploreDirections,
  ExploreHero,
  ExploreTrending,
  type ExploreCourse,
} from "../../../components/ui/Explore";
import { useStudentCourseList } from "../api/useStudentCourses";
import { useStudentLearningPath, useStudentLearningPaths, useStudentSavedCourses, useToggleStudentSavedCourse } from "../api/useStudentLearning";
import "../../../components/ui/Explore/Explore.css";

export function ExplorePage() {
  const { slug: learningPathId } = useParams<{ slug?: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeSemester, setActiveSemester] = useState<number | null>(null);
  const coursesQuery = useStudentCourseList("explore");
  const pathsQuery = useStudentLearningPaths();
  const pathQuery = useStudentLearningPath(learningPathId);
  const savedCoursesQuery = useStudentSavedCourses();
  const toggleSavedCourse = useToggleStudentSavedCourse();

  const courses = useMemo<ExploreCourse[]>(() => (coursesQuery.data ?? []).map((course, index) => {
    const artTypes: ExploreCourse["artType"][] = ["anatomy", "histology", "physiology", "biochemistry", "neuroscience", "pharmacology", "pathology"];
    const isSubject = course.unitLabel === "Subject";
    return {
      id: course.courseId,
      title: course.title,
      code: course.code,
      category: isSubject ? "SUBJECT" : "MODULE",
      categoryId: isSubject ? "subject" : "module",
      level: course.academicLevel.title,
      semester: course.academicSemester.title,
      semesterNumber: course.academicSemester.semesterNumber,
      lessonCount: course.lessonCount,
      updatedAt: course.updatedAt,
      canOpen: course.access.canOpen,
      artType: artTypes[index % artTypes.length]!,
    };
  }), [coursesQuery.data]);
  const selectedPath = learningPathId ? pathQuery.data?.path ?? null : pathsQuery.data?.[0] ?? null;
  const visibleCourses = useMemo(() => {
    if (!learningPathId) return courses;
    const pathCourseIds = new Set(pathQuery.data?.courses.map((course) => course.courseId) ?? []);
    return courses.filter((course) => pathCourseIds.has(course.id));
  }, [courses, learningPathId, pathQuery.data]);

  const filteredCourses = useMemo(() => {
    return visibleCourses.filter((course) => {
      if (activeCategory !== "all" && course.categoryId !== activeCategory) {
        return false;
      }
      if (activeSemester !== null && course.semesterNumber !== activeSemester) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          course.title.toLowerCase().includes(q) ||
          course.code.toLowerCase().includes(q) ||
          course.category.toLowerCase().includes(q) ||
          course.level.toLowerCase().includes(q) ||
          course.semester.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activeCategory, activeSemester, searchQuery, visibleCourses]);
  const categories = useMemo(() => [
    { id: "all" as const, label: "All" },
    ...(visibleCourses.some((course) => course.categoryId === "subject") ? [{ id: "subject" as const, label: "Subjects" }] : []),
    ...(visibleCourses.some((course) => course.categoryId === "module") ? [{ id: "module" as const, label: "Modules" }] : []),
  ], [visibleCourses]);
  const directions = useMemo(() => {
    const bySemester = new Map<number, ExploreCourse>();
    for (const course of visibleCourses) if (!bySemester.has(course.semesterNumber)) bySemester.set(course.semesterNumber, course);
    const themes = ["green", "purple", "blue"] as const;
    return [...bySemester.entries()].sort(([left], [right]) => left - right).map(([semesterNumber, course], index) => ({
      id: `${course.id}-semester-${semesterNumber}`,
      title: course.semester,
      subtitle: `${course.level} · ${course.category.toLowerCase()} catalogue`,
      semesterNumber,
      colorTheme: themes[index % themes.length]!,
    }));
  }, [visibleCourses]);
  const recentlyUpdated = useMemo(() => [...visibleCourses].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3), [visibleCourses]);
  const savedCourseIds = savedCoursesQuery.data ? savedCoursesQuery.data.map((course) => course.courseId) : null;
  const pageLoading = coursesQuery.isLoading || (learningPathId ? pathQuery.isLoading : pathsQuery.isLoading);
  const pageError = learningPathId ? pathQuery.error : pathsQuery.error;

  return (
    <section className="student-page student-page--explore" aria-labelledby="explore-title">
      <div className="explore-workspace">
        <header className="explore-toolbar">
          {/* <div className="student-page-intro">
            <span>Discover</span>
            <h1 id="explore-title">Explore</h1>
            <p>Find the next skill worth building.</p>
          </div> */}

          <div className="explore-toolbar__tools">
            <div className="explore-search-bar">
              <Search aria-hidden="true" />
              <input
                type="text"
                placeholder="Search your published courses…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search published courses"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="explore-search-bar__clear"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  <X aria-hidden="true" />
                </button>
              )}
            </div>

            <button
              type="button"
              className="explore-filter-btn"
              aria-label="Filter options"
            >
              <SlidersHorizontal className="size-4" aria-hidden="true" />
            </button>

            <span className="explore-courses-count">
              {`${filteredCourses.length} courses`}
            </span>
          </div>
        </header>

        {(pageError || coursesQuery.error || savedCoursesQuery.error || toggleSavedCourse.error) && (
          <p role="alert" className="explore-data-message">
            {pageError instanceof Error ? pageError.message : coursesQuery.error instanceof Error ? coursesQuery.error.message : savedCoursesQuery.error instanceof Error ? savedCoursesQuery.error.message : toggleSavedCourse.error instanceof Error ? toggleSavedCourse.error.message : "Some catalogue data could not be loaded."}
          </p>
        )}
        {pageLoading && <p role="status" className="explore-data-message">Loading published course data…</p>}

        <div className="explore-top-section">
          <ExploreHero path={selectedPath} />
          <div className="explore-aside">
            <ExploreTrending
              courses={recentlyUpdated}
              onSelectTopic={(course) => setSearchQuery(course.title)}
            />
            <ExploreDirections
              items={directions}
              selectedSemester={activeSemester}
              onSelectDirection={(semesterNumber) => setActiveSemester(semesterNumber === 0 ? null : semesterNumber)}
            />
          </div>
        </div>

        <ExploreCategories
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          categories={categories}
        />

        <ExploreCourses
          courses={filteredCourses}
          savedCourseIds={savedCourseIds}
          saving={toggleSavedCourse.isPending || savedCoursesQuery.isLoading || savedCoursesQuery.isError}
          onToggleSaved={(courseId, saved) => toggleSavedCourse.mutate({ courseId, saved })}
          searchQuery={searchQuery}
          loading={pageLoading || coursesQuery.isLoading}
          error={coursesQuery.error instanceof Error ? coursesQuery.error.message : undefined}
          onClearSearch={() => {
            setSearchQuery("");
            setActiveCategory("all");
            setActiveSemester(null);
          }}
        />
      </div>
    </section>
  );
}
