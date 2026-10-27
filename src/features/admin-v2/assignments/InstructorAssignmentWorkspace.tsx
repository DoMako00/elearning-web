import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownToLine, ArrowRight, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, ClipboardCheck, Download, ExternalLink, FileCheck2, FileText, ListChecks, Plus, RefreshCw, Search, Users, X } from "lucide-react";
import { adminAssignmentsApi, type AdminAssignmentSubmissionDto } from "../api/adminAssignmentsApi";
import { listInstructorStudents } from "../api/instructorWorkspaceApi";
import { useAdminV2 } from "../layout/AdminV2Layout";
import { getWorkspaceCopy } from "../copy/workspace-copy";
import { friendlyError, type FriendlyErrorInfo } from "../utils/friendlyError";
import { FriendlyErrorNotice } from "../shared/FriendlyErrorNotice";
import { InstructorAssignmentSkeleton } from "./InstructorAssignmentSkeleton";
import "./instructor-assignment-workspace.css";

type WorkspaceTab = "assignments" | "grading";
type StudentFilter = "all" | "to-grade" | "graded" | "returned" | "not-submitted";
type AssignmentRow = { id: string; name: string; submission: AdminAssignmentSubmissionDto | null };

const dateTime = (value: string | null | undefined) => value ? new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "No due date";
const studentStatus = (submission: AdminAssignmentSubmissionDto | null) => !submission ? "Not submitted" : submission.status === "submitted" ? "To grade" : submission.status === "reviewed" ? "Graded" : "Returned";
const statusClass = (status: string) => status.toLowerCase().replaceAll(" ", "-");

export function InstructorAssignmentWorkspace() {
  const { workspace } = useAdminV2();
  const copy = getWorkspaceCopy(workspace.workspace);
  const client = useQueryClient();
  const courses = workspace.courses.filter(course => course.status !== "archived");
  const createCourses = courses.filter(course => course.academicInstitutionId && course.academicLevelId && course.academicSemesterId);
  const [tab, setTab] = useState<WorkspaceTab>("grading");
  const [courseFilter, setCourseFilter] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentFilter, setStudentFilter] = useState<StudentFilter>("all");
  const [search, setSearch] = useState("");
  const [decision, setDecision] = useState<"reviewed" | "returned">("reviewed");
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [reason, setReason] = useState("");
  const [moveNext, setMoveNext] = useState(true);
  const [message, setMessage] = useState("");
  const [errorInfo, setErrorInfo] = useState<FriendlyErrorInfo | null>(null);
  const [newCourseId, setNewCourseId] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newInstructions, setNewInstructions] = useState("");
  const [newDueAt, setNewDueAt] = useState("");
  const [newMaxScore, setNewMaxScore] = useState("");
  const [openingAttachmentId, setOpeningAttachmentId] = useState<string | null>(null);

  const assignmentsQuery = useQuery({ queryKey: ["admin", "assignments"], queryFn: ({ signal }) => adminAssignmentsApi.list(signal) });
  const rosterQuery = useQuery({ queryKey: ["instructor", "assignment-roster"], queryFn: () => listInstructorStudents() });
  const items = assignmentsQuery.data?.items ?? [];
  const activeCourseId = courseFilter || items[0]?.brandCourseId || courses[0]?.id || "";
  const courseAssignments = useMemo(() => activeCourseId ? items.filter(item => item.brandCourseId === activeCourseId) : items, [activeCourseId, items]);
  const selected = courseAssignments.find(item => item.id === selectedId) ?? courseAssignments[0] ?? null;
  const assignmentQuery = useQuery({ queryKey: ["admin", "assignment-submissions", selected?.id], queryFn: ({ signal }) => adminAssignmentsApi.submissions(selected!.id, signal), enabled: Boolean(selected) });
  const submissionItems = assignmentQuery.data?.items ?? [];
  const rosterRows = useMemo<AssignmentRow[]>(() => {
    const submissionsByStudent = new Map(submissionItems.map(item => [item.studentProfileId, item]));
    const students = (rosterQuery.data ?? []).filter(student => !selected?.brandCourseId || student.courseIds.includes(selected.brandCourseId));
    const rows: AssignmentRow[] = students.map(student => ({ id: student.id, name: student.displayName ?? "Student", submission: submissionsByStudent.get(student.id) ?? null }));
    const known = new Set(rows.map(row => row.id));
    submissionItems.forEach(item => { if (!known.has(item.studentProfileId)) rows.push({ id: item.studentProfileId, name: item.studentName ?? "Student", submission: item }); });
    return rows.sort((left, right) => {
      const order = (row: AssignmentRow) => row.submission?.status === "submitted" ? 0 : row.submission?.status === "returned" ? 1 : row.submission?.status === "reviewed" ? 2 : 3;
      return order(left) - order(right) || left.name.localeCompare(right.name);
    });
  }, [rosterQuery.data, selected?.brandCourseId, submissionItems]);
  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rosterRows.filter(row => {
      const state = row.submission?.status ?? "not-submitted";
      const matchesFilter = studentFilter === "all" || studentFilter === "to-grade" && state === "submitted" || studentFilter === "graded" && state === "reviewed" || studentFilter === "returned" && state === "returned" || studentFilter === "not-submitted" && state === "not-submitted";
      const matchesSearch = !query || row.name.toLowerCase().includes(query) || row.id.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [rosterRows, search, studentFilter]);
  const selectedRow = visibleRows.find(row => row.id === selectedStudentId) ?? visibleRows.find(row => row.submission?.status === "submitted") ?? visibleRows[0] ?? null;
  const submission = selectedRow?.submission ?? null;
  const summaryCount = rosterQuery.isError ? submissionItems.length : rosterRows.length;
  const pendingCount = rosterRows.filter(row => row.submission?.status === "submitted").length;
  const reviewedCount = rosterRows.filter(row => row.submission?.status === "reviewed").length;
  const returnedCount = rosterRows.filter(row => row.submission?.status === "returned").length;
  const notSubmittedCount = rosterRows.filter(row => !row.submission).length;
  const activePosition = selectedRow ? visibleRows.findIndex(row => row.id === selectedRow.id) + 1 : 0;

  useEffect(() => { if (selected && selected.id !== selectedId) setSelectedId(selected.id); }, [selected, selectedId]);
  useEffect(() => {
    if (!selectedRow) { setSelectedStudentId(""); return; }
    if (selectedRow.id !== selectedStudentId) setSelectedStudentId(selectedRow.id);
  }, [selectedRow, selectedStudentId]);
  useEffect(() => {
    if (!submission) { setScore(""); setFeedback(""); setReason(""); setDecision("reviewed"); return; }
    setDecision(submission.status === "returned" ? "returned" : "reviewed");
    setScore(submission.score === null ? "" : String(submission.score));
    setFeedback(submission.feedback ?? "");
    setReason("");
  }, [submission?.id, submission?.version]);
  useEffect(() => { if (newCourseId || !createCourses[0]) return; setNewCourseId(createCourses[0].id); }, [createCourses, newCourseId]);

  const review = useMutation({
    mutationFn: async () => {
      if (!selected || !submission) throw new Error("Select a submitted student response first.");
      if (!reason.trim()) throw new Error("Add an audit reason for this review.");
      const parsedScore = decision === "returned" || score.trim() === "" ? null : Number(score);
      const maximum = assignmentQuery.data?.assignment.maxScore;
      if (parsedScore !== null && (!Number.isFinite(parsedScore) || parsedScore < 0 || maximum !== null && maximum !== undefined && parsedScore > maximum)) throw new Error("Score must be within the Assignment maximum.");
      if (decision === "reviewed" && maximum !== null && maximum !== undefined && parsedScore === null) throw new Error("Enter the score before marking this submission reviewed.");
      if (decision === "returned" && !feedback.trim()) throw new Error("Add feedback before returning the submission to the Student.");
      return adminAssignmentsApi.review(selected.id, submission.id, { expectedVersion: submission.version, status: decision, score: parsedScore, feedback: feedback.trim() || null, reason: reason.trim() });
    },
    onSuccess: async () => {
      setMessage(decision === "reviewed" ? "Submission review saved." : "Submission returned to the Student with feedback.");
      setReason(""); setErrorInfo(null);
      const nextRow = visibleRows.slice(Math.max(0, activePosition)).find(row => row.submission?.status === "submitted");
      if (moveNext && nextRow) setSelectedStudentId(nextRow.id);
      await Promise.all([client.invalidateQueries({ queryKey: ["admin", "assignments"] }), client.invalidateQueries({ queryKey: ["admin", "assignment-submissions", selected?.id] })]);
    },
    onError: error => setErrorInfo(friendlyError(error)),
  });
  const createAssignment = useMutation({
    mutationFn: () => {
      const course = createCourses.find(item => item.id === newCourseId);
      if (!course) throw new Error("Choose one of your mapped courses.");
      if (!newTitle.trim()) throw new Error("Enter an Assignment title.");
      const parsedScore = newMaxScore.trim() ? Number(newMaxScore) : null;
      if (parsedScore !== null && (!Number.isFinite(parsedScore) || parsedScore <= 0)) throw new Error("Maximum score must be a positive number.");
      return adminAssignmentsApi.create(course.brandId, { assignmentId: crypto.randomUUID(), brandCourseId: course.id, academicInstitutionId: course.academicInstitutionId!, academicLevelId: course.academicLevelId!, academicSemesterId: course.academicSemesterId!, title: newTitle.trim(), instructions: newInstructions.trim(), availableFrom: null, dueAt: newDueAt ? new Date(newDueAt).toISOString() : null, maxScore: parsedScore });
    },
    onSuccess: async result => { setMessage("Draft Assignment created. Review it and publish when it is ready for students."); setErrorInfo(null); setNewTitle(""); setNewInstructions(""); setNewDueAt(""); setNewMaxScore(""); await client.invalidateQueries({ queryKey: ["admin", "assignments"] }); setSelectedId(result.assignmentId); },
    onError: error => { setErrorInfo(friendlyError(error)); setMessage(""); },
  });
  const lifecycle = useMutation({
    mutationFn: (status: "published" | "closed") => {
      if (!selected) throw new Error("Select an Assignment first.");
      return adminAssignmentsApi.update(selected.id, { expectedVersion: selected.version, status });
    },
    onSuccess: async result => { setMessage(result.status === "published" ? "Assignment published for students in this course." : "Assignment closed."); setErrorInfo(null); await client.invalidateQueries({ queryKey: ["admin", "assignments"] }); },
    onError: error => { setErrorInfo(friendlyError(error)); setMessage(""); },
  });

  const refresh = async () => { await Promise.all([assignmentsQuery.refetch(), selected ? assignmentQuery.refetch() : Promise.resolve()]); };
  const openAttachment = async (attachmentId: string) => {
    if (!selected || !submission) return;
    setOpeningAttachmentId(attachmentId); setMessage("");
    const tabWindow = window.open("about:blank", "_blank");
    if (tabWindow) tabWindow.opener = null;
    try {
      const url = await adminAssignmentsApi.openAttachment(selected.id, submission.id, attachmentId);
      if (tabWindow) tabWindow.location.assign(url); else window.location.assign(url);
    } catch (error) { tabWindow?.close(); setErrorInfo(friendlyError(error)); setMessage(""); }
    finally { setOpeningAttachmentId(null); }
  };
  const exportGrades = () => {
    if (!selected || !assignmentQuery.data) return;
    const escape = (value: string | number | null) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = [
      ["Student", "Student ID", "Status", "Score", "Maximum score", "Feedback", "Submitted at", "Reviewed at"],
      ...rosterRows.map(row => [row.name, row.id, studentStatus(row.submission), row.submission?.score ?? "", assignmentQuery.data.assignment.maxScore ?? "", row.submission?.feedback ?? "", row.submission?.submittedAt ?? "", row.submission?.reviewedAt ?? ""]),
    ];
    const csv = rows.map(row => row.map(escape).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `${selected.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "assignment"}-grades.csv`; link.click(); URL.revokeObjectURL(url);
  };

  if (assignmentsQuery.isLoading) return <InstructorAssignmentSkeleton />;
  const filterCounts: Record<StudentFilter, number> = { all: rosterRows.length, "to-grade": pendingCount, graded: reviewedCount, returned: returnedCount, "not-submitted": notSubmittedCount };
  const filters: Array<{ id: StudentFilter; label: string }> = [{ id: "all", label: "All" }, { id: "to-grade", label: "To grade" }, { id: "graded", label: "Graded" }, { id: "returned", label: "Returned" }, { id: "not-submitted", label: "Not submitted" }];
  const toGradePosition = submissionItems.filter(item => item.status === "submitted").findIndex(item => item.id === submission?.id) + 1;

  return <main className="instructor-assignments" aria-label="Assignments and grading" aria-busy={assignmentQuery.isLoading || rosterQuery.isLoading}>
    <header className="instructor-assignments__heading">
      <div><span>INSTRUCTOR WORKSPACE</span><h1>Assignments &amp; grading</h1><p>Manage student submissions and return feedback.</p></div>
      <div className="instructor-assignments__heading-actions"><button type="button" className="instructor-assignments__secondary-button" onClick={() => void refresh()} disabled={assignmentsQuery.isFetching || assignmentQuery.isFetching}><RefreshCw size={15} /> Refresh</button><button type="button" className="instructor-assignments__secondary-button" onClick={exportGrades} disabled={!selected || !assignmentQuery.data}><ArrowDownToLine size={15} /> Export grades</button></div>
    </header>

    <nav className="instructor-assignments__tabs" aria-label="Assignment workspace tabs">
      <button type="button" role="tab" data-instructor-guide-target="assignment-list-tab" className={tab === "assignments" ? "is-active" : ""} aria-selected={tab === "assignments"} onClick={() => setTab("assignments")}>Assignments</button>
      <button type="button" role="tab" data-instructor-guide-target="assignment-grading-tab" className={tab === "grading" ? "is-active" : ""} aria-selected={tab === "grading"} onClick={() => setTab("grading")}><ClipboardCheck size={15} /> Submissions &amp; grading</button>
    </nav>

    <section className="instructor-assignments__summary" aria-label="Selected course assignment">
      <label data-instructor-guide-target="assignment-course"><span>Course</span><span className="instructor-assignments__select-wrap"><select value={activeCourseId} onChange={event => { setCourseFilter(event.target.value); setSelectedStudentId(""); }} aria-label="Filter assignments by course"><option value="">All courses</option>{courses.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}</select><ChevronDown size={15} /></span></label>
      <label data-instructor-guide-target="assignment-select"><span>Assignment</span><span className="instructor-assignments__select-wrap"><select value={selected?.id ?? ""} onChange={event => { setSelectedId(event.target.value); setSelectedStudentId(""); }} aria-label="Select assignment"><option value="">Choose assignment</option>{courseAssignments.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select><ChevronDown size={15} /></span></label>
      <div className="instructor-assignments__summary-detail"><CalendarDays size={19} /><span><small>Due</small><strong>{dateTime(selected?.dueAt)}</strong></span></div>
      <div className="instructor-assignments__summary-detail"><span><small>Status</small><strong className={`instructor-assignments__status is-${statusClass(selected?.status ?? "empty")}`}>{selected?.status ?? "No assignment"}</strong></span></div>
      <div className="instructor-assignments__summary-detail instructor-assignments__summary-count"><Users size={20} /><strong>{rosterQuery.isLoading ? "Loading students…" : `${summaryCount} students · ${submissionItems.length} submitted · ${pendingCount} to grade`}</strong></div>
    </section>

    {(message || errorInfo || assignmentsQuery.isError || rosterQuery.isError) && <div className="instructor-assignments__notices">{message && <p role="status"><Check size={14} /> {message}<button type="button" onClick={() => setMessage("")} aria-label="Dismiss message"><X size={14} /></button></p>}{errorInfo && <FriendlyErrorNotice error={errorInfo} />}{assignmentsQuery.isError && <FriendlyErrorNotice error={friendlyError(assignmentsQuery.error)} onRetry={() => void assignmentsQuery.refetch()} />}{rosterQuery.isError && <p role="status">Student roster unavailable; showing students with submitted work only.</p>}</div>}

    {tab === "grading" ? <div className="instructor-assignments__grading-grid">
      <section className="instructor-assignments__panel instructor-assignments__students" aria-label="Students">
        <header className="instructor-assignments__panel-heading"><div><h2>Students <small>{rosterQuery.isLoading ? "…" : summaryCount}</small></h2></div><label className="instructor-assignments__search"><Search size={15} /><input data-instructor-guide-target="assignment-student-search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search name or student ID" aria-label="Search students" /></label></header>
        <div className="instructor-assignments__filters" role="tablist" aria-label="Filter students">{filters.map(filter => <button type="button" role="tab" key={filter.id} className={studentFilter === filter.id ? "is-active" : ""} aria-selected={studentFilter === filter.id} onClick={() => { setStudentFilter(filter.id); setSelectedStudentId(""); }}>{filter.label}<span>{filterCounts[filter.id]}</span></button>)}</div>
        <div data-instructor-guide-target="assignment-student-list" className="instructor-assignments__student-scroll">
          {rosterQuery.isLoading && !submissionItems.length ? <StudentListSkeleton /> : !selected ? <div className="instructor-assignments__empty"><ClipboardCheck size={23} /><strong>Select an assignment</strong><span>Choose an assignment above to see its students and submissions.</span></div> : assignmentQuery.isLoading ? <StudentListSkeleton /> : visibleRows.length ? visibleRows.map(row => <button type="button" key={row.id} className={`instructor-assignments__student-row${selectedRow?.id === row.id ? " is-selected" : ""}`} onClick={() => setSelectedStudentId(row.id)} aria-pressed={selectedRow?.id === row.id}>
            <span className="instructor-assignments__student-avatar">{row.name.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase()}</span><span className="instructor-assignments__student-name"><strong>{row.name}</strong><small>{row.id.slice(-8).toUpperCase()}</small></span><span className={`instructor-assignments__student-status is-${statusClass(studentStatus(row.submission))}`}>{studentStatus(row.submission)}</span><span className="instructor-assignments__student-score">{row.submission?.score ?? (row.submission ? "—" : "—")}{row.submission && assignmentQuery.data?.assignment.maxScore !== null ? ` / ${assignmentQuery.data?.assignment.maxScore}` : ""}</span><ChevronRight size={15} />
          </button>) : <div className="instructor-assignments__empty"><Search size={21} /><strong>No students match</strong><span>Try a different name, ID, or submission filter.</span></div>}
        </div>
        <footer className="instructor-assignments__panel-footer"><span>{visibleRows.length} of {rosterQuery.isError ? submissionItems.length : rosterRows.length} students</span><button type="button" className="instructor-assignments__download-button" onClick={exportGrades} disabled={!selected || !assignmentQuery.data}><Download size={14} /> Download all</button></footer>
      </section>

      <section className="instructor-assignments__panel instructor-assignments__response" aria-label="Student submission">
        {!selected ? <div className="instructor-assignments__empty"><ClipboardCheck size={25} /><strong>No assignment selected</strong><span>Select an assignment to load student work.</span></div> : assignmentQuery.isLoading ? <ResponseSkeleton /> : !selectedRow ? <div className="instructor-assignments__empty"><Users size={25} /><strong>No student selected</strong><span>Choose a student from the list to review their work.</span></div> : !submission ? <div className="instructor-assignments__empty"><FileCheck2 size={25} /><strong>{selectedRow.name} has not submitted yet</strong><span>The submission will appear here when this student turns in their work.</span></div> : <>
          <header className="instructor-assignments__response-heading"><div><h2>{submission.studentName ?? selectedRow.name}</h2><span>{selectedRow.id.slice(-8).toUpperCase()}</span><span className={`instructor-assignments__student-status is-${statusClass(studentStatus(submission))}`}>{studentStatus(submission)}</span></div><div><small>Submitted</small><strong>{dateTime(submission.submittedAt)}</strong></div></header>
          <div className="instructor-assignments__attachments" aria-label="Submission attachments">{submission.attachments.length ? submission.attachments.map(attachment => <div className="instructor-assignments__attachment" key={attachment.id}><FileText size={17} /><span><strong>{attachment.originalFilename}</strong><small>{attachment.contentType} · {(attachment.size / (1024 * 1024)).toFixed(1)} MiB</small></span><button type="button" onClick={() => void openAttachment(attachment.id)} disabled={openingAttachmentId === attachment.id} aria-label={`Open ${attachment.originalFilename}`}>{openingAttachmentId === attachment.id ? <RefreshCw size={15} className="is-spinning" /> : <ExternalLink size={15} />}</button></div>) : <div className="instructor-assignments__attachment instructor-assignments__attachment--empty"><FileText size={17} /><strong>No attachment submitted</strong></div>}</div>
          <div className="instructor-assignments__report-scroll" data-instructor-guide-target="assignment-response"><article className="instructor-assignments__report"><span>ASSIGNMENT RESPONSE</span><h3>{selected.title}</h3><p>{submission.responseText || "No text response was submitted."}</p></article></div>
          <footer className="instructor-assignments__response-footer"><span><FileCheck2 size={14} /> Submission details</span><span>{selectedRow.name}</span></footer>
        </>}
      </section>

      <aside className="instructor-assignments__panel instructor-assignments__grade" aria-label="Grade submission">
        {!selected ? <div className="instructor-assignments__empty"><ClipboardCheck size={23} /><strong>Grade submission</strong><span>Select an assignment and student to review work.</span></div> : !submission ? <div className="instructor-assignments__empty"><FileCheck2 size={23} /><strong>{selectedRow?.submission ? "No submission selected" : "Waiting for student work"}</strong><span>Grading fields are available after a student submits an assignment.</span></div> : <>
          <header className="instructor-assignments__grade-heading"><div><h2>Grade submission</h2><small>{toGradePosition ? `${toGradePosition} of ${pendingCount} to grade` : `${activePosition} of ${visibleRows.length} students`}</small></div><div className="instructor-assignments__row-navigation"><button type="button" onClick={() => setSelectedStudentId(visibleRows[Math.max(0, activePosition - 2)]?.id ?? selectedRow.id)} disabled={activePosition <= 1} aria-label="Previous student"><ChevronLeft size={17} /></button><button type="button" onClick={() => setSelectedStudentId(visibleRows[Math.min(visibleRows.length - 1, activePosition)]?.id ?? selectedRow.id)} disabled={activePosition >= visibleRows.length} aria-label="Next student"><ChevronRight size={17} /></button></div></header>
          <form data-instructor-guide-target="assignment-review-form" className="instructor-assignments__grade-form" onSubmit={event => { event.preventDefault(); review.mutate(); }}>
            <label data-instructor-guide-target="grade-score"><span>Score</span><div className="instructor-assignments__score-input"><input type="number" min={0} max={assignmentQuery.data?.assignment.maxScore ?? undefined} step="0.01" value={score} onChange={event => setScore(event.target.value)} disabled={review.isPending || submission.status !== "submitted"} placeholder="Enter score" /><span>/ {assignmentQuery.data?.assignment.maxScore ?? "—"}</span></div></label>
            <label data-instructor-guide-target="grade-feedback"><span>Feedback</span><textarea value={feedback} onChange={event => setFeedback(event.target.value)} rows={5} maxLength={10000} disabled={review.isPending || submission.status !== "submitted"} placeholder="Explain the grade and how to improve." /></label>
            <div data-instructor-guide-target="grade-decision" className="instructor-assignments__decision" role="group" aria-label="Review decision"><button type="button" className={decision === "reviewed" ? "is-active" : ""} onClick={() => setDecision("reviewed")} disabled={submission.status !== "submitted"}>Mark reviewed</button><button type="button" className={decision === "returned" ? "is-active" : ""} onClick={() => setDecision("returned")} disabled={submission.status !== "submitted"}>Return for revision</button></div>
            <label data-instructor-guide-target="grade-reason"><span>Audit reason</span><textarea value={reason} onChange={event => setReason(event.target.value)} rows={2} maxLength={500} disabled={review.isPending || submission.status !== "submitted"} required placeholder="Reason for this grading decision" /></label>
            <label className="instructor-assignments__next-toggle"><input type="checkbox" checked={moveNext} onChange={event => setMoveNext(event.target.checked)} /><span><Check size={14} /> Move to next student after saving</span></label>
            {submission.status !== "submitted" && <p className="instructor-assignments__final-note">{submission.status === "reviewed" ? "This review is final." : "This submission was returned and is awaiting a student resubmission."}</p>}
            <button data-instructor-guide-target="grade-submit" type="submit" className="instructor-assignments__submit" disabled={review.isPending || submission.status !== "submitted" || !reason.trim() || decision === "reviewed" && assignmentQuery.data?.assignment.maxScore !== null && !score.trim() || decision === "returned" && !feedback.trim()}>{review.isPending ? "Saving review…" : decision === "returned" ? <>Return grade &amp; feedback <ArrowRight size={16} /></> : <>Save review <ArrowRight size={16} /></>}</button>
          </form>
        </>}
      </aside>
    </div> : <div className="instructor-assignments__assignment-grid">
      <section data-instructor-guide-target="assignment-list" className="instructor-assignments__panel instructor-assignments__assignment-list"><header className="instructor-assignments__panel-heading"><div><h2>Assignments <small>{courseAssignments.length}</small></h2><p>Choose an assignment to manage publishing and review.</p></div></header>
        <div className="instructor-assignments__assignment-scroll">{courseAssignments.length ? courseAssignments.map(item => <button type="button" key={item.id} className={`instructor-assignments__assignment-row${selected?.id === item.id ? " is-selected" : ""}`} onClick={() => setSelectedId(item.id)}><span className="instructor-assignments__assignment-icon"><ListChecks size={18} /></span><span><strong>{item.title}</strong><small>{item.courseTitle ?? "Course assignment"} · due {dateTime(item.dueAt)}</small></span><span className={`instructor-assignments__status is-${statusClass(item.status)}`}>{item.status}</span><span className="instructor-assignments__assignment-count">{item.needsReviewCount} to grade</span><ChevronRight size={15} /></button>) : <div className="instructor-assignments__empty"><ClipboardCheck size={24} /><strong>No assignments yet</strong><span>Create a draft, then publish it for students in the selected course.</span></div>}</div>
      </section>
      <section className="instructor-assignments__panel instructor-assignments__create-panel"><header className="instructor-assignments__panel-heading"><div><h2>Create an assignment</h2><p>Assignments are scoped to your assigned course and publish directly to its students.</p></div></header>
        {selected && <div className="instructor-assignments__lifecycle"><span><strong>{selected.title}</strong><small>{selected.courseTitle ?? "Course assignment"} · {selected.status}</small></span>{selected.status === "draft" ? <button type="button" onClick={() => lifecycle.mutate("published")} disabled={lifecycle.isPending}>{lifecycle.isPending ? "Publishing…" : "Publish to students"}</button> : selected.status === "published" ? <button type="button" className="is-outline" onClick={() => lifecycle.mutate("closed")} disabled={lifecycle.isPending}>{lifecycle.isPending ? "Closing…" : "Close assignment"}</button> : null}</div>}
        <form data-instructor-guide-target="assignment-create-form" className="instructor-assignments__create-form" onSubmit={event => { event.preventDefault(); createAssignment.mutate(); }}>
          <label data-instructor-guide-target="assignment-create-course"><span>Course</span><select value={newCourseId} onChange={event => setNewCourseId(event.target.value)} required><option value="">Choose course</option>{createCourses.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
          <label data-instructor-guide-target="assignment-create-title"><span>Assignment title</span><input value={newTitle} onChange={event => setNewTitle(event.target.value)} maxLength={240} required placeholder="e.g. Chapter 1 review" /></label>
          <div className="instructor-assignments__create-row"><label><span>Maximum score</span><input type="number" min={0.01} step="0.01" value={newMaxScore} onChange={event => setNewMaxScore(event.target.value)} placeholder="Optional" /></label><label data-instructor-guide-target="assignment-create-due"><span>Due date</span><input type="datetime-local" value={newDueAt} onChange={event => setNewDueAt(event.target.value)} /></label></div>
          <label data-instructor-guide-target="assignment-create-instructions"><span>Instructions</span><textarea rows={4} maxLength={20000} value={newInstructions} onChange={event => setNewInstructions(event.target.value)} placeholder="Explain what students should submit." /></label>
          {!createCourses.length && <p className="instructor-assignments__placement-notice">{copy.assignments.missingPlacementNotice}</p>}
          <button data-instructor-guide-target="assignment-create-button" className="instructor-assignments__submit" type="submit" disabled={!createCourses.some(course => course.id === newCourseId) || !newTitle.trim() || createAssignment.isPending}>{createAssignment.isPending ? "Creating draft…" : <><Plus size={15} /> Create draft</>}</button>
        </form>
      </section>
    </div>}
  </main>;
}

function StudentListSkeleton() { return <div className="instructor-assignments__student-skeletons" aria-hidden="true">{[0, 1, 2, 3, 4, 5].map(item => <div key={item}><i /><span><b /><small /></span><em /><strong /></div>)}</div>; }
function ResponseSkeleton() { return <div className="instructor-assignments__response-skeleton" aria-hidden="true"><div><b /><small /><i /></div><section><strong /><b /><p /><p /><p /></section></div>; }

