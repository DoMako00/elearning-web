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

export interface SearchItem {
  id: string;
  category: "courses" | "lessons" | "instructors" | "community" | "resources";
  title: string;
  subtitle: string;
  route: string;
  badge?: string;
}

const SEARCH_DATABASE: SearchItem[] = [
  // Courses
  {
    id: "c-1",
    category: "courses",
    title: "Human Anatomy I",
    subtitle: "Structure & Organization • 14 Lessons • 4.8 ★",
    route: "/my-courses/human-anatomy-i",
    badge: "Enrolled",
  },
  {
    id: "c-2",
    category: "courses",
    title: "Medical Physiology",
    subtitle: "Body Functions & Regulation • 10 Lessons • 4.8 ★",
    route: "/explore",
    badge: "Popular",
  },
  {
    id: "c-3",
    category: "courses",
    title: "Histology Basics",
    subtitle: "Tissues of the Human Body • 6 Lessons • 4.7 ★",
    route: "/explore",
    badge: "Beginner",
  },
  {
    id: "c-4",
    category: "courses",
    title: "Biochemistry Essentials",
    subtitle: "Molecules of Life • 7 Lessons • 4.6 ★",
    route: "/explore",
  },
  {
    id: "c-5",
    category: "courses",
    title: "Embryology Foundations",
    subtitle: "Development of Human Life • 5 Lessons • 4.8 ★",
    route: "/explore",
  },

  // Lessons
  {
    id: "l-1",
    category: "lessons",
    title: "Upper Limb Osteology & Shoulder Girdle",
    subtitle: "Human Anatomy I • Lesson 1 • 45 mins",
    route: "/my-courses/human-anatomy-i/lessons/human-anatomy-i-lesson-1",
    badge: "Lesson",
  },
  {
    id: "l-2",
    category: "lessons",
    title: "Brachial Plexus & Peripheral Infiltration",
    subtitle: "Human Anatomy I • Lesson 2 • 50 mins",
    route: "/my-courses/human-anatomy-i/lessons/human-anatomy-i-lesson-1",
    badge: "Lesson",
  },
  {
    id: "l-3",
    category: "lessons",
    title: "Cardiac Cycle & Hemodynamic Pressures",
    subtitle: "Medical Physiology • Lesson 4 • 40 mins",
    route: "/explore",
    badge: "Lesson",
  },
  {
    id: "l-4",
    category: "lessons",
    title: "Epithelial Junctions & Basal Lamina",
    subtitle: "Histology Basics • Lesson 3 • 35 mins",
    route: "/explore",
    badge: "Lesson",
  },

  // Instructors
  {
    id: "i-1",
    category: "instructors",
    title: "Dr. Ahmed Hassan, MD",
    subtitle: "Clinical Neuroanatomy & Surgical Anatomy Lead",
    route: "/instructor-profile",
    badge: "Faculty",
  },
  {
    id: "i-2",
    category: "instructors",
    title: "Prof. Sarah Johnson, PhD",
    subtitle: "Cell Biology & Medical Histology Fellow",
    route: "/community",
    badge: "Faculty",
  },
  {
    id: "i-3",
    category: "instructors",
    title: "Dr. Alexander Ross, MD, FACS",
    subtitle: "Thoracic & Cardiovascular Surgery",
    route: "/community",
    badge: "Faculty",
  },

  // Community & Resources
  {
    id: "cm-1",
    category: "community",
    title: "Brachial Plexus High-Yield Case Discussion",
    subtitle: "Clinical Case Study • 28 replies • Active now",
    route: "/community",
    badge: "Discussion",
  },
  {
    id: "cm-2",
    category: "community",
    title: "Gross Anatomy Practical Exam Prep Tips",
    subtitle: "Study Group • 42 replies • By Juliana Mohammed",
    route: "/community",
    badge: "Group",
  },
  {
    id: "r-1",
    category: "resources",
    title: "Upper Limb Complete Dissection Atlas (PDF)",
    subtitle: "Reference Guide • 14.2 MB • High Resolution",
    route: "/my-courses/human-anatomy-i",
    badge: "PDF",
  },
];

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return SEARCH_DATABASE.slice(0, 8);
    }
    return SEARCH_DATABASE.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [query]);

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
        if (filteredItems[selectedIndex]) {
          navigate(filteredItems[selectedIndex].route);
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, navigate, onClose]);

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
            placeholder="Search enrolled courses, lessons, faculty, community..."
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
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center">
              <Search className="mx-auto size-8 text-slate-300" />
              <p className="mt-2 text-sm font-medium text-slate-700">
                No matching results found for &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Try searching for Anatomy, Physiology, Dr. Hassan, or Quiz
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
            <span>Universal Search across entire Medical Learning Space</span>
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
