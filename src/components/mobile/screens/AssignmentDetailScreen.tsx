import React, { useState } from "react";
import {
  CalendarDays,
  Star,
  Clock,
  ArrowUp,
  FileText,
  Check,
  Folder,
  MoreVertical,
  Download,
} from "lucide-react";
import { TopAppBar } from "../TopAppBar";
import { SubmitAssignmentTextSheet } from "../shared/SubmitAssignmentTextSheet";
import { useScreenStack } from "../ScreenStack";
import { useToast } from "../../../hooks/useToast";
import { MobileToast } from "../shared/MobileToast";
import { useSubmitStudentAssignment } from "../../../features/student/api/useStudentAssignments";
import { studentAssignmentStatus } from "../../../features/student/api/studentAssignmentMapper";
import type { StudentAssignmentDto } from "../../../features/student/api/studentAssignmentsApi";
import { studentAssignmentsApi } from "../../../features/student/api/studentAssignmentsApi";

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Not set";
}

export interface AssignmentDetailScreenProps {
  assignment: StudentAssignmentDto;
}

export const AssignmentDetailScreen: React.FC<AssignmentDetailScreenProps> = ({ assignment }) => {
  const { pop } = useScreenStack();
  const { toastMessage, showToast } = useToast();
  const submit = useSubmitStudentAssignment();
  const [isSubmitSheetOpen, setIsSubmitSheetOpen] = useState(false);
  const status = studentAssignmentStatus(assignment);
  const isSubmitted = status === "submitted" || status === "graded";
  const canSubmit = assignment.status === "open" && (!assignment.submission || assignment.submission.status === "returned");
  const handleSubmit = async (responseText: string, attachmentIds: string[]) => {
    await submit.mutateAsync({ assignmentId: assignment.id, responseText, attachmentIds, expectedVersion: assignment.submission?.status === "returned" ? assignment.submission.version : null });
    showToast("Your response was saved.");
  };
  const openAttachment = async (attachmentId: string) => {
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    try {
      const url = await studentAssignmentsApi.openAttachment(assignment.id, attachmentId);
      if (tab) tab.location.assign(url);
      else window.location.assign(url);
    } catch {
      tab?.close();
      showToast("The protected attachment could not be opened.");
    }
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
              <span>Due {formatDate(assignment.dueAt)}</span>
              </div>
            </div>

            {assignment.courseTitle && <div className="flex items-center gap-2 text-xs font-semibold text-slate-600"><span>Course</span><span>{assignment.courseTitle}</span></div>}
            <p className="text-[11px] text-slate-400">Assignment status: {assignment.status}</p>
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
                {formatDate(assignment.dueAt)}
              </strong>
              <small className="text-[9.5px] text-slate-400 font-medium">Server due date</small>
            </div>

            {/* Points */}
            <div className="p-3 rounded-2xl bg-white border border-slate-100 shadow-2xs flex flex-col items-center text-center">
              <div className="size-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-1.5">
                <Star className="size-4" />
              </div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Points</span>
              <strong className="text-xs font-extrabold text-slate-900 mt-0.5">
                {assignment.maxScore === null ? "Not set" : `${assignment.maxScore} pts`}
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
                Not specified
              </strong>
              <small className="text-[9.5px] text-slate-400 font-medium">Recommended</small>
            </div>

            {/* Attempts */}
            <div className="p-3 rounded-2xl bg-white border border-slate-100 shadow-2xs flex flex-col items-center text-center">
              <div className="size-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-1.5">
                <Clock className="size-4" />
              </div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Attempts</span>
              <strong className="text-xs font-extrabold text-slate-900 mt-0.5">
                Not tracked
              </strong>
              <small className="text-[9.5px] text-slate-400 font-medium">
                by current API
              </small>
            </div>

            {/* Submission format */}
            <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-white border border-slate-100 shadow-2xs flex flex-col items-center text-center">
              <div className="size-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-1.5">
                <ArrowUp className="size-4" />
              </div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Submission</span>
              <strong className="text-xs font-extrabold text-slate-900 mt-0.5 truncate max-w-full">
                Text response
              </strong>
              <small className="text-[9.5px] text-slate-400 font-medium truncate max-w-full">
                Saved by backend
              </small>
            </div>
          </div>

          {/* 4. Assignment Brief Card */}
          <div className="bg-white rounded-3xl border border-slate-100/80 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-emerald-700">
              <FileText className="size-4.5" />
              <h2 className="text-sm font-extrabold text-slate-900">Assignment Brief</h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{assignment.instructions || "No assignment instructions have been provided."}</p>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <h3 className="text-xs font-bold text-slate-800">Instructions</h3>
              <p className="text-xs text-slate-500">Use the assignment instructions above and submit a written response through this screen.</p>
            </div>
          </div>

          {/* 5. What to Submit Card */}
          <div className="bg-white rounded-3xl border border-slate-100/80 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-emerald-700">
              <ArrowUp className="size-4.5" />
              <h2 className="text-sm font-extrabold text-slate-900">What to Submit</h2>
            </div>

            <ul className="space-y-1.5">
              <li className="flex items-start gap-2 text-xs text-slate-600 leading-normal">
                  <span className="size-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="size-2.5 stroke-3" />
                  </span>
                  <span>Text response</span>
              </li>
            </ul>
          </div>

          {/* 6. Assignment Resources Card */}
          <div className="bg-white rounded-3xl border border-slate-100/80 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-700">
                <Folder className="size-4.5" />
                <h2 className="text-sm font-extrabold text-slate-900">Assignment Resources</h2>
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Assignment-specific resources are not provided by the current API.
            </p>

            <div className="space-y-2 pt-1">
              <p className="text-xs text-slate-400">No resources are attached to this assignment.</p>
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
                {assignment.submission?.status ?? "Not submitted"}
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
            {assignment.submission && <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1"><p className="text-xs font-bold text-slate-700">{assignment.submission.status}</p><p className="text-[10px] text-slate-400 font-medium">Submitted: {formatDate(assignment.submission.submittedAt)}</p>{assignment.submission.feedback && <p className="text-xs text-slate-600 pt-1 border-t border-slate-200/60 mt-1">{assignment.submission.feedback}</p>}</div>}
            {!!assignment.submission?.attachments.length && <div className="space-y-2" aria-label="Submitted attachments">{assignment.submission.attachments.map(attachment => <div key={attachment.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2"><span className="min-w-0 truncate text-xs font-semibold text-slate-700">{attachment.originalFilename}</span><button type="button" className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-emerald-700" onClick={() => void openAttachment(attachment.id)}><Download className="size-3.5" />Open</button></div>)}</div>}
            {submit.isError && <p role="alert" className="text-xs text-rose-700">{submit.error instanceof Error ? submit.error.message : "Submission failed."}</p>}

            <p className="text-xs text-slate-500 font-medium">
              {isSubmitted
                ? "Your assignment is submitted and under review."
                : "Start your work and submit before the deadline."}
            </p>

            {/* Actions & Attempts Fix */}
            <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsSubmitSheetOpen(true)}
                  disabled={!canSubmit || submit.isPending}
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-98 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <ArrowUp className="size-4 stroke-[2.5]" />
                  <span>{assignment.submission?.status === "returned" ? "Resubmit response" : "Submit response"}</span>
                </button>
                {!canSubmit && <p className="text-[11px] text-slate-500 text-center">Submissions are unavailable for the current assignment state.</p>}
            </div>
          </div>
        </div>
      </div>

      <SubmitAssignmentTextSheet
        isOpen={isSubmitSheetOpen}
        onClose={() => setIsSubmitSheetOpen(false)}
        assignmentTitle={assignment.title}
        courseName={assignment.courseTitle ?? "Assignment"}
        onUploadFile={(file, key) => studentAssignmentsApi.uploadAttachment(assignment.id, file, key)}
        onSubmit={handleSubmit}
      />

      {/* Mobile Toast Notification */}
      <MobileToast message={toastMessage} />
    </div>
  );
};
