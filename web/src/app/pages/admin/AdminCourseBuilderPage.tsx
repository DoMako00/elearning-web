import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  FileText,
  Film,
  FolderPlus,
  GraduationCap,
  Layers3,
  Link2,
  Plus,
  Video,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useOutletContext,
  useParams,
  useSearchParams,
} from "react-router-dom";
import type {
  AdminBrandCode,
  AdminBrandView,
} from "../../../features/admin/api";
import {
  adminDeliveryRequest,
  deliveryCoursePath,
  type DeliveryChapter,
  type DeliveryCourse,
  type DeliveryLesson,
  type DeliveryModule,
  type DeliveryResource,
  type ResourceKind,
} from "../../../features/admin/api/adminDelivery.http";
import { AdminLessonMediaUpload } from "../../../features/admin/courses/AdminLessonMediaUpload";
import { AdminLessonMediaManagement } from "../../../features/admin/courses/AdminLessonMediaManagement";
import { AdminCourseTemplateForm } from "../../../features/admin/courses/AdminCourseTemplateForm";
import { AdminSideDrawer } from "../../../features/admin/components/AdminSideDrawer";

type Resource = DeliveryResource & { readonly kind: ResourceKind };
type Lesson = DeliveryLesson & { readonly resources: readonly Resource[] };
type Chapter = DeliveryChapter & { readonly lessons: readonly Lesson[] };
type EditableEntity = "chapters" | "lessons" | "resources";
type PendingRequest = Readonly<{ signature: string; key: string }>;

interface OutletContext {
  readonly brandView: AdminBrandView;
  readonly brand?: {
    readonly brandId: string;
    readonly brandCode: AdminBrandCode;
    readonly brandDisplayName: string;
  };
}

const RESOURCE_LABELS: Record<ResourceKind, string> = {
  video: "Video",
  document: "Document / PDF",
  quiz: "Quiz / exam",
  file: "File metadata",
  link: "Link metadata",
};

function createRequestKey(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return (
    "admin-course-" + Date.now() + "-" + Math.random().toString(36).slice(2)
  );
}

function getResourceIcon(kind: ResourceKind) {
  if (kind === "video") return <Video aria-hidden="true" />;
  if (kind === "document" || kind === "file")
    return <FileText aria-hidden="true" />;
  if (kind === "link") return <Link2 aria-hidden="true" />;
  return <CheckCircle2 aria-hidden="true" />;
}

function nextSortOrder(
  items: readonly { readonly sortOrder: number }[],
): number {
  return Math.max(0, ...items.map((item) => item.sortOrder)) + 1;
}

function buildCourseScope(
  brandId: string | undefined,
  courseId: string | undefined,
): string {
  if (!brandId || !courseId || courseId === "new") return "";
  return deliveryCoursePath(brandId, courseId);
}

function buildCourseFromSearch(query: URLSearchParams) {
  return {
    institutionId: query.get("institutionId") ?? "",
    levelId: query.get("levelId") ?? "",
    semesterId: query.get("semesterId") ?? "",
    moduleId: query.get("moduleId") ?? "",
    code: query.get("code") ?? "",
    title: query.get("title") ?? "",
    cataloguePresentation:
      query.get("presentation") === "subject_based"
        ? "subject_based"
        : "module_based",
  } as const;
}

export function AdminCourseBuilderPage() {
  const { courseId } = useParams();
  const [query] = useSearchParams();
  const navigate = useNavigate();
  const { brand, brandView } = useOutletContext<OutletContext>();
  const initialCourse = buildCourseFromSearch(query);

  const [course, setCourse] = useState<DeliveryCourse>();
  const [module, setModule] = useState<DeliveryModule>();
  const [chapters, setChapters] = useState<readonly Chapter[]>([]);
  const [activeChapterId, setActiveChapterId] = useState<string>();
  const [activeLessonId, setActiveLessonId] = useState<string>();
  const [chapterTitle, setChapterTitle] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceKind, setResourceKind] = useState<ResourceKind>("document");
  const [resourceStatus, setResourceStatus] = useState<"draft" | "published">(
    "draft",
  );
  const [editChapterTitle, setEditChapterTitle] = useState("");
  const [editLessonTitle, setEditLessonTitle] = useState("");
  const [editingChapter, setEditingChapter] = useState(false);
  const [editingLesson, setEditingLesson] = useState(false);
  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [revision, setRevision] = useState(0);
  const [courseDetailsOpen, setCourseDetailsOpen] = useState(false);

  const pendingRequest = useRef<PendingRequest | undefined>(undefined);
  const busy = useRef(false);
  const selectedBrandId =
    query.get("brandId") ?? (brandView !== "all" ? brand?.brandId : undefined);
  const scope = buildCourseScope(selectedBrandId, courseId);
  const currentScope = useRef(scope);
  currentScope.current = scope;

  useEffect(() => {
    setCourseDetailsOpen(false);
  }, [courseId]);

  const activeChapter =
    chapters.find((item) => item.id === activeChapterId) ?? chapters[0];
  const activeLesson =
    activeChapter?.lessons.find((item) => item.id === activeLessonId) ??
    activeChapter?.lessons[0];

  const totals = useMemo(
    () => ({
      lessons: chapters.reduce(
        (count, chapterItem) => count + chapterItem.lessons.length,
        0,
      ),
      resources: chapters.reduce(
        (count, chapterItem) =>
          count +
          chapterItem.lessons.reduce(
            (lessonCount, lessonItem) =>
              lessonCount + lessonItem.resources.length,
            0,
          ),
        0,
      ),
    }),
    [chapters],
  );

  async function loadStructure(
    path: string,
    signal?: AbortSignal,
  ): Promise<void> {
    const [chapterRows, lessonRows, resourceRows] = await Promise.all([
      adminDeliveryRequest<DeliveryChapter[]>(path + "/chapters", { signal }),
      adminDeliveryRequest<DeliveryLesson[]>(path + "/lessons", { signal }),
      adminDeliveryRequest<DeliveryResource[]>(path + "/resources", { signal }),
    ]);

    if (
      !Array.isArray(chapterRows) ||
      !Array.isArray(lessonRows) ||
      !Array.isArray(resourceRows)
    ) {
      throw new Error("The API returned an invalid course structure.");
    }
    if (currentScope.current !== path || signal?.aborted) return;

    setChapters(
      chapterRows.map((chapterItem) => ({
        ...chapterItem,
        lessons: lessonRows
          .filter((lessonItem) => lessonItem.courseChapterId === chapterItem.id)
          .map((lessonItem) => ({
            ...lessonItem,
            resources: resourceRows
              .filter(
                (resourceItem) => resourceItem.courseLessonId === lessonItem.id,
              )
              .map((resourceItem) => ({
                ...resourceItem,
                kind: resourceItem.resourceKind,
              })),
          })),
      })),
    );
  }

  useEffect(() => {
    const controller = new AbortController();
    setCourse(undefined);
    setModule(undefined);
    setChapters([]);
    setError("");
    setLoading(true);
    setActiveChapterId(undefined);
    setActiveLessonId(undefined);
    setChapterTitle("");
    setLessonTitle("");
    setResourceTitle("");
    setReason("");
    setNotice("");
    setEditingChapter(false);
    setEditingLesson(false);
    pendingRequest.current = undefined;

    if (!scope) {
      setLoading(false);
      return () => controller.abort();
    }

    void (async () => {
      try {
        const loadedCourse = await adminDeliveryRequest<DeliveryCourse>(scope, {
          signal: controller.signal,
        });

        if (
          loadedCourse.id !== courseId ||
          loadedCourse.brandId !== selectedBrandId
        ) {
          throw new Error("The API returned a different course context.");
        }

        const loadedModule = loadedCourse.academicModuleId
          ? await adminDeliveryRequest<DeliveryModule>(
              "/v1/admin/curriculum/modules/" +
                encodeURIComponent(loadedCourse.academicModuleId),
              { signal: controller.signal },
            )
          : undefined;

        await loadStructure(scope, controller.signal);
        if (!controller.signal.aborted) {
          setCourse(loadedCourse);
          setModule(loadedModule);
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load course delivery.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [courseId, revision, scope, selectedBrandId]);

  async function saveNew(
    entity: EditableEntity,
    fields: Record<string, unknown>,
  ): Promise<void> {
    if (!course || !scope || busy.current) return;
    if (!reason.trim()) {
      setError("Enter a reason for this change.");
      return;
    }

    const body = { ...fields, reason: reason.trim() };
    const signature = JSON.stringify({ path: scope, entity, body });
    if (pendingRequest.current?.signature !== signature) {
      pendingRequest.current = { signature, key: createRequestKey() };
    }

    busy.current = true;
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const result = await adminDeliveryRequest<{ readonly recordId: string }>(
        scope + "/" + entity,
        {
          method: "POST",
          key: pendingRequest.current.key,
          body,
        },
      );

      if (currentScope.current !== scope) return;
      pendingRequest.current = undefined;

      if (entity === "chapters") {
        setChapterTitle("");
        setActiveChapterId(result.recordId);
      } else if (entity === "lessons") {
        setLessonTitle("");
        setActiveLessonId(result.recordId);
      } else {
        setResourceTitle("");
      }

      setNotice("Metadata saved. No file content was uploaded.");
      await loadStructure(scope);
    } catch (cause) {
      if (currentScope.current === scope) {
        setError(
          cause instanceof Error ? cause.message : "Could not save metadata.",
        );
      }
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  async function updateExisting(
    entity: EditableEntity,
    recordId: string,
    expectedVersion: number,
    fields: Record<string, unknown>,
  ): Promise<void> {
    if (!course || !scope || busy.current) return;
    if (!reason.trim()) {
      setError("Enter a reason for this change.");
      return;
    }

    const body = {
      ...fields,
      reason: reason.trim(),
      expectedVersion,
    };
    const signature = JSON.stringify({ path: scope, entity, recordId, body });
    if (pendingRequest.current?.signature !== signature) {
      pendingRequest.current = { signature, key: createRequestKey() };
    }

    busy.current = true;
    setSaving(true);
    setError("");
    setNotice("");

    try {
      await adminDeliveryRequest<void>(
        scope + "/" + entity + "/" + encodeURIComponent(recordId),
        {
          method: "PATCH",
          key: pendingRequest.current.key,
          body,
        },
      );

      if (currentScope.current !== scope) return;
      pendingRequest.current = undefined;
      setEditingChapter(false);
      setEditingLesson(false);
      setNotice("Changes saved.");
      await loadStructure(scope);
    } catch (cause) {
      if (currentScope.current === scope) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not update this record.",
        );
      }
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  function addChapter(): void {
    if (!chapterTitle.trim()) return;
    void saveNew("chapters", {
      title: chapterTitle.trim(),
      sortOrder: nextSortOrder(chapters),
      status: "draft",
    });
  }

  function addLesson(): void {
    if (!activeChapter || !lessonTitle.trim()) return;
    void saveNew("lessons", {
      title: lessonTitle.trim(),
      courseChapterId: activeChapter.id,
      sortOrder: nextSortOrder(activeChapter.lessons),
      status: "draft",
    });
  }

  function addResource(): void {
    if (!activeLesson || !resourceTitle.trim()) return;
    const isBinaryResource =
      resourceKind === "video" || resourceKind === "document";

    void saveNew("resources", {
      title: resourceTitle.trim(),
      courseLessonId: activeLesson.id,
      resourceKind,
      sortOrder: nextSortOrder(activeLesson.resources),
      status: isBinaryResource ? "draft" : resourceStatus,
    });
  }

  if (courseId === "new") {
    return (
      <section className="admin-page admin-course-builder">
        <Link to="/admin/courses">Back to courses</Link>
        <h1>Create course</h1>
        <AdminCourseTemplateForm
          key={
            selectedBrandId +
            ":" +
            initialCourse.moduleId +
            ":" +
            initialCourse.cataloguePresentation
          }
          initialBrandId={selectedBrandId}
          initialInstitutionId={initialCourse.institutionId}
          initialLevelId={initialCourse.levelId}
          initialSemesterId={initialCourse.semesterId}
          initialModuleId={initialCourse.moduleId}
          initialCode={initialCourse.code}
          initialTitle={initialCourse.title}
          initialCataloguePresentation={initialCourse.cataloguePresentation}
          onSaved={(result) =>
            navigate(
              "/admin/courses/" +
                encodeURIComponent(result.courseId) +
                "/builder?brandId=" +
                encodeURIComponent(result.brandId),
              { replace: true },
            )
          }
        />
      </section>
    );
  }

  if (!scope) {
    return (
      <section className="admin-page">
        <h1>Course builder</h1>
        <p>Select the course’s brand to manage delivery.</p>
        <Link to="/admin/courses">Back to courses</Link>
      </section>
    );
  }

  if (loading || !course) {
    return (
      <section className="admin-page" aria-busy={loading}>
        <h1>Course builder</h1>
        {loading ? (
          <p>Loading course and module context…</p>
        ) : (
          <>
            <p role="alert">{error || "Course unavailable."}</p>
            <button
              type="button"
              onClick={() => setRevision((value) => value + 1)}
            >
              Reload
            </button>
          </>
        )}
        <Link to="/admin/courses">Back to courses</Link>
      </section>
    );
  }

  return (
    <section
      className="admin-page admin-course-builder"
      aria-label="Course content builder"
    >
      <header className="admin-course-builder__header">
        <div>
          <Link className="admin-course-builder__back" to="/admin/courses">
            <ArrowLeft aria-hidden="true" />
            Back to courses
          </Link>
          <div className="admin-course-builder__title">
            <div className={"admin-course-cover is-" + course.brand.code}>
              <BookOpen aria-hidden="true" />
            </div>
            <div>
              <span className={"admin-course-brand is-" + course.brand.code}>
                {course.brand.name}
              </span>
              <h1>{course.title}</h1>
              <p>
                {module
                  ? module.code + " · " + module.sourceDisplayLabel
                  : "Standalone course"}
              </p>
            </div>
          </div>
        </div>
        <div className="admin-course-builder__actions">
          <button
            className="is-primary"
            type="button"
            onClick={() => setCourseDetailsOpen(true)}
          >
            Edit course details
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => setRevision((value) => value + 1)}
          >
            Reload structure
          </button>
        </div>
      </header>

      <div className="admin-course-builder__notice" role="status">
        <Layers3 aria-hidden="true" />
        <span>
          <strong>Course structure workspace</strong>{" "}
          Manage chapters, lessons, and resources against the approved academic
          module.
        </span>
      </div>

      {error && (
        <p role="alert" className="admin-course-builder__notice">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="admin-course-builder__notice">
          {notice}
        </p>
      )}

      <label className="builder-inline-form">
        Reason for change
        <input
          maxLength={500}
          value={reason}
          disabled={saving}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Explain this metadata change"
        />
      </label>

      <div className="admin-course-builder__grid">
        <aside className="admin-course-builder__outline">
          <header>
            <div>
              <h2>Course outline</h2>
              <span>
                {chapters.length} chapters · {totals.lessons} lessons ·{" "}
                {totals.resources} resources
              </span>
            </div>
            <FolderPlus aria-hidden="true" />
          </header>

          {chapters.length === 0 && (
            <p className="builder-empty">
              No chapters yet. Add the first chapter below.
            </p>
          )}

          <div
            className="builder-outline-list"
            role="region"
            aria-label="Chapters and lessons"
            tabIndex={0}
          >
          {chapters.map((chapterItem) => (
            <div className="builder-chapter" key={chapterItem.id}>
              <button
                className={
                  chapterItem.id === activeChapter?.id ? "is-active" : ""
                }
                type="button"
                onClick={() => {
                  setActiveChapterId(chapterItem.id);
                  setActiveLessonId(chapterItem.lessons[0]?.id);
                }}
              >
                <span>{chapterItem.title}</span>
                <small>{chapterItem.lessons.length}</small>
              </button>
              {chapterItem.id === activeChapter?.id &&
                chapterItem.lessons.map((lessonItem) => (
                  <button
                    className={
                      "builder-lesson" +
                      (lessonItem.id === activeLesson?.id ? " is-active" : "")
                    }
                    key={lessonItem.id}
                    type="button"
                    onClick={() => setActiveLessonId(lessonItem.id)}
                  >
                    <span>{lessonItem.title}</span>
                    <small>{lessonItem.resources.length}</small>
                  </button>
                ))}
            </div>
          ))}
          </div>

          <div className="builder-inline-form">
            <input
              disabled={saving}
              maxLength={240}
              aria-label="New chapter title"
              value={chapterTitle}
              onChange={(event) => setChapterTitle(event.target.value)}
              placeholder="New chapter title"
            />
            <button
              type="button"
              disabled={saving || !chapterTitle.trim() || !reason.trim()}
              onClick={addChapter}
              aria-label="Add chapter"
            >
              <Plus aria-hidden="true" />
            </button>
          </div>
        </aside>

        <main className="admin-course-builder__main">
          <div className="builder-panel">
            <header>
              <div>
                <span className="builder-eyebrow">
                  {activeChapter?.title ?? "Select a chapter"}
                </span>
                <h2>{activeLesson?.title ?? "Add your first lesson"}</h2>
              </div>
              <GraduationCap aria-hidden="true" />
            </header>

            {activeChapter && (
              <div className="builder-edit-row">
                {editingChapter ? (
                  <>
                    <input
                      aria-label="Chapter title"
                      value={editChapterTitle}
                      maxLength={240}
                      disabled={saving}
                      onChange={(event) =>
                        setEditChapterTitle(event.target.value)
                      }
                    />
                    <button
                      type="button"
                      disabled={
                        saving || !editChapterTitle.trim() || !reason.trim()
                      }
                      onClick={() =>
                        void updateExisting(
                          "chapters",
                          activeChapter.id,
                          activeChapter.version,
                          { title: editChapterTitle.trim() },
                        )
                      }
                    >
                      Save chapter
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => setEditingChapter(false)}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditChapterTitle(activeChapter.title);
                      setEditingChapter(true);
                    }}
                  >
                    Edit chapter
                  </button>
                )}
              </div>
            )}

            {activeLesson && (
              <div className="builder-edit-row">
                {editingLesson ? (
                  <>
                    <input
                      aria-label="Lesson title"
                      value={editLessonTitle}
                      maxLength={240}
                      disabled={saving}
                      onChange={(event) =>
                        setEditLessonTitle(event.target.value)
                      }
                    />
                    <button
                      type="button"
                      disabled={
                        saving || !editLessonTitle.trim() || !reason.trim()
                      }
                      onClick={() =>
                        void updateExisting(
                          "lessons",
                          activeLesson.id,
                          activeLesson.version,
                          { title: editLessonTitle.trim() },
                        )
                      }
                    >
                      Save lesson
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => setEditingLesson(false)}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditLessonTitle(activeLesson.title);
                      setEditingLesson(true);
                    }}
                  >
                    Edit lesson
                  </button>
                )}
              </div>
            )}

            {activeLesson ? (
              <div className="builder-resources">
                <div className="builder-section-label">
                  Resources in this lesson
                </div>
                {activeLesson.resources.map((resource) => (
                  <div className="builder-resource" key={resource.id}>
                    {getResourceIcon(resource.kind)}
                    <div>
                      <strong>{resource.title}</strong>
                      <span>{RESOURCE_LABELS[resource.kind]}</span>
                    </div>
                    <span
                      className={
                        "builder-resource-status is-" + resource.status
                      }
                    >
                      {resource.status === "published"
                        ? "Published"
                        : resource.status === "archived"
                          ? "Archived"
                          : "Draft"}
                    </span>
                    {(resource.kind === "video" ||
                      resource.kind === "document") &&
                      resource.status === "published" && (
                        <AdminLessonMediaManagement
                          course={course}
                          lessonId={activeLesson.id}
                          resource={resource}
                          onChanged={() => setRevision((value) => value + 1)}
                        />
                      )}
                    {(resource.kind === "video" ||
                      resource.kind === "document") &&
                      resource.status !== "published" && (
                        <AdminLessonMediaUpload
                          course={course}
                          lessonId={activeLesson.id}
                          resource={resource}
                          onPublished={() => setRevision((value) => value + 1)}
                        />
                      )}
                  </div>
                ))}

                {activeLesson.resources.length === 0 && (
                  <div className="builder-empty">
                    No resources yet. Add a PDF, exam, link, or session below.
                  </div>
                )}

                <div className="builder-add-resource">
                  <input
                    disabled={saving}
                    maxLength={240}
                    aria-label="Resource title"
                    value={resourceTitle}
                    onChange={(event) => setResourceTitle(event.target.value)}
                    placeholder="Resource title"
                  />
                  <select
                    disabled={saving}
                    aria-label="Resource type"
                    value={resourceKind}
                    onChange={(event) =>
                      setResourceKind(event.target.value as ResourceKind)
                    }
                  >
                    {Object.entries(RESOURCE_LABELS).map(([value, label]) => (
                      <option value={value} key={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Resource metadata status"
                    disabled={
                      saving ||
                      resourceKind === "video" ||
                      resourceKind === "document"
                    }
                    value={
                      resourceKind === "video" || resourceKind === "document"
                        ? "draft"
                        : resourceStatus
                    }
                    onChange={(event) =>
                      setResourceStatus(
                        event.target.value as "draft" | "published",
                      )
                    }
                  >
                    <option value="draft">Draft metadata</option>
                    <option value="published">Published metadata</option>
                  </select>
                  <button
                    className="is-primary"
                    type="button"
                    disabled={saving || !resourceTitle.trim() || !reason.trim()}
                    onClick={addResource}
                  >
                    <Plus aria-hidden="true" />
                    Add resource
                  </button>
                </div>

                <p className="builder-policy">
                  <Film aria-hidden="true" />
                  <span>
                    <strong>Publishing policy:</strong> video and PDF content
                    uploads directly to private storage, then the backend
                    verifies and publishes it. Other resources remain
                    metadata-only.
                  </span>
                </p>
              </div>
            ) : (
              <div className="builder-empty builder-empty--lesson">
                Create a lesson from the form below to start adding resources.
              </div>
            )}

            <div className="builder-add-lesson">
              <input
                disabled={saving}
                maxLength={240}
                aria-label="New lesson title"
                value={lessonTitle}
                onChange={(event) => setLessonTitle(event.target.value)}
                placeholder="Lesson title"
              />
              <button
                type="button"
                disabled={
                  saving ||
                  !activeChapter ||
                  !lessonTitle.trim() ||
                  !reason.trim()
                }
                onClick={addLesson}
              >
                <Plus aria-hidden="true" />
                Add lesson to {activeChapter?.title ?? "chapter"}
              </button>
            </div>
          </div>

          <div className="builder-panel builder-panel--guide">
            <h3>How this maps to the curriculum</h3>
            <p>
              {module
                ? "This course is anchored to " +
                  module.code +
                  " " +
                  module.sourceDisplayLabel +
                  ". Keep each chapter and lesson focused on that approved module; do not create a second academic module from the builder."
                : "This is a standalone course with no shared academic module mapping."}
            </p>
          </div>
        </main>
      </div>

      {module?.chapters?.length ? (
        <section
          className="builder-panel builder-panel--academic-outline"
          aria-label="Academic chapter outline"
        >
          <header>
            <div>
              <span className="builder-eyebrow">Shared academic reference</span>
              <h2>{module.code} chapter outline</h2>
            </div>
            <GraduationCap aria-hidden="true" />
          </header>
          <p>
            Use the approved catalogue outline as a guide. These references do
            not become delivery chapters until you add them to this course.
          </p>
          <ol>
            {module.chapters.map((academicChapter) => (
              <li key={academicChapter.id}>
                <span>
                  <strong>{academicChapter.code}</strong>{" "}
                  {academicChapter.title}
                </span>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setChapterTitle(academicChapter.title)}
                >
                  Use as new chapter
                </button>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {course ? (
        <AdminSideDrawer
          open={courseDetailsOpen}
          eyebrow="Course settings"
          title="Edit course details"
          onClose={() => setCourseDetailsOpen(false)}
        >
          <AdminCourseTemplateForm
            key={course.id + ":" + course.version}
            course={course}
            onSaved={() => {
              setRevision((value) => value + 1);
              setCourseDetailsOpen(false);
            }}
          />
        </AdminSideDrawer>
      ) : null}
    </section>
  );
}
