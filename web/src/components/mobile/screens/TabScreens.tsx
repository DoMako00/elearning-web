import React from "react";
import { TopAppBar } from "../TopAppBar";
import { DocsOnlyBanner } from "../common/DocsOnlyBanner";

export const MyCoursesStubScreen: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
      <TopAppBar variant="main" />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <DocsOnlyBanner />
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900">My Courses</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Your course syllabus, study guides, and reading documents.
          </p>
          <span className="mt-3 inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
            Coming soon
          </span>
        </div>
      </div>
    </div>
  );
};

export const ExploreStubScreen: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
      <TopAppBar variant="main" />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <DocsOnlyBanner />
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900">Explore Catalog</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Browse medical disciplines, textbooks, and reading materials.
          </p>
          <span className="mt-3 inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
            Coming soon
          </span>
        </div>
      </div>
    </div>
  );
};

export const CalendarStubScreen: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
      <TopAppBar variant="main" />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900">Study Calendar</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Exam schedules, reading deadlines, and study session calendar.
          </p>
          <span className="mt-3 inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
            Coming soon
          </span>
        </div>
      </div>
    </div>
  );
};
