import React, { useState } from "react";
import {
  CalendarDays,
  Star,
  Clock,
  RotateCcw,
  ArrowUp,
  FileText,
  Check,
  HelpCircle,
  Folder,
  Download,
  Bookmark,
  MoreVertical,
} from "lucide-react";
import { TopAppBar } from "../TopAppBar";
import {
  DocsOnlyBanner,
  SubmitAssignmentSheet,
  getFileTypeStyle,
} from "../shared";
import { useScreenStack } from "../ScreenStack";
import { useSavedItems } from "../../../state/useSavedItems";
import { useToast } from "../../../hooks/useToast";
import { MobileToast } from "../shared/MobileToast";
import type { AssignmentDetailItem, AssignmentResource } from "../../ui/Assignments/assignments.types";

export interface AssignmentDetailScreenProps {
  assignment: AssignmentDetailItem;
}

export const AssignmentDetailScreen: React.FC<AssignmentDetailScreenProps> = ({
  assignment: initialAssignment,
}) => {
  const { pop, push } = useScreenStack();
  const { isSaved, toggleSaved } = useSavedItems();
  const { toastMessage, showToast } = useToast();

  const [assignment, setAssignment] = useState<AssignmentDetailItem>(initialAssignment);
  const [isSubmitSheetOpen, setIsSubmitSheetOpen] = useState(false);

  const saved = isSaved(assignment.id);
  const attemptsLeft = Math.max(0, assignment.attemptsAllowed - assignment.attemptsUsed);
  const noAttemptsLeft = attemptsLeft === 0;
  const isSubmitted = assignment.status === "submitted" || assignment.status === "graded";

  const handleToggleBookmark = () => {
    toggleSaved(assignment.id, "assignment");
    showToast(!saved ? "Saved to your bookmarks." : "Removed from bookmarks.");
  };

  const handleSaveDraft = () => {
    showToast("Assignment draft saved successfully.");
  };

  const handleDownloadResource = (e: React.MouseEvent, res: AssignmentResource) => {
    e.stopPropagation();
    showToast(`Downloading ${res.name}...`);
  };

  const handleOpenDocumentReader = (docTitle: string) => {
    push({
      id: `doc-${docTitle}`,
      title: docTitle,
      variant: "detail",
      backLabel: "Assignment Details",
      component: (
        <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
          <TopAppBar
            variant="detail"
            title={docTitle}
            backLabel="Assignment Details"
            onBack={pop}
          />
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <DocsOnlyBanner variant="full" />
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 shadow-xs">
              <h2 className="text-base font-bold text-slate-900">{docTitle}</h2>
              <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto">
                Interactive mobile document reader with annotations will render here.
              </p>
              <span className="mt-4 inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                Document Viewer Stub
              </span>
            </div>
          </div>
        </div>
      ),
    });
  };

  const handleSubmitSuccess = (data: { fileName: string; fileSize: string; note: string }) => {
    setAssignment((prev) => ({
      ...prev,
      status: "submitted",
      attemptsUsed: Math.min(prev.attemptsAllowed, prev.attemptsUsed + 1),
      submission: {
        status: "submitted",
        submittedAt: "Just now",
        fileName: data.fileName,
        fileSize: data.fileSize,
        note: data.note,
      },
    }));
    showToast("Assignment submitted successfully! 🎉");
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
      {/* 1. TopAppBar (variant="detail") */}
      <TopAppBar
        variant="detail"
        title="Assignment Details"
        backLabel="Back"
        onBack={pop}
        rightSlot={
          <button
            type="button"
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
            aria-label="More options"
          >
            <MoreVertical className="size-4.5" />
          </button>
        }
      />

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-3 pb-12 space-y-4 max-w-lg mx-auto">
          {/* 2. Hero Card: Title, Due Badge, Course / Module / Instructor info */}
          <div className="bg-white rounded-3xl border border-slate-100/80 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                {assignment.title}
              </h1>

              {/* Due Date pill matching design */}
              <div className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/70 text-orange-700 text-xs font-bold shadow-2xs">
                <Clock className="size-3.5" />
                <span>Due {assignment.dueLabel}</span>
              </div>
            </div>

            {/* Course metadata row */}
            <div className="flex items-center flex-wrap gap-2 text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1">
                <span>📖</span>
                <span>{assignment.courseName}</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1">
                <span>📑</span>
                <span>{assignment.moduleName}</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1">
                <span>👤</span>
                <span>{assignment.instructor}</span>
              </span>
            </div>

            {/* Bookmark button */}
            <div className="pt-1 flex items-center justify-end">
              <button
                type="button"
                onClick={handleToggleBookmark}
                className={`inline-flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer ${
                  saved ? "text-emerald-700" : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <Bookmark className={`size-3.5 ${saved ? "fill-current" : ""}`} />
                <span>{saved ? "Saved for later" : "Save for later"}</span>
              </button>
            </div>
          </div>

          {/* 3. Stat Strip (5 tiles): Due date, Points, Est. time, Attempts, Submission */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {/* Due date */}
            <div className="p-3 rounded-2xl bg-white border border-slate-100 shadow-2xs flex flex-col items-center text-center">
              <div className="size-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5">
                <CalendarDays className="size-4" />
              </div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Due date</span>
              <strong className="text-xs font-extrabold text-slate-900 mt-0.5">
                {assignment.dueFullDate ? assignment.dueFullDate.split(" at ")[0] : assignment.dueLabel}
              </strong>
              <small className="text-[9.5px] text-slate-400 font-medium">11:59 PM</small>
            </div>

            {/* Points */}
            <div className="p-3 rounded-2xl bg-white border border-slate-100 shadow-2xs flex flex-col items-center text-center">
              <div className="size-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-1.5">
                <Star className="size-4" />
              </div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Points</span>
              <strong className="text-xs font-extrabold text-slate-900 mt-0.5">
                {assignment.points} pts
              </strong>
              <small className="text-[9.5px] text-slate-400 font-medium">Total</small>
            </div>

            {/* Est. time */}
            <div className="p-3 rounded-2xl bg-white border border-slate-100 shadow-2xs flex flex-col items-center text-center">
              <div className="size-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5">
                <Clock className="size-4" />
              </div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Est. time</span>
              <strong className="text-xs font-extrabold text-slate-900 mt-0.5">
                {assignment.estimatedTime}
              </strong>
              <small className="text-[9.5px] text-slate-400 font-medium">Recommended</small>
            </div>

            {/* Attempts */}
            <div className="p-3 rounded-2xl bg-white border border-slate-100 shadow-2xs flex flex-col items-center text-center">
              <div className="size-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-1.5">
                <RotateCcw className="size-4" />
              </div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Attempts</span>
              <strong className="text-xs font-extrabold text-slate-900 mt-0.5">
                {assignment.attemptsUsed} of {assignment.attemptsAllowed}
              </strong>
              <small className="text-[9.5px] text-slate-400 font-medium">
                {attemptsLeft} remaining
              </small>
            </div>

            {/* Submission format */}
            <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-white border border-slate-100 shadow-2xs flex flex-col items-center text-center">
              <div className="size-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-1.5">
                <ArrowUp className="size-4" />
              </div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Submission</span>
              <strong className="text-xs font-extrabold text-slate-900 mt-0.5 truncate max-w-full">
                {assignment.submissionType}
              </strong>
              <small className="text-[9.5px] text-slate-400 font-medium truncate max-w-full">
                {assignment.acceptedFormats.join(", ")}
              </small>
            </div>
          </div>

          {/* 4. Assignment Brief Card */}
          <div className="bg-white rounded-3xl border border-slate-100/80 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-emerald-700">
              <FileText className="size-4.5" />
              <h2 className="text-sm font-extrabold text-slate-900">Assignment Brief</h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {assignment.brief.description}
            </p>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <h3 className="text-xs font-bold text-slate-800">What you need to do</h3>
              <ul className="space-y-1.5">
                {assignment.brief.instructions.map((inst, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs text-slate-600 leading-normal">
                    <span className="size-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="size-2.5 stroke-3" />
                    </span>
                    <span>{inst}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 5. What to Submit Card */}
          <div className="bg-white rounded-3xl border border-slate-100/80 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-emerald-700">
              <ArrowUp className="size-4.5" />
              <h2 className="text-sm font-extrabold text-slate-900">What to Submit</h2>
            </div>

            <ul className="space-y-1.5">
              {assignment.whatToSubmit.requirements.map((req, index) => (
                <li key={index} className="flex items-start gap-2 text-xs text-slate-600 leading-normal">
                  <span className="size-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="size-2.5 stroke-3" />
                  </span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>

            {assignment.whatToSubmit.tip && (
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 flex items-start gap-2.5">
                <HelpCircle className="size-4 text-emerald-700 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-900/90 font-medium leading-relaxed">
                  <strong className="font-bold">Tip:</strong> {assignment.whatToSubmit.tip}
                </p>
              </div>
            )}
          </div>

          {/* 6. Assignment Resources Card */}
          <div className="bg-white rounded-3xl border border-slate-100/80 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-700">
                <Folder className="size-4.5" />
                <h2 className="text-sm font-extrabold text-slate-900">Assignment Resources</h2>
              </div>
              <button
                type="button"
                onClick={() => handleOpenDocumentReader("Assignment Resource Pack")}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
              >
                View all &rarr;
              </button>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Review these materials to help you complete this assignment.
            </p>

            <div className="space-y-2 pt-1">
              {assignment.resources.map((res) => {
                const style = getFileTypeStyle(res.fileType);
                return (
                  <div
                    key={res.id}
                    onClick={() => handleOpenDocumentReader(res.name)}
                    className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    {/* Badge */}
                    <div
                      className={`size-9 rounded-xl border flex items-center justify-center shrink-0 text-[10px] font-black ${style.bgColor} ${style.borderColor} ${style.textColor}`}
                    >
                      {res.fileType.toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                        {res.name}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        {res.size}
                      </p>
                    </div>

                    {/* Download Action */}
                    <button
                      type="button"
                      onClick={(e) => handleDownloadResource(e, res)}
                      className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-white transition-all cursor-pointer"
                      aria-label={`Download ${res.name}`}
                    >
                      <Download className="size-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 7. Your Submission Card */}
          <div className="bg-white rounded-3xl border border-slate-100/80 p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-700">
                <FileText className="size-4.5" />
                <h2 className="text-sm font-extrabold text-slate-900">Your Submission</h2>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {isSubmitted ? "100% complete" : "0% complete"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  isSubmitted
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {assignment.status === "submitted"
                  ? "Submitted"
                  : assignment.status === "graded"
                  ? "Graded"
                  : "Not submitted"}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: isSubmitted ? "100%" : "0%" }}
              />
            </div>

            {/* Submission metadata or hint */}
            {assignment.submission && (
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 truncate">
                    {assignment.submission.fileName}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {assignment.submission.fileSize}
                  </span>
                </div>
                {assignment.submission.submittedAt && (
                  <p className="text-[10px] text-slate-400 font-medium">
                    Submitted: {assignment.submission.submittedAt}
                  </p>
                )}
                {assignment.submission.note && (
                  <p className="text-xs text-slate-600 pt-1 border-t border-slate-200/60 mt-1 italic">
                    &ldquo;{assignment.submission.note}&rdquo;
                  </p>
                )}
              </div>
            )}

            <p className="text-xs text-slate-500 font-medium">
              {isSubmitted
                ? "Your assignment is submitted and under review."
                : "Start your work and submit before the deadline."}
            </p>

            {/* Actions & Attempts Fix */}
            {noAttemptsLeft ? (
              <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 text-center">
                <p className="text-xs font-bold text-slate-600">
                  No attempts remaining
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  You have used all {assignment.attemptsAllowed} attempts for this assignment.
                </p>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsSubmitSheetOpen(true)}
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <ArrowUp className="size-4 stroke-[2.5]" />
                  <span>{isSubmitted ? "Resubmit assignment" : "Submit assignment"}</span>
                </button>

                {!isSubmitted && (
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Bookmark className="size-3.5" />
                    <span>Save draft</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* File Upload BottomSheet */}
      <SubmitAssignmentSheet
        isOpen={isSubmitSheetOpen}
        onClose={() => setIsSubmitSheetOpen(false)}
        assignmentTitle={assignment.title}
        courseName={assignment.courseName}
        maxFileSizeMb={assignment.maxFileSizeMb}
        acceptedFormats={assignment.acceptedFormats}
        onSubmitSuccess={handleSubmitSuccess}
      />

      {/* Mobile Toast Notification */}
      <MobileToast message={toastMessage} />
    </div>
  );
};
