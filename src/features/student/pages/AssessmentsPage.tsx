import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ClipboardCheck, Clock3 } from "lucide-react";
import { studentAssessmentApi } from "../api/studentAssessmentApi";
import { useAuth } from "../../../app/providers/AuthProvider";
import "./student-extra-pages.css";

export function AssessmentsPage() {
  const auth = useAuth();
  const query = useQuery({
    queryKey: ["student", "assessments"],
    queryFn: ({ signal }) => studentAssessmentApi.list(signal),
    enabled: auth.status === "authenticated",
  });

  return (
    <main className="student-extra-page assessments-page" aria-labelledby="assessments-title">
      <header className="student-extra-page__header">
        <span className="student-extra-page__eyebrow">Learning space</span>
        <h1 id="assessments-title">Assessments</h1>
        <p>Quizzes and exams assigned to your current course placement.</p>
      </header>

      {query.isLoading ? (
        <p className="student-extra-page__state" role="status">Loading assessments…</p>
      ) : null}
      {query.error ? (
        <p className="student-extra-page__state student-extra-page__state--error" role="alert">
          {query.error instanceof Error ? query.error.message : "Assessments could not be loaded."}
        </p>
      ) : null}
      {query.data?.length === 0 ? (
        <p className="student-extra-page__state" role="status">
          No assessments are available for your current placement.
        </p>
      ) : null}

      {!!query.data?.length ? (
        <div className="assessment-grid">
          {query.data.map((item) => (
            <article className="assessment-card" key={item.id}>
              <div className="assessment-card__top">
                <div className="assessment-card__copy">
                  <span className="assessment-card__kind">{item.kind}</span>
                  <h2>{item.title}</h2>
                  <p>{item.courseTitle ?? "Placement assessment"}</p>
                </div>
                <span className="assessment-card__icon" aria-hidden="true">
                  <ClipboardCheck />
                </span>
              </div>

              <div className="assessment-card__metadata" aria-label="Assessment information">
                <span className={`assessment-card__status assessment-card__status--${item.status}`}>
                  {item.status === "available" ? "Available now" : item.status === "upcoming" ? "Upcoming" : "Closed"}
                </span>
                <span>{item.attemptsUsed}/{item.attemptsAllowed} attempts</span>
                {item.timeLimitSeconds ? (
                  <span className="assessment-card__time">
                    <Clock3 aria-hidden="true" />
                    {Math.round(item.timeLimitSeconds / 60)} min
                  </span>
                ) : null}
              </div>

              {item.status === "available" &&
              (item.latestAttempt?.status === "in_progress" || item.attemptsUsed < item.attemptsAllowed) ? (
                <Link className="assessment-card__action" to={`/assessments/${item.id}`}>
                  {item.latestAttempt?.status === "in_progress" ? "Resume" : "Open assessment"}
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
    </main>
  );
}

export default AssessmentsPage;
