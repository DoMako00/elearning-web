import React from "react";
import { Search } from "lucide-react";
import { RobotIllustration } from "./RobotIllustration";
import { POPULAR_SEARCH_TAGS } from "../data/helpCenterData";

interface HelpHeroBannerProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onTagClick: (tag: string) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export const HelpHeroBanner: React.FC<HelpHeroBannerProps> = ({
  searchQuery,
  onSearchChange,
  onTagClick,
  inputRef,
}) => {
  return (
    <section
      aria-label="Help and Support Search"
      className="relative w-full rounded-2xl bg-linear-to-r from-[#eef9f2] via-[#e5f6ed] to-[#d8f2e4] border border-[#d2edd9] p-3 sm:p-4 lg:py-3.5 lg:px-6 flex items-center justify-between gap-4 overflow-hidden shadow-xs shrink-0"
    >
      {/* Background Soft Organic Waves */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-white/40 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute -bottom-10 right-12 w-64 h-64 bg-emerald-300/20 rounded-full blur-2xl pointer-events-none z-0" />

      {/* Left Content Area */}
      <div className="relative z-10 flex-1 min-w-0 flex flex-col justify-center max-w-2xl">
        {/* Category Pill Tag */}
        <div className="inline-flex items-center gap-1.5 self-start mb-1 px-2.5 py-0.5 rounded-full bg-emerald-100/80 border border-emerald-200 text-[10.5px] font-bold tracking-wider text-emerald-800 uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
          We're here to help
        </div>

        {/* Hero Heading */}
        <h1 className="text-xl sm:text-2xl lg:text-[26px] font-bold text-gray-900 tracking-tight leading-tight">
          How can we help you?
        </h1>

        {/* Subtitle description */}
        <p className="mt-0.5 text-xs sm:text-[13px] text-gray-600 leading-relaxed line-clamp-2">
          Find answers, browse guides, or submit a support ticket. We're here to help you succeed in your learning journey.
        </p>

        {/* Live Search Input Bar */}
        <div className="mt-2.5 relative flex items-center w-full max-w-xl">
          <div className="absolute left-3.5 text-gray-400 pointer-events-none flex items-center justify-center">
            <Search className="w-4 h-4 text-gray-400" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder='Search for help articles, e.g. "video not playing"'
            aria-label="Search help articles"
            className="w-full h-10 pl-9 pr-14 sm:pr-16 text-xs sm:text-sm bg-white border border-emerald-200/90 rounded-xl text-gray-900 placeholder-gray-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
          />

          {/* Shortcut Badge: Cmd + K */}
          <div className="absolute right-2.5 hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded-md select-none pointer-events-none">
            <span className="text-[11px]">⌘</span>
            <span>K</span>
          </div>
        </div>

        {/* Popular searches pill tags */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] font-medium text-gray-500 mr-0.5">Popular searches:</span>
          {POPULAR_SEARCH_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onTagClick(tag)}
              className="px-2.5 py-0.5 text-[11px] font-medium text-gray-700 bg-white/80 hover:bg-white hover:text-emerald-700 hover:border-emerald-300 border border-emerald-200/70 rounded-full transition-all duration-150 shadow-2xs"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Right Graphic / Mascot Container */}
      <div className="hidden md:flex items-center justify-center shrink-0 pr-2 lg:pr-6 relative z-10">
        <RobotIllustration className="w-36 h-32 lg:w-44 lg:h-38" />
      </div>
    </section>
  );
};
