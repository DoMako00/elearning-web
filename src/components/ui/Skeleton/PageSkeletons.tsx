import React from "react";
import { Skeleton, SkeletonText, SkeletonAvatar, SkeletonCard } from "./Skeleton";

/**
 * Universal Card Skeleton container with customizable layout
 */
export const SkeletonCardWrapper: React.FC<{
  className?: string;
  children?: React.ReactNode;
}> = ({ className = "", children }) => (
  <div
    aria-hidden="true"
    className={`rounded-2xl border border-[#dfe9e4] bg-white p-5 shadow-2xs ${className}`}
  >
    {children}
  </div>
);

/**
 * Hero Card Skeleton with the requested soft greenish-grey muted tone (#e7ede9)
 */
export const SkeletonHeroCard: React.FC<{
  height?: number | string;
  className?: string;
}> = ({ height = 280, className = "" }) => (
  <div
    aria-hidden="true"
    className={`relative overflow-hidden rounded-2xl border border-[#d6eedf] bg-[#e7ede9] p-6 flex flex-col justify-between shadow-2xs ${className}`}
    style={{ minHeight: typeof height === "number" ? `${height}px` : height }}
  >
    <div className="space-y-4 max-w-xl">
      <div className="flex gap-2">
        <Skeleton width={110} height={26} borderRadius={999} variant="contrast" />
        <Skeleton width={80} height={26} borderRadius={999} variant="contrast" />
      </div>
      <Skeleton width="80%" height={32} borderRadius={6} variant="contrast" />
      <Skeleton width="60%" height={18} borderRadius={4} variant="contrast" />
    </div>

    <div className="pt-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <SkeletonAvatar size={42} className="bg-[#d8e2dc]" />
        <div className="space-y-1.5">
          <Skeleton width={130} height={14} borderRadius={4} variant="contrast" />
          <Skeleton width={80} height={12} borderRadius={4} variant="contrast" />
        </div>
      </div>
      <Skeleton width={140} height={40} borderRadius={12} variant="contrast" />
    </div>
  </div>
);

/**
 * 1. HOME DASHBOARD SKELETON
 * Matches DashboardBento 3-row layout:
 * - Top row: Continue Learning + AI Guide + Weekly Goal
 * - Middle row: Progress + Upcoming + Streak
 * - Bottom row: Recommended Subjects Grid
 */
export const HomeDashboardSkeleton: React.FC = () => {
  return (
    <section className="dashboard-bento" aria-busy="true" aria-label="Loading student home dashboard">
      {/* Top row */}
      <div className="dashboard-bento__row dashboard-bento__row--top">
        <div className="dashboard-bento__slot dashboard-bento__slot--continue">
          <SkeletonHeroCard height="100%" className="h-full" />
        </div>
        <div className="dashboard-bento__slot dashboard-bento__slot--ai">
          <SkeletonCardWrapper className="h-full flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <Skeleton width={44} height={44} borderRadius={12} />
              <div className="space-y-1.5 flex-1">
                <Skeleton width="60%" height={16} borderRadius={4} />
                <Skeleton width="40%" height={12} borderRadius={4} />
              </div>
            </div>
            <div className="space-y-2 my-2">
              <Skeleton width="90%" height={14} borderRadius={4} />
              <Skeleton width="75%" height={14} borderRadius={4} />
            </div>
            <Skeleton width="100%" height={38} borderRadius={10} />
          </SkeletonCardWrapper>
        </div>
        <div className="dashboard-bento__slot dashboard-bento__slot--weekly">
          <SkeletonCardWrapper className="h-full flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <Skeleton width={100} height={18} borderRadius={4} />
              <Skeleton width={32} height={32} circle />
            </div>
            <div className="flex justify-center my-1">
              <Skeleton width={80} height={80} circle />
            </div>
            <Skeleton width="100%" height={12} borderRadius={999} />
          </SkeletonCardWrapper>
        </div>
      </div>

      {/* Middle row */}
      <div className="dashboard-bento__row dashboard-bento__row--middle">
        <div className="dashboard-bento__slot dashboard-bento__slot--progress">
          <SkeletonCardWrapper className="h-full flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <Skeleton width={90} height={18} borderRadius={4} />
              <Skeleton width={50} height={14} borderRadius={4} />
            </div>
            <div className="space-y-2">
              <Skeleton width="100%" height={8} borderRadius={999} />
              <div className="flex justify-between">
                <Skeleton width={60} height={12} borderRadius={4} />
                <Skeleton width={40} height={12} borderRadius={4} />
              </div>
            </div>
          </SkeletonCardWrapper>
        </div>
        <div className="dashboard-bento__slot dashboard-bento__slot--upcoming">
          <SkeletonCardWrapper className="h-full flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <Skeleton width={120} height={18} borderRadius={4} />
              <Skeleton width={28} height={20} borderRadius={6} />
            </div>
            <div className="space-y-2 my-1">
              <Skeleton width="100%" height={28} borderRadius={6} />
              <Skeleton width="100%" height={28} borderRadius={6} />
            </div>
          </SkeletonCardWrapper>
        </div>
        <div className="dashboard-bento__slot dashboard-bento__slot--streak">
          <SkeletonCardWrapper className="h-full flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton width={110} height={18} borderRadius={4} />
              <Skeleton width={80} height={32} borderRadius={6} />
              <Skeleton width={140} height={12} borderRadius={4} />
            </div>
            <Skeleton width={64} height={64} circle />
          </SkeletonCardWrapper>
        </div>
      </div>

      {/* Bottom row */}
      <div className="dashboard-bento__row dashboard-bento__row--bottom">
        <div className="dashboard-bento__slot dashboard-bento__slot--recommended">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 h-full">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * 2. MY COURSES SKELETON
 * Matches MyCoursesPage:
 * - Hero banner + Weekly summary + Pace card
 * - Grid of enrolled course cards
 */
export const MyCoursesSkeleton: React.FC = () => {
  return (
    <section className="student-page student-page--my-courses space-y-5" aria-busy="true" aria-label="Loading your courses">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Hero Focus Card (8 cols) */}
        <div className="lg:col-span-8">
          <SkeletonHeroCard height={290} />
        </div>
        {/* Right Summaries (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <SkeletonCardWrapper className="flex-1 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <Skeleton width={90} height={18} borderRadius={4} />
              <Skeleton width={20} height={20} borderRadius={4} />
            </div>
            <div className="flex gap-2 justify-center my-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} width={28} height={40} borderRadius={8} />
              ))}
            </div>
            <Skeleton width="100%" height={14} borderRadius={4} />
          </SkeletonCardWrapper>

          <SkeletonCardWrapper className="flex-1 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <Skeleton width={90} height={18} borderRadius={4} />
              <Skeleton width={60} height={22} borderRadius={6} />
            </div>
            <Skeleton width="100%" height={60} borderRadius={8} />
            <Skeleton width="70%" height={12} borderRadius={4} />
          </SkeletonCardWrapper>
        </div>
      </div>

      {/* Grid of courses */}
      <div className="pt-2">
        <div className="flex justify-between items-center mb-4">
          <Skeleton width={180} height={22} borderRadius={6} />
          <div className="flex gap-2">
            <Skeleton width={100} height={32} borderRadius={8} />
            <Skeleton width={120} height={32} borderRadius={8} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </section>
  );
};

/**
 * 3. EXPLORE PAGE SKELETON
 * Matches ExplorePage:
 * - Toolbar: Search & Filters
 * - Hero Card (greenish-grey) + Aside (Trending & Directions)
 * - Category Pills
 * - Course Cards Grid
 */
export const ExploreSkeleton: React.FC = () => {
  return (
    <section className="student-page student-page--explore space-y-4" aria-busy="true" aria-label="Loading explore catalog">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-1">
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <Skeleton width="100%" height={48} borderRadius={16} />
          <Skeleton width={48} height={48} borderRadius={12} />
        </div>
        <Skeleton width={140} height={20} borderRadius={6} />
      </div>

      {/* Hero + Aside */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8">
          <SkeletonHeroCard height={280} />
        </div>
        <div className="lg:col-span-4 flex flex-col gap-3.5">
          <SkeletonCardWrapper className="flex-1 flex flex-col justify-between">
            <Skeleton width={130} height={18} borderRadius={4} className="mb-2" />
            <div className="flex flex-wrap gap-2">
              <Skeleton width={70} height={24} borderRadius={999} />
              <Skeleton width={90} height={24} borderRadius={999} />
              <Skeleton width={80} height={24} borderRadius={999} />
              <Skeleton width={110} height={24} borderRadius={999} />
            </div>
          </SkeletonCardWrapper>
          <SkeletonCardWrapper className="flex-1 flex flex-col justify-between">
            <Skeleton width={140} height={18} borderRadius={4} className="mb-2" />
            <div className="space-y-2">
              <Skeleton width="100%" height={28} borderRadius={8} />
              <Skeleton width="100%" height={28} borderRadius={8} />
            </div>
          </SkeletonCardWrapper>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto py-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} width={100} height={36} borderRadius={999} />
        ))}
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </section>
  );
};

/**
 * 4. CALENDAR PAGE SKELETON
 * Matches CalendarWorkspace:
 * - Left calendar toolbar & weekly grid
 * - Right sidebar: mini date picker + upcoming agenda + study goal
 */
export const CalendarSkeleton: React.FC = () => {
  return (
    <section className="student-page student-page--calendar h-full w-full" aria-busy="true" aria-label="Loading calendar">
      <div className="flex flex-col lg:flex-row gap-4 h-full">
        {/* Main Calendar View (Week Grid) */}
        <div className="flex-1 rounded-2xl border border-[#dfe9e4] bg-white p-4 flex flex-col min-h-0">
          {/* Calendar Header Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#dfe9e4]">
            <div className="flex items-center gap-2">
              <Skeleton width={36} height={36} borderRadius={8} />
              <Skeleton width={36} height={36} borderRadius={8} />
              <Skeleton width={150} height={24} borderRadius={6} className="ml-2" />
            </div>
            <div className="flex gap-2">
              <Skeleton width={70} height={34} borderRadius={8} />
              <Skeleton width={70} height={34} borderRadius={8} />
              <Skeleton width={70} height={34} borderRadius={8} />
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-8 gap-2 py-3 border-b border-[#dfe9e4]">
            <Skeleton width="100%" height={20} borderRadius={4} />
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <Skeleton width={30} height={12} borderRadius={4} />
                <Skeleton width={24} height={20} borderRadius={6} />
              </div>
            ))}
          </div>

          {/* Time grid slots */}
          <div className="flex-1 space-y-3 pt-3 overflow-hidden">
            {Array.from({ length: 6 }).map((_, r) => (
              <div key={r} className="grid grid-cols-8 gap-2 items-center">
                <Skeleton width={40} height={14} borderRadius={4} />
                <div className="col-span-7 grid grid-cols-7 gap-2">
                  {Array.from({ length: 7 }).map((_, c) => (
                    <div key={c} className="h-12 rounded-lg bg-gray-50 border border-gray-100 p-1">
                      {(r + c) % 3 === 0 && (
                        <Skeleton width="100%" height="100%" borderRadius={6} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-80 shrink-0 space-y-4">
          <SkeletonCardWrapper className="space-y-3">
            <Skeleton width={120} height={18} borderRadius={4} />
            <div className="grid grid-cols-7 gap-1.5 pt-1">
              {Array.from({ length: 28 }).map((_, i) => (
                <Skeleton key={i} width={24} height={24} borderRadius={4} />
              ))}
            </div>
          </SkeletonCardWrapper>

          <SkeletonCardWrapper className="space-y-3">
            <div className="flex justify-between items-center">
              <Skeleton width={110} height={18} borderRadius={4} />
              <Skeleton width={40} height={14} borderRadius={4} />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-gray-50">
                <Skeleton width={36} height={36} borderRadius={8} />
                <div className="space-y-1.5 flex-1">
                  <Skeleton width="70%" height={14} borderRadius={4} />
                  <Skeleton width="45%" height={10} borderRadius={4} />
                </div>
              </div>
            ))}
          </SkeletonCardWrapper>
        </div>
      </div>
    </section>
  );
};

/**
 * 5. ASSIGNMENTS PAGE SKELETON
 * Matches AssignmentsWorkspace exact layout:
 * - Top toolbar: Filters (All, In progress, Submitted, Graded) + Sort dropdown & filter icon
 * - 2-Column 3-row grid (6 cards): Each card has category, organ 3D art (130px), title, desc, due date, status tag, points/progress bar, action button
 * - Right rail (3 widgets): Upcoming deadlines (with organ thumbnails & relative days), Your progress donut with breakdown list, Recent feedback with score badges
 * - Footer: pagination count and view all button
 */
export const AssignmentsSkeleton: React.FC = () => {
  return (
    <section className="student-page student-page--assignments h-full w-full overflow-hidden" aria-busy="true" aria-label="Loading assignments">
      <div className="assignments-workspace">
        {/* Left Column: Main Area */}
        <div className="assignments-main">
          {/* Top Filter & Sort Toolbar */}
          <div className="assignments-toolbar">
            <div className="assignments-filters">
              <Skeleton width={68} height={34} borderRadius={10} />
              <Skeleton width={112} height={34} borderRadius={10} />
              <Skeleton width={110} height={34} borderRadius={10} />
              <Skeleton width={92} height={34} borderRadius={10} />
            </div>

            <div className="assignments-toolbar__tools">
              <Skeleton width={138} height={38} borderRadius={11} />
              <Skeleton width={38} height={38} borderRadius={11} />
            </div>
          </div>

          {/* 2-Column 3-Row Assignments Grid (6 Cards) */}
          <div className="assignments-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="assignment-card">
                {/* Left side of card */}
                <div className="assignment-card__left">
                  {/* Category tag */}
                  <Skeleton width={84} height={12} borderRadius={2} />

                  <div className="assignment-card__body">
                    {/* Organ Art Placeholder (130x130) */}
                    <div className="assignment-card__art shrink-0">
                      <Skeleton width={100} height={100} borderRadius={16} />
                    </div>

                    {/* Card Info */}
                    <div className="assignment-card__info flex-1">
                      <div className="space-y-1.5">
                        <Skeleton width="90%" height={20} borderRadius={4} />
                        <Skeleton width="100%" height={14} borderRadius={4} />
                        <Skeleton width="75%" height={14} borderRadius={4} />
                      </div>

                      {/* Due date and relative tag */}
                      <div className="assignment-card__meta">
                        <Skeleton width={110} height={14} borderRadius={4} />
                        <Skeleton width={64} height={19} borderRadius={999} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side of card */}
                <div className="assignment-card__right">
                  <div className="assignment-card__header">
                    <Skeleton width={74} height={26} borderRadius={999} />
                    <Skeleton width={26} height={26} borderRadius={6} />
                  </div>

                  <div className="space-y-1.5">
                    <Skeleton width={60} height={12} borderRadius={4} />
                    <div className="flex items-center gap-1.5">
                      <Skeleton width="100%" height={8} borderRadius={999} />
                      <Skeleton width={26} height={12} borderRadius={4} />
                    </div>
                  </div>

                  <Skeleton width="100%" height={28} borderRadius={8} />
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="assignments-footer">
            <Skeleton width={180} height={14} borderRadius={4} />
            <Skeleton width={120} height={16} borderRadius={4} />
          </div>
        </div>

        {/* Right Rail: 3 Widgets */}
        <aside className="assignments-rail">
          {/* Widget 1: Upcoming deadlines */}
          <section className="assignments-widget">
            <Skeleton width={130} height={18} borderRadius={4} className="mb-2" />
            <ul className="assignments-deadlines">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i}>
                  <Skeleton width={32} height={32} borderRadius={8} />
                  <div className="space-y-1 min-w-0">
                    <Skeleton width="85%" height={12} borderRadius={4} />
                    <Skeleton width="60%" height={10} borderRadius={4} />
                  </div>
                  <Skeleton width={42} height={18} borderRadius={999} />
                </li>
              ))}
            </ul>
            <div className="pt-2">
              <Skeleton width={100} height={14} borderRadius={4} />
            </div>
          </section>

          {/* Widget 2: Your progress */}
          <section className="assignments-widget assignments-widget--progress">
            <Skeleton width={100} height={18} borderRadius={4} className="mb-2" />
            <div className="assignments-progress">
              <div className="grid place-items-center py-1">
                <Skeleton width={88} height={88} circle />
              </div>
              <ul className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Skeleton width={8} height={8} circle />
                      <Skeleton width={75} height={12} borderRadius={4} />
                    </div>
                    <Skeleton width={32} height={12} borderRadius={4} />
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-2">
              <Skeleton width={90} height={14} borderRadius={4} />
            </div>
          </section>

          {/* Widget 3: Recent feedback */}
          <section className="assignments-widget">
            <Skeleton width={110} height={18} borderRadius={4} className="mb-2" />
            <ul className="assignments-feedback">
              {Array.from({ length: 2 }).map((_, i) => (
                <li key={i}>
                  <Skeleton width={20} height={20} circle />
                  <div className="space-y-1 min-w-0">
                    <Skeleton width="75%" height={12} borderRadius={4} />
                    <Skeleton width="95%" height={10} borderRadius={4} />
                    <Skeleton width={50} height={9} borderRadius={4} />
                  </div>
                  <Skeleton width={38} height={14} borderRadius={4} />
                </li>
              ))}
            </ul>
            <div className="pt-2">
              <Skeleton width={110} height={14} borderRadius={4} />
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
};

/**
 * 6. MESSAGES PAGE SKELETON
 * Matches MessagesLayout 3-column architecture:
 * - Col 1: Conversation List (~340px)
 * - Col 2: Chat Window (flex-1)
 * - Col 3: Context Sidebar (~280px)
 */
export const MessagesSkeleton: React.FC = () => {
  return (
    <section className="student-page student-page--messages h-full w-full overflow-hidden" aria-busy="true" aria-label="Loading messages">
      <div className="flex h-full w-full rounded-2xl border border-[#dfe9e4] bg-white overflow-hidden shadow-2xs">
        {/* Col 1: Conversation List */}
        <div className="w-full sm:w-85 border-r border-[#dfe9e4] flex flex-col shrink-0 p-3.5 space-y-3">
          <div className="flex justify-between items-center">
            <Skeleton width={100} height={22} borderRadius={6} />
            <Skeleton width={32} height={32} borderRadius={8} />
          </div>
          <Skeleton width="100%" height={40} borderRadius={12} />
          <div className="flex gap-2">
            <Skeleton width={50} height={26} borderRadius={999} />
            <Skeleton width={60} height={26} borderRadius={999} />
            <Skeleton width={60} height={26} borderRadius={999} />
          </div>
          <div className="space-y-2 flex-1 pt-1 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 bg-gray-50/60">
                <SkeletonAvatar size={42} />
                <div className="space-y-1.5 flex-1">
                  <div className="flex justify-between">
                    <Skeleton width={90} height={14} borderRadius={4} />
                    <Skeleton width={35} height={10} borderRadius={4} />
                  </div>
                  <Skeleton width="70%" height={12} borderRadius={4} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Col 2: Chat Window */}
        <div className="hidden sm:flex flex-1 flex-col justify-between p-4 bg-[#fbfdfc]">
          <div className="flex items-center justify-between pb-3 border-b border-[#dfe9e4]">
            <div className="flex items-center gap-3">
              <SkeletonAvatar size={40} />
              <div className="space-y-1.5">
                <Skeleton width={120} height={16} borderRadius={4} />
                <Skeleton width={60} height={10} borderRadius={4} />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton width={34} height={34} borderRadius={8} />
              <Skeleton width={34} height={34} borderRadius={8} />
            </div>
          </div>

          {/* Bubbles */}
          <div className="space-y-4 py-4 flex-1">
            <div className="flex gap-2 items-start max-w-sm">
              <SkeletonAvatar size={28} />
              <Skeleton width={220} height={50} borderRadius={14} />
            </div>
            <div className="flex justify-end">
              <Skeleton width={200} height={42} borderRadius={14} className="bg-emerald-100/60" />
            </div>
            <div className="flex gap-2 items-start max-w-sm">
              <SkeletonAvatar size={28} />
              <Skeleton width={250} height={60} borderRadius={14} />
            </div>
          </div>

          <Skeleton width="100%" height={48} borderRadius={14} />
        </div>

        {/* Col 3: Context Sidebar */}
        <div className="hidden lg:flex w-70 flex-col p-4 border-l border-[#dfe9e4] space-y-4 shrink-0">
          <div className="flex flex-col items-center text-center space-y-2 pt-2">
            <SkeletonAvatar size={64} />
            <Skeleton width={110} height={18} borderRadius={4} />
            <Skeleton width={80} height={12} borderRadius={4} />
          </div>
          <div className="space-y-2 pt-4">
            <Skeleton width="100%" height={32} borderRadius={8} />
            <Skeleton width="100%" height={32} borderRadius={8} />
            <Skeleton width="100%" height={32} borderRadius={8} />
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * 7. COMMUNITY PAGE SKELETON
 * Matches Community layout:
 * - Search & Filter Toolbar
 * - Main 2-column feed: Featured Study Group + Trending Topics
 * - Discussion Feed + Mentor Spotlight
 * - Right Sidebar: Stats, Events, Top Contributors
 */
export const CommunitySkeleton: React.FC = () => {
  return (
    <section className="student-page student-page--community h-full w-full overflow-hidden" aria-busy="true" aria-label="Loading community">
      <div className="w-full max-w-430 h-full mx-auto px-3.5 sm:px-4 lg:px-6 py-2.5 sm:py-3 flex flex-col justify-between gap-3 min-h-0">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2 flex-1 max-w-xl">
            <Skeleton width="100%" height={42} borderRadius={12} />
            <Skeleton width={100} height={42} borderRadius={12} />
          </div>
          <Skeleton width={130} height={42} borderRadius={12} />
        </div>

        {/* 2-Column row */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row items-stretch gap-3 w-full">
          {/* Main Feed */}
          <div className="flex-1 flex flex-col gap-3 min-h-0">
            {/* Top row: Featured Group (7 cols) + Trending (5 cols) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 flex-1 min-h-0">
              <div className="xl:col-span-7">
                <SkeletonHeroCard height="100%" className="h-full" />
              </div>
              <div className="xl:col-span-5">
                <SkeletonCardWrapper className="h-full flex flex-col justify-between">
                  <Skeleton width={140} height={18} borderRadius={4} />
                  <div className="space-y-2 my-2">
                    <Skeleton width="100%" height={36} borderRadius={8} />
                    <Skeleton width="100%" height={36} borderRadius={8} />
                    <Skeleton width="100%" height={36} borderRadius={8} />
                  </div>
                </SkeletonCardWrapper>
              </div>
            </div>

            {/* Bottom row: Feed (8 cols) + Mentor (4 cols) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 flex-1 min-h-0">
              <div className="xl:col-span-8">
                <SkeletonCardWrapper className="h-full flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <Skeleton width={130} height={18} borderRadius={4} />
                    <Skeleton width={70} height={14} borderRadius={4} />
                  </div>
                  <div className="space-y-2.5">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex gap-3 p-2.5 rounded-xl bg-gray-50">
                        <SkeletonAvatar size={36} />
                        <div className="space-y-1.5 flex-1">
                          <Skeleton width="60%" height={14} borderRadius={4} />
                          <Skeleton width="90%" height={12} borderRadius={4} />
                        </div>
                      </div>
                    ))}
                  </div>
                </SkeletonCardWrapper>
              </div>
              <div className="xl:col-span-4">
                <SkeletonCardWrapper className="h-full flex flex-col justify-between">
                  <Skeleton width={120} height={18} borderRadius={4} />
                  <div className="flex flex-col items-center py-2 space-y-2">
                    <SkeletonAvatar size={56} />
                    <Skeleton width={110} height={16} borderRadius={4} />
                    <Skeleton width={80} height={12} borderRadius={4} />
                  </div>
                  <Skeleton width="100%" height={36} borderRadius={10} />
                </SkeletonCardWrapper>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="hidden lg:flex w-75 flex-col gap-3 shrink-0">
            <SkeletonCardWrapper className="flex-1 flex flex-col justify-between">
              <Skeleton width={110} height={18} borderRadius={4} />
              <div className="space-y-2">
                <Skeleton width="100%" height={30} borderRadius={8} />
                <Skeleton width="100%" height={30} borderRadius={8} />
              </div>
            </SkeletonCardWrapper>
            <SkeletonCardWrapper className="flex-1 flex flex-col justify-between">
              <Skeleton width={120} height={18} borderRadius={4} />
              <div className="space-y-2">
                <Skeleton width="100%" height={34} borderRadius={8} />
                <Skeleton width="100%" height={34} borderRadius={8} />
              </div>
            </SkeletonCardWrapper>
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * 8. SETTINGS PAGE SKELETON
 * Matches Settings layout:
 * - Greenish-grey hero banner
 * - Left tab nav pills / sidebar
 * - Right card form fields
 */
export const SettingsSkeleton: React.FC = () => {
  return (
    <section className="student-page student-page--settings w-full h-full min-h-0 space-y-4" aria-busy="true" aria-label="Loading settings">
      {/* Settings Hero Banner (Soft greenish-grey) */}
      <div className="relative overflow-hidden rounded-2xl bg-[#e7ede9] border border-[#d6eedf] px-5 py-4 flex items-center justify-between shadow-2xs">
        <div className="space-y-2">
          <Skeleton width={130} height={24} borderRadius={6} variant="contrast" />
          <Skeleton width={260} height={14} borderRadius={4} variant="contrast" />
        </div>
        <Skeleton width={120} height={36} borderRadius={10} variant="contrast" />
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left Tab navigation */}
        <div className="w-full lg:w-64 shrink-0 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={42} borderRadius={12} />
          ))}
        </div>

        {/* Right Settings Form Container */}
        <div className="flex-1 space-y-4">
          <SkeletonCardWrapper className="space-y-4">
            <div className="flex items-center gap-4">
              <SkeletonAvatar size={64} />
              <div className="space-y-2">
                <Skeleton width={130} height={18} borderRadius={4} />
                <Skeleton width={90} height={32} borderRadius={8} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <Skeleton width={80} height={14} borderRadius={4} />
                <Skeleton width="100%" height={42} borderRadius={10} />
              </div>
              <div className="space-y-1.5">
                <Skeleton width={80} height={14} borderRadius={4} />
                <Skeleton width="100%" height={42} borderRadius={10} />
              </div>
              <div className="space-y-1.5">
                <Skeleton width={60} height={14} borderRadius={4} />
                <Skeleton width="100%" height={42} borderRadius={10} />
              </div>
              <div className="space-y-1.5">
                <Skeleton width={90} height={14} borderRadius={4} />
                <Skeleton width="100%" height={42} borderRadius={10} />
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <Skeleton width={120} height={40} borderRadius={10} />
            </div>
          </SkeletonCardWrapper>
        </div>
      </div>
    </section>
  );
};

/**
 * 9. HELP CENTER SKELETON
 * Matches HelpCenter layout:
 * - Help Hero Search Banner (greenish-grey)
 * - 8 Categories Grid
 * - Popular Articles Grid
 * - Support Sidebar
 */
export const HelpCenterSkeleton: React.FC = () => {
  return (
    <section className="student-page student-page--help w-full h-full min-h-0 space-y-4" aria-busy="true" aria-label="Loading help center">
      {/* Help Hero Search Banner (Soft greenish-grey) */}
      <div className="relative overflow-hidden rounded-2xl bg-[#e7ede9] border border-[#d6eedf] px-6 py-8 flex flex-col items-center text-center space-y-4 shadow-2xs">
        <Skeleton width={200} height={28} borderRadius={6} variant="contrast" />
        <Skeleton width={320} height={16} borderRadius={4} variant="contrast" />
        <Skeleton width="100%" height={48} borderRadius={16} className="max-w-xl bg-white" />
        <div className="flex gap-2 pt-1">
          <Skeleton width={80} height={24} borderRadius={999} variant="contrast" />
          <Skeleton width={90} height={24} borderRadius={999} variant="contrast" />
          <Skeleton width={70} height={24} borderRadius={999} variant="contrast" />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left Column: Categories and Articles */}
        <div className="flex-1 space-y-4">
          {/* Categories Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCardWrapper key={i} className="flex flex-col items-center text-center p-4 space-y-2">
                <Skeleton width={36} height={36} borderRadius={10} />
                <Skeleton width="75%" height={14} borderRadius={4} />
              </SkeletonCardWrapper>
            ))}
          </div>

          {/* Popular Articles Grid */}
          <div className="space-y-3">
            <Skeleton width={140} height={20} borderRadius={6} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCardWrapper key={i} className="space-y-2">
                  <Skeleton width={28} height={28} borderRadius={8} />
                  <Skeleton width="85%" height={16} borderRadius={4} />
                  <Skeleton width="60%" height={12} borderRadius={4} />
                </SkeletonCardWrapper>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-75 shrink-0 space-y-4">
          <SkeletonCardWrapper className="space-y-3">
            <Skeleton width={130} height={18} borderRadius={4} />
            <Skeleton width="100%" height={38} borderRadius={10} />
            <Skeleton width="100%" height={38} borderRadius={10} />
          </SkeletonCardWrapper>
          <SkeletonCardWrapper className="space-y-3">
            <Skeleton width={120} height={18} borderRadius={4} />
            <Skeleton width="100%" height={70} borderRadius={10} />
          </SkeletonCardWrapper>
        </div>
      </div>
    </section>
  );
};

/**
 * 10. PROFILE PAGE SKELETON (WITH TABS SUPPORT)
 * Matches Profile Header (avatar, stats, nav tabs) and provides tab-specific card layouts
 */
export const ProfileSkeleton: React.FC<{ activeTab?: "overview" | "achievements" | "saved" | "activity" | "settings" }> = ({
  activeTab = "overview",
}) => {
  return (
    <section className="profile-page flex flex-col h-full min-h-0 w-full max-w-550 mx-auto overflow-y-auto space-y-4" aria-busy="true" aria-label="Loading profile">
      {/* Profile Header Hero (Soft greenish-grey) */}
      <div className="relative overflow-hidden rounded-2xl bg-[#e7ede9] border border-[#d6eedf] px-5 py-4 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <SkeletonAvatar size={76} className="bg-[#d8e2dc]" />
          <div className="flex-1 space-y-2 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <Skeleton width={150} height={24} borderRadius={6} variant="contrast" />
              <Skeleton width={70} height={22} borderRadius={999} variant="contrast" />
            </div>
            <Skeleton width={200} height={14} borderRadius={4} variant="contrast" />
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <Skeleton width={80} height={14} borderRadius={4} variant="contrast" />
              <Skeleton width={90} height={14} borderRadius={4} variant="contrast" />
            </div>
          </div>
          <Skeleton width={110} height={38} borderRadius={12} variant="contrast" />
        </div>

        {/* Tab Navigation Row */}
        <div className="flex gap-2 pt-2 border-t border-[#d8e2dc]">
          {["Overview", "Achievements", "Saved", "Activity", "Settings"].map((t) => (
            <Skeleton key={t} width={90} height={32} borderRadius={8} variant="contrast" />
          ))}
        </div>
      </div>

      {/* Tab Specific Content Skeletons */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 lg:gap-4 flex-1">
          {/* Card 1: About Me */}
          <SkeletonCardWrapper className="space-y-3">
            <Skeleton width={100} height={20} borderRadius={4} />
            <SkeletonText lines={4} />
            <Skeleton width={60} height={24} borderRadius={6} className="mt-4" />
          </SkeletonCardWrapper>

          {/* Card 2: Enrolled Courses */}
          <SkeletonCardWrapper className="space-y-3">
            <div className="flex justify-between items-center">
              <Skeleton width={130} height={20} borderRadius={4} />
              <Skeleton width={50} height={14} borderRadius={4} />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50">
                <Skeleton width={48} height={48} borderRadius={10} />
                <div className="space-y-1.5 flex-1">
                  <Skeleton width="80%" height={14} borderRadius={4} />
                  <Skeleton width="50%" height={8} borderRadius={999} />
                </div>
              </div>
            ))}
          </SkeletonCardWrapper>

          {/* Card 3: My Goals */}
          <SkeletonCardWrapper className="space-y-3">
            <div className="flex justify-between items-center">
              <Skeleton width={100} height={20} borderRadius={4} />
              <Skeleton width={50} height={14} borderRadius={4} />
            </div>
            <div className="space-y-2.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <Skeleton width={20} height={20} circle />
                  <Skeleton width="85%" height={14} borderRadius={4} />
                </div>
              ))}
            </div>
          </SkeletonCardWrapper>

          {/* Card 4: Upcoming */}
          <SkeletonCardWrapper className="space-y-3">
            <div className="flex justify-between items-center">
              <Skeleton width={100} height={20} borderRadius={4} />
              <Skeleton width={70} height={14} borderRadius={4} />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-gray-50">
                <Skeleton width={40} height={40} borderRadius={10} />
                <div className="space-y-1.5 flex-1">
                  <Skeleton width="75%" height={14} borderRadius={4} />
                  <Skeleton width="45%" height={10} borderRadius={4} />
                </div>
              </div>
            ))}
          </SkeletonCardWrapper>

          {/* Card 5: Interests */}
          <SkeletonCardWrapper className="space-y-3">
            <Skeleton width={90} height={20} borderRadius={4} />
            <div className="flex flex-wrap gap-2 pt-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} width={80} height={28} borderRadius={10} />
              ))}
            </div>
          </SkeletonCardWrapper>

          {/* Card 6: Recent Activity */}
          <SkeletonCardWrapper className="space-y-3">
            <div className="flex justify-between items-center">
              <Skeleton width={120} height={20} borderRadius={4} />
              <Skeleton width={50} height={14} borderRadius={4} />
            </div>
            <div className="space-y-2.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-1 flex-1">
                    <Skeleton width="70%" height={14} borderRadius={4} />
                    <Skeleton width="40%" height={10} borderRadius={4} />
                  </div>
                  <Skeleton width={40} height={10} borderRadius={4} />
                </div>
              ))}
            </div>
          </SkeletonCardWrapper>
        </div>
      )}

      {activeTab === "achievements" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCardWrapper key={i} className="space-y-2">
                <Skeleton width={100} height={16} borderRadius={4} />
                <Skeleton width={60} height={28} borderRadius={6} />
              </SkeletonCardWrapper>
            ))}
          </div>
          <SkeletonCardWrapper className="space-y-3">
            <Skeleton width={140} height={20} borderRadius={4} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center p-3 rounded-xl bg-gray-50 space-y-2">
                  <Skeleton width={44} height={44} circle />
                  <Skeleton width={70} height={12} borderRadius={4} />
                </div>
              ))}
            </div>
          </SkeletonCardWrapper>
        </div>
      )}

      {activeTab === "saved" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} width={90} height={32} borderRadius={999} />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      )}

      {activeTab === "activity" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCardWrapper key={i} className="space-y-1.5">
                <Skeleton width={70} height={14} borderRadius={4} />
                <Skeleton width={50} height={24} borderRadius={6} />
              </SkeletonCardWrapper>
            ))}
          </div>
          <SkeletonCardWrapper className="h-64 flex flex-col justify-between">
            <Skeleton width={160} height={20} borderRadius={4} />
            <Skeleton width="100%" height={160} borderRadius={8} />
          </SkeletonCardWrapper>
        </div>
      )}

      {activeTab === "settings" && (
        <SkeletonCardWrapper className="max-w-xl mx-auto p-8 space-y-3 flex flex-col items-center text-center">
          <Skeleton width={48} height={48} circle />
          <Skeleton width={140} height={18} borderRadius={4} />
          <Skeleton width={260} height={14} borderRadius={4} />
        </SkeletonCardWrapper>
      )}
    </section>
  );
};
