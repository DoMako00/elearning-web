import { BookOpen, Layers3, Plus, Search, ShieldCheck, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import {
  WorkspaceBadge,
  WorkspaceInspector,
} from "../../../features/admin/components/AdminWorkspacePrimitives";
import { AdminSideDrawer } from "../../../features/admin/components/AdminSideDrawer";
import { AdminCourseTemplateForm } from "../../../features/admin/courses/AdminCourseTemplateForm";
import { AdminCourseInstructorAssignments } from "../../../features/admin/courses/AdminCourseInstructorAssignments";
import type { AdminBrandView } from "../../../features/admin/api";
import {
  adminDeliveryRequest,
  catalogueBrandAccessPath,
  catalogueInstitutionsPath,
  type CatalogueBrand,
  type CatalogueInstitution,
  type CatalogueLevel,
  type CatalogueSemester,
  type DeliveryCourse,
} from "../../../features/admin/api/adminDelivery.http";
type CourseAcademicContext = {
  institution: CatalogueInstitution;
  level: CatalogueLevel;
  semester: CatalogueSemester;
};
type CourseDirectoryRow = {
  id: string;
  course: DeliveryCourse;
  context?: CourseAcademicContext;
};

const PAGE_SIZE = 10;

function activeInstructorLabel(course: DeliveryCourse) {
  return (
    course.instructorAssignments
      .filter((item) => item.status === "active")
      .map((item) => item.displayName)
      .join(", ") || "Unassigned"
  );
}

function rowSearchText(row: CourseDirectoryRow) {
  return [
    row.course.title,
    row.course.code,
    row.course.brand.name,
    row.course.academicInstitution?.displayName,
    row.course.academicModule?.code,
    row.course.academicModule?.sourceDisplayLabel,
    row.context?.level.displayTitle,
    row.context?.semester.displayTitle,
    activeInstructorLabel(row.course),
  ].join(" ");
}

function rowSortKey(row: CourseDirectoryRow) {
  return row.course.title;
}

export function AdminCoursesPage() {
  const { brandView } = useOutletContext<{ brandView: AdminBrandView }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [action, setAction] = useState<
    "create" | "edit" | "instructors" | null
  >(searchParams.get("action") === "create" ? "create" : null);
  const [brands, setBrands] = useState<CatalogueBrand[]>([]);
  const [institutions, setInstitutions] = useState<CatalogueInstitution[]>([]);
  const [courses, setCourses] = useState<DeliveryCourse[]>([]);
  const [brandId, setBrandId] = useState("");
  const [institutionId, setInstitutionId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(
    searchParams.get("courseId") ?? "",
  );
  const [catalogueLoading, setCatalogueLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [page, setPage] = useState(1);
  useEffect(() => {
    const controller = new AbortController();
    setCatalogueLoading(true);
    setError("");
    setCourses([]);
    setBrands([]);
    setInstitutions([]);
    void Promise.all([
      adminDeliveryRequest<CatalogueBrand[]>(catalogueBrandAccessPath, {
        signal: controller.signal,
      }),
      adminDeliveryRequest<CatalogueInstitution[]>(catalogueInstitutionsPath, {
        signal: controller.signal,
      }),
    ])
      .then(([brandRows, institutionRows]) => {
        if (controller.signal.aborted) return;
        if (!Array.isArray(brandRows) || !Array.isArray(institutionRows))
          throw new Error("The academic catalogue response is invalid.");
        setBrands(brandRows);
        setInstitutions(institutionRows);
        setBrandId(
          brandView === "all"
            ? ""
            : (brandRows.find((item) => item.code === brandView)?.id ?? ""),
        );
        setInstitutionId("");
        setLevelId("");
        setSemesterId("");
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(
            e instanceof Error
              ? e.message
              : "Could not load the academic catalogue.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setCatalogueLoading(false);
      });
    return () => controller.abort();
  }, [brandView, revision]);
  useEffect(() => {
    if (!brands.length) {
      setCourses([]);
      return;
    }
    const controller = new AbortController();
    setCoursesLoading(true);
    setError("");
    setCourses([]);
    const selectedBrands = brandId
      ? brands.filter((item) => item.id === brandId)
      : brands;
    void Promise.all(
      selectedBrands.map((brand) =>
        adminDeliveryRequest<DeliveryCourse[]>(
          `/v1/admin/brands/${encodeURIComponent(brand.id)}/courses`,
          { signal: controller.signal },
        ),
      ),
    )
      .then((groups) => {
        if (controller.signal.aborted) return;
        if (groups.some((rows) => !Array.isArray(rows)))
          throw new Error("The course directory response is invalid.");
        setCourses(groups.flat());
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : "Could not load courses.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setCoursesLoading(false);
      });
    return () => controller.abort();
  }, [brands, brandId]);
  useEffect(
    () => setPage(1),
    [brandId, institutionId, levelId, semesterId, status, search],
  );
  const selectedBrands = useMemo(() => {
    const active = brands.filter((item) => item.status === "active");
    return brandId ? active.filter((item) => item.id === brandId) : active;
  }, [brandId, brands]);
  const moduleContextById = useMemo(() => {
    const map = new Map<string, CourseAcademicContext>();
    for (const institution of institutions) {
      for (const level of institution.levels) {
        for (const semester of level.semesters) {
          for (const module of semester.modules) {
            map.set(module.id, { institution, level, semester });
          }
        }
      }
    }
    return map;
  }, [institutions]);
  const allowedInstitutions = useMemo(() => {
    const allowedIds = new Set(
      selectedBrands.flatMap((brand) =>
        brand.allowedAcademicInstitutions.map((item) => item.id),
      ),
    );
    return institutions.filter(
      (item) => item.status === "active" && allowedIds.has(item.id),
    );
  }, [institutions, selectedBrands]);
  const levels = useMemo(() => {
    const source = institutionId
      ? allowedInstitutions.filter((item) => item.id === institutionId)
      : allowedInstitutions;
    return [
      ...new Map(
        source
          .flatMap((institution) =>
            institution.levels.filter((level) => level.status === "active"),
          )
          .map((level) => [level.id, level]),
      ).values(),
    ].sort((a, b) => a.levelNumber - b.levelNumber);
  }, [allowedInstitutions, institutionId]);
  const semesters = useMemo(() => {
    const source = institutionId
      ? allowedInstitutions.filter((item) => item.id === institutionId)
      : allowedInstitutions;
    return [
      ...new Map(
        source
          .flatMap((institution) => institution.levels)
          .filter((level) => !levelId || level.id === levelId)
          .flatMap((level) =>
            level.semesters.filter((semester) => semester.status === "active"),
          )
          .map((semester) => [semester.id, semester]),
      ).values(),
    ].sort((a, b) => a.semesterNumber - b.semesterNumber);
  }, [allowedInstitutions, institutionId, levelId]);
  const rows = useMemo<CourseDirectoryRow[]>(
    () =>
      courses.map((course) => ({
        id: course.id,
        course,
        context: course.academicModuleId
          ? moduleContextById.get(course.academicModuleId)
          : undefined,
      })),
    [courses, moduleContextById],
  );
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows
      .filter((row) => {
        const context = row.context;
        return (
          (status === "all" || row.course.status === status) &&
          (!institutionId || context?.institution.id === institutionId) &&
          (!levelId || context?.level.id === levelId) &&
          (!semesterId || context?.semester.id === semesterId) &&
          (!query || rowSearchText(row).toLowerCase().includes(query))
        );
      })
      .sort((a, b) => rowSortKey(a).localeCompare(rowSortKey(b)));
  }, [institutionId, levelId, rows, search, semesterId, status]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const selected =
    selectedId === "closed"
      ? undefined
      : (filtered.find((row) => row.id === selectedId) ?? filtered[0]);
  function closeAction() {
    setAction(null);
    if (searchParams.has("action")) {
      const next = new URLSearchParams(searchParams);
      next.delete("action");
      setSearchParams(next, { replace: true });
    }
  }
  function courseSaved(result: { brandId: string; courseId: string }) {
    setSelectedId(result.courseId);
    closeAction();
    setRevision((value) => value + 1);
  }
  const loading = catalogueLoading || coursesLoading;
  const rowCountLabel = loading
    ? "Loading courses…"
    : error
      ? "Courses unavailable"
      : `${filtered.length} courses`;
  return (
    <section
      className="admin-page admin-courses admin-courses-page"
      aria-label="Course directory"
    >
      <header className="admin-page-header">
        <div>
          <h1>Courses</h1>
          <p>
            Manage brand-owned courses, map them to curriculum modules, and
            track delivery readiness.
          </p>
        </div>
        <button
          className="is-primary"
          type="button"
          onClick={() => setAction("create")}
        >
          <Plus aria-hidden="true" /> Create course
        </button>
      </header>
      <div className="admin-course-filterbar">
        <label>
          Commercial brand
          <select
            value={brandId}
            onChange={(event) => {
              setBrandId(event.target.value);
              setInstitutionId("");
              setLevelId("");
              setSemesterId("");
            }}
          >
            <option value="">All commercial brands</option>
            {brands
              .filter((brand) => brand.status === "active")
              .map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          Academic catalogue
          <select
            value={institutionId}
            onChange={(event) => {
              setInstitutionId(event.target.value);
              setLevelId("");
              setSemesterId("");
            }}
          >
            <option value="">All catalogues</option>
            {allowedInstitutions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.displayName}
              </option>
            ))}
          </select>
        </label>
        <label>
          Academic level
          <select
            value={levelId}
            onChange={(event) => {
              setLevelId(event.target.value);
              setSemesterId("");
            }}
          >
            <option value="">All levels</option>
            {levels.map((item) => (
              <option key={item.id} value={item.id}>
                {item.displayTitle}
              </option>
            ))}
          </select>
        </label>
        <label>
          Semester
          <select
            value={semesterId}
            onChange={(event) => setSemesterId(event.target.value)}
          >
            <option value="">All semesters</option>
            {semesters.map((item) => (
              <option key={item.id} value={item.id}>
                {item.displayTitle}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <button
          type="button"
          className="admin-course-reset"
          disabled={loading}
          onClick={() => setRevision((value) => value + 1)}
        >
          Reload courses
        </button>
      </div>
      <div className="admin-courses-workspace has-detail">
        <article className="admin-course-directory" aria-busy={loading}>
          <header>
            <div>
              <h2>Course directory</h2>
              <span>{rowCountLabel}</span>
            </div>
            <label className="admin-course-search">
              <Search aria-hidden="true" />
              <input
                type="search"
                aria-label="Search courses and academic modules"
                placeholder="Search courses or modules…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </header>
          {error ? (
            <p role="alert" className="builder-empty">
              {error}
            </p>
          ) : loading ? (
            <p role="status" className="builder-empty">
              Loading courses…
            </p>
          ) : rows.length === 0 ? (
            <div className="builder-empty">
              <BookOpen aria-hidden="true" />
              <h3>No courses yet</h3>
              <p>Create a course to add a brand-owned learning offering.</p>
              <button
                className="is-primary"
                type="button"
                onClick={() => setAction("create")}
              >
                <Plus aria-hidden="true" /> Create course
              </button>
            </div>
          ) : (
            <>
              <div className="admin-course-table-wrap">
                <table className="admin-course-table">
                  <caption className="admin-sr-only">
                    Commercial courses
                  </caption>
                  <thead>
                    <tr>
                      <th>Course title</th>
                      <th>Brand</th>
                      <th>Scope</th>
                      <th>Linked Subject / Module</th>
                      <th>Lead instructor</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered
                      .slice(
                        (currentPage - 1) * PAGE_SIZE,
                        currentPage * PAGE_SIZE,
                      )
                      .map((row) => {
                        const isSelected = selected?.id === row.id;
                        return (
                          <tr
                            key={row.id}
                            className={isSelected ? "is-selected" : ""}
                          >
                            <td>
                              <button
                                type="button"
                                className="admin-course-title"
                                onClick={() => setSelectedId(row.id)}
                              >
                                <strong>{row.course.title}</strong>
                                <small>{row.course.code}</small>
                                <em>Selected</em>
                              </button>
                            </td>
                            <td>
                              <span
                                className={`admin-course-brand is-${row.course.brand.code}`}
                              >
                                <ShieldCheck aria-hidden="true" />
                                {row.course.brand.name}
                              </span>
                            </td>
                            <td>
                              {row.course.classification ===
                              "academic_module_offering"
                                ? row.course.cataloguePresentation ===
                                  "subject_based"
                                  ? "Subject"
                                  : "Module"
                                : "Standalone"}
                            </td>
                            <td className="admin-course-module">
                              {row.course.academicModule ? (
                                <>
                                  <strong>
                                    {row.course.academicModule.code}
                                  </strong>
                                  <span>
                                    {
                                      row.course.academicModule
                                        .sourceDisplayLabel
                                    }
                                  </span>
                                </>
                              ) : (
                                "Not linked"
                              )}
                            </td>
                            <td>
                              <span
                                className={
                                  activeInstructorLabel(row.course) ===
                                  "Unassigned"
                                    ? "admin-course-unassigned"
                                    : undefined
                                }
                              >
                                {activeInstructorLabel(row.course)}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`admin-course-status is-${row.course.status}`}
                              >
                                <i />
                                {row.course.status}
                              </span>
                            </td>
                            <td>
                              <Link
                                className="admin-course-action-link"
                                to={`/admin/content?courseId=${encodeURIComponent(row.course.id)}&brandId=${encodeURIComponent(row.course.brandId)}`}
                              >
                                Open content
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
              {filtered.length === 0 && (
                <p className="builder-empty">No courses match these filters.</p>
              )}
              <footer className="admin-course-pagination">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  Previous
                </button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Next
                </button>
              </footer>
            </>
          )}
        </article>
        {selected ? (
          <CourseDetailPanel
            row={selected}
            onClose={() => setSelectedId("closed")}
            onEdit={() => setAction("edit")}
            onManageInstructors={() => setAction("instructors")}
          />
        ) : (
          <WorkspaceInspector title="Course details" selected={false} />
        )}
      </div>
      <AdminSideDrawer
        open={action !== null}
        title={
          action === "create"
            ? "Create course"
            : action === "instructors"
              ? "Course instructors"
              : "Edit course"
        }
        eyebrow={
          action === "create"
            ? "Course offering"
            : (selected?.course.title ?? "Course offering")
        }
        onClose={closeAction}
      >
        {action === "create" ? (
          <AdminCourseTemplateForm
            initialBrandId={brandId || searchParams.get("brandId") || ""}
            initialInstitutionId={institutionId}
            initialLevelId={levelId}
            initialSemesterId={semesterId}
            onSaved={courseSaved}
          />
        ) : action === "edit" && selected ? (
          <AdminCourseTemplateForm
            course={selected.course}
            onSaved={courseSaved}
          />
        ) : action === "instructors" && selected ? (
          <AdminCourseInstructorAssignments
            course={selected.course}
            onChanged={() => setRevision((value) => value + 1)}
          />
        ) : null}
      </AdminSideDrawer>
    </section>
  );
}

function CourseDetailPanel({
  row,
  onClose,
  onEdit,
  onManageInstructors,
}: {
  row: CourseDirectoryRow;
  onClose: () => void;
  onEdit: () => void;
  onManageInstructors: () => void;
}) {
  return (
    <aside className="admin-course-detail" aria-label="Course details">
      <div className="admin-course-detail__top">
        <strong>Course details</strong>
        <button type="button" className="admin-course-new" onClick={onEdit}>
          Edit course
        </button>
      </div>
      <div className="admin-course-detail__identity">
        <div className={`admin-course-cover is-${row.course.brand.code}`}>
          <BookOpen aria-hidden="true" />
        </div>
        <div>
          <h2>{row.course.title}</h2>
          <span className={`admin-course-status is-${row.course.status}`}>
            <i />
            {row.course.status}
          </span>
          <span className={`admin-course-brand is-${row.course.brand.code}`}>
            <ShieldCheck aria-hidden="true" />
            {row.course.brand.name}
          </span>
          <small>{row.course.code}</small>
        </div>
        <button
          type="button"
          className="admin-course-detail__close"
          onClick={onClose}
          aria-label="Close course details"
        >
          <X aria-hidden="true" />
        </button>
      </div>
      <div className="admin-course-detail__body">
        <dl className="admin-course-metadata">
          <div>
            <dt>Scope</dt>
            <dd>
              {row.course.classification === "academic_module_offering"
                ? row.course.cataloguePresentation === "subject_based"
                  ? "Subject"
                  : "Module"
                : "Standalone"}
            </dd>
          </div>
          <div>
            <dt>
              {row.course.cataloguePresentation === "subject_based"
                ? "Linked Subject"
                : "Linked Module"}
            </dt>
            <dd>
              {row.course.academicModule
                ? `${row.course.academicModule.code} ${row.course.academicModule.sourceDisplayLabel}`
                : "Not linked"}
            </dd>
          </div>
          <div>
            <dt>Academic catalogue</dt>
            <dd>
              {row.course.academicInstitution?.displayName ?? "Not assigned"}
            </dd>
          </div>
          <div>
            <dt>Brand</dt>
            <dd>{row.course.brand.name}</dd>
          </div>
          <div>
            <dt>Academic level</dt>
            <dd>{row.context?.level.displayTitle ?? "Not assigned"}</dd>
          </div>
          <div>
            <dt>Semester</dt>
            <dd>{row.context?.semester.displayTitle ?? "Not assigned"}</dd>
          </div>
          <div>
            <dt>Last updated</dt>
            <dd>{new Date(row.course.updatedAt).toLocaleDateString()}</dd>
          </div>
        </dl>
        <section
          className="admin-course-instructor-summary"
          aria-label="Assigned instructors"
        >
          <header>
            <h3>Course instructor assignments</h3>
            <button type="button" onClick={onManageInstructors}>
              Manage
            </button>
          </header>
          {row.course.instructorAssignments.length ? (
            <ul>
              {row.course.instructorAssignments.map((assignment) => (
                <li key={assignment.instructorId}>
                  <span>{assignment.displayName}</span>
                  <WorkspaceBadge value={assignment.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p>No instructors assigned.</p>
          )}
        </section>
        <div className="admin-course-actions">
          <button type="button" onClick={onEdit}>
            <Layers3 aria-hidden="true" />
            <span>Edit course / map to curriculum</span>
            <small>
              Course identity, academic reference and archive state.
            </small>
          </button>
          <Link
            to={`/admin/content?courseId=${encodeURIComponent(row.course.id)}&brandId=${encodeURIComponent(row.course.brandId)}`}
          >
            <BookOpen aria-hidden="true" />
            <span>Open content</span>
            <small>Manage chapters, lessons, videos and documents.</small>
          </Link>
        </div>
      </div>
    </aside>
  );
}
