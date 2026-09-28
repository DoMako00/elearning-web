import React from "react";
import {
  User,
  BookOpen,
  CreditCard,
  Settings2,
  FileText,
  Award,
  Users,
  MoreHorizontal,
  ArrowRight,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import type { HelpCategory } from "../../../types/help";

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

interface CategoryGridProps {
  categories: HelpCategory[];
  onSelectCategory: (category: HelpCategory) => void;
  onViewAllCategories: () => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  onSelectCategory,
  onViewAllCategories,
}) => {
  return (
    <section aria-label="Browse by category" className="flex flex-col min-h-0">
      {/* Header section */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
          Browse by category
        </h2>
        <button
          type="button"
          onClick={onViewAllCategories}
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors group cursor-pointer"
        >
          <span>View all categories</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* 2x4 Grid Container (4 columns on desktop, 2 columns on tablet, 1 on small screens) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {categories.map((cat) => {
          const IconComponent = ICON_MAP[cat.iconName] || MoreHorizontal;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat)}
              className="group relative flex flex-col justify-between p-3 sm:p-3.5 text-left bg-white border border-gray-100 hover:border-emerald-200 rounded-xl shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden hover:-translate-y-0.5"
            >
              {/* Top Row: Icon + Arrow action button */}
              <div className="flex items-start justify-between gap-2 mb-2 w-full">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200 shrink-0">
                  <IconComponent className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </div>
                <div className="w-6 h-6 rounded-full border border-gray-100 group-hover:border-emerald-300 flex items-center justify-center text-gray-400 group-hover:text-emerald-700 group-hover:bg-emerald-50 transition-all shrink-0">
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Title & Description */}
              <div className="min-w-0 flex-1 mb-2">
                <h3 className="text-xs sm:text-[13px] font-bold text-gray-900 leading-snug group-hover:text-emerald-700 transition-colors">
                  {cat.title}
                </h3>
                <p className="mt-0.5 text-[11px] text-gray-500 leading-normal line-clamp-2">
                  {cat.description}
                </p>
              </div>

              {/* Bottom Badge: Article Count */}
              <div className="pt-1.5 border-t border-gray-50 flex items-center">
                <span className="text-[11px] font-semibold text-emerald-600">
                  {cat.articleCount} articles
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
