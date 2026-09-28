import React from "react";
import {
  PlayCircle,
  KeyRound,
  Laptop,
  FileCheck,
  HelpCircle,
  MessageCircle,
  Users,
  Award,
  LifeBuoy,
  ChevronRight,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import type { HelpArticle } from "../../../types/help";

const ARTICLE_ICON_MAP: Record<string, { icon: LucideIcon; bg: string; color: string }> = {
  PlayCircle: { icon: PlayCircle, bg: "bg-blue-50", color: "text-blue-600" },
  KeyRound: { icon: KeyRound, bg: "bg-sky-50", color: "text-sky-600" },
  Laptop: { icon: Laptop, bg: "bg-indigo-50", color: "text-indigo-600" },
  FileCheck: { icon: FileCheck, bg: "bg-rose-50", color: "text-rose-600" },
  HelpCircle: { icon: HelpCircle, bg: "bg-amber-50", color: "text-amber-600" },
  MessageCircle: { icon: MessageCircle, bg: "bg-emerald-50", color: "text-emerald-600" },
  Users: { icon: Users, bg: "bg-teal-50", color: "text-teal-600" },
  Award: { icon: Award, bg: "bg-purple-50", color: "text-purple-600" },
  LifeBuoy: { icon: LifeBuoy, bg: "bg-red-50", color: "text-rose-500" },
};

interface PopularArticlesProps {
  articles: HelpArticle[];
  onSelectArticle: (article: HelpArticle) => void;
  onViewAllArticles: () => void;
}

export const PopularArticles: React.FC<PopularArticlesProps> = ({
  articles,
  onSelectArticle,
  onViewAllArticles,
}) => {
  return (
    <section aria-label="Popular articles" className="flex flex-col min-h-0">
      {/* Header section */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
          Popular articles
        </h2>
        <button
          type="button"
          onClick={onViewAllArticles}
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors group cursor-pointer"
        >
          <span>View all articles</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* 3x3 or 3x2 Grid (3 columns on desktop, 2 on tablet, 1 on mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
        {articles.map((article) => {
          const iconConfig = ARTICLE_ICON_MAP[article.iconName] || {
            icon: HelpCircle,
            bg: "bg-emerald-50",
            color: "text-emerald-600",
          };
          const IconComponent = iconConfig.icon;

          return (
            <button
              key={article.id}
              type="button"
              onClick={() => onSelectArticle(article)}
              className="group flex items-center justify-between p-2.5 sm:p-3 text-left bg-white border border-gray-100 hover:border-emerald-200 rounded-xl shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                {/* Visual Icon with color badge */}
                <div
                  className={`w-8 h-8 rounded-lg ${iconConfig.bg} ${iconConfig.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}
                >
                  <IconComponent className="w-4 h-4" />
                </div>

                {/* Text Title & Subtitle */}
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs sm:text-[12.5px] font-bold text-gray-900 truncate group-hover:text-emerald-700 transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-[11px] text-gray-500 truncate mt-0.5">
                    {article.description}
                  </p>
                </div>
              </div>

              {/* Chevron Right */}
              <div className="ml-2 text-gray-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0">
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
