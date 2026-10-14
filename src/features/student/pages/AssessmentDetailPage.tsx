import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { studentAssessmentApi, type StudentAssessmentQuestionDto } from "../api/studentAssessmentApi";
import { useAuth } from "../../../app/providers/AuthProvider";

function answerInput(question: StudentAssessmentQuestionDto, value: unknown, onChange: (next: unknown) => void) {
  if (question.questionType === "free_text") return <textarea className="min-h-28 w-full rounded-lg border border-slate-300 p-3 text-sm" value={typeof value === "string" ? value : ""} onChange={event => onChange(event.target.value)} aria-label={question.prompt} />;
  const options = question.questionType === "true_false" ? [true, false] : question.options;
  if (question.questionType === "multiple_choice") return <div className="mt-3 space-y-2">{options.map((option, index) => { const selected = Array.isArray(value) && value.some(item => JSON.stringify(item) === JSON.stringify(option)); return <label key={index} className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm"><input type="checkbox" checked={selected} onChange={event => onChange(event.target.checked ? [...(Array.isArray(value) ? value : []), option] : (Array.isArray(value) ? value.filter(item => JSON.stringify(item) !== JSON.stringify(option)) : []))} />{String(option)}</label>; })}</div>;
  return <div className="mt-3 space-y-2">{options.map((option, index) => <label key={index} className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm"><input type="radio" name={question.id} checked={JSON.stringify(value) === JSON.stringify(option)} onChange={() => onChange(option)} />{String(option)}</label>)}</div>;
}

export function AssessmentDetailPage() {
  const { assessmentId = "" } = useParams();
  const auth = useAuth();
  const client = useQueryClient();
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [attemptVersion, setAttemptVersion] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [result, setResult] = useState<{ status: string; score: number | null } | null>(null);
  const query = useQuery({ queryKey: ["student", "assessment", assessmentId], queryFn: ({ signal }) => studentAssessmentApi.detail(assessmentId, signal), enabled: auth.status === "authenticated" && Boolean(assessmentId) });
  const active = query.data?.assessment.latestAttempt?.status === "in_progress" ? query.data.assessment.latestAttempt : null;
  const start = useMutation({ mutationFn: () => studentAssessmentApi.start(assessmentId, active?.id ?? crypto.randomUUID()), onSuccess: data => { setAttemptId(data.attempt.id); setAttemptVersion(data.attempt.version); void query.refetch(); } });
  const submit = useMutation({ mutationFn: () => studentAssessmentApi.submit(assessmentId, attemptId!, attemptVersion!, (query.data?.questions ?? []).map(question => ({ questionId: question.id, answer: answers[question.id] }))), onSuccess: data => { setResult({ status: data.status, score: data.score }); void client.invalidateQueries({ queryKey: ["student", "assessments"] }); void query.refetch(); } });
  const questions = useMemo(() => query.data?.questions ?? [], [query.data?.questions]);
  return <main className="mx-auto w-full max-w-4xl p-4 sm:p-6 lg:p-8">
    <Link to="/assessments" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">← All assessments</Link>
    {query.isLoading && <p role="status" className="mt-5 rounded-xl border bg-white p-5 text-sm text-slate-500">Loading assessment…</p>}
    {query.error && <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-white p-5 text-sm text-rose-700">{query.error instanceof Error ? query.error.message : "Assessment could not be loaded."}</p>}
    {query.data && <><header className="my-5 rounded-xl border border-slate-200 bg-white p-5"><p className="text-xs font-semibold uppercase text-emerald-700">{query.data.assessment.kind}</p><h1 className="mt-1 text-2xl font-bold text-slate-900">{query.data.assessment.title}</h1><p className="mt-1 text-sm text-slate-500">{query.data.assessment.courseTitle ?? "Placement assessment"}</p>{query.data.assessment.status !== "available" && <p className="mt-3 text-sm text-slate-600">This assessment is {query.data.assessment.status}.</p>}</header>
      {result && <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{result.score === null ? "Your responses were submitted for review." : `Attempt submitted. Score: ${result.score}.`}</p>}
      {!attemptId && !result && query.data.assessment.status === "available" && <button disabled={start.isPending || query.data.assessment.attemptsUsed >= query.data.assessment.attemptsAllowed} onClick={() => start.mutate()} className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{start.isPending ? "Opening…" : active ? "Resume attempt" : "Start attempt"}</button>}
      {start.error && <p role="alert" className="mt-3 text-sm text-rose-700">{start.error.message}</p>}
      {attemptId && questions.map((question, index) => <section key={question.id} className="mb-3 rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold text-slate-900">{index + 1}. {question.prompt}</h2>{answerInput(question, answers[question.id], value => setAnswers(current => ({ ...current, [question.id]: value })))}</section>)}
      {attemptId && <button disabled={submit.isPending || questions.some(question => answers[question.id] === undefined || answers[question.id] === "")} onClick={() => submit.mutate()} className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{submit.isPending ? "Submitting…" : "Submit answers"}</button>}
      {submit.error && <p role="alert" className="mt-3 text-sm text-rose-700">{submit.error.message}</p>}
    </>}
  </main>;
}

export default AssessmentDetailPage;
