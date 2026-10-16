import { useMemo, useRef, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Archive, ArrowLeft, ArrowRight, BookOpen, ChevronDown, ChevronRight, FileText, FolderPlus, Layers3, MoreHorizontal, Pencil, Plus, RotateCcw, X } from "lucide-react";
import { AdminV2DomainStatus, useAdminV2 } from "../layout/AdminV2Layout";
import { createStructureRecord, listStructure, updateStructureRecord, type StructureEntity, type StructureItem, type StructureWriteBody } from "../api/adminAcademicApi";
import { ConfirmDialog, FormField, StatusBadge } from "../shared/AdminV2Primitives";
import type { CourseChapter, CourseLesson } from "../types/adminV2.types";

type ArchiveTarget = { kind: StructureEntity; id: string };
type VersionedError = Error & { status?: number; code?: string };

const toBackendStatus = (value: string): StructureItem["status"] => value.toLowerCase() as StructureItem["status"];
const versionConflict = () => Object.assign(new Error("This Course structure changed on the server."), { status: 409, code: "version_conflict" }) as VersionedError;
const isVersionConflict = (error: unknown) => {
  const value = error as VersionedError;
  return value?.status === 409 || /version|conflict/i.test(value?.code ?? "");
};
const errorText = (error: unknown) => error instanceof Error ? error.message : "The Course Builder command failed.";

export function CourseBuilderPage() {
  const { courseId = "" } = useParams();
  const navigate = useNavigate();
  const { data, refreshServerDomains } = useAdminV2();
  const course = data.courses.find((item) => item.id === courseId);
  const allCourseChapters = useMemo(() => data.chapters.filter((item) => item.courseId === courseId), [data.chapters, courseId]);
  const chapters = useMemo(() => allCourseChapters.filter((item) => item.status !== "Archived").sort((a, b) => a.order - b.order), [allCourseChapters]);
  const allCourseLessons = useMemo(() => data.lessons.filter((item) => item.courseId === courseId), [data.lessons, courseId]);
  const [activeChapterId, setActiveChapterId] = useState("");
  const [activeLessonId, setActiveLessonId] = useState("");
  const [openNodeActions, setOpenNodeActions] = useState("");
  const [confirm, setConfirm] = useState<ArchiveTarget | null>(null);
  const [saving, setSaving] = useState(false);
  const [mutationError, setMutationError] = useState("");
  const [mutationNotice, setMutationNotice] = useState("");
  const pendingKeys = useRef(new Map<string, string>());
  const selectedChapter = chapters.find((item) => item.id === activeChapterId);
  const chapter = selectedChapter ?? chapters[0];
  const lessons = allCourseLessons.filter((item) => item.chapterId === chapter?.id && item.status !== "Archived").sort((a, b) => a.order - b.order);
  const selectedLesson = allCourseLessons.find((item) => item.id === activeLessonId && item.status !== "Archived" && item.chapterId === chapter?.id);
  const lesson = selectedLesson ?? (selectedChapter && !activeLessonId ? undefined : lessons[0]);
  const archivedChapters = allCourseChapters.filter((item) => item.status === "Archived").sort((a, b) => a.order - b.order);
  const archivedLessons = allCourseLessons.filter((item) => item.status === "Archived").sort((a, b) => a.order - b.order);
  const totalLessons = allCourseLessons.filter((item) => item.status !== "Archived").length;
  const lessonResources = lesson ? data.contentResources.filter((item) => item.lessonId === lesson.id) : [];
  const commandKey = (signature: string) => {
    const key = pendingKeys.current.get(signature) ?? crypto.randomUUID();
    pendingKeys.current.set(signature, key);
    return key;
  };
  const completeCommandKey = (signature: string) => pendingKeys.current.delete(signature);
  const selectChapter = (id: string) => { setActiveChapterId(id); setActiveLessonId(""); setOpenNodeActions(""); };
  const selectLesson = (item: CourseLesson) => { setActiveChapterId(item.chapterId); setActiveLessonId(item.id); setOpenNodeActions(""); };
  const requestArchive = (kind: StructureEntity, id: string) => { setConfirm({ kind, id }); setOpenNodeActions(""); };

  const brandId = () => {
    if (!course?.brandId) throw new Error("This Course is missing its persisted Brand scope. Reload the catalogue before editing it.");
    return course.brandId;
  };
  const readStructure = () => listStructure(brandId(), course!.id);
  const getCurrentRow = (rows: StructureItem[], id: string, entity: StructureEntity) => {
    const row = rows.find((item) => item.id === id);
    if (!row) throw new Error(`The ${entity === "lessons" ? "lesson" : "chapter"} no longer exists in this Course. The latest structure was reloaded.`);
    const local = entity === "lessons" ? allCourseLessons.find((item) => item.id === id) : allCourseChapters.find((item) => item.id === id);
    if (!local || local.version === undefined) throw new Error("The server version is unavailable. Reload the Course Builder before saving.");
    if (local.version !== row.version) throw versionConflict();
    return row;
  };
  const reconciledRow = async (entity: StructureEntity, id: string, matches: (row: CourseChapter | CourseLesson) => boolean) => {
    const refreshed = await refreshServerDomains();
    if (!refreshed.ok) throw new Error(`The write was accepted by the command endpoint, but the Course Builder could not reload server state: ${refreshed.message}`);
    const row = entity === "lessons" ? refreshed.data.lessons.find((item) => item.id === id) : refreshed.data.chapters.find((item) => item.id === id);
    if (!row || !matches(row)) throw new Error("The server response did not reconcile to the requested Course state. Review the reloaded structure before retrying.");
    return row;
  };
  const runMutation = async (action: () => Promise<string>) => {
    if (saving) return;
    setSaving(true); setMutationError(""); setMutationNotice("");
    try { setMutationNotice(await action()); }
    catch (error) {
      const conflict = isVersionConflict(error);
      const refreshed = await refreshServerDomains();
      const suffix = refreshed.ok ? "Latest server state has been reloaded; review it before retrying." : `The latest server state could not be reloaded: ${refreshed.message}`;
      setMutationError(conflict ? `This item changed after it was loaded. ${suffix}` : `${errorText(error)} ${suffix}`);
    } finally { setSaving(false); }
  };
  const writeUpdate = async (entity: StructureEntity, id: string, body: StructureWriteBody) => {
    const keySignature = `${entity}:${id}:${JSON.stringify(body)}`;
    const updated = await updateStructureRecord(brandId(), course!.id, entity, id, body, commandKey(keySignature));
    completeCommandKey(keySignature);
    return { updated, keySignature };
  };
  const createChapter = () => runMutation(async () => {
    const snapshot = await readStructure();
    const sortOrder = Math.max(0, ...snapshot.chapters.map((item) => item.sortOrder)) + 1;
    const body: StructureWriteBody = { title: `Chapter ${sortOrder}`, sortOrder, status: "draft", reason: "Admin V2 Course Builder: create chapter" };
    const keySignature = `chapters:create:${JSON.stringify(body)}`;
    const id = await createStructureRecord(brandId(), course!.id, "chapters", body, commandKey(keySignature));
    completeCommandKey(keySignature);
    await reconciledRow("chapters", id, (row) => row.title === body.title && row.order === sortOrder && row.status !== "Archived");
    setActiveChapterId(id); setActiveLessonId("");
    return "Chapter created and confirmed by the server.";
  });
  const createLesson = (chapterId: string) => runMutation(async () => {
    const snapshot = await readStructure();
    const parent = snapshot.chapters.find((item) => item.id === chapterId && item.status !== "archived");
    if (!parent) throw new Error("The selected chapter is no longer active. Reload the Course structure.");
    const sortOrder = Math.max(0, ...snapshot.lessons.filter((item) => item.courseChapterId === chapterId).map((item) => item.sortOrder)) + 1;
    const body: StructureWriteBody = { courseChapterId: chapterId, title: `Lesson ${sortOrder}`, sortOrder, status: "draft", reason: "Admin V2 Course Builder: create lesson" };
    const keySignature = `lessons:create:${JSON.stringify(body)}`;
    const id = await createStructureRecord(brandId(), course!.id, "lessons", body, commandKey(keySignature));
    completeCommandKey(keySignature);
    await reconciledRow("lessons", id, (row) => row.title === body.title && (row as CourseLesson).chapterId === chapterId && row.order === sortOrder && row.status !== "Archived");
    setActiveChapterId(chapterId); setActiveLessonId(id);
    return "Lesson created and confirmed by the server.";
  });
  const saveChapter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!chapter || !course) return;
    const title = String(new FormData(event.currentTarget).get("title") ?? "").trim();
    if (!title) { setMutationError("Chapter title is required."); return; }
    void runMutation(async () => {
      const snapshot = await readStructure();
      const current = getCurrentRow(snapshot.chapters, chapter.id, "chapters");
      const body: StructureWriteBody = { title, expectedVersion: current.version, reason: "Admin V2 Course Builder: update chapter title" };
      const result = await writeUpdate("chapters", chapter.id, body);
      const row = await reconciledRow("chapters", chapter.id, (item) => item.title === title && item.version === result.updated.version);
      completeCommandKey(result.keySignature);
      return `Chapter saved at server version ${row.version}.`;
    });
  };
  const saveLesson = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!lesson || !course) return;
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const nextChapterId = String(form.get("chapterId") ?? lesson.chapterId);
    const status = toBackendStatus(String(form.get("status") ?? lesson.status));
    const description = String(form.get("description") ?? "").trim();
    if (!title) { setMutationError("Lesson title is required."); return; }
    if (!chapters.some((item) => item.id === nextChapterId)) { setMutationError("Select an active chapter in this Brand Course."); return; }
    void runMutation(async () => {
      const snapshot = await readStructure();
      const current = getCurrentRow(snapshot.lessons, lesson.id, "lessons");
      const moved = current.courseChapterId !== nextChapterId;
      const sortOrder = moved ? Math.max(0, ...snapshot.lessons.filter((item) => item.courseChapterId === nextChapterId).map((item) => item.sortOrder)) + 1 : current.sortOrder;
      const body: StructureWriteBody = { title, description: description || null, courseChapterId: nextChapterId, status, ...(moved ? { sortOrder } : {}), expectedVersion: current.version, reason: "Admin V2 Course Builder: update lesson metadata" };
      const result = await writeUpdate("lessons", lesson.id, body);
      const row = await reconciledRow("lessons", lesson.id, (item) => item.title === title && (item as CourseLesson).description === description && (item as CourseLesson).chapterId === nextChapterId && item.status === (status === "archived" ? "Archived" : status === "published" ? "Published" : "Draft") && item.version === result.updated.version);
      completeCommandKey(result.keySignature);
      setActiveChapterId(nextChapterId);
      return `Lesson saved at server version ${row.version}.`;
    });
  };
  const reorder = (entity: StructureEntity, step: number) => runMutation(async () => {
    const snapshot = await readStructure();
    const rows = entity === "chapters" ? snapshot.chapters : snapshot.lessons;
    const activeRows = rows.filter((item) => item.status !== "archived").sort((a, b) => a.sortOrder - b.sortOrder);
    const selectedId = entity === "chapters" ? chapter?.id : lesson?.id;
    const index = activeRows.findIndex((item) => item.id === selectedId), neighborIndex = index + step;
    if (index < 0 || neighborIndex < 0 || neighborIndex >= activeRows.length) throw new Error("There is no active item in that direction.");
    const selected = activeRows[index], neighbor = activeRows[neighborIndex];
    getCurrentRow(rows, selected.id, entity); getCurrentRow(rows, neighbor.id, entity);
    const selectedOrder = selected.sortOrder, neighborOrder = neighbor.sortOrder;
    const temporaryOrder = Math.max(0, ...rows.map((item) => item.sortOrder)) + 1;
    const label = entity === "lessons" ? "lesson" : "chapter";
    const updateAtOrder = async (id: string, sortOrder: number, reason: string, expectedVersion: number, previousOrder: number) => {
      const fresh = await readStructure();
      const row = fresh[entity].find((item) => item.id === id);
      if (!row) throw new Error(`The ${label} disappeared during reorder.`);
      if (row.version !== expectedVersion || row.sortOrder !== previousOrder) throw versionConflict();
      const body: StructureWriteBody = { sortOrder, expectedVersion: row.version, reason };
      const result = await writeUpdate(entity, id, body);
      return result.updated;
    };
    try {
      const selectedAtTemporaryPosition = await updateAtOrder(selected.id, temporaryOrder, `Admin V2 Course Builder: reorder ${label} using temporary unique position`, selected.version, selectedOrder);
      await updateAtOrder(neighbor.id, selectedOrder, `Admin V2 Course Builder: reorder ${label} to selected position`, neighbor.version, neighborOrder);
      await updateAtOrder(selected.id, neighborOrder, `Admin V2 Course Builder: finalize ${label} order`, selectedAtTemporaryPosition.version, temporaryOrder);
    } catch (writeError) {
      try {
        const latest = await readStructure();
        const currentSelected = latest[entity].find((item) => item.id === selected.id);
        const currentNeighbor = latest[entity].find((item) => item.id === neighbor.id);
        if (!currentSelected || !currentNeighbor) throw writeError;
        if (currentSelected.sortOrder === neighborOrder && currentNeighbor.sortOrder === selectedOrder) {
          // The last request may have completed even if its response was lost.
        } else if (currentSelected.sortOrder === temporaryOrder && currentNeighbor.sortOrder === selectedOrder) {
          await updateAtOrder(selected.id, neighborOrder, `Admin V2 Course Builder: complete interrupted ${label} reorder`, currentSelected.version, temporaryOrder);
        } else if (currentSelected.sortOrder === temporaryOrder && currentNeighbor.sortOrder === neighborOrder) {
          await updateAtOrder(selected.id, selectedOrder, `Admin V2 Course Builder: restore interrupted ${label} reorder`, currentSelected.version, temporaryOrder);
          throw writeError;
        } else {
          throw writeError;
        }
      } catch (recoveryError) {
        if (recoveryError === writeError) throw writeError;
        throw new Error(`${errorText(writeError)} Reorder recovery also failed: ${errorText(recoveryError)}`);
      }
    }
    const refreshed = await refreshServerDomains();
    if (!refreshed.ok) throw new Error(`Reorder command completed, but the Builder could not reload server state: ${refreshed.message}`);
    const finalRows = entity === "chapters" ? refreshed.data.chapters : refreshed.data.lessons;
    if (finalRows.find((item) => item.id === selected.id)?.order !== neighborOrder || finalRows.find((item) => item.id === neighbor.id)?.order !== selectedOrder) throw new Error("The server order did not match the requested reorder. Review the reloaded structure.");
    return `${label[0].toUpperCase()}${label.slice(1)} order saved and confirmed by the server.`;
  });
  const archiveSelected = () => {
    if (!confirm || !course) return;
    const target = confirm;
    void runMutation(async () => {
      const snapshot = await readStructure();
      if (target.kind === "chapters") {
        const current = getCurrentRow(snapshot.chapters, target.id, target.kind);
        if (snapshot.lessons.some((item) => item.courseChapterId === target.id && item.status !== "archived")) throw new Error("Archive the chapter's active lessons first. Existing lessons and their history will be retained.");
        const body: StructureWriteBody = { status: "archived", expectedVersion: current.version, reason: "Admin V2 Course Builder: archive chapter" };
        const result = await writeUpdate(target.kind, target.id, body);
        const row = await reconciledRow(target.kind, target.id, (item) => item.status === "Archived" && item.version === result.updated.version);
        completeCommandKey(result.keySignature);
        setActiveChapterId(""); setActiveLessonId(""); setConfirm(null);
        return `Chapter archived at server version ${row.version}; its records are retained.`;
      }
      const current = getCurrentRow(snapshot.lessons, target.id, target.kind);
      const body: StructureWriteBody = { status: "archived", expectedVersion: current.version, reason: "Admin V2 Course Builder: archive lesson" };
      const result = await writeUpdate(target.kind, target.id, body);
      const row = await reconciledRow(target.kind, target.id, (item) => item.status === "Archived" && item.version === result.updated.version);
      completeCommandKey(result.keySignature);
      setActiveLessonId(""); setConfirm(null);
      return `Lesson archived at server version ${row.version}; resources and progress references are retained.`;
    });
  };
  const restore = (entity: StructureEntity, id: string) => runMutation(async () => {
    const snapshot = await readStructure();
    const current = snapshot[entity].find((item) => item.id === id);
    if (!current || current.status !== "archived") throw new Error("This record is no longer archived. The latest structure was reloaded.");
    if (entity === "lessons" && snapshot.chapters.find((item) => item.id === current.courseChapterId)?.status === "archived") throw new Error("Restore the parent chapter before restoring this lesson.");
    const local = entity === "lessons" ? allCourseLessons.find((item) => item.id === id) : allCourseChapters.find((item) => item.id === id);
    if (!local || local.version === undefined || local.version !== current.version) throw versionConflict();
    const body: StructureWriteBody = { status: "draft", expectedVersion: current.version, reason: `Admin V2 Course Builder: restore archived ${entity === "lessons" ? "lesson" : "chapter"} as draft` };
    const result = await writeUpdate(entity, id, body);
    const row = await reconciledRow(entity, id, (item) => item.status === "Active" || item.status === "Draft");
    if (row.version !== result.updated.version) throw new Error("The restored item version did not match the server response.");
    completeCommandKey(result.keySignature);
    if (entity === "chapters") { setActiveChapterId(id); setActiveLessonId(""); }
    else { setActiveChapterId(current.courseChapterId ?? ""); setActiveLessonId(id); }
    return `${entity === "lessons" ? "Lesson" : "Chapter"} restored as draft and confirmed by the server.`;
  });

  if (!course) return <section className="admin-v2__page"><AdminV2DomainStatus /><div className="v2-empty"><strong>Course not found</strong><span>This course may have been removed from the current catalogue.</span><button className="admin-v2__button" onClick={() => navigate("/admin/courses")}><ArrowLeft size={14} /> Back to courses</button></div></section>;

  return <section className="admin-v2__page admin-v2__builder">
    <AdminV2DomainStatus />
    {mutationError && <div className="admin-v2__inline-notice" role="alert">{mutationError}</div>}
    {mutationNotice && !mutationError && <div className="admin-v2__inline-notice" role="status">{mutationNotice}</div>}
    <div className="v2-workspace-toolbar"><div><span className="v2-overline">COURSE STRUCTURE · {course.brand.toUpperCase()}</span><h2>{course.title}</h2><p>Curriculum mapping and teaching structure are managed separately. Changes apply only to this Brand Course.</p></div><div><button className="admin-v2__button" onClick={() => navigate("/admin/courses")}><ArrowLeft size={14} /> Courses</button><button className="admin-v2__button is-primary" onClick={createChapter} disabled={saving || course.status === "Archived" || !course.brandId}><FolderPlus size={15} /> Add chapter</button></div></div>
    <div className="v2-builder-grid">
      <section className="v2-phase-panel v2-builder-tree">
        <header><div><span className="v2-overline">STRUCTURE</span><h3>Chapters & lessons</h3></div><span className="v2-count">{chapters.length}</span></header>
        <div className="v2-tree-scroll">
          <div className="v2-tree-course"><BookOpen size={16} /><span><strong>{course.title}</strong><small>{chapters.length} chapters · {totalLessons} lessons</small></span></div>
          {chapters.map((item) => {
            const children = allCourseLessons.filter((entry) => entry.chapterId === item.id && entry.status !== "Archived").sort((a, b) => a.order - b.order);
            const open = item.id === (chapter?.id ?? "");
            return <div className={`v2-tree-chapter${open ? " is-active" : ""}`} key={item.id}>
              <div className="v2-tree-node-row">
                <button className="v2-tree-chapter__label" aria-expanded={open} title={`Select ${item.title} to edit chapter details`} onClick={() => selectChapter(item.id)}><ChevronDown size={14} /><Layers3 size={15} /><span>{item.title}<small>{children.length} lessons</small></span></button>
                <div className="v2-tree-node-actions">
                  <button type="button" className="v2-tree-node-actions__trigger" aria-label={`Actions for chapter ${item.title}`} aria-controls={`chapter-actions-${item.id}`} aria-expanded={openNodeActions === `chapters:${item.id}`} onClick={() => setOpenNodeActions((current) => current === `chapters:${item.id}` ? "" : `chapters:${item.id}`)}><MoreHorizontal size={16} /></button>
                  {openNodeActions === `chapters:${item.id}` && <div id={`chapter-actions-${item.id}`} className="v2-tree-node-actions__menu" aria-label={`Chapter actions for ${item.title}`}>
                    <button type="button" onClick={() => selectChapter(item.id)}><Pencil size={13} />Edit chapter</button>
                    <button type="button" className="is-danger" disabled={saving || children.length > 0} title={children.length ? "Archive the active lessons first; history will be retained." : "Remove this chapter from the active course; it can be restored."} onClick={() => requestArchive("chapters", item.id)}><Archive size={13} />Archive chapter</button>
                    {children.length > 0 && <small>Archive the active lessons first. Their history is preserved.</small>}
                  </div>}
                </div>
              </div>
              {open && <div className="v2-tree-lessons">{children.map((child) => <div className="v2-tree-node-row v2-tree-node-row--lesson" key={child.id}>
                <button title={`Select ${child.title} to edit lesson details`} aria-pressed={lesson?.id === child.id} className={`v2-tree-lesson${lesson?.id === child.id ? " is-selected" : ""}`} onClick={() => selectLesson(child)}><FileText size={14} /><span>{child.title}</span><i className={child.status === "Published" ? "is-published" : ""} /></button>
                <div className="v2-tree-node-actions">
                  <button type="button" className="v2-tree-node-actions__trigger" aria-label={`Actions for lesson ${child.title}`} aria-controls={`lesson-actions-${child.id}`} aria-expanded={openNodeActions === `lessons:${child.id}`} onClick={() => setOpenNodeActions((current) => current === `lessons:${child.id}` ? "" : `lessons:${child.id}`)}><MoreHorizontal size={16} /></button>
                  {openNodeActions === `lessons:${child.id}` && <div id={`lesson-actions-${child.id}`} className="v2-tree-node-actions__menu" aria-label={`Lesson actions for ${child.title}`}>
                    <button type="button" onClick={() => selectLesson(child)}><Pencil size={13} />Edit lesson</button>
                    <button type="button" className="is-danger" disabled={saving} title="Remove this lesson from the active course; resources and progress history are retained." onClick={() => requestArchive("lessons", child.id)}><Archive size={13} />Archive lesson</button>
                  </div>}
                </div>
              </div>)}<button className="v2-tree-add" onClick={() => createLesson(item.id)} disabled={saving}><Plus size={13} /> Add lesson</button></div>}
            </div>;
          })}
          {!chapters.length && <div className="v2-empty"><Layers3 size={21} /><strong>No active course structure</strong><span>Add a chapter, or restore one from the archived records below.</span></div>}
        </div>
        {(archivedChapters.length > 0 || archivedLessons.length > 0) && <details className="v2-tree-archived"><summary>Archived records ({archivedChapters.length + archivedLessons.length})</summary><div>
          {archivedChapters.map((item) => <p key={item.id}><span>Chapter · {item.title}</span><button type="button" className="admin-v2__button" onClick={() => restore("chapters", item.id)} disabled={saving}><RotateCcw size={13} /> Restore as draft</button></p>)}
          {archivedLessons.map((item) => <p key={item.id}><span>Lesson · {item.title}</span><button type="button" className="admin-v2__button" onClick={() => restore("lessons", item.id)} disabled={saving || archivedChapters.some((chapterItem) => chapterItem.id === item.chapterId)} title={archivedChapters.some((chapterItem) => chapterItem.id === item.chapterId) ? "Restore the parent chapter first" : "Restore lesson as draft"}><RotateCcw size={13} /> Restore as draft</button></p>)}
        </div></details>}
      </section>
      <section className="v2-phase-panel v2-builder-editor">
        {lesson ? <form className="v2-editor-form" onSubmit={saveLesson}>
          <nav className="v2-editor-breadcrumb" aria-label="Course structure"><span>{course.title}</span><ChevronRight size={13} /><span>{chapter?.title}</span><ChevronRight size={13} /><strong>{lesson.title}</strong></nav>
          <header className="v2-editor-header"><div><span className="v2-overline">SELECTED LESSON</span><h2>{lesson.title}</h2></div><StatusBadge status={lesson.status} /></header>
          <div className="v2-editor-fields">
            <section className="v2-editor-group"><h3>BASIC INFORMATION</h3><div className="v2-editor-group__fields"><FormField label="Lesson title" wide><input name="title" required defaultValue={lesson.title} key={lesson.id + lesson.title} /></FormField><FormField label="Lesson description" wide><textarea name="description" rows={4} maxLength={2000} defaultValue={lesson.description} key={lesson.id + lesson.description} placeholder="Write a concise lesson summary." /></FormField></div></section>
            <section className="v2-editor-group"><h3>ORDER / STRUCTURE</h3><div className="v2-editor-group__fields"><FormField label="Chapter" wide><select name="chapterId" defaultValue={lesson.chapterId} key={lesson.id + lesson.chapterId}>{chapters.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></FormField></div></section>
            <section className="v2-editor-group"><h3>PUBLISHING</h3><div className="v2-editor-group__fields"><FormField label="Lesson status"><select name="status" defaultValue={lesson.status.toLowerCase()} key={lesson.id + lesson.status}><option value="draft">Draft</option><option value="published">Published</option></select></FormField><FormField label="Visibility"><select disabled defaultValue="unavailable"><option value="unavailable">Unavailable in current API</option></select></FormField><FormField label="Release mode"><select disabled defaultValue="unavailable"><option value="unavailable">Unavailable in current API</option></select></FormField><FormField label="Release date"><input type="date" disabled value="" readOnly /></FormField></div></section>
          </div>
          <section className="v2-lesson-summary"><div><span>CHAPTER</span><strong>{chapter?.title ?? "—"}</strong></div><div><span>POSITION</span><strong>Lesson {lesson.order}</strong></div><div><span>UPDATED</span><strong>{lesson.updatedAt}</strong></div><div><span>RESOURCES</span><strong>{lessonResources.length}</strong></div><button type="button" onClick={() => navigate(`/admin/content?courseId=${course.id}&lessonId=${lesson.id}`)}>Manage in Content <ArrowRight size={14} /></button></section>
          <footer className="v2-editor-footer"><button type="button" className="admin-v2__button is-danger" onClick={() => setConfirm({ kind: "lessons", id: lesson.id })} disabled={saving}><X size={14} /> Archive lesson</button><button type="submit" className="admin-v2__button is-primary" disabled={saving || lesson.version === undefined}>{saving ? "Saving…" : "Save lesson"}</button></footer>
        </form> : chapter ? <form className="v2-editor-form" onSubmit={saveChapter}>
          <header><div><span className="v2-overline">CHAPTER {chapter.order}</span><h2>Chapter details</h2></div></header>
          <div className="v2-editor-fields"><FormField label="Chapter title" wide><input name="title" required defaultValue={chapter.title} key={chapter.id + chapter.title} /></FormField><p className="v2-editor-note">{lessons.length ? "Lessons in this chapter appear in Course Builder and Content. Video and PDF resources are managed in Content." : "No lessons in this chapter yet. Add one from the structure tree."}</p></div>
          <footer className="v2-editor-footer"><button type="button" className="admin-v2__button is-danger" onClick={() => setConfirm({ kind: "chapters", id: chapter.id })} disabled={saving || lessons.length > 0} title={lessons.length ? "Archive the active lessons first; chapter history will be retained." : "Archive this chapter while preserving its history."}><X size={14} /> Archive chapter</button><button type="submit" className="admin-v2__button is-primary" disabled={saving || chapter.version === undefined}>{saving ? "Saving…" : "Save chapter"}</button></footer>
        </form> : <div className="v2-empty"><FileText size={21} /><strong>Select a lesson</strong><span>Choose a lesson from the structure tree.</span></div>}
      </section>
      <aside className="v2-phase-panel v2-builder-inspector">
        <header><div><span className="v2-overline">STRUCTURE SUMMARY</span><h3>Course metadata</h3></div></header>
        <div className="v2-builder-inspector__body">
          <div className="v2-summary-card"><BookOpen size={17} /><div><strong>{course.title}</strong><small>{course.scope} course · {course.brand.toUpperCase()}</small></div></div>
          <dl className="v2-detail-grid"><div><dt>Chapters</dt><dd>{chapters.length}</dd></div><div><dt>Active lessons</dt><dd>{totalLessons}</dd></div><div><dt>Selected chapter</dt><dd>{chapter?.title ?? "None"}</dd></div><div><dt>Selected lesson</dt><dd>{lesson?.title ?? "None"}</dd></div><div><dt>Resources</dt><dd>{lessonResources.length}</dd></div></dl>
          {chapter && <div className="v2-order-actions"><strong>Chapter order</strong><button className="admin-v2__button" onClick={() => reorder("chapters", -1)} title="Move chapter up" disabled={saving || chapters.findIndex((item) => item.id === chapter.id) <= 0}><ChevronDown size={14} className="is-up" /> Move up</button><button className="admin-v2__button" onClick={() => reorder("chapters", 1)} title="Move chapter down" disabled={saving || chapters.findIndex((item) => item.id === chapter.id) === chapters.length - 1}><ChevronDown size={14} /> Move down</button></div>}
          {lesson && <div className="v2-order-actions"><strong>Lesson order</strong><button className="admin-v2__button" onClick={() => reorder("lessons", -1)} title="Move lesson up" disabled={saving || lessons.findIndex((item) => item.id === lesson.id) <= 0}><ChevronDown size={14} className="is-up" /> Move up</button><button className="admin-v2__button" onClick={() => reorder("lessons", 1)} title="Move lesson down" disabled={saving || lessons.findIndex((item) => item.id === lesson.id) === lessons.length - 1}><ChevronDown size={14} /> Move down</button></div>}
          {!chapter && <p className="v2-helper-note">A lesson is separate from its Video and PDF resources. Build structure here, attach files in Content.</p>}
        </div>
      </aside>
    </div>
    {confirm && <ConfirmDialog title={`Archive this ${confirm.kind === "lessons" ? "lesson" : "chapter"}?`} detail={confirm.kind === "chapters" ? "The chapter can be archived only after its active lessons are archived. Records and history remain in the server." : "The lesson leaves active structure; its resources, progress, and historical references remain preserved."} confirmLabel={`Archive ${confirm.kind === "lessons" ? "lesson" : "chapter"}`} pending={saving} onCancel={() => setConfirm(null)} onConfirm={archiveSelected} />}
  </section>;
}
