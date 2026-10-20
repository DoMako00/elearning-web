import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { studentAssessmentApi, type StudentAssessmentQuestionDto } from "../api/studentAssessmentApi";
import { clearAssessmentDraft, loadAssessmentDraft, saveAssessmentDraft } from "../api/assessmentDrafts";
import { useAuth } from "../../../app/providers/AuthProvider";
import "./student-extra-pages.css";

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
  if (question.questionType === "free_text") {
    return (
      <textarea
        className="assessment-answer-textarea"
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
        aria-label={question.prompt}
        disabled={disabled}
      />
    );
  }
  const options = question.questionType === "true_false" ? [true, false] : question.options;
  if (question.questionType === "multiple_choice") {
    return (
      <div className="assessment-answer-options">
        {options.map((option, index) => {
          const selected = Array.isArray(value) && value.some((item) => JSON.stringify(item) === JSON.stringify(option));
          return (
            <label className="assessment-answer-option" key={index}>
              <input
                type="checkbox"
                checked={selected}
                disabled={disabled}
                onChange={(event) => onChange(event.target.checked
                  ? [...(Array.isArray(value) ? value : []), option]
                  : (Array.isArray(value) ? value.filter((item) => JSON.stringify(item) !== JSON.stringify(option)) : []))}
              />
              <span>{optionLabel(option)}</span>
            </label>
          );
        })}
      </div>
    );
  }

  return (
    <div className="assessment-answer-options">
      {options.map((option, index) => (
        <label className="assessment-answer-option" key={index}>
          <input
            type="radio"
            name={question.id}
            checked={JSON.stringify(value) === JSON.stringify(option)}
            disabled={disabled}
            onChange={() => onChange(option)}
          />
          <span>{optionLabel(option)}</span>
        </label>
      ))}
    </div>
  );
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
  return (
    <main className="student-extra-page assessment-detail-page" aria-labelledby="assessment-detail-title">
      <Link to="/assessments" className="assessment-detail-page__back">
        <ArrowLeft aria-hidden="true" />
        All assessments
      </Link>

      {query.isLoading ? (
        <p className="student-extra-page__state" role="status">Loading assessment…</p>
      ) : null}
      {query.error ? (
        <p className="student-extra-page__state student-extra-page__state--error" role="alert">
          {query.error instanceof Error ? query.error.message : "Assessment could not be loaded."}
        </p>
      ) : null}

      {assessment ? (
        <>
          <header className="assessment-detail-hero">
            <span className="assessment-card__kind">{assessment.kind}</span>
            <h1 id="assessment-detail-title">{assessment.title}</h1>
            <p className="assessment-detail-hero__course">{assessment.courseTitle ?? "Placement assessment"}</p>
            <div className="assessment-detail-hero__meta">
              <span>{assessment.attemptsUsed}/{assessment.attemptsAllowed} attempts used</span>
              {assessment.timeLimitSeconds ? <span>{Math.round(assessment.timeLimitSeconds / 60)} min time limit</span> : null}
            </div>
            {assessment.status !== "available" ? (
              <p className="assessment-detail-hero__availability">This assessment is {assessment.status}.</p>
            ) : null}
          </header>

          {result ? (
            <p className="assessment-feedback assessment-feedback--success" role="status">
              {result.score === null ? "Your responses were submitted for review." : `Attempt submitted. Score: ${result.score}.`}
            </p>
          ) : null}
          {!result && !attemptId && finished ? (
            <p className="assessment-feedback" role="status">
              Attempt {finished.attemptNumber} was submitted{finished.submittedAt ? ` on ${new Date(finished.submittedAt).toLocaleString()}` : ""}. {finished.score === null ? "It is awaiting review." : `Score: ${finished.score}.`}
            </p>
          ) : null}
          {!attemptId && !result && assessment.status === "available" ? (
            <button className="assessment-action" disabled={start.isPending || !canStart} onClick={() => start.mutate()}>
              {start.isPending ? "Opening…" : active ? "Resume attempt" : canStart ? "Start attempt" : "No attempts remaining"}
            </button>
          ) : null}
          {start.error ? <p className="assessment-inline-error" role="alert">{start.error.message}</p> : null}
          {attemptId ? (
            <p className="assessment-draft-note" role="status">
              {draftSaved ? "Your answers are kept in this browser tab until you submit; they are not sent to the server before then." : "Your answers can't be kept in this browser — don't leave the page before submitting."}
            </p>
          ) : null}
          {attemptId && questions.length === 0 ? (
            <p className="assessment-feedback assessment-feedback--warning" role="alert">
              This attempt has no questions to answer. Contact your instructor before submitting.
            </p>
          ) : null}
          {attemptId ? (
            <div className="assessment-question-list">
              {questions.map((question, index) => (
                <section className="assessment-question" key={question.id}>
                  <h2>{index + 1}. {question.prompt}</h2>
                  {answerInput(question, answers[question.id], (value) => setAnswers((current) => ({ ...current, [question.id]: value })), submit.isPending)}
                </section>
              ))}
            </div>
          ) : null}
          {attemptId ? (
            <button className="assessment-action assessment-action--submit" disabled={submit.isPending || !allAnswered} onClick={() => submit.mutate()}>
              {submit.isPending ? "Submitting…" : "Submit answers"}
            </button>
          ) : null}
          {submit.error ? <p className="assessment-inline-error" role="alert">{submit.error.message}</p> : null}
        </>
      ) : null}
    </main>
  );
}

export default AssessmentDetailPage;
