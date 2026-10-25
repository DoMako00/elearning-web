import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowUp, CalendarDays, Check, CheckCircle2, ChevronRight, Clock, Download, FileText, Folder, HelpCircle, Scale, Star } from "lucide-react";
import { SubmitAssignmentModal } from "./SubmitAssignmentModal";
import { isAssignmentSubmissionWindowOpen } from "../../../features/student/api/studentAssignmentMapper";
import { useStudentAssignments, useSubmitStudentAssignment } from "../../../features/student/api/useStudentAssignments";
import { studentAssignmentsApi } from "../../../features/student/api/studentAssignmentsApi";
import { AssignmentDetailSkeleton } from "../Skeleton";
import "./AssignmentDetailPage.css";

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Not set";
}

function FeedbackState({ title, message, error, onRetry }: { title: string; message: string; error?: boolean; onRetry?: () => void }) {
  return <div className="assignment-detail-page"><div className="assignment-detail-container"><section className="assignment-detail-section-card" role={error ? "alert" : "status"}><h1 className="assignment-detail-title">{title}</h1><p className="assignment-detail-brief-desc">{message}</p>{onRetry && <button type="button" className="assignment-detail-btn" onClick={onRetry}>Try again</button>}</section></div></div>;
}

export function AssignmentDetailPage() {
  const { assignmentId } = useParams<{ assignmentId?: string }>();
  const assignments = useStudentAssignments();
  const submit = useSubmitStudentAssignment();
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [openingAttachmentId, setOpeningAttachmentId] = useState<string | null>(null);

  if (assignments.isLoading) return <AssignmentDetailSkeleton />;
  if (assignments.isError) return <FeedbackState title="Assignment unavailable" message={assignments.error instanceof Error ? assignments.error.message : "The assignment could not be loaded."} error onRetry={() => void assignments.refetch()} />;
  const assignment = assignments.data?.find((item) => item.id === assignmentId);
  if (!assignment) return <FeedbackState title="Assignment not found" message="This assignment is not available to the current Student account." error />;

  const submission = assignment.submission;
  const canSubmit = isAssignmentSubmissionWindowOpen(assignment) && (!submission || submission.status === "returned");
  const handleSubmit = async (responseText: string, attachmentIds: string[], submissionId: string) => {
    await submit.mutateAsync({ assignmentId: assignment.id, submissionId, responseText, attachmentIds, expectedVersion: submission?.status === "returned" ? submission.version : null });
    setToastMessage("Your response was received by the server.");
  };
  const handleOpenAttachment = async (attachmentId: string) => {
    setAttachmentError(null);
    setOpeningAttachmentId(attachmentId);
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    try {
      const url = await studentAssignmentsApi.openAttachment(assignment.id, attachmentId);
      if (tab) tab.location.assign(url);
      else window.location.assign(url);
    } catch (error) {
      tab?.close();
      setAttachmentError(error instanceof Error ? error.message : "The protected attachment could not be opened.");
    } finally {
      setOpeningAttachmentId(null);
    }
  };

  return (
    <div className="assignment-detail-page">
      {toastMessage && <div className="assignment-detail-toast" role="status"><CheckCircle2 size={16} /><span>{toastMessage}</span></div>}
      {submit.isError && <div className="assignment-detail-toast" role="alert">{submit.error instanceof Error ? submit.error.message : "The response could not be submitted."}</div>}
      <div className="assignment-detail-container">
        <section className="assignment-detail-header-card">
          <div className="assignment-detail-header-top">
            <div className="assignment-detail-meta-left">
              <nav className="assignment-detail-breadcrumb" aria-label="Assignment navigation">
                <Link to="/my-courses">My Courses</Link><ChevronRight size={13} />
                {assignment.courseId && assignment.courseTitle ? <><Link to={`/my-courses/${assignment.courseId}`}>{assignment.courseTitle}</Link><ChevronRight size={13} /></> : null}
                <Link to="/assignments" className="is-active">Assignments</Link>
              </nav>
              <h1 className="assignment-detail-title">{assignment.title}</h1>
              <div className="assignment-detail-course-tags">
                {assignment.courseTitle && <span className="assignment-detail-tag">{assignment.courseTitle}</span>}
                <span className="assignment-detail-tag">{assignment.status === "open" ? "Open" : "Closed"}</span>
              </div>
            </div>
            <div className="assignment-detail-header-actions">
              <span className="assignment-detail-due-pill"><Clock size={13} />Due: {formatDate(assignment.dueAt)}</span>
            </div>
          </div>
          <div className="assignment-detail-metrics-row">
            <div className="assignment-detail-metric-card"><div className="assignment-detail-metric-icon assignment-detail-metric-icon--green"><CalendarDays size={24} /></div><div className="assignment-detail-metric-content"><span className="assignment-detail-metric-label">Available from</span><strong className="assignment-detail-metric-value">{formatDate(assignment.availableFrom)}</strong></div></div>
            <div className="assignment-detail-metric-card"><div className="assignment-detail-metric-icon assignment-detail-metric-icon--teal"><Star size={24} /></div><div className="assignment-detail-metric-content"><span className="assignment-detail-metric-label">Maximum score</span><strong className="assignment-detail-metric-value">{assignment.maxScore === null ? "Not set" : `${assignment.maxScore} points`}</strong></div></div>
            <div className="assignment-detail-metric-card"><div className="assignment-detail-metric-icon assignment-detail-metric-icon--blue"><FileText size={24} /></div><div className="assignment-detail-metric-content"><span className="assignment-detail-metric-label">Submission</span><strong className="assignment-detail-metric-value">{submission?.status ?? "Not submitted"}</strong></div></div>
            <div className="assignment-detail-metric-card"><div className="assignment-detail-metric-icon assignment-detail-metric-icon--orange"><Clock size={24} /></div><div className="assignment-detail-metric-content"><span className="assignment-detail-metric-label">Submitted at</span><strong className="assignment-detail-metric-value">{formatDate(submission?.submittedAt ?? null)}</strong></div></div>
          </div>
        </section>

        <div className="assignment-detail-body-layout">
          <div className="assignment-detail-main-column">
            <div className="assignment-detail-brief-row">
              <section className="assignment-detail-section-card assignment-detail-brief-card">
                <div className="assignment-detail-section-header"><div className="assignment-detail-section-title"><FileText size={18} className="text-emerald-600" /><h2>Assignment brief</h2></div></div>
                <p className="assignment-detail-brief-desc">{assignment.instructions || "No instructions have been added."}</p>
                <div className="assignment-detail-todo-block"><h3 className="assignment-detail-section-sub">Response guidance</h3><ul className="assignment-detail-todo-list"><li><span className="assignment-detail-check-icon"><Check size={11} /></span><span>Submit a written response, privately uploaded files, or both.</span></li></ul></div>
              </section>
              <section className="assignment-detail-section-card assignment-detail-submit-info-card">
                <div className="assignment-detail-section-header"><div className="assignment-detail-section-title"><ArrowUp size={18} className="text-emerald-600" /><h2>Submission details</h2></div></div>
                <ul className="assignment-detail-req-list"><li><span className="assignment-detail-check-icon assignment-detail-check-icon--emerald"><Check size={11} /></span><span>Text and verified private attachments are saved to your submission.</span></li><li><span className="assignment-detail-check-icon assignment-detail-check-icon--emerald"><Check size={11} /></span><span>Scores and feedback appear after instructor review.</span></li></ul>
                <div className="assignment-detail-tip-banner"><HelpCircle size={15} className="text-emerald-700 shrink-0" /><p>Submitting does not change course access or academic entitlement.</p></div>
              </section>
            </div>
            <section className="assignment-detail-section-card assignment-detail-resources-section">
              <div className="assignment-detail-section-header"><div className="assignment-detail-section-title"><Folder size={18} className="text-emerald-600" /><h2>Assignment resources</h2></div></div>
              <p className="assignment-detail-section-sub">Resources attached to this assignment, if any, are provided by the course.</p>
              <div className="assignment-detail-resources-grid"><p className="text-sm text-gray-500">No assignment-specific resources are available.</p></div>
            </section>
          </div>

          <aside className="assignment-detail-sidebar-column">
            <section className="assignment-detail-sidebar-card assignment-submission-action-card">
              <div className="assignment-submission-card-header"><div className="assignment-submission-card-title"><FileText size={17} className="text-emerald-600" /><h3>Your submission</h3></div><span className="assignment-submission-percentage">{submission ? "Submitted" : "Not submitted"}</span></div>
              <div className="assignment-submission-badge-row"><span className={`assignment-submission-badge assignment-submission-badge--${submission?.status ?? "not-started"}`}>{submission?.status ?? "Not submitted"}</span></div>
              <div className="assignment-submission-progress-bar"><div className="assignment-submission-progress-fill" style={{ width: submission ? "100%" : "0%" }} /></div>
              <p className="assignment-submission-hint">{submission?.feedback ?? (submission ? "Your response is saved and awaiting review." : "Submit text, private attachments, or both before the due date.")}</p>
              {attachmentError && <p className="text-xs text-rose-600" role="alert">{attachmentError}</p>}
              {submission?.attachments.length ? <div className="mt-3 space-y-2" aria-label="Submitted attachments">{submission.attachments.map(attachment => <div key={attachment.id} className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs"><span className="min-w-0 truncate" title={attachment.originalFilename}>{attachment.originalFilename}</span><button type="button" className="inline-flex shrink-0 items-center gap-1 font-semibold text-emerald-700 disabled:opacity-50" onClick={() => void handleOpenAttachment(attachment.id)} disabled={openingAttachmentId === attachment.id}>{openingAttachmentId === attachment.id ? <Clock size={13} className="animate-spin" /> : <Download size={13} />} Open</button></div>)}</div> : null}
              <button type="button" className="assignment-btn-submit-main" onClick={() => setIsSubmitModalOpen(true)} disabled={!canSubmit || submit.isPending || (submit.isSuccess && assignments.isFetching)}><ArrowUp size={16} /><span>{submission?.status === "returned" ? "Resubmit response" : "Submit response"}</span></button>
            </section>
            <section className="assignment-detail-sidebar-card"><div className="assignment-rubric-header"><div className="assignment-rubric-title"><Scale size={17} className="text-emerald-600" /><h3>Review result</h3></div></div><p className="assignment-detail-section-sub">{submission?.status === "reviewed" ? (submission.score === null ? "Reviewed; no score recorded." : `Score: ${submission.score}${assignment.maxScore === null ? "" : ` / ${assignment.maxScore}`}`) : "No review has been recorded yet."}</p></section>
            <section className="assignment-detail-sidebar-card"><div className="assignment-timeline-header"><Clock size={17} className="text-emerald-600" /><h3>Assignment timeline</h3></div><div className="assignment-timeline-steps"><div className="assignment-timeline-step"><div className="assignment-timeline-dot" /><div className="assignment-timeline-step-info"><span className="assignment-timeline-date">{formatDate(assignment.availableFrom)}</span><strong className="assignment-timeline-name">Available</strong></div></div><div className="assignment-timeline-step"><div className="assignment-timeline-dot" /><div className="assignment-timeline-step-info"><span className="assignment-timeline-date">{formatDate(assignment.dueAt)}</span><strong className="assignment-timeline-name">Due</strong></div></div>{submission && <div className="assignment-timeline-step is-completed"><div className="assignment-timeline-dot is-completed" /><div className="assignment-timeline-step-info"><span className="assignment-timeline-date">{formatDate(submission.submittedAt)}</span><strong className="assignment-timeline-name">Submitted</strong></div></div>}</div></section>
          </aside>
        </div>
      </div>
      <SubmitAssignmentModal isOpen={isSubmitModalOpen} onClose={() => setIsSubmitModalOpen(false)} assignmentTitle={assignment.title} courseName={assignment.courseTitle ?? "Assignment"} onUploadFile={(file, key) => studentAssignmentsApi.uploadAttachment(assignment.id, file, key)} onSubmitSuccess={handleSubmit} />
    </div>
  );
}
