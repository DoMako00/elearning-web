import { useEffect, useMemo, useState } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import type { AdminBrandContext } from "../../../features/admin/api";
import {
  adminDeliveryRequest,
  type DeliveryCourse,
} from "../../../features/admin/api/adminDelivery.http";
import { AdminContentEditor } from "../../../features/admin/content/AdminContentEditor";
import { WorkspaceState } from "../../../features/admin/components/AdminWorkspacePrimitives";
interface ContentCourseEntry {
  readonly course: DeliveryCourse;
  readonly brandLabel: string;
}

export function AdminContentPage() {
  const { brand, availableBrands } = useOutletContext<{
    brand?: AdminBrandContext;
    availableBrands: readonly AdminBrandContext[];
  }>();
  const [query, setQuery] = useSearchParams();
  const targets = useMemo(
    () => (brand ? [brand] : availableBrands),
    [brand, availableBrands],
  );
  const [courses, setCourses] = useState<readonly ContentCourseEntry[]>([]);
  const [selectedCourseKey, setSelectedCourseKey] = useState(() =>
    query.get("brandId") && query.get("courseId")
      ? `${query.get("brandId")}:${query.get("courseId")}`
      : "",
  );
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoadingCourses(true);
    setError("");
    void Promise.all(
      targets.map(async (target) => {
        const rows = await adminDeliveryRequest<DeliveryCourse[]>(
          `/v1/admin/brands/${encodeURIComponent(target.brandId)}/courses`,
          { signal: controller.signal },
        );
        if (!Array.isArray(rows))
          throw new Error("A brand course response is invalid.");
        return rows.map((course) => ({
          course,
          brandLabel: target.brandDisplayName,
        }));
      }),
    )
      .then((groups) => {
        if (controller.signal.aborted) return;
        const next = groups.flat();
        setCourses(next);
        setSelectedCourseKey((current) =>
          next.some(
            (entry) => `${entry.course.brandId}:${entry.course.id}` === current,
          )
            ? current
            : next[0]
              ? `${next[0].course.brandId}:${next[0].course.id}`
              : "",
        );
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setCourses([]);
        setSelectedCourseKey("");
        setError(
          cause instanceof Error
            ? cause.message
            : "Courses could not be loaded.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingCourses(false);
      });
    return () => controller.abort();
  }, [targets, revision]);
  const selected = courses.find(
    (entry) =>
      `${entry.course.brandId}:${entry.course.id}` === selectedCourseKey,
  );
  const picker = (
    <label className="admin-content-course-picker">
      <span>Course</span>
      <select
        value={selectedCourseKey}
        onChange={(event) => {
          const key = event.target.value;
          setSelectedCourseKey(key);
          const entry = courses.find(
            (item) => `${item.course.brandId}:${item.course.id}` === key,
          );
          if (entry)
            setQuery(
              { courseId: entry.course.id, brandId: entry.course.brandId },
              { replace: true },
            );
        }}
      >
        {courses.map((entry) => (
          <option
            key={entry.course.id}
            value={`${entry.course.brandId}:${entry.course.id}`}
          >
            {entry.brandLabel} · {entry.course.title}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <section
      className="admin-page admin-workspace-page admin-content-live"
      aria-label="Content management"
    >
      <nav className="admin-content-live__tabs" aria-label="Content sections">
        <button type="button" aria-current="page">
          Content Library
        </button>
        <button type="button" disabled aria-disabled="true">
          Media Library
        </button>
        <button type="button" disabled aria-disabled="true">
          Question Bank
        </button>
        <button type="button" disabled aria-disabled="true">
          Categories
        </button>
        <button type="button" disabled aria-disabled="true">
          Tags
        </button>
      </nav>
      {loadingCourses || error ? (
        <WorkspaceState
          loading={loadingCourses}
          error={!!error}
          onRetry={() => setRevision((value) => value + 1)}
        />
      ) : selected ? (
        <AdminContentEditor
          key={selectedCourseKey}
          courseId={selected.course.id}
          brandId={selected.course.brandId}
          coursePicker={picker}
        />
      ) : (
        <WorkspaceState title="No courses in this context" />
      )}
    </section>
  );
}
