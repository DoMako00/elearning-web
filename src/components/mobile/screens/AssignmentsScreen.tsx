import React, { useState, useMemo } from "react";
import { TopAppBar } from "../TopAppBar";
import {
  HeroBand,
  DocsOnlyBanner,
  StatusFilterTabs,
  AssignmentCard,
  AssignmentProgressRing,
  MobileToast,
} from "../shared";
import { useScreenStack } from "../ScreenStack";
import { useToast } from "../../../hooks/useToast";
import {
  ASSIGNMENT_ITEMS,
  ASSIGNMENT_DETAILS,
} from "../../ui/Assignments/assignments.data";
import type {
  AssignmentFilter,
  AssignmentItem,
  AssignmentDetailItem,
} from "../../ui/Assignments/assignments.types";
import { AssignmentDetailScreen } from "./AssignmentDetailScreen";
import { BookOpen } from "lucide-react";

export const AssignmentsScreen: React.FC = () => {
  const { push } = useScreenStack();
  const { toastMessage, showToast } = useToast();

  const [activeTab, setActiveTab] = useState<AssignmentFilter>("all");

  // Reusing desktop's exact counts logic from AssignmentsWorkspace.tsx:225-238
  const counts = useMemo(() => {
    const inProgress = ASSIGNMENT_ITEMS.filter((item) => item.status === "in-progress").length;
    const submitted = ASSIGNMENT_ITEMS.filter((item) => item.status === "submitted").length;
    const graded = ASSIGNMENT_ITEMS.filter((item) => item.status === "graded").length;
    const notStarted = ASSIGNMENT_ITEMS.filter((item) => item.status === "not-started").length;
    return {
      all: ASSIGNMENT_ITEMS.length,
      "in-progress": inProgress,
      submitted,
      graded,
      notStarted,
      completed: submitted + graded,
    };
  }, []);

  // Filter tabs array (All / In progress / Submitted / Graded)
  const filterTabs = [
    { key: "all", label: "All", count: counts.all },
    { key: "in-progress", label: "In progress", count: counts["in-progress"] },
    { key: "submitted", label: "Submitted", count: counts.submitted },
    { key: "graded", label: "Graded", count: counts.graded },
  ];

  // Filtered assignments list
  const filteredItems = useMemo(() => {
    if (activeTab === "all") return ASSIGNMENT_ITEMS;
    return ASSIGNMENT_ITEMS.filter((item) => item.status === activeTab);
  }, [activeTab]);

  // Navigate to Assignment Detail screen
  const handleOpenDetail = (item: AssignmentItem) => {
    // Find rich detail if present in ASSIGNMENT_DETAILS, or create a complete fallback
    const detailData: AssignmentDetailItem =
      ASSIGNMENT_DETAILS[item.id] ||
      (item.id === "asg-1" ? ASSIGNMENT_DETAILS["upper-limb-clinical-case-review"] : null) || {
        ...item,
        courseName: item.category,
        courseSlug: item.category.toLowerCase().replace(/\s+/g, "-"),
        moduleName: "Core Clinical Module",
        instructor: "Faculty of Medicine",
        dueFullDate: `${item.dueLabel}, 2026 at 11:59 PM`,
        estimatedTime: "3-5 hours",
        attemptsUsed: item.status === "submitted" || item.status === "graded" ? 1 : 0,
        attemptsAllowed: 2,
        submissionType: "File upload",
        acceptedFormats: ["PDF", "DOCX", "PPTX"],
        maxFileSizeMb: 20,
        brief: {
          description: item.description,
          instructions: [
            "Review the patient case presentation and clinical findings.",
            "Analyze diagnostic criteria and differential diagnoses.",
            "Formulate an evidence-based clinical management plan.",
            "Cite relevant medical guidelines in APA format.",
          ],
        },
        whatToSubmit: {
          requirements: [
            "Clinical analysis report (PDF or DOCX)",
            "Annotated diagnostic readings or laboratory chart",
            "Structured management algorithm",
          ],
          tip: "Verify your reference values against current clinical benchmarks.",
        },
        resources: [
          {
            id: `res-${item.id}-1`,
            name: `${item.title.replace(/\s+/g, "_")}_Case_Packet.pdf`,
            fileType: "pdf",
            size: "1.8 MB",
          },
          {
            id: `res-${item.id}-2`,
            name: "Clinical_Guidelines_Summary.docx",
            fileType: "docx",
            size: "420 KB",
          },
        ],
        rubric: {
          items: [
            { criterion: "Clinical diagnosis & accuracy", points: Math.round(item.points * 0.4) },
            { criterion: "Management strategy", points: Math.round(item.points * 0.35) },
            { criterion: "References & presentation", points: Math.round(item.points * 0.25) },
          ],
          totalPoints: item.points,
        },
        timeline: {
          assignedDate: "May 15, 2026 • 09:00 AM",
          dueDate: item.dueLabel,
          gradesReleasedDate: "May 31, 2026 • 05:00 PM",
        },
      };

    push({
      id: `assignment-${item.id}`,
      title: item.title,
      variant: "detail",
      backLabel: "Assignments",
      component: <AssignmentDetailScreen assignment={detailData} />,
    });
  };

  const handleBookmarkToast = (isSaved: boolean) => {
    showToast(isSaved ? "Saved to your bookmarks." : "Removed from bookmarks.");
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
          banner={<DocsOnlyBanner variant="compact" />}
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
            onViewStats={() => showToast("Full statistics coming soon")}
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
              {filteredItems.map((item) => (
                <AssignmentCard
                  key={item.id}
                  item={item}
                  onOpenDetail={handleOpenDetail}
                  onBookmarkToast={handleBookmarkToast}
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
