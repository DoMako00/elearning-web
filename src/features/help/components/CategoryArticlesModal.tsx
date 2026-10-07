import React, { useState, useMemo } from "react";
import {
  X,
  Search,
  BookOpen,
  ChevronRight,
  Clock,
  User,
  CreditCard,
  Settings2,
  FileText,
  Award,
  Users,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";
import type { HelpCategory, HelpArticle } from "../../../types/help";
import { ALL_CATEGORY_ARTICLES } from "../data/helpCenterData";

const ICON_MAP: Record<string, LucideIcon> = {
  User,
  BookOpen,
  CreditCard,
  Settings2,
  FileText,
  Award,
  Users,
  MoreHorizontal,
};

interface CategoryArticlesModalProps {
  category: HelpCategory | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectArticle: (article: HelpArticle) => void;
  allCategories?: HelpCategory[];
  onSwitchCategory?: (category: HelpCategory) => void;
}

export const CategoryArticlesModal: React.FC<CategoryArticlesModalProps> = ({
  category,
  isOpen,
  onClose,
  onSelectArticle,
  allCategories,
  onSwitchCategory,
}) => {
  const [searchFilter, setSearchFilter] = useState("");

  // Retrieve articles for this category (Hook must always run on every render)
  const categoryId = category?.id;
  const articles: HelpArticle[] = useMemo(() => {
    if (!categoryId) return [];
    const list = ALL_CATEGORY_ARTICLES[categoryId] || [];
    if (!searchFilter.trim()) return list;
    const q = searchFilter.toLowerCase();
    return list.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.content.overview.toLowerCase().includes(q)
    );
  }, [categoryId, searchFilter]);

  if (!isOpen || !category) return null;

  const IconComponent = ICON_MAP[category.iconName] || BookOpen;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      {/* Backdrop click handler */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[85vh] sm:max-h-[80vh] overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 bg-linear-to-r from-emerald-50/50 to-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center shrink-0">
              <IconComponent className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2
                  id="category-modal-title"
                  className="text-base sm:text-lg font-bold text-gray-900 truncate"
                >
                  {category.title}
                </h2>
                <span className="px-2 py-0.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-full">
                  {category.articleCount} articles
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {category.description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close category dialog"
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search inside category */}
        <div className="p-3 sm:px-5 border-b border-gray-100 bg-gray-50/50">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder={`Search in ${category.title}...`}
              className="w-full h-9 pl-9 pr-3 text-xs sm:text-sm bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Articles List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-gray-100">
          {articles.length === 0 ? (
            <div className="text-center py-10">
              <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-700">No articles found</p>
              <p className="text-xs text-gray-400 mt-1">
                Try searching with different keywords or browse other categories.
              </p>
            </div>
          ) : (
            articles.map((art) => (
              <button
                key={art.id}
                type="button"
                onClick={() => onSelectArticle(art)}
                className="w-full py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3 text-left hover:bg-emerald-50/40 -mx-2 px-2 rounded-xl transition-all cursor-pointer group"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                    {art.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                    {art.description}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      {art.readTime}
                    </span>
                    <span>•</span>
                    <span>Updated {art.lastUpdated}</span>
                  </div>
                </div>

                <div className="w-7 h-7 rounded-full bg-gray-50 group-hover:bg-emerald-100 text-gray-400 group-hover:text-emerald-700 flex items-center justify-center shrink-0 transition-colors mt-1">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Modal Footer with quick category switcher */}
        {allCategories && allCategories.length > 0 && (
          <div className="p-3 sm:px-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs">
            <span className="text-gray-500 font-medium">Other categories:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-[70%]">
              {allCategories
                .filter((c) => c.id !== category.id)
                .slice(0, 4)
                .map((otherCat) => (
                  <button
                    key={otherCat.id}
                    type="button"
                    onClick={() => onSwitchCategory?.(otherCat)}
                    className="px-2 py-1 bg-white border border-gray-200 rounded-md text-[11px] text-gray-600 hover:text-emerald-700 hover:border-emerald-300 transition-colors shrink-0 cursor-pointer"
                  >
                    {otherCat.title}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
