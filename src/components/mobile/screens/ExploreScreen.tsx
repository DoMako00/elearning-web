import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TopAppBar } from "../TopAppBar";
import {
  HeroBand,
  MobileSearchBar,
  CategoryChipsRow,
  FeaturedPathCard,
  SectionHeader,
  TrendingRow,
  ResourceCard,
  AdvancedFilterSheet,
  EmptyState,
  type LearningPath,
  type ResourceCardData,
  type CategoryItem,
  type FilterState,
} from "../shared";
import { SlidersHorizontal, Layers } from "lucide-react";
import type { StudentCourseItem } from "../../../features/student/api/studentCoursesApi";
import { useStudentCourseList } from "../../../features/student/api/useStudentCourses";
import { useStudentLearningPaths } from "../../../features/student/api/useStudentLearning";

// Existing images from course-library, assignments, and onboarding/instructor
import myCoursesAnatomyOverlay from "../../../Assets/dashboard/my-courses-anatomy-overlay.webp";

const INITIAL_FILTERS: FilterState = {
  level: "all",
  semester: "all",
};

export const ExploreScreen: React.FC = () => {
  const navigate = useNavigate();
  const coursesQuery = useStudentCourseList("explore");
  const pathsQuery = useStudentLearningPaths();

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<FilterState>(INITIAL_FILTERS);

  const courses = coursesQuery.data ?? [];
  const levels = useMemo(() => [...new Set(courses.map((course) => course.academicLevel.title))].sort(), [courses]);
  const semesters = useMemo(() => [...new Set(courses.map((course) => course.academicSemester.title))].sort(), [courses]);
  const categories = useMemo<CategoryItem[]>(() => [
    { key: "all", label: "All" },
    ...(courses.some((course) => course.unitLabel === "Subject") ? [{ key: "subject", label: "Subjects" }] : []),
    ...(courses.some((course) => course.unitLabel === "Module") ? [{ key: "module", label: "Modules" }] : []),
  ], [courses]);
  const matchesFilters = (course: StudentCourseItem) => {
    const query = searchQuery.trim().toLowerCase();
    const searchable = [course.title, course.code, course.academicInstitution.name, course.academicLevel.title, course.academicSemester.title, course.unitLabel].join(" ").toLowerCase();
    return (!query || searchable.includes(query))
      && (activeCategory === "all" || course.unitLabel.toLowerCase() === activeCategory)
      && (advancedFilters.level === "all" || course.academicLevel.title === advancedFilters.level)
      && (advancedFilters.semester === "all" || course.academicSemester.title === advancedFilters.semester);
  };
  const filteredCourses = useMemo(() => courses.filter(matchesFilters), [courses, searchQuery, activeCategory, advancedFilters]);
  const filteredTrending = useMemo(() => [...filteredCourses].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)).slice(0, 3), [filteredCourses]);
  const filteredModules = useMemo<ResourceCardData[]>(() => filteredCourses.map((course) => ({
    id: course.courseId,
    title: course.title,
    subtitle: `${course.academicInstitution.name} · ${course.academicLevel.title} · ${course.academicSemester.title}`,
    category: course.unitLabel.toUpperCase(),
    categoryId: course.unitLabel.toLowerCase(),
    imageSrc: myCoursesAnatomyOverlay,
    lessonCount: course.lessonCount,
    canOpen: course.access.canOpen,
    slug: course.courseId,
  })), [filteredCourses]);
  const featuredPath = pathsQuery.data?.[0];
  const featuredPathCard: LearningPath | null = featuredPath ? {
    ...featuredPath,
    illustration: myCoursesAnatomyOverlay,
  } : null;
  const hasActiveAdvancedFilters = advancedFilters.level !== "all" || advancedFilters.semester !== "all";
  const isLoading = coursesQuery.isLoading || pathsQuery.isLoading;
  const loadError = coursesQuery.error ?? pathsQuery.error;
  const totalResults = filteredCourses.length;

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
      {/* 1. Fixed TopAppBar main variant */}
      <TopAppBar variant="main" />

      {/* Main scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/* 2. HeroBand: Heading + Subtitle */}
        <HeroBand
          heading="Explore"
          subtitle="Discover courses in your academic catalogue."
        />

        <div className="px-4 pb-12 space-y-5 max-w-lg mx-auto">
          {/* 3. MobileSearchBar with Filter Sliders Button */}
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <MobileSearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search courses, codes, levels, or semesters..."
              />
            </div>

            {/* Filter sheet trigger button */}
            <button
              type="button"
              onClick={() => setIsFilterSheetOpen(true)}
              aria-label="Filter resources"
              className={`p-2.5 rounded-2xl border transition-all cursor-pointer shrink-0 ${
                hasActiveAdvancedFilters
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                  : "bg-white text-slate-600 border-slate-200/90 hover:bg-slate-50"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>

          {/* 4. CategoryChipsRow (wraps to 2 rows per screenshot) */}
          <CategoryChipsRow
            categories={categories}
            activeKey={activeCategory}
            onChange={setActiveCategory}
          />

          {/* 5. FeaturedPathCard (Dark green card) */}
          {featuredPathCard && activeCategory === "all" && !searchQuery.trim() && !hasActiveAdvancedFilters && (
            <FeaturedPathCard
              path={featuredPathCard}
              onExplore={() => navigate(`/explore/paths/${featuredPathCard.id}`)}
            />
          )}

          {isLoading && <p role="status" className="py-4 text-center text-xs font-medium text-slate-500">Loading your course catalogue…</p>}
          {loadError && <p role="alert" className="py-4 text-center text-xs font-medium text-rose-700">{loadError instanceof Error ? loadError.message : "Course data could not be loaded."}</p>}

          {/* Empty State when zero results */}
          {!isLoading && !loadError && totalResults === 0 ? (
            <div className="pt-4">
              <EmptyState
                icon={<Layers className="w-6 h-6" />}
                title="No matching resources found"
                subtitle="Try adjusting your search terms, changing the category, or clearing active filters."
                action={{
                  label: "Reset All Filters",
                  onClick: () => {
                    setSearchQuery("");
                    setActiveCategory("all");
                    setAdvancedFilters(INITIAL_FILTERS);
                  },
                }}
              />
            </div>
          ) : (
            <>
              {/* 6. Recently updated Section */}
              {filteredTrending.length > 0 && (
                <section aria-label="Recently updated courses">
                  <SectionHeader title="Recently updated" />
                  <div className="space-y-2.5">
                    {filteredTrending.map((item) => (
                      <TrendingRow
                        key={item.courseId}
                        icon={<Layers className="w-5 h-5" />}
                        title={item.title}
                        subtitle={`${item.unitLabel} · ${item.academicLevel.title} · ${item.academicSemester.title}`}
                        onClick={() => navigate(`/my-courses/${item.courseId}`)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* 7. Published courses */}
              {filteredModules.length > 0 && (
                <section aria-label="Published courses">
                  <SectionHeader title="Published courses" />
                  <p className="text-xs text-slate-400 font-medium -mt-2 mb-3">
                    Course structure and access are shown from your account data.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {filteredModules.map((module) => (
                      <ResourceCard
                        key={module.id}
                        resource={module}
                        onClick={() => navigate(`/my-courses/${module.slug}`)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>

      {/* Advanced Filter Bottom Sheet */}
      <AdvancedFilterSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        filters={advancedFilters}
        levels={levels}
        semesters={semesters}
        onApply={(newFilters) => setAdvancedFilters(newFilters)}
        onReset={() => setAdvancedFilters(INITIAL_FILTERS)}
      />
    </div>
  );
};

export default ExploreScreen;
