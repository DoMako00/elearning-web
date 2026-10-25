import React from "react";
import { Skeleton } from "./Skeleton";
import "../../../features/admin-v2/styles/admin-v2.css";
import "../../../features/admin-v2/styles/admin-v2-phase2.css";

/**
 * 1. ADMIN OVERVIEW SKELETON
 * Matches AdminV2 OverviewPage:
 * - Welcome Card (badge, title, subtitle, icon)
 * - 4 Metric Cards (Students, Courses, Content in Review, Payments)
 * - Platform Workflow (4 steps)
 */
export const AdminOverviewSkeleton: React.FC = () => {
  return (
    <section className="admin-v2__page admin-v2__workflow-page" aria-busy="true" aria-label="Loading admin overview">
      {/* Welcome Card */}
      <div className="rounded-xl border border-[#e5ebe7] bg-white p-6 shadow-xs flex justify-between items-center gap-4">
        <div className="space-y-2">
          <Skeleton width={180} height={20} borderRadius={999} />
          <Skeleton width={260} height={26} borderRadius={6} />
          <Skeleton width={420} height={14} borderRadius={4} />
        </div>
        <Skeleton width={58} height={58} circle className="shrink-0" />
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Student accounts" },
          { label: "Published courses" },
          { label: "Content awaiting review" },
          { label: "Payments to review" },
        ].map((_, idx) => (
          <div key={idx} className="rounded-xl border border-[#e5ebe7] bg-white p-4 shadow-xs flex items-center gap-3">
            <Skeleton width={42} height={42} borderRadius={8} className="shrink-0" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <Skeleton width={90} height={12} borderRadius={3} />
              <Skeleton width={60} height={24} borderRadius={4} />
              <Skeleton width={110} height={11} borderRadius={3} />
            </div>
          </div>
        ))}
      </div>

      {/* Platform Workflow Card */}
      <div className="rounded-xl border border-[#e5ebe7] bg-white p-5 shadow-xs space-y-4">
        <div className="space-y-1 pb-2 border-b border-[#edf0ee]">
          <Skeleton width={140} height={12} borderRadius={3} />
          <Skeleton width={220} height={20} borderRadius={5} />
          <Skeleton width={380} height={13} borderRadius={3} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {[0, 1, 2, 3].map((step) => (
            <div key={step} className="rounded-lg border border-[#e8edea] bg-[#fcfdfc] p-3.5 space-y-2.5 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton width={28} height={28} borderRadius={6} />
                  <Skeleton width={20} height={14} borderRadius={3} />
                </div>
                <Skeleton width="85%" height={16} borderRadius={4} />
                <Skeleton width="100%" height={12} borderRadius={3} />
                <Skeleton width="70%" height={12} borderRadius={3} />
              </div>
              <Skeleton width={100} height={28} borderRadius={6} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/**
 * 2. INSTRUCTOR OVERVIEW SKELETON
 * Matches InstructorOverviewPage:
 * - Welcome Card ("INSTRUCTOR WORKSPACE")
 * - 4 Metric Cards (My courses, Assignments to grade, Published exams, Materials in review)
 * - Teaching Flow (5 steps)
 * - Assigned courses grid
 */
export const InstructorOverviewSkeleton: React.FC = () => {
  return (
    <section className="admin-v2__page admin-v2__workflow-page" aria-busy="true" aria-label="Loading instructor overview">
      {/* Welcome Card */}
      <div className="rounded-xl border border-[#e5ebe7] bg-white p-6 shadow-xs flex justify-between items-center gap-4">
        <div className="space-y-2">
          <Skeleton width={160} height={20} borderRadius={999} />
          <Skeleton width={280} height={26} borderRadius={6} />
          <Skeleton width={440} height={14} borderRadius={4} />
        </div>
        <Skeleton width={58} height={58} circle className="shrink-0" />
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "My courses" },
          { label: "Assignments to grade" },
          { label: "Published exams" },
          { label: "Materials in review" },
        ].map((_, idx) => (
          <div key={idx} className="rounded-xl border border-[#e5ebe7] bg-white p-4 shadow-xs flex items-center gap-3">
            <Skeleton width={42} height={42} borderRadius={8} className="shrink-0" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <Skeleton width={95} height={12} borderRadius={3} />
              <Skeleton width={50} height={24} borderRadius={4} />
              <Skeleton width={115} height={11} borderRadius={3} />
            </div>
          </div>
        ))}
      </div>

      {/* Teaching Workflow Card */}
      <div className="rounded-xl border border-[#e5ebe7] bg-white p-5 shadow-xs space-y-4">
        <div className="space-y-1 pb-2 border-b border-[#edf0ee]">
          <Skeleton width={140} height={12} borderRadius={3} />
          <Skeleton width={240} height={20} borderRadius={5} />
          <Skeleton width={400} height={13} borderRadius={3} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
          {[0, 1, 2, 3, 4].map((step) => (
            <div key={step} className="rounded-lg border border-[#e8edea] bg-[#fcfdfc] p-3 space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <Skeleton width={24} height={24} borderRadius={6} />
                <Skeleton width="85%" height={15} borderRadius={4} />
                <Skeleton width="100%" height={11} borderRadius={3} />
                <Skeleton width="65%" height={11} borderRadius={3} />
              </div>
              <Skeleton width={90} height={26} borderRadius={5} />
            </div>
          ))}
        </div>
      </div>

      {/* Assigned Courses Section */}
      <div className="space-y-3 pt-2">
        <div className="flex justify-between items-center">
          <Skeleton width={160} height={20} borderRadius={5} />
          <Skeleton width={100} height={14} borderRadius={4} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[0, 1, 2].map((k) => (
            <div key={k} className="rounded-xl border border-[#e5ebe7] bg-white p-4 shadow-xs space-y-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <Skeleton width={150} height={18} borderRadius={4} />
                  <Skeleton width={90} height={12} borderRadius={3} />
                </div>
                <Skeleton width={60} height={20} borderRadius={999} />
              </div>
              <div className="space-y-1 pt-2">
                <Skeleton width="100%" height={8} borderRadius={999} />
                <div className="flex justify-between text-xs">
                  <Skeleton width={70} height={11} borderRadius={2} />
                  <Skeleton width={40} height={11} borderRadius={2} />
                </div>
              </div>
              <Skeleton width="100%" height={34} borderRadius={6} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/**
 * 3. ADMIN TABLE SKELETON
 * Universal Table Skeleton matching:
 * - CoursesPage, InstructorsPage, StudentsPage, PaymentsPage,
 * - ContentApprovalsPage, CurriculumPage, SubscriptionsPage, RolesPage, SecurityPage
 */
export const AdminTableSkeleton: React.FC<{ columns?: number; rows?: number }> = ({
  columns = 6,
  rows = 7,
}) => {
  return (
    <section className="admin-v2__page" aria-busy="true" aria-label="Loading table data">
      {/* Filter Bar */}
      <div className="admin-v2__filterbar">
        {[0, 1, 2, 3, 4].map((f) => (
          <div key={f} className="admin-v2__filter-field space-y-1">
            <Skeleton width={50} height={10} borderRadius={2} />
            <Skeleton width="100%" height={34} borderRadius={5} />
          </div>
        ))}
        <div className="flex items-end">
          <Skeleton width={80} height={34} borderRadius={5} />
        </div>
      </div>

      {/* Main Table Card */}
      <div className="admin-v2__workgrid">
        <div className="admin-v2__table-card">
          {/* Table Toolbar */}
          <div className="admin-v2__table-toolbar">
            <div className="flex items-center gap-3">
              <Skeleton width={120} height={18} borderRadius={4} />
              <Skeleton width={60} height={18} borderRadius={999} />
            </div>
            <div className="admin-v2__table-tools">
              <div className="admin-v2__search">
                <Skeleton width={14} height={14} borderRadius={3} />
                <Skeleton width="100%" height={12} borderRadius={3} />
              </div>
              <Skeleton width={85} height={34} borderRadius={5} />
            </div>
          </div>

          {/* Table Scroll Area */}
          <div className="admin-v2__table-scroll">
            <table className="admin-v2__table">
              <thead>
                <tr>
                  {Array.from({ length: columns }).map((_, c) => (
                    <th key={c}>
                      <Skeleton width={c === 0 ? 110 : 75} height={12} borderRadius={3} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: rows }).map((_, r) => (
                  <tr key={r}>
                    {/* Column 1: Primary title with optional avatar */}
                    <td>
                      <div className="flex items-center gap-2.5">
                        <Skeleton width={28} height={28} borderRadius={6} className="shrink-0" />
                        <div className="space-y-1">
                          <Skeleton width={130} height={14} borderRadius={3} />
                          <Skeleton width={70} height={10} borderRadius={2} />
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Brand badge */}
                    <td>
                      <Skeleton width={68} height={22} borderRadius={4} />
                    </td>

                    {/* Column 3: Category / Code / Identifier */}
                    <td>
                      <Skeleton width={85} height={13} borderRadius={3} />
                    </td>

                    {/* Column 4: Status badge */}
                    <td>
                      <Skeleton width={64} height={20} borderRadius={999} />
                    </td>

                    {/* Column 5: Date / Numeric value */}
                    <td>
                      <Skeleton width={70} height={12} borderRadius={3} />
                    </td>

                    {/* Column 6: Action buttons */}
                    {columns > 5 && (
                      <td>
                        <div className="flex items-center gap-1.5">
                          <Skeleton width={55} height={26} borderRadius={4} />
                          <Skeleton width={26} height={26} borderRadius={4} />
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <footer className="admin-v2__pagination flex justify-between items-center p-3 border-t border-[#edf0ee]">
            <Skeleton width={160} height={12} borderRadius={3} />
            <div className="flex items-center gap-2">
              <Skeleton width={28} height={28} borderRadius={4} />
              <Skeleton width={40} height={14} borderRadius={3} />
              <Skeleton width={28} height={28} borderRadius={4} />
            </div>
          </footer>
        </div>
      </div>
    </section>
  );
};

/**
 * 4. INSTRUCTOR COURSE CONTENT SKELETON
 * Matches InstructorCourseContentPage (/admin/instructor/courses/:courseId)
 */
export const InstructorCourseContentSkeleton: React.FC = () => {
  return (
    <section className="admin-v2__page" aria-busy="true" aria-label="Loading course content">
      {/* Course Banner */}
      <div className="rounded-xl border border-[#e5ebe7] bg-white p-5 shadow-xs flex justify-between items-center gap-4">
        <div className="space-y-2">
          <Skeleton width={90} height={14} borderRadius={3} />
          <Skeleton width={240} height={24} borderRadius={5} />
          <Skeleton width={320} height={13} borderRadius={3} />
        </div>
        <div className="flex gap-2">
          <Skeleton width={110} height={34} borderRadius={6} />
          <Skeleton width={120} height={34} borderRadius={6} />
        </div>
      </div>

      {/* Chapters & Lessons List */}
      <div className="space-y-3">
        {[0, 1, 2].map((ch) => (
          <div key={ch} className="rounded-xl border border-[#e5ebe7] bg-white p-4 shadow-xs space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-[#edf0ee]">
              <div className="flex items-center gap-3">
                <Skeleton width={24} height={24} borderRadius={6} />
                <div className="space-y-1">
                  <Skeleton width={160} height={16} borderRadius={4} />
                  <Skeleton width={80} height={11} borderRadius={2} />
                </div>
              </div>
              <Skeleton width={85} height={28} borderRadius={5} />
            </div>
            <div className="space-y-2">
              {[0, 1, 2].map((ls) => (
                <div key={ls} className="flex items-center justify-between p-2.5 rounded-lg border border-[#eef1ef] bg-[#fbfdfb]">
                  <div className="flex items-center gap-3">
                    <Skeleton width={20} height={20} borderRadius={4} />
                    <Skeleton width={180} height={14} borderRadius={3} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton width={60} height={20} borderRadius={999} />
                    <Skeleton width={70} height={24} borderRadius={4} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

/**
 * 5. COURSE BUILDER SKELETON
 * Matches CourseBuilderPage (/admin/courses/:courseId/builder)
 */
export const CourseBuilderSkeleton: React.FC = () => {
  return (
    <section className="admin-v2__page h-full min-h-0 flex-1 flex flex-col" aria-busy="true" aria-label="Loading course builder">
      {/* Top Header */}
      <div className="flex justify-between items-center pb-3 border-b border-[#e5ebe7]">
        <div className="space-y-1">
          <Skeleton width={200} height={22} borderRadius={4} />
          <Skeleton width={140} height={12} borderRadius={3} />
        </div>
        <div className="flex gap-2">
          <Skeleton width={90} height={34} borderRadius={6} />
          <Skeleton width={110} height={34} borderRadius={6} />
        </div>
      </div>

      {/* Two-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 pt-3">
        {/* Left Tree Pane (4 cols) */}
        <div className="lg:col-span-4 rounded-xl border border-[#e5ebe7] bg-white p-4 flex flex-col gap-3 shadow-xs">
          <div className="flex justify-between items-center pb-2 border-b border-[#edf0ee]">
            <Skeleton width={110} height={16} borderRadius={4} />
            <Skeleton width={32} height={32} borderRadius={6} />
          </div>
          <div className="space-y-2 flex-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-[#f7f9f8]">
                <Skeleton width={16} height={16} borderRadius={3} />
                <Skeleton width="75%" height={14} borderRadius={3} />
              </div>
            ))}
          </div>
        </div>

        {/* Right Editor Canvas (8 cols) */}
        <div className="lg:col-span-8 rounded-xl border border-[#e5ebe7] bg-white p-5 flex flex-col gap-4 shadow-xs">
          <div className="space-y-1.5">
            <Skeleton width={80} height={12} borderRadius={2} />
            <Skeleton width="100%" height={38} borderRadius={6} />
          </div>
          <div className="space-y-1.5">
            <Skeleton width={100} height={12} borderRadius={2} />
            <Skeleton width="100%" height={120} borderRadius={8} />
          </div>
          <div className="space-y-1.5">
            <Skeleton width={110} height={12} borderRadius={2} />
            <div className="rounded-xl border border-dashed border-[#cfe0d5] p-8 flex flex-col items-center justify-center gap-2 bg-[#f9fbf9]">
              <Skeleton width={44} height={44} circle />
              <Skeleton width={180} height={14} borderRadius={4} />
              <Skeleton width={120} height={11} borderRadius={3} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
