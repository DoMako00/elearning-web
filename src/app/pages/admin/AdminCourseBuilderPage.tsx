import { Navigate, useParams, useSearchParams } from "react-router-dom";
/** Preserve saved builder links; Content owns chapters, lessons, and media. */
export function AdminCourseBuilderPage() {
  const { courseId } = useParams();
  const [query] = useSearchParams();
  const target = new URLSearchParams(query);
  if (!courseId || courseId === "new") {
    target.set("action", "create");
    return <Navigate replace to={`/admin/courses?${target}`} />;
  }
  target.set("courseId", courseId);
  return <Navigate replace to={`/admin/content?${target}`} />;
}
