import React, { useState, useMemo } from "react";
import { TopAppBar } from "../TopAppBar";
import {
  HeroBand,
  StatusFilterTabs,
  AssignmentCard,
  AssignmentProgressRing,
  MobileToast,
} from "../shared";
import { useScreenStack } from "../ScreenStack";
import { useToast } from "../../../hooks/useToast";
import type {
  AssignmentFilter,
  AssignmentItem,
} from "../../ui/Assignments/assignments.types";
import { AssignmentDetailScreen } from "./AssignmentDetailScreen";
import { BookOpen } from "lucide-react";
import { useStudentAssignments } from "../../../features/student/api/useStudentAssignments";
import { mapStudentAssignment } from "../../../features/student/api/studentAssignmentMapper";
import type { StudentAssignmentDto } from "../../../features/student/api/studentAssignmentsApi";

export const AssignmentsScreen: React.FC = () => {
  const { push } = useScreenStack();
  const { toastMessage, showToast } = useToast();
  const assignmentsQuery = useStudentAssignments();
  const assignments = useMemo(() => assignmentsQuery.data ?? [], [assignmentsQuery.data]);
  const items = useMemo(() => assignments.map((assignment) => mapStudentAssignment(assignment)), [assignments]);

  const [activeTab, setActiveTab] = useState<AssignmentFilter>("all");

  const counts = useMemo(() => {
    const inProgress = items.filter((item) => item.status === "in-progress").length;
    const submitted = items.filter((item) => item.status === "submitted").length;
    const graded = items.filter((item) => item.status === "graded").length;
    const notStarted = items.filter((item) => item.status === "not-started").length;
    return {
      all: items.length,
      "in-progress": inProgress,
      submitted,
      graded,
      notStarted,
      completed: submitted + graded,
    };
  }, [items]);

  // Filter tabs array (All / In progress / Submitted / Graded)
  const filterTabs = [
    { key: "all", label: "All", count: counts.all },
    { key: "in-progress", label: "In progress", count: counts["in-progress"] },
    { key: "submitted", label: "Submitted", count: counts.submitted },
    { key: "graded", label: "Graded", count: counts.graded },
  ];

  // Filtered assignments list
  const filteredItems = useMemo(() => {
    if (activeTab === "all") return items;
    return items.filter((item) => item.status === activeTab);
  }, [activeTab, items]);

  // Navigate to Assignment Detail screen
  const handleOpenDetail = (item: AssignmentItem) => {
    const detailData: StudentAssignmentDto | undefined = assignments.find((assignment) => assignment.id === item.id);
    if (!detailData) return;
    push({
      id: `assignment-${item.id}`,
      title: item.title,
      variant: "detail",
      backLabel: "Assignments",
      component: <AssignmentDetailScreen assignment={detailData} />,
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
      {/* 1. TopAppBar (variant="main") */}
      <TopAppBar variant="main" />

      {/* Main scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/* 2. HeroBand */}
        <HeroBand
          eyebrow="ACADEMIC TASKS"
          heading="Assignments"
          subtitle="Read, learn, and submit your work."
          illustration={
            <div className="relative w-28 h-24 flex items-center justify-center">
              <div className="size-18 rounded-2xl bg-emerald-100/70 border border-emerald-200/80 flex items-center justify-center text-emerald-700 shadow-xs">
                <BookOpen className="size-9 stroke-[1.8]" />
              </div>
            </div>
          }
        />

        {/* Inner Content */}
        <div className="px-4 pt-2 pb-12 space-y-4 max-w-lg mx-auto">
          {/* 3. StatusFilterTabs */}
          <StatusFilterTabs
            tabs={filterTabs}
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as AssignmentFilter)}
          />

          {/* 4. AssignmentProgressRing */}
          <AssignmentProgressRing
            completed={counts.completed}
            inProgress={counts["in-progress"]}
            notStarted={counts.notStarted}
            total={counts.all}
            onViewStats={() => showToast("Assignment totals reflect your saved assignment records.")}
          />

          {/* 5. Assignment Cards List */}
          <section aria-label="Assignments List" className="space-y-3 pt-1">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {activeTab === "all" ? "All Assignments" : `${filterTabs.find(t => t.key === activeTab)?.label} (${filteredItems.length})`}
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                {filteredItems.length} {filteredItems.length === 1 ? "task" : "tasks"}
              </span>
            </div>

            <div className="space-y-3">
              {assignmentsQuery.isLoading ? <p role="status" className="rounded-2xl bg-white p-4 text-sm text-slate-500">Loading assignments…</p>
                : assignmentsQuery.isError ? <div role="alert" className="rounded-2xl bg-white p-4 text-sm text-rose-700"><p>{assignmentsQuery.error instanceof Error ? assignmentsQuery.error.message : "Assignments could not be loaded."}</p><button type="button" className="mt-2 font-bold" onClick={() => void assignmentsQuery.refetch()}>Try again</button></div>
                  : filteredItems.length === 0 ? <p role="status" className="rounded-2xl bg-white p-4 text-sm text-slate-500">No assignments are available in this view.</p>
                    : filteredItems.map((item) => (
                <AssignmentCard
                  key={item.id}
                  item={item}
                  onOpenDetail={handleOpenDetail}
                />
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Global Toast for Assignments screen */}
      <MobileToast message={toastMessage} />
    </div>
  );
};
