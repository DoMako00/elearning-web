import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TopAppBar } from "../TopAppBar";
import {
  HeroBand,
  MobileSearchBar,
  StatusFilterTabs,
  CourseCard,
  BottomSheet,
  EmptyState,
  type CourseCardData,
} from "../shared";
import { Clock, ChevronDown, Check, BookOpen, Sparkles } from "lucide-react";
import { useSavedItems } from "../../../state/useSavedItems";

import { SHARED_COURSES_DATA } from "../data/courses.data";

const MY_COURSES_DATA: CourseCardData[] = SHARED_COURSES_DATA;

type FilterTabKey = "in-progress" | "completed" | "saved";
type SortOptionKey = "opened" | "progress" | "title";

const SORT_OPTIONS: { key: SortOptionKey; label: string }[] = [
  { key: "opened", label: "Last opened" },
  { key: "progress", label: "Progress %" },
  { key: "title", label: "Title (A–Z)" },
];

export const MyCoursesScreen: React.FC = () => {
  const navigate = useNavigate();
  const { isSaved, getSavedCountByType } = useSavedItems();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTabKey>("in-progress");
  const [sortBy, setSortBy] = useState<SortOptionKey>("opened");
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false);

  // Counts derived from data and saved items store
  const inProgressCount = useMemo(
    () => MY_COURSES_DATA.filter((c) => c.status === "IN PROGRESS").length,
    []
  );
  const completedCount = useMemo(
    () => MY_COURSES_DATA.filter((c) => c.status === "COMPLETED").length,
    []
  );
  const savedCount = getSavedCountByType("course");

  const filterTabs = [
    { key: "in-progress", label: "In progress", count: inProgressCount },
    { key: "completed", label: "Completed", count: completedCount },
    { key: "saved", label: "Saved", count: savedCount },
  ];

  // Filtering + Sorting
  const filteredCourses = useMemo(() => {
    let list = [...MY_COURSES_DATA];

    // 1. Tab filter
    if (activeTab === "in-progress") {
      list = list.filter((c) => c.status === "IN PROGRESS");
    } else if (activeTab === "completed") {
      list = list.filter((c) => c.status === "COMPLETED");
    } else if (activeTab === "saved") {
      list = list.filter((c) => isSaved(c.id));
    }

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.subtitle.toLowerCase().includes(q)
      );
    }

    // 3. Sorting
    list.sort((a, b) => {
      if (sortBy === "progress") {
        const pctA = a.completedDocs / Math.max(1, a.totalDocs);
        const pctB = b.completedDocs / Math.max(1, b.totalDocs);
        return pctB - pctA;
      }
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      // "opened" default: keeps natural list order or id
      return 0;
    });

    return list;
  }, [activeTab, searchQuery, sortBy, isSaved]);

  const activeSortLabel =
    SORT_OPTIONS.find((s) => s.key === sortBy)?.label || "Last opened";

  const handleCourseClick = (course: CourseCardData) => {
    // Navigate to actual refresh-safe route
    navigate(`/my-courses/${course.slug || "human-anatomy-i"}`);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
      {/* 1. Fixed TopAppBar main variant */}
      <TopAppBar variant="main" />

      {/* Main scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/* 2. HeroBand: Heading + Subtitle only (no unused slots) */}
        <HeroBand
          heading="My Courses"
          subtitle="Your learning resources, all in one place."
        />

        <div className="px-4 pb-8 space-y-3.5 max-w-lg mx-auto">
          {/* 3. MobileSearchBar without ⌘K badge */}
          <MobileSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search your courses..."
          />

          {/* 4. StatusFilterTabs + Sort Trigger */}
          <StatusFilterTabs
            tabs={filterTabs}
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as FilterTabKey)}
            rightSlot={
              <button
                type="button"
                onClick={() => setIsSortSheetOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200/80 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer select-none"
              >
                <Clock className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />
                <span className="whitespace-nowrap">{activeSortLabel}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" strokeWidth={2} />
              </button>
            }
          />

          {/* 5. Course List or Empty State */}
          {filteredCourses.length > 0 ? (
            <div className="space-y-3 pt-1">
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  layout="full"
                  onClick={() => handleCourseClick(course)}
                />
              ))}
            </div>
          ) : (
            <div className="pt-4">
              <EmptyState
                icon={
                  activeTab === "saved" ? (
                    <Sparkles className="w-6 h-6" />
                  ) : (
                    <BookOpen className="w-6 h-6" />
                  )
                }
                title={
                  searchQuery.trim()
                    ? "No matching courses found"
                    : activeTab === "completed"
                    ? "No completed courses yet"
                    : activeTab === "saved"
                    ? "No saved courses yet"
                    : "No courses found"
                }
                subtitle={
                  searchQuery.trim()
                    ? `No courses matched "${searchQuery}". Try a different keyword.`
                    : activeTab === "completed"
                    ? "Keep going — you'll see them here once you finish one."
                    : activeTab === "saved"
                    ? "Tap the bookmark icon on any course card to save it for quick access."
                    : "You are not currently enrolled in any active courses."
                }
                action={
                  searchQuery.trim()
                    ? {
                        label: "Clear Search",
                        onClick: () => setSearchQuery(""),
                      }
                    : undefined
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* 6. Sort Bottom Sheet */}
      <BottomSheet
        isOpen={isSortSheetOpen}
        onClose={() => setIsSortSheetOpen(false)}
        title="Sort Courses"
      >
        <div className="space-y-1.5 py-1">
          {SORT_OPTIONS.map((option) => {
            const isSelected = option.key === sortBy;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => {
                  setSortBy(option.key);
                  setIsSortSheetOpen(false);
                }}
                className={`w-full p-3 rounded-2xl flex items-center justify-between text-left text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-emerald-50 text-emerald-900 font-bold"
                    : "hover:bg-slate-50 text-slate-700"
                }`}
              >
                <span>{option.label}</span>
                {isSelected && (
                  <Check className="w-4.5 h-4.5 text-emerald-600 stroke-[2.5]" />
                )}
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </div>
  );
};

export default MyCoursesScreen;
