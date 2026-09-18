import {
  ChevronDown,
  Compass,
  FolderPlus,
  HelpCircle,
  MessageSquare,
  Plus,
  Search,
  Users2,
  Calendar,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { TopicCategory } from "../types/community";

interface SearchAndFilterToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: TopicCategory;
  onCategorySelect: (category: TopicCategory) => void;
  selectedDropdownTopic: string;
  onDropdownTopicSelect: (topic: string) => void;
  onCreateThreadClick?: () => void;
}

const DROPDOWN_TOPICS = [
  "All topics",
  "React & Next.js",
  "UI/UX Design Systems",
  "Backend & APIs",
  "Data Science & AI",
  "Career & Portfolios",
];

export function SearchAndFilterToolbar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategorySelect,
  selectedDropdownTopic,
  onDropdownTopicSelect,
  onCreateThreadClick,
}: SearchAndFilterToolbarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const categories: Array<{
    id: TopicCategory;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
  }> = [
    { id: "all", label: "All" },
    { id: "groups", label: "Study Groups", icon: Users2 },
    { id: "discussions", label: "Discussions", icon: MessageSquare },
    { id: "qa", label: "Q&A", icon: HelpCircle },
    { id: "resources", label: "Resources", icon: FolderPlus },
    { id: "events", label: "Events", icon: Calendar },
  ];

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Search Input and All Topics Dropdown Trigger */}
      <div className="flex items-center gap-3 w-full">
        <div className="relative flex-1 min-w-0">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none"
            strokeWidth={2}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search discussions, topics, or members..."
            className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200/90 rounded-xl text-[14px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
          />
        </div>

        {/* Dropdown for All topics */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="h-11 px-4 flex items-center gap-2 bg-white border border-slate-200/90 rounded-xl text-[13.5px] font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-xs transition-all"
            aria-haspopup="listbox"
            aria-expanded={isDropdownOpen}
          >
            <Compass className="size-4 text-slate-400" />
            <span>{selectedDropdownTopic}</span>
            <ChevronDown
              className={`size-3.5 text-slate-400 transition-transform duration-150 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-slate-200/90 rounded-xl shadow-lg z-30 py-1 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
              {DROPDOWN_TOPICS.map((topic) => {
                const isSelected = selectedDropdownTopic === topic;
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => {
                      onDropdownTopicSelect(topic);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-[13px] flex items-center justify-between transition-colors ${
                      isSelected
                        ? "bg-emerald-50 text-emerald-700 font-semibold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>{topic}</span>
                    {isSelected && (
                      <span className="size-1.5 rounded-full bg-emerald-600" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Horizontal Pill Filters + Quick Add button */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const Icon = cat.icon;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategorySelect(cat.id)}
              className={`h-8.5 px-3.5 rounded-lg text-[13px] font-medium flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                isSelected
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-2xs font-semibold"
                  : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {Icon && (
                <Icon
                  className={`size-3.5 ${
                    isSelected ? "text-emerald-600" : "text-slate-400"
                  }`}
                />
              )}
              <span>{cat.label}</span>
            </button>
          );
        })}

        {/* Floating Quick Action "+" Button */}
        <button
          type="button"
          onClick={onCreateThreadClick}
          className="size-8.5 grid place-items-center rounded-lg bg-white border border-slate-200/80 text-slate-500 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 transition-all shrink-0 cursor-pointer shadow-2xs ml-0.5"
          title="Create discussion or study group"
          aria-label="Create discussion or study group"
        >
          <Plus className="size-4" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}
