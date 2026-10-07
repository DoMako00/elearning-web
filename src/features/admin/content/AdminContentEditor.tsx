import {
  WorkspaceBadge,
  WorkspaceCard,
  WorkspaceFields,
  WorkspaceInspector,
  WorkspaceState,
} from "../components/AdminWorkspacePrimitives";
import {
  BookOpen,
  CheckCircle2,
  FileText,
  Link2,
  Plus,
  Video,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  adminDeliveryRequest,
  deliveryCoursePath,
  type DeliveryChapter,
  type DeliveryCourse,
  type DeliveryLesson,
  type DeliveryModule,
  type DeliveryResource,
  type ResourceKind,
} from "../api/adminDelivery.http";
import { AdminLessonMediaUpload } from "./AdminLessonMediaUpload";
import { AdminLessonMediaManagement } from "./AdminLessonMediaManagement";
import { AdminSideDrawer } from "../components/AdminSideDrawer";
type Resource = DeliveryResource & { readonly kind: ResourceKind };
type Lesson = DeliveryLesson & { readonly resources: readonly Resource[] };
type Chapter = DeliveryChapter & { readonly lessons: readonly Lesson[] };
type EditableEntity = "chapters" | "lessons" | "resources";
type PendingRequest = Readonly<{ signature: string; key: string }>;

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

export function AdminContentEditor({
  courseId,
  brandId,
  coursePicker,
}: {
  courseId: string;
  brandId: string;
  coursePicker: React.ReactNode;
}) {
  const [course, setCourse] = useState<DeliveryCourse>();
  const [module, setModule] = useState<DeliveryModule>();
  const [chapters, setChapters] = useState<readonly Chapter[]>([]);
  const [activeChapterId, setActiveChapterId] = useState<string>();
  const [activeLessonId, setActiveLessonId] = useState<string>();
  const [chapterTitle, setChapterTitle] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceKind, setResourceKind] = useState<ResourceKind>("document");
  const [resourceStatus] = useState<"draft" | "published">("draft");
  const [editChapterTitle, setEditChapterTitle] = useState("");
  const [editLessonTitle, setEditLessonTitle] = useState("");
  const [editingChapter, setEditingChapter] = useState(false);
  const [editingLesson, setEditingLesson] = useState(false);
  const [editingResource, setEditingResource] = useState(false);
  const [editResourceTitle, setEditResourceTitle] = useState("");
  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [revision, setRevision] = useState(0);
  const [selectedResourceId, setSelectedResourceId] = useState("");
  const [createKind, setCreateKind] = useState<
    "chapter" | "lesson" | "resource" | null
  >(null);
  const pendingRequest = useRef<PendingRequest | undefined>(undefined);
  const busy = useRef(false);
  const selectedBrandId = brandId;
  const scope = buildCourseScope(selectedBrandId, courseId);
  const currentScope = useRef(scope);
  currentScope.current = scope;
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
    setChapterTitle("");
    setLessonTitle("");
    setResourceTitle("");
    setReason("");
    setNotice("");
    setEditingChapter(false);
    setEditingLesson(false);
    setEditingResource(false);
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
      setCreateKind(null);
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
      setEditingResource(false);
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
  const selectedResource = activeLesson?.resources.find(
    (item) => item.id === selectedResourceId,
  );
  if (loading || !course)
    return (
      <WorkspaceCard title="Course content">
        <WorkspaceState
          loading={loading}
          error={!!error}
          title="Course unavailable"
          onRetry={() => setRevision((value) => value + 1)}
        />
        {error && <p role="alert">{error}</p>}
      </WorkspaceCard>
    );
  return (
    <div className="admin-content-editor" aria-label="Content editor">
      <WorkspaceCard
        title="Content library"
        className="admin-content-editor__tree"
      >
        {coursePicker}
        <nav
          className="builder-outline-list"
          aria-label="Course chapters and lessons"
        >
          {chapters.map((chapter) => (
            <div className="builder-chapter" key={chapter.id}>
              <button
                type="button"
                className={chapter.id === activeChapter?.id ? "is-active" : ""}
                onClick={() => {
                  setActiveChapterId(chapter.id);
                  setActiveLessonId(chapter.lessons[0]?.id);
                  setSelectedResourceId("");
                }}
              >
                <BookOpen aria-hidden="true" />
                <span>{chapter.title}</span>
                <small>{chapter.lessons.length}</small>
              </button>
              {chapter.id === activeChapter?.id &&
                chapter.lessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    type="button"
                    className={`builder-lesson${lesson.id === activeLesson?.id ? " is-active" : ""}`}
                    onClick={() => {
                      setActiveLessonId(lesson.id);
                      setSelectedResourceId("");
                    }}
                  >
                    <FileText aria-hidden="true" />
                    <span>{lesson.title}</span>
                  </button>
                ))}
            </div>
          ))}
          {!chapters.length && <WorkspaceState title="No chapters yet" />}
        </nav>
        <footer className="admin-content-editor__footer">
          <button
            type="button"
            disabled={saving}
            onClick={() => setCreateKind("chapter")}
          >
            <Plus aria-hidden="true" />
            Add chapter
          </button>
          <small>
            {totals.lessons} lessons · {totals.resources} resources
          </small>
        </footer>
      </WorkspaceCard>
      <WorkspaceCard
        title={activeLesson?.title ?? course.title}
        className="admin-content-editor__resources"
        aside={<WorkspaceBadge value={activeLesson?.status ?? course.status} />}
      >
        <div className="admin-content-editor__breadcrumb">
          {course.brand.name} / {course.title} /{" "}
          {activeChapter?.title ?? "Course outline"}
        </div>
        <div className="admin-workspace-toolbar">
          <strong>Lesson resources</strong>
          <button
            type="button"
            disabled={!activeLesson || saving}
            onClick={() => setCreateKind("resource")}
          >
            <Plus aria-hidden="true" />
            Add video / PDF
          </button>
          <button
            type="button"
            disabled={!activeChapter || saving}
            onClick={() => setCreateKind("lesson")}
          >
            Add lesson
          </button>
        </div>
        {error && (
          <p className="admin-workspace-note" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="admin-workspace-note" role="status">
            {notice}
          </p>
        )}
        <div className="admin-workspace-table-wrap">
          <table className="admin-workspace-table">
            <caption className="admin-sr-only">Lesson resources</caption>
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {activeLesson?.resources.map((resource) => (
                <tr
                  key={resource.id}
                  className={
                    selectedResource?.id === resource.id ? "is-selected" : ""
                  }
                >
                  <td>
                    <span className="admin-workspace-cell">
                      {getResourceIcon(resource.kind)}
                      <strong>{resource.title}</strong>
                    </span>
                  </td>
                  <td>{RESOURCE_LABELS[resource.kind]}</td>
                  <td>
                    <WorkspaceBadge value={resource.status} />
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => setSelectedResourceId(resource.id)}
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!activeLesson?.resources.length && (
            <WorkspaceState
              title={
                activeLesson
                  ? "No resources in this lesson"
                  : "Select or add a lesson"
              }
            />
          )}
        </div>
        <footer className="admin-content-editor__footer">
          <span>Course and resource publication are separate.</span>
          <button
            type="button"
            disabled={saving}
            onClick={() => setRevision((value) => value + 1)}
          >
            Reload content
          </button>
        </footer>
      </WorkspaceCard>
      <WorkspaceInspector
        title={selectedResource ? "Resource settings" : "Lesson settings"}
        selected
      >
        <section className="admin-inspector-section">
          <h3>
            {selectedResource?.title ?? activeLesson?.title ?? course.title}
          </h3>
          <WorkspaceBadge
            value={
              selectedResource?.status ?? activeLesson?.status ?? course.status
            }
          />
        </section>
        <WorkspaceFields
          fields={[
            ["Brand", course.brand.name],
            ["Course", course.title],
            ["Chapter", activeChapter?.title],
            ["Lesson", activeLesson?.title],
            [
              "Resource type",
              selectedResource
                ? RESOURCE_LABELS[selectedResource.kind]
                : "Select a resource",
            ],
            ["Order", selectedResource?.sortOrder ?? activeLesson?.sortOrder],
            [
              "Curriculum reference",
              module?.sourceDisplayLabel ?? "Standalone course",
            ],
          ]}
        />
        <section className="admin-inspector-section">
          <h3>Content actions</h3>
          {selectedResource && (
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setEditResourceTitle(selectedResource.title);
                setEditingResource(true);
              }}
            >
              Edit resource details
            </button>
          )}
          <div className="admin-workspace-actions">
            <button
              type="button"
              disabled={!activeChapter || saving}
              onClick={() => {
                setEditChapterTitle(activeChapter?.title ?? "");
                setEditingChapter(true);
              }}
            >
              Edit chapter
            </button>
            <button
              type="button"
              disabled={!activeLesson || saving}
              onClick={() => {
                setEditLessonTitle(activeLesson?.title ?? "");
                setEditingLesson(true);
              }}
            >
              Edit lesson
            </button>
          </div>
        </section>
        {selectedResource &&
          activeLesson &&
          (selectedResource.kind === "video" ||
            selectedResource.kind === "document") && (
            <section className="admin-inspector-section">
              <h3>Upload & publication</h3>
              {selectedResource.status === "published" ? (
                <AdminLessonMediaManagement
                  key={selectedResource.id}
                  course={course}
                  lessonId={activeLesson.id}
                  resource={selectedResource}
                  onChanged={() => setRevision((value) => value + 1)}
                />
              ) : (
                <AdminLessonMediaUpload
                  key={selectedResource.id}
                  course={course}
                  lessonId={activeLesson.id}
                  resource={selectedResource}
                  onPublished={() => setRevision((value) => value + 1)}
                />
              )}
            </section>
          )}
        <section className="admin-inspector-section">
          <h3>Scheduling & visibility</h3>
          <p>
            Delivery follows the published course release and effective access
            rules. Release scheduling controls are unavailable in this frontend
            contract.
          </p>
        </section>
        {module?.chapters?.length ? (
          <details className="admin-inspector-section">
            <summary>Academic chapter reference</summary>
            <ol>
              {module.chapters.map((chapter) => (
                <li key={chapter.id}>{chapter.title}</li>
              ))}
            </ol>
          </details>
        ) : null}
      </WorkspaceInspector>
      <AdminSideDrawer
        open={
          !!createKind || editingChapter || editingLesson || editingResource
        }
        title={
          createKind
            ? `Add ${createKind}`
            : editingResource
              ? "Edit resource"
              : editingChapter
                ? "Edit chapter"
                : "Edit lesson"
        }
        eyebrow={course.title}
        dismissible={!saving}
        onClose={() => {
          setCreateKind(null);
          setEditingChapter(false);
          setEditingLesson(false);
          setEditingResource(false);
        }}
      >
        <form
          className="admin-workspace-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (createKind === "chapter") addChapter();
            else if (createKind === "lesson") addLesson();
            else if (createKind === "resource") addResource();
            else {
              const entity = editingResource
                ? selectedResource
                : editingChapter
                  ? activeChapter
                  : activeLesson;
              if (entity)
                void updateExisting(
                  editingResource
                    ? "resources"
                    : editingChapter
                      ? "chapters"
                      : "lessons",
                  entity.id,
                  entity.version,
                  {
                    title: (editingResource
                      ? editResourceTitle
                      : editingChapter
                        ? editChapterTitle
                        : editLessonTitle
                    ).trim(),
                  },
                );
            }
          }}
        >
          <label>
            Title
            <input
              required
              maxLength={240}
              disabled={saving}
              value={
                createKind === "chapter"
                  ? chapterTitle
                  : createKind === "lesson"
                    ? lessonTitle
                    : createKind === "resource"
                      ? resourceTitle
                      : editingResource
                        ? editResourceTitle
                        : editingChapter
                          ? editChapterTitle
                          : editLessonTitle
              }
              onChange={(event) => {
                const value = event.target.value;
                if (createKind === "chapter") setChapterTitle(value);
                else if (createKind === "lesson") setLessonTitle(value);
                else if (createKind === "resource") setResourceTitle(value);
                else if (editingResource) setEditResourceTitle(value);
                else if (editingChapter) setEditChapterTitle(value);
                else setEditLessonTitle(value);
              }}
            />
          </label>
          {createKind === "resource" && (
            <>
              <label>
                Resource type
                <select
                  disabled={saving}
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
              </label>
              <p>
                Video and PDF resources start as drafts. Upload and verify the
                file before publishing it.
              </p>
            </>
          )}
          <label>
            Reason for change
            <textarea
              required
              maxLength={500}
              disabled={saving}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
          {error && <p role="alert">{error}</p>}
          <button
            className="is-primary"
            type="submit"
            disabled={saving || !reason.trim()}
          >
            {saving
              ? "Saving…"
              : createKind
                ? `Create ${createKind}`
                : "Save changes"}
          </button>
        </form>
      </AdminSideDrawer>
    </div>
  );
}
