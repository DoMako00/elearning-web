import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  BookOpen,
  PlayCircle,
  User,
  MessageSquare,
  FileText,
  ArrowRight,
  X,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { fetchScopedCourseLessons, fetchScopedCourseList } from "../../../features/student/api/useStudentCourses";
import { useStudentScope, type StudentScope } from "../../../features/student/scope/StudentScopeProvider";
import { studentInstructorApi } from "../../../features/student/api/studentInstructorApi";
import { studentCommunityApi } from "../../../features/student/api/studentCommunityApi";

export interface SearchItem {
  id: string;
  category: "courses" | "lessons" | "instructors" | "community" | "resources";
  title: string;
  subtitle: string;
  route: string;
  badge?: string;
}

async function loadSearchItems(scope: StudentScope, signal: AbortSignal): Promise<SearchItem[]> {
  const [courses, instructors, posts] = await Promise.all([
    fetchScopedCourseList(scope, "explore", signal),
    studentInstructorApi.list(signal),
    studentCommunityApi.listPosts(signal),
  ]);

  const items: SearchItem[] = courses.map((course) => ({
    id: `course:${course.courseId}`,
    category: "courses",
    title: course.title,
    subtitle: `${course.academicInstitution.name} · ${course.academicLevel.title} · ${course.academicSemester.title}`,
    route: `/my-courses/${encodeURIComponent(course.courseId)}`,
    badge: course.access.isEnrolled ? (course.access.canOpen ? "Enrolled" : "Not open yet") : "Not enrolled",
  }));

  const accessibleCourses = courses.filter((course) => course.access.canOpen);
  const lessonsByCourse = await Promise.all(accessibleCourses.map(async (course) => ({
    course,
    lessons: await fetchScopedCourseLessons(scope, course.courseId, signal),
  })));

  for (const { course, lessons } of lessonsByCourse) {
    for (const lesson of lessons.lessons) {
      const route = `/my-courses/${encodeURIComponent(course.courseId)}/lessons/${encodeURIComponent(lesson.lessonId)}`;
      items.push({
        id: `lesson:${lesson.lessonId}`,
        category: "lessons",
        title: lesson.title,
        subtitle: `${course.title} · ${lesson.mediaStatus === "ready" ? "Released lesson" : "Lesson"}`,
        route,
        badge: "Lesson",
      });
      if (lesson.resourceId && lesson.resourceTitle) {
        items.push({
          id: `resource:${lesson.resourceId}`,
          category: "resources",
          title: lesson.resourceTitle,
          subtitle: `${course.title} · ${lesson.title}`,
          route,
          badge: lesson.resourceType === "pdf" ? "PDF" : "Video",
        });
      }
    }
  }

  for (const instructor of instructors) {
    items.push({
      id: `instructor:${instructor.id}`,
      category: "instructors",
      title: instructor.displayName,
      subtitle: instructor.specialties.join(" · ") || instructor.courses.map((course) => course.title).join(" · "),
      route: `/instructors/${encodeURIComponent(instructor.id)}`,
      badge: "Instructor",
    });
  }

  for (const post of posts) {
    items.push({
      id: `community:${post.id}`,
      category: "community",
      title: post.title?.trim() || post.body.slice(0, 88).trim(),
      subtitle: `${post.categoryKey} · ${post.commentCount} ${post.commentCount === 1 ? "reply" : "replies"}`,
      route: "/community",
      badge: "Discussion",
    });
  }

  return items;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const auth = useAuth();
  const scope = useStudentScope();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [items, setItems] = useState<SearchItem[]>([]);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryIndex, setRetryIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || auth.status !== "authenticated") {
      setItems([]);
      setLoadState("idle");
      setLoadError(null);
      return;
    }

    const controller = new AbortController();
    setLoadState("loading");
    setLoadError(null);
    void loadSearchItems(scope, controller.signal)
      .then((nextItems) => {
        if (controller.signal.aborted) return;
        setItems(nextItems);
        setLoadState("success");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setItems([]);
        setLoadError(error instanceof Error ? error.message : "Search data could not be loaded.");
        setLoadState("error");
      });
    return () => controller.abort();
  }, [isOpen, auth.status, scope, retryIndex]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const results = items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
    return q ? results : results.slice(0, 8);
  }, [items, query]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredItems.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredItems.length - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (loadState === "success" && filteredItems[selectedIndex]) {
          navigate(filteredItems[selectedIndex].route);
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loadState, filteredItems, selectedIndex, navigate, onClose]);

  if (!isOpen) return null;

  const getCategoryIcon = (category: SearchItem["category"]) => {
    switch (category) {
      case "courses":
        return <BookOpen className="size-4 text-(--color-brand,#20a862)" />;
      case "lessons":
        return <PlayCircle className="size-4 text-emerald-600" />;
      case "instructors":
        return <User className="size-4 text-sky-600" />;
      case "community":
        return <MessageSquare className="size-4 text-amber-600" />;
      case "resources":
        return <FileText className="size-4 text-rose-500" />;
    }
  };

  const getCategoryLabel = (cat: SearchItem["category"]) => {
    switch (cat) {
      case "courses":
        return "Courses & Modules";
      case "lessons":
        return "Video Lessons";
      case "instructors":
        return "Faculty & Instructors";
      case "community":
        return "Community Threads";
      case "resources":
        return "Study Resources & PDFs";
    }
  };

  // Group filtered items by category
  const groupedCategories = ["courses", "lessons", "instructors", "community", "resources"] as const;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-16 sm:pt-24 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Universal Search Command Palette"
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Search Input Row */}
        <div className="flex items-center border-b border-slate-100 px-4 py-3.5">
          <Search className="size-5 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent px-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
            placeholder="Search courses, lessons, instructors, community..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="rounded p-1 text-slate-400 hover:text-slate-600"
              aria-label="Clear query"
            >
              <X className="size-4" />
            </button>
          ) : (
            <kbd className="hidden rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-500 sm:inline-block">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="max-h-[60vh] overflow-y-auto p-3 space-y-4"
        >
          {loadState === "loading" ? (
            <div className="py-12 text-center" role="status">
              <Search className="mx-auto size-8 text-slate-300" />
              <p className="mt-2 text-sm font-medium text-slate-700">Loading your learning-space results…</p>
            </div>
          ) : loadState === "error" ? (
            <div className="py-12 text-center" role="alert">
              <Search className="mx-auto size-8 text-slate-300" />
              <p className="mt-2 text-sm font-medium text-slate-700">{loadError ?? "Search data could not be loaded."}</p>
              <button type="button" className="mt-3 text-sm font-semibold text-emerald-700 hover:text-emerald-800" onClick={() => setRetryIndex((value) => value + 1)}>Try again</button>
            </div>
          ) : auth.status !== "authenticated" ? (
            <div className="py-12 text-center" role="status">
              <Search className="mx-auto size-8 text-slate-300" />
              <p className="mt-2 text-sm font-medium text-slate-700">Sign in to search your learning space.</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 text-center">
              <Search className="mx-auto size-8 text-slate-300" />
              <p className="mt-2 text-sm font-medium text-slate-700">
                {items.length === 0 ? "No learning-space results are available yet." : `No matching results found for “${query}”`}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Try another course, lesson, instructor, or discussion.
              </p>
            </div>
          ) : (
            groupedCategories.map((cat) => {
              const catItems = filteredItems.filter((i) => i.category === cat);
              if (catItems.length === 0) return null;

              return (
                <div key={cat} className="space-y-1">
                  <div className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                    {getCategoryLabel(cat)}
                  </div>
                  {catItems.map((item) => {
                    const overallIndex = filteredItems.findIndex(
                      (fi) => fi.id === item.id
                    );
                    const isSelected = overallIndex === selectedIndex;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          navigate(item.route);
                          onClose();
                        }}
                        onMouseEnter={() => setSelectedIndex(overallIndex)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all ${
                          isSelected
                            ? "bg-emerald-50/80 text-emerald-950"
                            : "hover:bg-slate-50 text-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                              isSelected
                                ? "bg-white text-(--color-brand,#20a862) shadow-xs"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {getCategoryIcon(item.category)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-semibold">
                                {item.title}
                              </p>
                              {item.badge && (
                                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="truncate text-xs text-slate-500">
                              {item.subtitle}
                            </p>
                          </div>
                        </div>

                        <ArrowRight
                          className={`size-4 shrink-0 transition-transform ${
                            isSelected
                              ? "translate-x-0.5 text-(--color-brand,#20a862)"
                              : "opacity-0"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Sparkles className="size-3.5 text-emerald-600" />
          <span>Search real courses, released learning resources, instructors, and community discussions</span>
          </div>
          <div className="flex items-center gap-3">
            <span>
              <kbd className="rounded border bg-white px-1 py-0.5 font-mono text-[10px]">
                ↑
              </kbd>{" "}
              <kbd className="rounded border bg-white px-1 py-0.5 font-mono text-[10px]">
                ↓
              </kbd>{" "}
              navigate
            </span>
            <span>
              <kbd className="rounded border bg-white px-1 py-0.5 font-mono text-[10px]">
                ↵
              </kbd>{" "}
              open
            </span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
