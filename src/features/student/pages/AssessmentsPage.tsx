import { AssessmentsWorkspace } from "../components/AssessmentsWorkspace";

export function AssessmentsPage() {
  return (
    <section className="student-page student-page--assessments" aria-labelledby="assessments-title">
      <AssessmentsWorkspace />
    </section>
  );
}

export default AssessmentsPage;
