import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ClipboardCheck, Clock3 } from "lucide-react";
import { studentAssessmentApi } from "../api/studentAssessmentApi";
import { useAuth } from "../../../app/providers/AuthProvider";

export function AssessmentsPage() {
  const auth = useAuth();
  const query = useQuery({ queryKey: ["student", "assessments"], queryFn: ({ signal }) => studentAssessmentApi.list(signal), enabled: auth.status === "authenticated" });
  return <main className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
    <header className="mb-6"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Learning</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Assessments</h1><p className="mt-1 text-sm text-slate-500">Quizzes and exams assigned to your current course placement.</p></header>
    {query.isLoading && <p role="status" className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Loading assessments…</p>}
    {query.error && <p role="alert" className="rounded-xl border border-rose-200 bg-white p-5 text-sm text-rose-700">{query.error instanceof Error ? query.error.message : "Assessments could not be loaded."}</p>}
    {query.data?.length === 0 && <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">No assessments are available for your current placement.</p>}
    {!!query.data?.length && <div className="grid gap-3 md:grid-cols-2">{query.data.map(item => <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase text-emerald-700">{item.kind}</p><h2 className="mt-1 font-semibold text-slate-900">{item.title}</h2><p className="mt-1 text-sm text-slate-500">{item.courseTitle ?? "Placement assessment"}</p></div><ClipboardCheck className="h-5 w-5 shrink-0 text-emerald-700" /></div><div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500"><span>{item.status === "available" ? "Available now" : item.status === "upcoming" ? "Upcoming" : "Closed"}</span><span>{item.attemptsUsed}/{item.attemptsAllowed} attempts</span>{item.timeLimitSeconds && <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{Math.round(item.timeLimitSeconds / 60)} min</span>}</div>{item.status === "available" && item.attemptsUsed < item.attemptsAllowed && <Link className="mt-4 inline-flex rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800" to={`/assessments/${item.id}`}>{item.latestAttempt?.status === "in_progress" ? "Resume" : "Open assessment"}</Link>}</article>)}</div>}
  </main>;
}

export default AssessmentsPage;
