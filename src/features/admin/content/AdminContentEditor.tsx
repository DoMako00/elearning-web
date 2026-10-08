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
  ChevronRight,
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
import {
  inspectAdminLessonMedia,
  type AdminMediaAsset,
} from "../api/adminMedia.http";
import { AdminLessonMediaUpload } from "./AdminLessonMediaUpload";
import { AdminLessonMediaManagement } from "./AdminLessonMediaManagement";
import { AdminSideDrawer } from "../components/AdminSideDrawer";
type Resource = DeliveryResource & { readonly kind: ResourceKind };
type Lesson = DeliveryLesson & { readonly resources: readonly Resource[] };
type Chapter = DeliveryChapter & { readonly lessons: readonly Lesson[] };
type EditableEntity = "chapters" | "lessons" | "resources";
type PendingRequest = Readonly<{ signature: string; key: string }>;
type MediaRowStatus =
  | AdminMediaAsset["status"]
  | "no_file"
  | "unavailable";

const MEDIA_STATUS_LABELS: Record<MediaRowStatus, string> = {
  pending_upload: "Awaiting file",
  uploaded: "Uploaded",
  verified: "Verified",
  published: "Published",
  withdrawn: "Withdrawn",
  failed: "Failed",
  no_file: "No file",
  unavailable: "Unavailable",
};

const MEDIA_STATUS_PRIORITY: Record<AdminMediaAsset["status"], number> = {
  published: 6,
  verified: 5,
  uploaded: 4,
  pending_upload: 3,
  failed: 2,
  withdrawn: 1,
};

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
  section = "library",
  initialResourceId = "",
  onOpenMediaLibrary,
  onOpenContentLibrary,
}: {
  courseId: string;
  brandId: string;
  coursePicker: React.ReactNode;
  section?: "library" | "media";
  initialResourceId?: string;
  onOpenMediaLibrary: (resourceId: string) => void;
  onOpenContentLibrary: (resourceId: string) => void;
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
  const [mediaStatusByResourceId, setMediaStatusByResourceId] = useState<
    Readonly<Record<string, MediaRowStatus>>
  >({});
  const [selectedResourceId, setSelectedResourceId] =
    useState(initialResourceId);
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
  const mediaResourceEntries = useMemo(
    () =>
      chapters.flatMap((chapter) =>
        chapter.lessons.flatMap((lesson) =>
          lesson.resources
            .filter(
              (resource) =>
                resource.kind === "video" || resource.kind === "document",
            )
            .map((resource) => ({ chapter, lesson, resource })),
        ),
      ),
    [chapters],
  );
  useEffect(() => {
    if (section !== "media" || !course || !mediaResourceEntries.length) {
      setMediaStatusByResourceId({});
      return;
    }
    let current = true;
    const currentCourse = course;
    const lessonIds = [
      ...new Set(mediaResourceEntries.map((entry) => entry.lesson.id)),
    ];
    void Promise.all(
      lessonIds.map(async (lessonId) => {
        try {
          const result = await inspectAdminLessonMedia(currentCourse, lessonId);
          return { lessonId, assets: result.assets };
        } catch {
          return { lessonId, assets: null };
        }
      }),
    ).then((results) => {
      if (!current) return;
      const next: Record<string, MediaRowStatus> = {};
      for (const entry of mediaResourceEntries) {
        const result = results.find(
          (candidate) => candidate.lessonId === entry.lesson.id,
        );
        if (!result || result.assets === null) {
          next[entry.resource.id] = "unavailable";
          continue;
        }
        const asset = [...result.assets]
          .filter((candidate) => candidate.resourceId === entry.resource.id)
          .sort(
            (left, right) =>
              MEDIA_STATUS_PRIORITY[right.status] -
              MEDIA_STATUS_PRIORITY[left.status],
          )[0];
        next[entry.resource.id] = asset?.status ?? "no_file";
      }
      setMediaStatusByResourceId(next);
    });
    return () => {
      current = false;
    };
  }, [course, mediaResourceEntries, revision, section]);

  const selectedMediaEntry =
    mediaResourceEntries.find(
      (entry) => entry.resource.id === selectedResourceId,
    ) ??
    mediaResourceEntries.find(
      (entry) => entry.lesson.id === activeLesson?.id,
    );
  const workspaceChapter =
    section === "media" ? selectedMediaEntry?.chapter : activeChapter;
  const workspaceLesson =
    section === "media" ? selectedMediaEntry?.lesson : activeLesson;
  const selectedResource =
    section === "media"
      ? selectedMediaEntry?.resource
      : activeLesson?.resources.find((item) => item.id === selectedResourceId) ??
        activeLesson?.resources[0];
  const resourceRows =
    section === "media"
      ? mediaResourceEntries
      : activeChapter && activeLesson
        ? activeLesson.resources.map((resource) => ({
            chapter: activeChapter,
            lesson: activeLesson,
            resource,
          }))
        : [];
  const mediaSelectionInitialized = useRef(false);
  useEffect(() => {
    if (mediaSelectionInitialized.current || !chapters.length) return;

    const requestedEntry = chapters
      .flatMap((chapter) =>
        chapter.lessons.flatMap((lesson) =>
          lesson.resources.map((resource) => ({ chapter, lesson, resource })),
        ),
      )
      .find((entry) => entry.resource.id === initialResourceId);
    const firstMediaEntry = mediaResourceEntries[0];
    const nextEntry =
      requestedEntry && (section === "library" ||
        requestedEntry.resource.kind === "video" ||
        requestedEntry.resource.kind === "document")
        ? requestedEntry
        : section === "media"
          ? firstMediaEntry
          : undefined;
    if (!nextEntry) return;

    setActiveChapterId(nextEntry.chapter.id);
    setActiveLessonId(nextEntry.lesson.id);
    setSelectedResourceId(nextEntry.resource.id);
    mediaSelectionInitialized.current = true;
  }, [chapters, initialResourceId, mediaResourceEntries, section]);
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
  function openCreateDrawer(kind: "chapter" | "lesson" | "resource"): void {
    setReason("");
    setError("");
    setNotice("");
    setCreateKind(kind);
  }
  function selectResourceEntry(
    entry: (typeof mediaResourceEntries)[number],
  ): void {
    setActiveChapterId(entry.chapter.id);
    setActiveLessonId(entry.lesson.id);
    setSelectedResourceId(entry.resource.id);
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
    if (!workspaceChapter || !lessonTitle.trim()) return;
    void saveNew("lessons", {
      title: lessonTitle.trim(),
      courseChapterId: workspaceChapter.id,
      sortOrder: nextSortOrder(workspaceChapter.lessons),
      status: "draft",
    });
  }
  function addResource(): void {
    if (!workspaceLesson || !resourceTitle.trim()) return;
    void saveNew("resources", {
      title: resourceTitle.trim(),
      courseLessonId: workspaceLesson.id,
      resourceKind,
      sortOrder: nextSortOrder(workspaceLesson.resources),
      status: "draft",
    });
  }

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
        title={section === "media" ? "Media library" : "Content library"}
        className="admin-content-editor__tree"
      >
        {coursePicker}
        <nav
          className="builder-outline-list"
          aria-label={
            section === "media"
              ? "Course media and lesson hierarchy"
              : "Course chapters and lessons"
          }
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
                <ChevronRight aria-hidden="true" />
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
            onClick={() => openCreateDrawer("chapter")}
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
        title={section === "media" ? "Media library" : "Lesson resources"}
        className="admin-content-editor__resources"
      >
        <div className="admin-content-editor__lesson-header">
          <div className="admin-content-editor__breadcrumb">
            {course.title} / {workspaceChapter?.title ?? "Course outline"}
          </div>
          <div className="admin-content-editor__lesson-title">
            <div>
              <h2>
                {section === "media"
                  ? "Media library"
                  : workspaceLesson?.title ?? course.title}
              </h2>
              <p>
                {section === "media"
                  ? `${mediaResourceEntries.length} video and PDF resources · ${course.brand.name}`
                  : workspaceLesson
                    ? `Lesson · ${selectedResource ? RESOURCE_LABELS[selectedResource.kind] : "No resources"} · Course updated ${new Date(course.updatedAt).toLocaleDateString()}`
                    : `Course · ${course.code} · ${course.brand.name}`}
              </p>
            </div>
            <WorkspaceBadge
              value={
                selectedResource?.status ??
                workspaceLesson?.status ??
                course.status
              }
            />
          </div>
        </div>
        {section !== "media" && (
          <nav
            className="admin-content-editor__tabs"
            aria-label="Lesson workspace sections"
          >
            <button type="button" aria-current="page">
              Resources
            </button>
            <button type="button" disabled aria-disabled="true">
              Details
            </button>
            <button type="button" disabled aria-disabled="true">
              Settings
            </button>
            <button type="button" disabled aria-disabled="true">
              Analytics
            </button>
          </nav>
        )}
        <div className="admin-workspace-toolbar admin-content-editor__resource-toolbar">
          <div>
            <strong>
              {section === "media"
                ? "Video and PDF resources"
                : "Lesson resources"}
            </strong>
            <small>
              {section === "media"
                ? "Review, manage, and publish course media."
                : "Upload and publish lesson materials."}
            </small>
          </div>
          <button
            type="button"
            disabled={!workspaceLesson || saving}
            onClick={() => {
              setResourceKind("document");
              openCreateDrawer("resource");
            }}
          >
            <Plus aria-hidden="true" />
            Add resource
          </button>
          {section !== "media" && (
            <button
              type="button"
              disabled={!workspaceLesson || saving}
              onClick={() => {
                setResourceKind("quiz");
                openCreateDrawer("resource");
              }}
            >
              <CheckCircle2 aria-hidden="true" />
              Create quiz
            </button>
          )}
          {section !== "media" && (
            <button
              className="is-primary"
              type="button"
              disabled={!workspaceChapter || saving}
              onClick={() => openCreateDrawer("lesson")}
            >
              <Plus aria-hidden="true" />
              Add lesson
            </button>
          )}
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
            <caption className="admin-sr-only">
              {section === "media"
                ? "Course video and PDF resources"
                : "Lesson resources"}
            </caption>
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {resourceRows.map((entry) => {
                const { chapter, lesson, resource } = entry;
                return (
                  <tr
                    key={resource.id}
                    className={
                      selectedResource?.id === resource.id ? "is-selected" : ""
                    }
                  >
                    <td>
                      <span className="admin-workspace-cell">
                        {getResourceIcon(resource.kind)}
                        <span className="admin-content-editor__resource-label">
                          <strong>{resource.title}</strong>
                          {section === "media" && (
                            <small>
                              {chapter.title} · {lesson.title}
                            </small>
                          )}
                        </span>
                      </span>
                    </td>
                    <td>{RESOURCE_LABELS[resource.kind]}</td>
                    <td>
                      {section === "media" ? (
                        <span
                          className="admin-content-editor__media-status"
                          data-status={
                            mediaStatusByResourceId[resource.id] ?? "no_file"
                          }
                        >
                          {MEDIA_STATUS_LABELS[
                            mediaStatusByResourceId[resource.id] ?? "no_file"
                          ]}
                        </span>
                      ) : (
                        <WorkspaceBadge value={resource.status} />
                      )}
                    </td>
                    <td>
                      <div className="admin-content-editor__resource-actions">
                        <button
                          type="button"
                          onClick={() => selectResourceEntry(entry)}
                        >
                          Manage
                        </button>
                        {section === "library" &&
                          (resource.kind === "video" ||
                            resource.kind === "document") && (
                            <button
                              className="admin-content-editor__open-media"
                              type="button"
                              onClick={() => onOpenMediaLibrary(resource.id)}
                            >
                              Open in Media Library
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!resourceRows.length && (
            <WorkspaceState
              title={
                section === "media"
                  ? "No video or PDF resources in this course"
                  : workspaceLesson
                    ? "No resources in this lesson"
                    : "Select or add a lesson"
              }
            />
          )}
        </div>
        {section === "media" &&
          selectedResource &&
          workspaceLesson &&
          (selectedResource.kind === "video" ||
            selectedResource.kind === "document") && (
            <section
              className="admin-content-editor__media"
              aria-label="Media upload and publication"
            >
              <header>
                <div>
                  <h3>Media upload &amp; publication</h3>
                  <p>
                    {selectedResource.status === "published"
                      ? "Published media can be withdrawn from this resource."
                      : "Upload and verify the file, or publish an existing verified upload."}
                  </p>
                </div>
                <WorkspaceBadge value={selectedResource.status} />
              </header>
              {selectedResource.status === "published" ? (
                <AdminLessonMediaManagement
                  key={selectedResource.id}
                  course={course}
                  lessonId={workspaceLesson.id}
                  resource={selectedResource}
                  onChanged={() => setRevision((value) => value + 1)}
                />
              ) : (
                <AdminLessonMediaUpload
                  key={selectedResource.id}
                  course={course}
                  lessonId={workspaceLesson.id}
                  resource={selectedResource}
                  onStatusChanged={(status) =>
                    setMediaStatusByResourceId((current) => ({
                      ...current,
                      [selectedResource.id]: status,
                    }))
                  }
                  onPublished={() => setRevision((value) => value + 1)}
                />
              )}
            </section>
          )}
        <footer className="admin-content-editor__footer">
          <span>
            {section === "media"
              ? "Media verification and publication are managed here."
              : "Content Library manages structure and draft metadata only."}
          </span>
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
            {selectedResource?.title ?? workspaceLesson?.title ?? course.title}
          </h3>
          <div className="admin-content-editor__status-context">
            <span>Content status</span>
            <WorkspaceBadge
              value={
                selectedResource?.status ??
                workspaceLesson?.status ??
                course.status
              }
            />
          </div>
        </section>
        <WorkspaceFields
          fields={[
            ["Brand", course.brand.name],
            ["Course", course.title],
            ["Chapter", workspaceChapter?.title],
            ["Lesson", workspaceLesson?.title],
            [
              "Resource type",
              selectedResource
                ? RESOURCE_LABELS[selectedResource.kind]
                : "Select a resource",
            ],
            ["Order", selectedResource?.sortOrder ?? workspaceLesson?.sortOrder],
            ...(section === "media" && selectedResource
              ? [
                  [
                    "Media status",
                    MEDIA_STATUS_LABELS[
                      mediaStatusByResourceId[selectedResource.id] ?? "no_file"
                    ],
                  ] as const,
                  [
                    "Publication",
                    selectedResource.status === "published" &&
                    mediaStatusByResourceId[selectedResource.id] === "published"
                      ? "Published"
                      : "Not published",
                  ] as const,
                ]
              : []),
            [
              "Curriculum reference",
              module?.sourceDisplayLabel ?? "Standalone course",
            ],
          ]}
        />
        {section === "library" ? (
          <>
            <section className="admin-inspector-section">
              <h3>Content actions</h3>
              {selectedResource && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setReason("");
                    setError("");
                    setEditResourceTitle(selectedResource.title);
                    setEditingResource(true);
                  }}
                >
                  Edit resource details
                </button>
              )}
              {(selectedResource?.kind === "video" ||
                selectedResource?.kind === "document") && (
                <div className="admin-content-editor__media-guidance">
                  <p>
                    Media publishing is managed from Media Library.
                    Draft media remains unavailable until its file is verified
                    and published there.
                  </p>
                  <button
                    type="button"
                    onClick={() => onOpenMediaLibrary(selectedResource.id)}
                  >
                    Open in Media Library
                  </button>
                </div>
              )}
              <div className="admin-workspace-actions">
                <button
                  type="button"
                  disabled={!workspaceChapter || saving}
                  onClick={() => {
                    setReason("");
                    setError("");
                    setEditChapterTitle(workspaceChapter?.title ?? "");
                    setEditingChapter(true);
                  }}
                >
                  Edit chapter
                </button>
                <button
                  type="button"
                  disabled={!workspaceLesson || saving}
                  onClick={() => {
                    setReason("");
                    setError("");
                    setEditLessonTitle(workspaceLesson?.title ?? "");
                    setEditingLesson(true);
                  }}
                >
                  Edit lesson
                </button>
              </div>
            </section>
            <section className="admin-inspector-section admin-content-editor__settings-card">
              <div className="admin-content-editor__section-heading">
                <h3>Scheduling &amp; release</h3>
                <span>Unavailable</span>
              </div>
              <p>
                Release scheduling is not exposed by the current API contract.
                Published course release rules still govern delivery.
              </p>
            </section>
            <section className="admin-inspector-section admin-content-editor__settings-card">
              <div className="admin-content-editor__section-heading">
                <h3>Visibility &amp; access</h3>
                <span>Backend controlled</span>
              </div>
              <p>
                Student access follows the effective grant and enrollment
                checks. This page does not override access rules.
              </p>
            </section>
            <section className="admin-inspector-section admin-content-editor__settings-card">
              <div className="admin-content-editor__section-heading">
                <h3>Lesson progress</h3>
                <span>Unavailable</span>
              </div>
              <p>
                Progress analytics are not included in the current Admin read
                model.
              </p>
            </section>
          </>
        ) : (
          <section className="admin-inspector-section">
            <h3>Media actions</h3>
            <p>
              Upload, verification, publication, retry, and withdrawal are
              managed in the selected media workflow.
            </p>
            {selectedResource && (
              <button
                type="button"
                onClick={() => onOpenContentLibrary(selectedResource.id)}
              >
                Open lesson in Content Library
              </button>
            )}
          </section>
        )}
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
                  ? workspaceChapter
                  : workspaceLesson;
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
          {editingResource &&
            selectedResource &&
            (selectedResource.kind === "video" ||
              selectedResource.kind === "document") && (
              <p>
                This resource remains Draft in Content Library. Upload,
                verification, and publication are managed from Media Library.
              </p>
            )}
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
                Video and PDF resources start as drafts. Open the resource
                in Media Library to upload, verify, and publish its file.
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
