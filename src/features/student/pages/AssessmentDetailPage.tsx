import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { studentAssessmentApi, type StudentAssessmentQuestionDto } from "../api/studentAssessmentApi";
import { clearAssessmentDraft, loadAssessmentDraft, saveAssessmentDraft } from "../api/assessmentDrafts";
import { useAuth } from "../../../app/providers/AuthProvider";

function optionLabel(option: unknown): string {
  if (typeof option === "boolean") return option ? "True" : "False";
  if (typeof option === "string" || typeof option === "number") return String(option);
  if (option && typeof option === "object") {
    const record = option as Record<string, unknown>;
    for (const key of ["label", "text", "value"]) if (typeof record[key] === "string" || typeof record[key] === "number") return String(record[key]);
  }
  return JSON.stringify(option);
}

function answerInput(question: StudentAssessmentQuestionDto, value: unknown, onChange: (next: unknown) => void, disabled: boolean) {
  if (question.questionType === "free_text") return <textarea className="min-h-28 w-full rounded-lg border border-slate-300 p-3 text-sm" value={typeof value === "string" ? value : ""} onChange={event => onChange(event.target.value)} aria-label={question.prompt} disabled={disabled} />;
  const options = question.questionType === "true_false" ? [true, false] : question.options;
  if (question.questionType === "multiple_choice") return <div className="mt-3 space-y-2">{options.map((option, index) => { const selected = Array.isArray(value) && value.some(item => JSON.stringify(item) === JSON.stringify(option)); return <label key={index} className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm"><input type="checkbox" checked={selected} disabled={disabled} onChange={event => onChange(event.target.checked ? [...(Array.isArray(value) ? value : []), option] : (Array.isArray(value) ? value.filter(item => JSON.stringify(item) !== JSON.stringify(option)) : []))} />{optionLabel(option)}</label>; })}</div>;
  return <div className="mt-3 space-y-2">{options.map((option, index) => <label key={index} className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm"><input type="radio" name={question.id} checked={JSON.stringify(value) === JSON.stringify(option)} disabled={disabled} onChange={() => onChange(option)} />{optionLabel(option)}</label>)}</div>;
}

function isAnswered(value: unknown) {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export function AssessmentDetailPage() {
  const { assessmentId = "" } = useParams();
  const auth = useAuth();
  const userId = auth.user?.id ?? "anonymous";
  const client = useQueryClient();
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [attemptVersion, setAttemptVersion] = useState<number | null>(null);
  const [attemptQuestions, setAttemptQuestions] = useState<StudentAssessmentQuestionDto[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [draftSaved, setDraftSaved] = useState(true);
  const [result, setResult] = useState<{ status: string; score: number | null } | null>(null);
  // One identity per logical "start attempt" so a retry is idempotent.
  const newAttemptId = useRef(crypto.randomUUID());
  const query = useQuery({ queryKey: ["student", "assessment", assessmentId], queryFn: ({ signal }) => studentAssessmentApi.detail(assessmentId, signal), enabled: auth.status === "authenticated" && Boolean(assessmentId) });
  const assessment = query.data?.assessment;
  const active = assessment?.latestAttempt?.status === "in_progress" ? assessment.latestAttempt : null;
  const finished = assessment?.latestAttempt && (assessment.latestAttempt.status === "submitted" || assessment.latestAttempt.status === "scored") ? assessment.latestAttempt : null;
  // An in-progress attempt may already be counted in attemptsUsed; resuming it never needs a spare attempt.
  const canStart = Boolean(assessment && assessment.status === "available" && (active || assessment.attemptsUsed < assessment.attemptsAllowed));

  const start = useMutation({
    mutationFn: () => studentAssessmentApi.start(assessmentId, active?.id ?? newAttemptId.current),
    onSuccess: data => {
      setAttemptId(data.attempt.id);
      setAttemptVersion(data.attempt.version);
      if (data.questions?.length) setAttemptQuestions(data.questions);
      setAnswers(loadAssessmentDraft(userId, data.attempt.id));
      newAttemptId.current = crypto.randomUUID();
      void query.refetch();
    },
  });
  const questions = useMemo(
    () => [...(attemptQuestions ?? query.data?.questions ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [attemptQuestions, query.data?.questions],
  );
  const submit = useMutation({
    mutationFn: () => studentAssessmentApi.submit(assessmentId, attemptId!, attemptVersion!, questions.map(question => ({ questionId: question.id, answer: answers[question.id] }))),
    onSuccess: data => {
      clearAssessmentDraft(userId, attemptId!);
      // The attempt is closed server-side: it can no longer be resubmitted.
      setAttemptId(null);
      setAttemptVersion(null);
      setAttemptQuestions(null);
      setAnswers({});
      setResult({ status: data.status, score: data.score });
      void client.invalidateQueries({ queryKey: ["student", "assessments"] });
      void query.refetch();
    },
  });

  useEffect(() => {
    if (!attemptId) return;
    setDraftSaved(saveAssessmentDraft(userId, attemptId, answers));
  }, [answers, attemptId, userId]);

  const allAnswered = questions.length > 0 && questions.every(question => isAnswered(answers[question.id]));
  return <main className="mx-auto w-full max-w-4xl p-4 sm:p-6 lg:p-8">
    <Link to="/assessments" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">← All assessments</Link>
    {query.isLoading && <p role="status" className="mt-5 rounded-xl border bg-white p-5 text-sm text-slate-500">Loading assessment…</p>}
    {query.error && <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-white p-5 text-sm text-rose-700">{query.error instanceof Error ? query.error.message : "Assessment could not be loaded."}</p>}
    {assessment && <><header className="my-5 rounded-xl border border-slate-200 bg-white p-5"><p className="text-xs font-semibold uppercase text-emerald-700">{assessment.kind}</p><h1 className="mt-1 text-2xl font-bold text-slate-900">{assessment.title}</h1><p className="mt-1 text-sm text-slate-500">{assessment.courseTitle ?? "Placement assessment"}</p><p className="mt-2 text-xs text-slate-500">{assessment.attemptsUsed}/{assessment.attemptsAllowed} attempts used{assessment.timeLimitSeconds ? ` · ${Math.round(assessment.timeLimitSeconds / 60)} min time limit` : ""}</p>{assessment.status !== "available" && <p className="mt-3 text-sm text-slate-600">This assessment is {assessment.status}.</p>}</header>
      {result && <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{result.score === null ? "Your responses were submitted for review." : `Attempt submitted. Score: ${result.score}.`}</p>}
      {!result && !attemptId && finished && <p className="mb-4 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">Attempt {finished.attemptNumber} was submitted{finished.submittedAt ? ` on ${new Date(finished.submittedAt).toLocaleString()}` : ""}. {finished.score === null ? "It is awaiting review." : `Score: ${finished.score}.`}</p>}
      {!attemptId && !result && assessment.status === "available" && <button disabled={start.isPending || !canStart} onClick={() => start.mutate()} className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{start.isPending ? "Opening…" : active ? "Resume attempt" : canStart ? "Start attempt" : "No attempts remaining"}</button>}
      {start.error && <p role="alert" className="mt-3 text-sm text-rose-700">{start.error.message}</p>}
      {attemptId && <p className="mb-3 text-xs text-slate-500" role="status">{draftSaved ? "Your answers are kept in this browser tab until you submit; they are not sent to the server before then." : "Your answers can't be kept in this browser — don't leave the page before submitting."}</p>}
      {attemptId && questions.length === 0 && <p role="alert" className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">This attempt has no questions to answer. Contact your instructor before submitting.</p>}
      {attemptId && questions.map((question, index) => <section key={question.id} className="mb-3 rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold text-slate-900">{index + 1}. {question.prompt}</h2>{answerInput(question, answers[question.id], value => setAnswers(current => ({ ...current, [question.id]: value })), submit.isPending)}</section>)}
      {attemptId && <button disabled={submit.isPending || !allAnswered} onClick={() => submit.mutate()} className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{submit.isPending ? "Submitting…" : "Submit answers"}</button>}
      {submit.error && <p role="alert" className="mt-3 text-sm text-rose-700">{submit.error.message}</p>}
    </>}
  </main>;
}

export default AssessmentDetailPage;
