import React from "react";
import { TopAppBar } from "../TopAppBar";
import { DocsOnlyBanner } from "../common/DocsOnlyBanner";
import { useScreenStack } from "../ScreenStack";
import { ArrowRight, BookOpen, Clock } from "lucide-react";

export const HomeStubScreen: React.FC = () => {
  const { push } = useScreenStack();

  const handleOpenAssignments = () => {
    push({
      id: "assignments",
      title: "Assignments",
      tabRoot: "home", // Keeps Home tab visually highlighted per requirement!
      variant: "main",
      component: <AssignmentsStubScreen />,
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
      <TopAppBar variant="main" />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Mobile documents constraint banner */}
        <DocsOnlyBanner />

        {/* Home placeholder card with Quick Actions leading to Assignments */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Quick Actions</h2>
            <span className="text-[10.5px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              Mobile Documents
            </span>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleOpenAssignments}
              className="w-full p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5 text-left">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">View Assignments</h3>
                  <p className="text-[10.5px] text-slate-500">Read assigned clinical case studies</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-600 shrink-0" />
            </button>
          </div>
        </div>

        {/* Placeholder Coming Soon section */}
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900">Home Feed</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Your personalized learning feed and reading list will appear here.
          </p>
          <span className="mt-3 inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
            Coming soon
          </span>
        </div>
      </div>
    </div>
  );
};

export const AssignmentsStubScreen: React.FC = () => {
  const { push } = useScreenStack();

  const handleOpenDetail = () => {
    push({
      id: "assignment-detail",
      title: "Clinical Case Review",
      tabRoot: "home", // Keeps Home tab visually active
      variant: "detail",
      backLabel: "Assignments",
      component: <AssignmentDetailStubScreen />,
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
      <TopAppBar variant="main" />

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Assignments & Cases</h2>
          <span className="text-xs text-slate-400">Home Tab Active</span>
        </div>

        <button
          type="button"
          onClick={handleOpenDetail}
          className="w-full p-3.5 rounded-2xl bg-white border border-slate-100 shadow-2xs flex items-center justify-between text-left hover:border-emerald-200 transition-colors cursor-pointer"
        >
          <div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
              Document Study
            </span>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
              Clinical Case Review: Cardiovascular Pathology
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> Due in 2 days • 12 pages reading
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-emerald-600 shrink-0" />
        </button>
      </div>
    </div>
  );
};

export const AssignmentDetailStubScreen: React.FC = () => {
  const { pop } = useScreenStack();

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
      <TopAppBar
        variant="detail"
        title="Clinical Case Review"
        backLabel="Assignments"
        onBack={pop}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <DocsOnlyBanner />

        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-2xs text-center">
          <h2 className="text-sm font-bold text-slate-900">Assignment Document Viewer</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Full document reading viewer and assignment prompt will render here.
          </p>
          <span className="mt-3 inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
            Coming soon
          </span>
        </div>
      </div>
    </div>
  );
};
