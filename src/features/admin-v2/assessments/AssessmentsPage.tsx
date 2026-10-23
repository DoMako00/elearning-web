import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminAssessmentApi, type AdminAssessmentQuestionDto } from "../api/adminAssessmentApi";
import { listBrandAccess, listCourses, listInstitutions } from "../api/adminAcademicApi";
import { InspectorFields, InspectorSection, TableFrame } from "../shared/AdminV2Table";
import { useAdminV2 } from "../layout/AdminV2Layout";

type QuestionDraft = Omit<AdminAssessmentQuestionDto, "version">;
const errorText = (error: unknown) => error instanceof Error ? error.message : "The assessment request failed.";
const asLocalTime = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

export function AssessmentsPage() {
  const { workspace } = useAdminV2();
  const isInstructor = workspace.workspace === "instructor";
  const client = useQueryClient();
  const list = useQuery({ queryKey: ["admin", "assessments"], queryFn: ({ signal }) => adminAssessmentApi.list(signal) });
  const brands = useQuery({ queryKey: ["admin", "assessment-brand-access"], queryFn: listBrandAccess, enabled: !isInstructor });
  const institutions = useQuery({ queryKey: ["admin", "assessment-academic-institutions"], queryFn: listInstitutions, enabled: !isInstructor });
  const [selectedId, setSelectedId] = useState("");
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedAttemptId, setSelectedAttemptId] = useState("");
  const [overrideScore, setOverrideScore] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [assessmentKind, setAssessmentKind] = useState<"quiz" | "exam">("quiz");
  const [title, setTitle] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableUntil, setAvailableUntil] = useState("");
  const [attemptsAllowed, setAttemptsAllowed] = useState(1);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState("");
  const [questionText, setQuestionText] = useState("[]");
  const [message, setMessage] = useState("");
  const selected = list.data?.items.find(item => item.id === selectedId) ?? list.data?.items[0] ?? null;
  const courses = useQuery({ queryKey: ["admin", "assessment-courses", selectedBrandId], queryFn: () => listCourses(selectedBrandId), enabled: !isInstructor && Boolean(selectedBrandId) });
  const detail = useQuery({ queryKey: ["admin", "assessment", selected?.id], queryFn: ({ signal }) => adminAssessmentApi.detail(selected!.id, signal), enabled: Boolean(selected) });
  const attempts = useQuery({ queryKey: ["admin", "assessment-attempts", selected?.id], queryFn: ({ signal }) => adminAssessmentApi.attempts(selected!.id, signal), enabled: Boolean(selected) });
  const selectedAttempt = attempts.data?.items.find(item => item.id === selectedAttemptId) ?? null;
  const scoreOverride = useMutation({ mutationFn: () => {
    if (!selected || !selectedAttempt) throw new Error("Select a completed Student attempt first.");
    const parsed = Number(overrideScore);
    if (!Number.isFinite(parsed) || parsed < 0 || !overrideReason.trim()) throw new Error("Enter an effective score and a reason for the audit record.");
    return adminAssessmentApi.overrideScore(selected.id, selectedAttempt.id, { expectedVersion: selectedAttempt.version, score: parsed, reason: overrideReason.trim() });
  }, onSuccess: async () => { setMessage("Effective score saved. The original calculated score is preserved."); setOverrideReason(""); await attempts.refetch(); }, onError: error => setMessage(errorText(error)) });
  useEffect(() => { if (selected && selected.id !== selectedId) setSelectedId(selected.id); }, [selected, selectedId]);
  useEffect(() => { if (!selected) return; setEditTitle(selected.title); setAvailableFrom(asLocalTime(selected.availableFrom)); setAvailableUntil(asLocalTime(selected.availableUntil)); setAttemptsAllowed(selected.attemptsAllowed); setTimeLimitMinutes(selected.timeLimitSeconds ? String(Math.round(selected.timeLimitSeconds / 60)) : ""); }, [selected?.id, selected?.version]);
  useEffect(() => {
    if (detail.data) setQuestionText(JSON.stringify(detail.data.questions.map(({ version: _version, ...question }) => question), null, 2));
  }, [detail.data]);
  const selectedBrand = isInstructor ? workspace.brands[0] ?? null : brands.data?.find(item => item.id === selectedBrandId) ?? null;
  const courseOptions = isInstructor
    ? workspace.courses.map(course => ({ id: course.id, title: course.title, academicModuleId: course.academicModuleId, academicInstitutionId: course.academicInstitutionId, academicLevelId: course.academicLevelId, academicSemesterId: course.academicSemesterId }))
    : (courses.data?.filter(course => course.academicModuleId) ?? []).map(course => ({ id: course.id, title: course.title, academicModuleId: course.academicModuleId, academicInstitutionId: course.academicInstitutionId, academicLevelId: null, academicSemesterId: null }));
  const selectedCourse = courseOptions.find(item => item.id === selectedCourseId) ?? null;
  const placement = useMemo(() => {
    if (isInstructor) {
      if (!selectedCourse?.academicInstitutionId || !selectedCourse.academicLevelId || !selectedCourse.academicSemesterId) return null;
      return { institution: { id: selectedCourse.academicInstitutionId }, level: { id: selectedCourse.academicLevelId }, semester: { id: selectedCourse.academicSemesterId } };
    }
    if (!selectedCourse?.academicModuleId || !institutions.data) return null;
    for (const institution of institutions.data) for (const level of institution.levels) for (const semester of level.semesters) {
      if (semester.modules.some(module => module.id === selectedCourse.academicModuleId)) return { institution, level, semester };
    }
    return null;
  }, [institutions.data, isInstructor, selectedCourse]);

  const refresh = async () => { await client.invalidateQueries({ queryKey: ["admin", "assessments"] }); if (selected) { await detail.refetch(); await attempts.refetch(); } };
  const create = useMutation({ mutationFn: () => {
    if (!selectedBrand || !selectedCourse || !placement) throw new Error("Choose a real Brand Course mapped to a persisted academic module.");
    if (!title.trim()) throw new Error("Enter an assessment title.");
    return adminAssessmentApi.create(selectedBrand.id, { assessmentId: crypto.randomUUID(), brandCourseId: selectedCourse.id, academicInstitutionId: placement.institution.id, academicLevelId: placement.level.id, academicSemesterId: placement.semester.id, title: title.trim(), kind: assessmentKind, availableFrom: null, availableUntil: null, attemptsAllowed: 1, timeLimitSeconds: null });
  }, onSuccess: async result => { setTitle(""); setMessage("Draft quiz created. Add questions before publishing."); await client.invalidateQueries({ queryKey: ["admin", "assessments"] }); setSelectedId(result.assessmentId); }, onError: error => setMessage(errorText(error)) });
  const saveQuestions = useMutation({ mutationFn: () => {
    if (!selected || !detail.data) throw new Error("Select an assessment first.");
    let parsed: QuestionDraft[];
    try { parsed = JSON.parse(questionText) as QuestionDraft[]; } catch { throw new Error("Questions must be valid JSON."); }
    if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > 200) throw new Error("Provide between 1 and 200 questions.");
    return adminAssessmentApi.replaceQuestions(selected.id, detail.data.assessment.version, parsed);
  }, onSuccess: async () => { setMessage("Questions saved from the server response."); await refresh(); }, onError: error => setMessage(errorText(error)) });
  const lifecycle = useMutation({ mutationFn: (status: "published" | "closed" | "archived") => {
    if (!selected || !detail.data) throw new Error("Select an assessment first.");
    return adminAssessmentApi.update(selected.id, { expectedVersion: detail.data.assessment.version, status });
  }, onSuccess: async () => { setMessage("Assessment status updated."); await refresh(); }, onError: error => setMessage(errorText(error)) });
  const saveDetails = useMutation({ mutationFn: () => {
    if (!selected || !detail.data) throw new Error("Select an assessment first.");
    const from = availableFrom ? new Date(availableFrom).toISOString() : null;
    const until = availableUntil ? new Date(availableUntil).toISOString() : null;
    if (from && until && new Date(until).getTime() <= new Date(from).getTime()) throw new Error("Availability end must be after availability start.");
    return adminAssessmentApi.update(selected.id, { expectedVersion: detail.data.assessment.version, title: editTitle.trim(), availableFrom: from, availableUntil: until, attemptsAllowed, timeLimitSeconds: timeLimitMinutes ? Number(timeLimitMinutes) * 60 : null });
  }, onSuccess: async () => { setMessage("Assessment details saved."); await refresh(); }, onError: error => setMessage(errorText(error)) });

  return <section className="admin-v2__page">
    <header className="admin-v2__page-header"><div><h1>Assessments</h1><p>Manage persisted quizzes and exams, schedules, questions, and attempt results.</p></div></header>
    {message && <p role="status" className="admin-v2__inline-notice">{message}</p>}
    {list.isError && <p role="alert" className="admin-v2__inline-notice">{errorText(list.error)} <button type="button" onClick={() => void list.refetch()}>Retry</button></p>}
    <div className="admin-v2__workgrid has-inspector">
      <TableFrame title="Assessment library" count={list.isLoading ? "Loading…" : `${list.data?.items.length ?? 0} assessments`} toolbar={isInstructor ? <form className="admin-v2__table-tools" onSubmit={event => { event.preventDefault(); create.mutate(); }}>
        {!isInstructor && <select aria-label="Authorized Brand" value={selectedBrandId} onChange={event => { setSelectedBrandId(event.target.value); setSelectedCourseId(""); }}><option value="">Choose Brand</option>{brands.data?.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select>}
        <select aria-label="Assessment type" value={assessmentKind} onChange={event => setAssessmentKind(event.target.value as "quiz" | "exam")}><option value="quiz">Quiz</option><option value="exam">Exam</option></select>
        <select aria-label="Mapped Brand Course" value={selectedCourseId} onChange={event => setSelectedCourseId(event.target.value)} disabled={!isInstructor && !selectedBrandId}><option value="">Choose mapped Course</option>{courseOptions.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}</select>
        <label className="admin-v2__search"><input aria-label="New assessment title" value={title} onChange={event => setTitle(event.target.value)} maxLength={240} placeholder={assessmentKind === "exam" ? "New exam title" : "New quiz title"} /></label>
        <button className="admin-v2__button is-primary" type="submit" disabled={!title.trim() || !placement || create.isPending}>{create.isPending ? "Creating…" : "Create draft"}</button>
      </form> : <span className="admin-v2__muted">Read-only oversight · authored by Instructors</span>}>
        {!isInstructor && courses.isError && <p role="alert" className="admin-v2__inline-notice">{errorText(courses.error)}</p>}
        {!isInstructor && brands.isError && <p role="alert" className="admin-v2__inline-notice">Unable to load authorized Brand options. <button type="button" onClick={() => void brands.refetch()}>Retry</button></p>}
        {!isInstructor && institutions.isError && <p role="alert" className="admin-v2__inline-notice">Unable to load academic mappings. <button type="button" onClick={() => void institutions.refetch()}>Retry</button></p>}
        {list.isLoading ? <div role="status" className="admin-v2__empty">Loading saved assessments…</div> : list.data?.items.length === 0 ? <div className="admin-v2__empty">No assessments have been created for your authorized Brands.</div> : <table className="admin-v2__table"><thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Questions</th><th>Attempts</th></tr></thead><tbody>{list.data?.items.map(item => <tr key={item.id} onClick={() => { setSelectedId(item.id); setMessage(""); }} className={selected?.id === item.id ? "is-selected" : ""}><td><strong>{item.title}</strong></td><td>{item.kind}</td><td>{item.status}</td><td>{item.questionCount ?? "—"}</td><td>{item.attemptCount ?? "—"}</td></tr>)}</tbody></table>}
      </TableFrame>
      <aside className="admin-v2__inspector admin-v2__course-inspector">{!selected ? <div className="admin-v2__empty">Select an assessment to review details and attempts.</div> : <>
        <header className="admin-v2__inspector-title"><div><h2>{selected.title}</h2><small>{selected.brandCode} · {selected.kind} · {selected.status}</small></div></header>
        {detail.isLoading ? <div role="status" className="admin-v2__empty">Loading assessment details…</div> : detail.isError ? <p role="alert" className="admin-v2__inline-notice">{errorText(detail.error)} <button className="admin-v2__button" type="button" onClick={() => void detail.refetch()}>Retry</button></p> : detail.data && <>
          <InspectorFields fields={[["Course", detail.data.assessment.courseTitle ?? "No course mapped"], ["Question count", detail.data.questions.length], ["Attempts", selected.attemptCount ?? 0]]} />
          {isInstructor ? <><InspectorSection title="Schedule &amp; attempt policy"><div className="admin-v2__inspector-content">
            <label className="admin-v2__field">Title<input value={editTitle} maxLength={240} onChange={event => setEditTitle(event.target.value)} disabled={saveDetails.isPending || selected.status === "archived"} /></label>
            <label className="admin-v2__field">Available from<input type="datetime-local" value={availableFrom} onChange={event => setAvailableFrom(event.target.value)} disabled={saveDetails.isPending || selected.status !== "draft"} /></label>
            <label className="admin-v2__field">Available until<input type="datetime-local" value={availableUntil} onChange={event => setAvailableUntil(event.target.value)} disabled={saveDetails.isPending || selected.status !== "draft"} /></label>
            <label className="admin-v2__field">Attempts allowed<input type="number" min={1} max={10} value={attemptsAllowed} onChange={event => setAttemptsAllowed(Number(event.target.value))} disabled={saveDetails.isPending || selected.status === "archived"} /></label>
            <label className="admin-v2__field">Time limit (minutes)<input type="number" min={1} max={1440} value={timeLimitMinutes} onChange={event => setTimeLimitMinutes(event.target.value)} placeholder="No time limit" disabled={saveDetails.isPending || selected.status === "archived"} /></label>
            <button className="admin-v2__button is-primary" type="button" onClick={() => saveDetails.mutate()} disabled={saveDetails.isPending || !editTitle.trim() || !Number.isInteger(attemptsAllowed) || attemptsAllowed < 1 || attemptsAllowed > 10}>{saveDetails.isPending ? "Saving…" : "Save details"}</button>
          </div></InspectorSection>
          <InspectorSection title="Question authoring"><div className="admin-v2__inspector-content"><p>Question keys are available only to authorized assessment Instructors and are never sent to Student assessment reads.</p><label className="admin-v2__field">Replace draft questions (JSON)<textarea className="admin-v2__assessment-question-editor" aria-label="Question authoring JSON" rows={10} value={questionText} onChange={event => setQuestionText(event.target.value)} disabled={selected.status !== "draft" || saveQuestions.isPending} /></label><div className="admin-v2__actions"><button className="admin-v2__button" type="button" onClick={() => { try { const current = JSON.parse(questionText) as QuestionDraft[]; const order = current.reduce((maximum, question) => Math.max(maximum, Number(question.sortOrder) || 0), 0); setQuestionText(JSON.stringify([...current, { id: crypto.randomUUID(), questionType: "single_choice", prompt: "", options: [], answerKey: null, points: 1, sortOrder: order + 1 }], null, 2)); } catch { setMessage("Fix the question JSON before adding another question."); } }} disabled={selected.status !== "draft" || saveQuestions.isPending}>Add question template</button><button className="admin-v2__button is-primary" type="button" onClick={() => saveQuestions.mutate()} disabled={selected.status !== "draft" || saveQuestions.isPending}>{saveQuestions.isPending ? "Saving…" : "Save questions"}</button></div></div></InspectorSection></> : <InspectorSection title="Instructor authored content"><div className="admin-v2__inspector-content"><p>Question authoring and assessment settings belong to the assigned Instructor. Super Admin can monitor attempts and close an assessment when required.</p><InspectorFields fields={[["Available from", detail.data.assessment.availableFrom ? new Date(detail.data.assessment.availableFrom).toLocaleString() : "Not scheduled"],["Available until", detail.data.assessment.availableUntil ? new Date(detail.data.assessment.availableUntil).toLocaleString() : "No end date"],["Attempts allowed", detail.data.assessment.attemptsAllowed],["Time limit", detail.data.assessment.timeLimitSeconds ? `${Math.round(detail.data.assessment.timeLimitSeconds / 60)} minutes` : "None"]]} /></div></InspectorSection>}
          <InspectorSection title="Attempts"><div className="admin-v2__inspector-content">{attempts.isLoading ? <p role="status">Loading attempts…</p> : attempts.isError ? <p role="alert">{errorText(attempts.error)} <button className="admin-v2__button" type="button" onClick={() => void attempts.refetch()}>Retry</button></p> : !attempts.data?.items.length ? <p className="admin-v2__empty-inline">No Student attempts have been recorded.</p> : <><ul>{attempts.data.items.map(item => <li key={item.id}><button type="button" className="admin-v2__button" onClick={() => { setSelectedAttemptId(item.id); setOverrideScore(item.score === null ? "" : String(item.score)); setOverrideReason(""); }}>{item.studentName ?? "Student"} · {item.status} · {item.score ?? "Not scored"}{item.overrideReason ? " · Overridden" : ""}</button></li>)}</ul>{selectedAttempt && <div className="admin-v2__inspector-content"><strong>{selectedAttempt.studentName ?? "Student"} · attempt {selectedAttempt.attemptNumber}</strong><p>Original calculated score: {selectedAttempt.originalScore ?? "Not scored"}</p><p>Effective score: {selectedAttempt.score ?? "Not scored"}</p>{selectedAttempt.overrideReason && <p>Last override: {selectedAttempt.overrideReason} · {selectedAttempt.overriddenAt ? new Date(selectedAttempt.overriddenAt).toLocaleString() : ""}</p>}{isInstructor && <p className="admin-v2__empty-inline">The current assessment API provides attempt summaries only; student answers and manual grading are not available here.</p>}{!isInstructor && selectedAttempt.originalScore !== null && <><label className="admin-v2__field">New effective score<input type="number" min="0" max={detail.data.questions.reduce((sum, question) => sum + question.points, 0)} step="0.01" value={overrideScore} onChange={event => setOverrideScore(event.target.value)} disabled={scoreOverride.isPending} /></label><label className="admin-v2__field">Override reason<textarea rows={2} maxLength={500} value={overrideReason} onChange={event => setOverrideReason(event.target.value)} disabled={scoreOverride.isPending} /></label><button type="button" className="admin-v2__button is-primary" disabled={scoreOverride.isPending || !overrideReason.trim() || !overrideScore.trim()} onClick={() => scoreOverride.mutate()}>{scoreOverride.isPending ? "Saving…" : "Save score override"}</button></>}</div>}</>}</div></InspectorSection>
          <div className="admin-v2__subscription-actions">{isInstructor&&selected.status === "draft" && <button type="button" className="admin-v2__button is-primary" disabled={lifecycle.isPending || detail.data.questions.length === 0} onClick={() => lifecycle.mutate("published")}>Publish</button>}{selected.status === "published" && <button type="button" className="admin-v2__button" disabled={lifecycle.isPending} onClick={() => lifecycle.mutate("closed")}>Close</button>}{selected.status === "closed" && <button type="button" className="admin-v2__button" disabled={lifecycle.isPending} onClick={() => lifecycle.mutate("archived")}>Archive</button>}</div>
        </>}
      </>}</aside>
    </div>
  </section>;
}

export default AssessmentsPage;
