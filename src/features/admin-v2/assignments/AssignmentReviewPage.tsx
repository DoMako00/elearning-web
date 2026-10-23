import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck, Download, RefreshCw } from "lucide-react";
import { adminAssignmentsApi } from "../api/adminAssignmentsApi";
import { InspectorFields, InspectorSection, TableFrame } from "../shared/AdminV2Table";
import { StatusBadge } from "../shared/AdminV2Primitives";
import { useAdminV2 } from "../layout/AdminV2Layout";

const errorText = (error: unknown) => error instanceof Error ? error.message : "The Assignment request failed.";
const when = (value: string | null) => value ? new Date(value).toLocaleString() : "—";

export function AssignmentReviewPage() {
  const { workspace } = useAdminV2();
  const isInstructor = workspace.workspace === "instructor";
  const client = useQueryClient();
  const list = useQuery({ queryKey: ["admin", "assignments"], queryFn: ({ signal }) => adminAssignmentsApi.list(signal) });
  const items = list.data?.items ?? [];
  const [selectedId, setSelectedId] = useState("");
  const [selectedSubmissionId, setSelectedSubmissionId] = useState("");
  const [decision, setDecision] = useState<"reviewed" | "returned">("reviewed");
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [newCourseId, setNewCourseId] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newInstructions, setNewInstructions] = useState("");
  const [newDueAt, setNewDueAt] = useState("");
  const [newMaxScore, setNewMaxScore] = useState("");
  const [openingAttachmentId, setOpeningAttachmentId] = useState<string | null>(null);
  const selected = useMemo(() => items.find(item => item.id === selectedId) ?? items[0] ?? null, [items, selectedId]);
  const courseOptions = workspace.courses.filter(course => course.academicInstitutionId && course.academicLevelId && course.academicSemesterId && course.status !== "archived");
  const selectedCourse = courseOptions.find(course => course.id === newCourseId) ?? null;
  const submissions = useQuery({ queryKey: ["admin", "assignment-submissions", selected?.id], queryFn: ({ signal }) => adminAssignmentsApi.submissions(selected!.id, signal), enabled: Boolean(selected) });
  const submission = useMemo(() => submissions.data?.items.find(item => item.id === selectedSubmissionId) ?? submissions.data?.items.find(item => item.status === "submitted") ?? submissions.data?.items[0] ?? null, [submissions.data, selectedSubmissionId]);

  useEffect(() => { if (selected && selected.id !== selectedId) { setSelectedId(selected.id); setSelectedSubmissionId(""); } }, [selected, selectedId]);
  useEffect(() => {
    if (!submission) return;
    setSelectedSubmissionId(submission.id);
    setDecision(submission.status === "returned" ? "returned" : "reviewed");
    setScore(submission.score === null ? "" : String(submission.score));
    setFeedback(submission.feedback ?? "");
  }, [submission?.id, submission?.version]);

  const review = useMutation({
    mutationFn: async () => {
      if (!selected || !submission) throw new Error("Select an Assignment submission first.");
      if (!reason.trim()) throw new Error("Add an audit reason for this review.");
      const parsedScore = decision === "returned" || score.trim() === "" ? null : Number(score);
      const maximum = submissions.data?.assignment.maxScore;
      if (parsedScore !== null && (!Number.isFinite(parsedScore) || parsedScore < 0 || (maximum !== null && maximum !== undefined && parsedScore > maximum))) throw new Error("Score must be within the Assignment maximum.");
      if (decision === "reviewed" && maximum !== null && maximum !== undefined && parsedScore === null) throw new Error("Enter the score before marking this submission reviewed.");
      if (decision === "returned" && !feedback.trim()) throw new Error("Add feedback before returning the submission to the Student.");
      return adminAssignmentsApi.review(selected.id, submission.id, { expectedVersion: submission.version, status: decision, score: parsedScore, feedback: feedback.trim() || null, reason: reason.trim() });
    },
    onSuccess: async () => { setMessage(decision === "reviewed" ? "Submission review saved." : "Submission returned to the Student with feedback."); setReason(""); await Promise.all([client.invalidateQueries({ queryKey: ["admin", "assignments"] }), client.invalidateQueries({ queryKey: ["admin", "assignment-submissions", selected?.id] })]); },
    onError: error => setMessage(errorText(error)),
  });
  const createAssignment = useMutation({
    mutationFn: () => {
      if (!selectedCourse) throw new Error("Choose one of your mapped courses.");
      if (!newTitle.trim()) throw new Error("Enter an Assignment title.");
      const parsedScore = newMaxScore.trim() ? Number(newMaxScore) : null;
      if (parsedScore !== null && (!Number.isFinite(parsedScore) || parsedScore <= 0)) throw new Error("Maximum score must be a positive number.");
      const dueAt = newDueAt ? new Date(newDueAt).toISOString() : null;
      return adminAssignmentsApi.create(selectedCourse.brandId, { assignmentId: crypto.randomUUID(), brandCourseId: selectedCourse.id, academicInstitutionId: selectedCourse.academicInstitutionId!, academicLevelId: selectedCourse.academicLevelId!, academicSemesterId: selectedCourse.academicSemesterId!, title: newTitle.trim(), instructions: newInstructions.trim(), availableFrom: null, dueAt, maxScore: parsedScore });
    },
    onSuccess: async result => { setMessage("Draft Assignment created. Review it and publish when it is ready for students."); setNewTitle(""); setNewInstructions(""); setNewDueAt(""); setNewMaxScore(""); await client.invalidateQueries({ queryKey: ["admin", "assignments"] }); setSelectedId(result.assignmentId); },
    onError: error => setMessage(errorText(error)),
  });
  const lifecycle = useMutation({
    mutationFn: (status: "published" | "closed") => {
      if (!selected) throw new Error("Select an Assignment first.");
      return adminAssignmentsApi.update(selected.id, { expectedVersion: selected.version, status });
    },
    onSuccess: async result => { setMessage(result.status === "published" ? "Assignment published for students in this course." : "Assignment closed."); await client.invalidateQueries({ queryKey: ["admin", "assignments"] }); },
    onError: error => setMessage(errorText(error)),
  });

  const openAttachment = async (attachmentId: string) => {
    if (!selected || !submission) return;
    setOpeningAttachmentId(attachmentId);
    setMessage("");
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    try {
      const url = await adminAssignmentsApi.openAttachment(selected.id, submission.id, attachmentId);
      if (tab) tab.location.assign(url);
      else window.location.assign(url);
    } catch (error) {
      tab?.close();
      setMessage(errorText(error));
    } finally {
      setOpeningAttachmentId(null);
    }
  };

  return <section className="admin-v2__page">
    <header className="admin-v2__page-header"><div><h1>{isInstructor ? "Assignments" : "Assignment Review"}</h1><p>{isInstructor ? "Create course assignments, publish them to students, and review submissions." : "Review persisted Student submissions, record scores, or return work with feedback."}</p></div></header>
    {message && <p role="status" className="admin-v2__inline-notice">{message}</p>}
    {list.isError && <p role="alert" className="admin-v2__inline-notice">{errorText(list.error)} <button className="admin-v2__button" type="button" onClick={() => void list.refetch()}>Retry</button></p>}
    {isInstructor && <form className="admin-v2__inspector-content" onSubmit={event => { event.preventDefault(); createAssignment.mutate(); }}>
      <div className="admin-v2__page-header"><div><h2>Create an Assignment</h2><p>Assignments are scoped to your assigned courses and publish directly to those students.</p></div></div>
      <div className="admin-v2__table-tools">
        <label className="admin-v2__field"><span>Course</span><select aria-label="Assignment course" value={newCourseId} onChange={event => setNewCourseId(event.target.value)} required><option value="">Choose course</option>{courseOptions.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
        <label className="admin-v2__field"><span>Title</span><input value={newTitle} onChange={event => setNewTitle(event.target.value)} maxLength={240} required /></label>
        <label className="admin-v2__field"><span>Maximum score</span><input type="number" min={0.01} step="0.01" value={newMaxScore} onChange={event => setNewMaxScore(event.target.value)} placeholder="Optional" /></label>
        <label className="admin-v2__field"><span>Due date</span><input type="datetime-local" value={newDueAt} onChange={event => setNewDueAt(event.target.value)} /></label>
        <label className="admin-v2__field"><span>Instructions</span><textarea rows={3} maxLength={20000} value={newInstructions} onChange={event => setNewInstructions(event.target.value)} /></label>
        <button className="admin-v2__button is-primary" type="submit" disabled={!selectedCourse || !newTitle.trim() || createAssignment.isPending}>{createAssignment.isPending ? "Creating…" : "Create draft"}</button>
        {!courseOptions.length && <p className="admin-v2__muted">Your assigned courses need a verified academic placement before you can create an Assignment.</p>}
      </div>
    </form>}
    <div className="admin-v2__workgrid has-inspector">
      <TableFrame title="Assignment review queue" count={list.isLoading ? "Loading…" : `${items.length} assignments`} toolbar={<div className="admin-v2__table-tools"><button className="admin-v2__button" type="button" onClick={() => void list.refetch()} disabled={list.isFetching}><RefreshCw size={13} /> Refresh</button></div>}>
        {list.isLoading ? <div className="admin-v2__empty" role="status">Loading saved Assignments…</div> : items.length === 0 ? <div className="admin-v2__empty"><ClipboardCheck size={18} /><strong>No Assignments</strong><span>Assignments will appear here when they are published for your authorized Brands.</span></div> : <table className="admin-v2__table"><thead><tr><th>Assignment</th><th>Course</th><th>Status</th><th>To review</th><th>Due</th></tr></thead><tbody>{items.map(item => <tr key={item.id} onClick={() => { setSelectedId(item.id); setSelectedSubmissionId(""); setMessage(""); }} className={selected?.id === item.id ? "is-selected" : ""}><td><strong>{item.title}</strong><small>{item.brandCode}</small></td><td>{item.courseTitle ?? "—"}</td><td>{item.status}</td><td>{item.needsReviewCount}</td><td>{when(item.dueAt)}</td></tr>)}</tbody></table>}
        {selected && <section className="admin-v2__inspector-section"><header><h3>Student submissions</h3><span>{submissions.isLoading ? "Loading…" : `${submissions.data?.items.length ?? 0} submissions`}</span></header>
          {submissions.isError ? <p role="alert" className="admin-v2__empty-inline">{errorText(submissions.error)} <button className="admin-v2__button" type="button" onClick={() => void submissions.refetch()}>Retry</button></p> : submissions.isLoading ? <div role="status" className="admin-v2__empty">Loading saved submissions…</div> : !submissions.data?.items.length ? <div className="admin-v2__empty-inline">No Student submissions have been recorded.</div> : <table className="admin-v2__table"><thead><tr><th>Student</th><th>Submitted</th><th>Status</th><th>Score</th></tr></thead><tbody>{submissions.data.items.map(item => <tr key={item.id} onClick={() => { setSelectedSubmissionId(item.id); setMessage(""); }} className={submission?.id === item.id ? "is-selected" : ""}><td><strong>{item.studentName ?? "Student"}</strong></td><td>{when(item.submittedAt)}</td><td><StatusBadge status={item.status === "reviewed" ? "Reviewed" : item.status === "returned" ? "Returned" : "Submitted"} /></td><td>{item.score ?? "—"}{submissions.data.assignment.maxScore !== null ? ` / ${submissions.data.assignment.maxScore}` : ""}</td></tr>)}</tbody></table>}
        </section>}
      </TableFrame>
      <aside className="admin-v2__inspector admin-v2__course-inspector">
        {!selected ? <div className="admin-v2__empty-inspector"><ClipboardCheck size={22} /><strong>Select an Assignment</strong><span>Choose a course Assignment to inspect submissions.</span></div> : <>
          <header className="admin-v2__inspector-title"><div><h2>{selected.title}</h2><small>{selected.courseTitle ?? "Course Assignment"} · {selected.status}</small></div><StatusBadge status={selected.status === "published" ? "Published" : selected.status === "draft" ? "Draft" : selected.status === "archived" ? "Archived" : "Closed"} /></header>
          <InspectorSection title="Assignment lifecycle"><div className="admin-v2__inspector-content"><p>Students see published assignments in this course. Drafts remain instructor-only; Super Admin may close a published Assignment when needed.</p>{isInstructor && selected.status === "draft" && <button type="button" className="admin-v2__button is-primary" onClick={() => lifecycle.mutate("published")} disabled={lifecycle.isPending}>{lifecycle.isPending ? "Publishing…" : "Publish to students"}</button>}{selected.status === "published" && <button type="button" className="admin-v2__button" onClick={() => lifecycle.mutate("closed")} disabled={lifecycle.isPending}>{lifecycle.isPending ? "Closing…" : "Close Assignment"}</button>}</div></InspectorSection>
          {!submission ? <div className="admin-v2__empty-inspector"><ClipboardCheck size={22} /><strong>No submission selected</strong><span>Student submissions for this Assignment will appear here.</span></div> : <>
          <header className="admin-v2__inspector-title"><div><h2>{submission.studentName ?? "Student"}</h2><small>{selected.title}</small></div><StatusBadge status={submission.status === "reviewed" ? "Reviewed" : submission.status === "returned" ? "Returned" : "Submitted"} /></header>
          <InspectorFields fields={[["Submitted", when(submission.submittedAt)], ["Course", selected.courseTitle ?? "—"], ["Maximum score", submissions.data?.assignment.maxScore ?? "Not configured"], ["Last reviewed", when(submission.reviewedAt)]]} />
          <InspectorSection title="Student response"><div className="admin-v2__inspector-content"><p className="admin-v2__assignment-response">{submission.responseText || "No text response was submitted."}</p></div></InspectorSection>
          <InspectorSection title="Attachments"><div className="admin-v2__inspector-content">
            {!submission.attachments.length ? <p className="admin-v2__muted">No verified files were attached to this submission.</p> : <div className="space-y-2">{submission.attachments.map(attachment => <div key={attachment.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2"><div className="min-w-0"><strong className="block truncate text-sm">{attachment.originalFilename}</strong><span className="text-xs text-gray-500">{attachment.contentType} · {(attachment.size / (1024 * 1024)).toFixed(1)} MiB</span></div><button type="button" className="admin-v2__button" onClick={() => void openAttachment(attachment.id)} disabled={openingAttachmentId === attachment.id}>{openingAttachmentId === attachment.id ? "Opening…" : <><Download size={13} /> Open</>}</button></div>)}</div>}
          </div></InspectorSection>
          <InspectorSection title="Review"><div className="admin-v2__inspector-content">
            <label className="admin-v2__field"><span>Decision</span><select value={decision} onChange={event => setDecision(event.target.value as "reviewed" | "returned")} disabled={review.isPending || submission.status !== "submitted"}><option value="reviewed">Mark reviewed</option><option value="returned">Return for revision</option></select></label>
            {decision === "reviewed" && <label className="admin-v2__field"><span>Score {submissions.data?.assignment.maxScore !== null ? `(max ${submissions.data?.assignment.maxScore})` : "(optional)"}</span><input type="number" min={0} max={submissions.data?.assignment.maxScore ?? undefined} step="0.01" value={score} onChange={event => setScore(event.target.value)} disabled={review.isPending || submission.status !== "submitted"} /></label>}
            <label className="admin-v2__field"><span>Feedback</span><textarea rows={4} maxLength={10000} value={feedback} onChange={event => setFeedback(event.target.value)} disabled={review.isPending || submission.status !== "submitted"} /></label>
            <label className="admin-v2__field"><span>Audit reason</span><textarea rows={2} maxLength={500} value={reason} onChange={event => setReason(event.target.value)} disabled={review.isPending || submission.status !== "submitted"} required /></label>
            {submission.status === "reviewed" && <p className="admin-v2__muted">This review is final. If revision is needed, a returned submission can be reviewed again after the Student resubmits.</p>}
            {submission.status === "returned" && <p className="admin-v2__muted">This submission was returned and is awaiting a Student resubmission before another review.</p>}
            <button type="button" className="admin-v2__button is-primary" onClick={() => review.mutate()} disabled={review.isPending || submission.status !== "submitted" || !reason.trim() || (decision === "returned" && !feedback.trim())}>{review.isPending ? "Saving…" : submission.status === "returned" ? "Awaiting resubmission" : submission.status === "reviewed" ? "Review complete" : decision === "returned" ? "Return submission" : "Save review"}</button>
          </div></InspectorSection>
          </>}
        </>}
      </aside>
    </div>
  </section>;
}

export default AssignmentReviewPage;
