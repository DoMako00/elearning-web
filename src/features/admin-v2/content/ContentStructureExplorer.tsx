import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Archive, BookOpen, ChevronDown, ChevronRight, FileText, FolderPlus, Layers3, Pencil, Plus, RotateCcw, Video } from "lucide-react";
import { createStructureRecord, listStructure, updateStructureRecord, type StructureEntity, type StructureWriteBody } from "../api/adminAcademicApi";
import { useAdminV2 } from "../layout/AdminV2Layout";
import { ConfirmDialog, Drawer, FormActions, FormField } from "../shared/AdminV2Primitives";
import type { CourseChapter, CourseLesson, CourseRecord } from "../types/adminV2.types";

type StructureKind = "chapters" | "lessons";
type StructureEditor = { mode: "create" | "edit"; kind: StructureKind; id?: string; parentChapterId?: string } | null;
type ArchiveTarget = { kind: StructureKind; id: string } | null;
type VersionedError = Error & { status?: number; code?: string };

const conflictError = (error: unknown) => {
  const value = error as VersionedError;
  return value?.status === 409 || /version|conflict/i.test(value?.code ?? "");
};

export function ContentStructureExplorer({
  course,
  availableCourses,
  courseId,
  brandLabel,
  chapters,
  lessons,
  selectedLessonId,
  onSelectCourse,
  onSelectLesson,
}: {
  course: CourseRecord | undefined;
  availableCourses: CourseRecord[];
  courseId: string;
  brandLabel: string;
  chapters: CourseChapter[];
  lessons: CourseLesson[];
  selectedLessonId: string;
  onSelectCourse: (id: string) => void;
  onSelectLesson: (id: string) => void;
}) {
  const { data, refreshServerDomains } = useAdminV2();
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(() => new Set(chapters.map((item) => item.id)));
  const [courseExpanded, setCourseExpanded] = useState(true);
  const [editor, setEditor] = useState<StructureEditor>(null);
  const [archiveTarget, setArchiveTarget] = useState<ArchiveTarget>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [parentChapterId, setParentChapterId] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const pendingKeys = useRef(new Map<string, string>());

  const allChapters = useMemo(() => data.chapters.filter((item) => item.courseId === course?.id), [data.chapters, course?.id]);
  const allLessons = useMemo(() => data.lessons.filter((item) => item.courseId === course?.id), [data.lessons, course?.id]);
  const archivedChapters = allChapters.filter((item) => item.status === "Archived").sort((a, b) => a.order - b.order);
  const archivedLessons = allLessons.filter((item) => item.status === "Archived").sort((a, b) => a.order - b.order);

  useEffect(() => setExpandedChapters(new Set(chapters.map((item) => item.id))), [course?.id, chapters]);

  const requestKey = (signature: string) => {
    const key = pendingKeys.current.get(signature) ?? crypto.randomUUID();
    pendingKeys.current.set(signature, key);
    return key;
  };
  const completeRequest = (signature: string) => pendingKeys.current.delete(signature);

  const currentApiStructure = async () => {
    if (!course?.brandId || !course.id) throw new Error("The selected Brand Course is unavailable. Reload the Content Library.");
    return listStructure(course.brandId, course.id);
  };

  const reloadAndVerify = async (kind: StructureKind, id: string, matches: (item: CourseChapter | CourseLesson) => boolean) => {
    const refreshed = await refreshServerDomains();
    if (!refreshed.ok) throw new Error(`The server accepted the command, but the latest structure could not be loaded: ${refreshed.message}`);
    const rows = kind === "chapters" ? refreshed.data.chapters : refreshed.data.lessons;
    const item = rows.find((entry) => entry.id === id);
    if (!item || !matches(item)) throw new Error("The server response did not match the requested structure. Review the reloaded course before retrying.");
    return item;
  };

  const openEditor = (next: NonNullable<StructureEditor>) => {
    const current = next.id
      ? next.kind === "chapters" ? allChapters.find((item) => item.id === next.id) : allLessons.find((item) => item.id === next.id)
      : undefined;
    setMessage("");
    setNotice("");
    setTitle(current?.title ?? (next.kind === "chapters" ? "New chapter" : "New lesson"));
    setDescription(next.kind === "lessons" && current ? (current as CourseLesson).description : "");
    setParentChapterId(next.parentChapterId ?? (next.kind === "lessons" && current ? (current as CourseLesson).chapterId : chapters[0]?.id ?? ""));
    setEditor(next);
  };

  const saveStructure = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editor || !course || pending) return;
    const cleanTitle = title.trim();
    if (!cleanTitle) { setMessage("Enter a title before saving."); return; }
    if (editor.kind === "lessons" && !chapters.some((item) => item.id === parentChapterId)) { setMessage("Choose an active parent chapter for this lesson."); return; }
    setPending(true);
    setMessage("");
    setNotice("");
    try {
      const snapshot = await currentApiStructure();
      const entity: StructureEntity = editor.kind;
      const rows = snapshot[entity];
      let id = editor.id;
      let signature = "";
      let responseVersion: number | undefined;
      let expectedVersion: number | undefined;
      let sortOrder: number | undefined;

      if (editor.mode === "create") {
        const activeParent = editor.kind === "lessons" ? snapshot.chapters.find((item) => item.id === parentChapterId && item.status !== "archived") : undefined;
        if (editor.kind === "lessons" && !activeParent) throw new Error("The selected parent chapter is no longer active. Reload the structure.");
        const siblings = editor.kind === "chapters" ? snapshot.chapters : snapshot.lessons.filter((item) => item.courseChapterId === parentChapterId);
        sortOrder = Math.max(0, ...siblings.map((item) => item.sortOrder)) + 1;
        const body: StructureWriteBody = editor.kind === "chapters"
          ? { title: cleanTitle, sortOrder, status: "draft", reason: "Admin Content Library: create chapter" }
          : { title: cleanTitle, description: description.trim() || null, courseChapterId: parentChapterId, sortOrder, status: "draft", reason: "Admin Content Library: create lesson" };
        signature = `${entity}:create:${JSON.stringify(body)}`;
        id = await createStructureRecord(course.brandId!, course.id, entity, body, requestKey(signature));
      } else {
        const current = rows.find((item) => item.id === editor.id);
        if (!current) throw new Error("This item no longer exists in the selected Brand Course.");
        expectedVersion = current.version;
        const fields: StructureWriteBody = editor.kind === "chapters"
          ? { title: cleanTitle, expectedVersion, reason: "Admin Content Library: update chapter title" }
          : { title: cleanTitle, description: description.trim() || null, courseChapterId: parentChapterId, expectedVersion, reason: "Admin Content Library: update lesson metadata" };
        if (editor.kind === "lessons" && current.courseChapterId !== parentChapterId) {
          sortOrder = Math.max(0, ...snapshot.lessons.filter((item) => item.courseChapterId === parentChapterId).map((item) => item.sortOrder)) + 1;
          fields.sortOrder = sortOrder;
        }
        signature = `${entity}:${current.id}:${JSON.stringify(fields)}`;
        const updated = await updateStructureRecord(course.brandId!, course.id, entity, current.id, fields, requestKey(signature));
        id = updated.id;
        responseVersion = updated.version;
      }

      if (!id) throw new Error("The server did not return a persisted record ID.");
      const desiredParent = editor.kind === "lessons" ? parentChapterId : undefined;
      const row = await reloadAndVerify(editor.kind, id, (item) => item.title === cleanTitle
        && item.status !== "Archived"
        && (editor.kind === "lessons" && desiredParent ? (item as CourseLesson).chapterId === desiredParent : true)
        && (editor.kind === "lessons" ? (item as CourseLesson).description === (description.trim() || "") : true));
      if (responseVersion !== undefined && row.version !== responseVersion) throw new Error("The reloaded item version differs from the server command response. Review the latest structure.");
      completeRequest(signature);
      setEditor(null);
      if (editor.kind === "chapters") setExpandedChapters((current) => new Set(current).add(id!));
      else {
        setExpandedChapters((current) => new Set(current).add(desiredParent!));
        onSelectLesson(id);
      }
      setNotice(`${editor.kind === "chapters" ? "Chapter" : "Lesson"} saved and confirmed by the server.`);
      setMessage("");
      void row;
    } catch (error) {
      const refreshed = await refreshServerDomains();
      const latest = refreshed.ok ? "Latest server state has been reloaded." : `Latest server state could not be reloaded: ${refreshed.message}`;
      setMessage(`${conflictError(error) ? "This item changed on the server. " : `${error instanceof Error ? error.message : "The structure change failed."} `}${latest}`);
    } finally {
      setPending(false);
    }
  };

  const archive = async () => {
    if (!archiveTarget || !course || pending) return;
    setPending(true);
    setMessage("");
    setNotice("");
    try {
      const snapshot = await currentApiStructure();
      const rows = snapshot[archiveTarget.kind];
      const current = rows.find((item) => item.id === archiveTarget.id);
      if (!current || current.status === "archived") throw new Error("This item is already archived or no longer exists.");
      if (archiveTarget.kind === "chapters" && snapshot.lessons.some((item) => item.courseChapterId === current.id && item.status !== "archived")) {
        throw new Error("Archive the chapter’s active lessons first. The chapter remains their parent.");
      }
      const body: StructureWriteBody = { status: "archived", expectedVersion: current.version, reason: `Admin Content Library: archive ${archiveTarget.kind === "chapters" ? "chapter" : "lesson"}` };
      const signature = `${archiveTarget.kind}:${current.id}:${JSON.stringify(body)}`;
      const updated = await updateStructureRecord(course.brandId!, course.id, archiveTarget.kind, current.id, body, requestKey(signature));
      const kind = archiveTarget.kind;
      const row = await reloadAndVerify(kind, current.id, (item) => item.status === "Archived");
      if (row.version !== updated.version) throw new Error("The reloaded archive version differs from the server command response.");
      completeRequest(signature);
      setArchiveTarget(null);
      if (kind === "lessons" && selectedLessonId === current.id) onSelectLesson("");
      setNotice(`${kind === "chapters" ? "Chapter" : "Lesson"} archived. Its records and history remain preserved.`);
    } catch (error) {
      const refreshed = await refreshServerDomains();
      setArchiveTarget(null);
      setMessage(`${conflictError(error) ? "This item changed on the server. " : `${error instanceof Error ? error.message : "The archive command failed."} `}${refreshed.ok ? "Latest server state has been reloaded." : `Latest server state could not be reloaded: ${refreshed.message}`}`);
    } finally {
      setPending(false);
    }
  };

  const restore = async (kind: StructureKind, id: string) => {
    if (!course || pending) return;
    setPending(true);
    setMessage("");
    setNotice("");
    try {
      const snapshot = await currentApiStructure();
      const current = snapshot[kind].find((item) => item.id === id && item.status === "archived");
      if (!current) throw new Error("This item is no longer archived. Reload the structure.");
      if (kind === "lessons" && snapshot.chapters.find((item) => item.id === current.courseChapterId)?.status === "archived") throw new Error("Restore the parent chapter first, then restore this lesson.");
      const body: StructureWriteBody = { status: "draft", expectedVersion: current.version, reason: `Admin Content Library: restore ${kind === "chapters" ? "chapter" : "lesson"} as draft` };
      const signature = `${kind}:${id}:${JSON.stringify(body)}`;
      const updated = await updateStructureRecord(course.brandId!, course.id, kind, id, body, requestKey(signature));
      const row = await reloadAndVerify(kind, id, (item) => item.status !== "Archived");
      if (row.version !== updated.version) throw new Error("The reloaded restore version differs from the server command response.");
      completeRequest(signature);
      if (kind === "chapters") setExpandedChapters((value) => new Set(value).add(id));
      if (kind === "lessons") onSelectLesson(id);
      setNotice(`${kind === "chapters" ? "Chapter" : "Lesson"} restored as a draft.`);
    } catch (error) {
      const refreshed = await refreshServerDomains();
      setMessage(`${conflictError(error) ? "This item changed on the server. " : `${error instanceof Error ? error.message : "The restore command failed."} `}${refreshed.ok ? "Latest server state has been reloaded." : `Latest server state could not be reloaded: ${refreshed.message}`}`);
    } finally {
      setPending(false);
    }
  };

  const activeEditorItem = editor?.id
    ? editor.kind === "chapters" ? allChapters.find((item) => item.id === editor.id) : allLessons.find((item) => item.id === editor.id)
    : undefined;
  const chapterWithActiveLessons = (id: string) => lessons.some((item) => item.chapterId === id);
  const toggleChapter = (id: string) => setExpandedChapters((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return <>
    <header className="v2-content-tree__header">
      <div><span className="v2-overline">COURSE LIBRARY</span><h3>Course structure</h3></div>
      <div className="v2-content-tree__header-actions"><span className="v2-count">{chapters.length}</span><button type="button" className="v2-structure-icon-button" aria-label="Create chapter at course root" title="Create chapter" disabled={!course || pending || course.status === "Archived"} onClick={() => openEditor({ mode: "create", kind: "chapters" })}><FolderPlus size={15} /></button></div>
    </header>
    <label className="v2-tree-filter"><span>Course <small>{brandLabel}</small></span><select value={courseId} onChange={(event) => onSelectCourse(event.target.value)}><option value="">Select course</option>{availableCourses.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
    {message && <p className="v2-structure-feedback is-error" role="alert">{message}</p>}
    {notice && !message && <p className="v2-structure-feedback" role="status">{notice}</p>}
    <div className="v2-tree-scroll v2-content-tree__scroll">
      {course && <>
        <button type="button" className="v2-content-course-node" aria-expanded={courseExpanded} title={courseExpanded ? "Collapse course" : "Expand course"} onClick={() => setCourseExpanded((expanded) => !expanded)}>
          <BookOpen size={17} /><span><strong>{course.title}</strong><small>{chapters.length} chapters <i /> {lessons.length} lessons</small></span><ChevronDown className={courseExpanded ? "" : "is-collapsed"} size={15} />
        </button>
        {courseExpanded && chapters.map((item) => {
          const chapterLessons = lessons.filter((entry) => entry.chapterId === item.id).sort((a, b) => a.order - b.order);
          const expanded = expandedChapters.has(item.id);
          return <section className={["v2-content-chapter", selectedLessonId && chapterLessons.some((child) => child.id === selectedLessonId) ? "is-active" : ""].join(" ")} key={item.id}>
            <div className="v2-content-chapter__row">
              <button type="button" className="v2-content-chapter__toggle" aria-expanded={expanded} title={expanded ? "Collapse chapter" : "Expand chapter"} onClick={() => toggleChapter(item.id)}>
                <ChevronRight className={expanded ? "is-expanded" : ""} size={14} /><Layers3 size={15} /><span><strong>{item.title}</strong><small>{chapterLessons.length} lessons</small></span>
              </button>
              <div className="v2-structure-node-actions" aria-label={`Actions for chapter ${item.title}`}>
                <button type="button" className="v2-structure-icon-button" aria-label={`Add lesson to ${item.title}`} title="Add lesson under this chapter" disabled={pending || course.status === "Archived"} onClick={() => openEditor({ mode: "create", kind: "lessons", parentChapterId: item.id })}><Plus size={13} /></button>
                <button type="button" className="v2-structure-icon-button" aria-label={`Rename chapter ${item.title}`} title="Rename chapter" disabled={pending} onClick={() => openEditor({ mode: "edit", kind: "chapters", id: item.id })}><Pencil size={13} /></button>
                <button type="button" className="v2-structure-icon-button is-danger" aria-label={`Archive chapter ${item.title}`} title={chapterWithActiveLessons(item.id) ? "Archive active lessons first" : "Archive chapter"} disabled={pending || chapterWithActiveLessons(item.id)} onClick={() => setArchiveTarget({ kind: "chapters", id: item.id })}><Archive size={13} /></button>
              </div>
            </div>
            {expanded && <div className="v2-content-chapter__lessons">{chapterLessons.map((child) => {
              const childResources = data.contentResources.filter((resource) => resource.lessonId === child.id);
              const LessonIcon = childResources.some((resource) => resource.type === "Video") ? Video : FileText;
              return <div className={["v2-content-lesson-node", selectedLessonId === child.id ? "is-selected" : ""].join(" ")} key={child.id}>
                <button type="button" className="v2-tree-lesson v2-content-tree-lesson" aria-pressed={selectedLessonId === child.id} aria-current={selectedLessonId === child.id ? "true" : undefined} title={`Select ${child.title}`} onClick={() => onSelectLesson(child.id)}>
                  <LessonIcon size={14} /><span>{child.title}</span><i className={child.status === "Published" ? "is-published" : ""} title={child.status} />
                </button>
                <div className="v2-structure-node-actions" aria-label={`Actions for lesson ${child.title}`}>
                  <button type="button" className="v2-structure-icon-button" aria-label={`Edit lesson ${child.title}`} title="Edit lesson" disabled={pending} onClick={() => openEditor({ mode: "edit", kind: "lessons", id: child.id })}><Pencil size={13} /></button>
                  <button type="button" className="v2-structure-icon-button is-danger" aria-label={`Archive lesson ${child.title}`} title="Archive lesson" disabled={pending} onClick={() => setArchiveTarget({ kind: "lessons", id: child.id })}><Archive size={13} /></button>
                </div>
              </div>;
            })}</div>}
          </section>;
        })}
      </>}
      {course && !chapters.length && <div className="v2-empty"><Layers3 size={21} /><strong>No active chapters</strong><span>Create a chapter here, then add lessons inside it.</span></div>}
      {!course && <div className="v2-empty"><Layers3 size={21} /><strong>Select a course</strong><span>Choose a course to view its chapter and lesson structure.</span></div>}
      {(archivedChapters.length > 0 || archivedLessons.length > 0) && <details className="v2-content-archived"><summary>Archived structure ({archivedChapters.length + archivedLessons.length})</summary>
        {archivedChapters.map((item) => <div key={item.id}><span><Layers3 size={13} /> Chapter · {item.title}</span><button type="button" className="v2-structure-icon-button" aria-label={`Restore chapter ${item.title} as draft`} title="Restore as draft" disabled={pending} onClick={() => void restore("chapters", item.id)}><RotateCcw size={13} /></button></div>)}
        {archivedLessons.map((item) => <div key={item.id}><span><FileText size={13} /> Lesson · {item.title}</span><button type="button" className="v2-structure-icon-button" aria-label={`Restore lesson ${item.title} as draft`} title={archivedChapters.some((chapter) => chapter.id === item.chapterId) ? "Restore the parent chapter first" : "Restore as draft"} disabled={pending || archivedChapters.some((chapter) => chapter.id === item.chapterId)} onClick={() => void restore("lessons", item.id)}><RotateCcw size={13} /></button></div>)}
      </details>}
    </div>
    {editor && <Drawer title={`${editor.mode === "create" ? "Create" : "Edit"} ${editor.kind === "chapters" ? "chapter" : "lesson"}`} subtitle={editor.kind === "chapters" ? `${course?.title ?? "Course"} · chapter is a top-level parent` : `${course?.title ?? "Course"} · lesson belongs to one chapter`} onClose={() => { if (!pending) setEditor(null); }} footer={<FormActions><button type="button" className="admin-v2__button" disabled={pending} onClick={() => setEditor(null)}>Cancel</button><button type="submit" form="content-structure-form" className="admin-v2__button is-primary" disabled={pending}>{pending ? "Saving…" : "Save"}</button></FormActions>}>
      <form id="content-structure-form" className="admin-v2__form" onSubmit={(event) => void saveStructure(event)}>
        <FormField label={`${editor.kind === "chapters" ? "Chapter" : "Lesson"} title`} wide><input autoFocus maxLength={240} required value={title} onChange={(event) => setTitle(event.target.value)} /></FormField>
        {editor.kind === "lessons" && <>
          <FormField label={editor.mode === "create" ? "Parent chapter" : "Move under chapter"} wide><select value={parentChapterId} onChange={(event) => setParentChapterId(event.target.value)} disabled={editor.mode === "create" && Boolean(editor.parentChapterId)} required>{chapters.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></FormField>
          <FormField label="Lesson description · optional" wide><textarea rows={4} maxLength={2000} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Add a concise, neutral summary." /></FormField>
        </>}
        {editor.mode === "create" && <p className="admin-v2__form-note">New structure is saved as a draft. It does not publish content or grant Student access.</p>}
        {activeEditorItem && <p className="admin-v2__form-note">Server record · version {activeEditorItem.version}. Changes are saved to this Brand Course only.</p>}
        {message && <p className="v2-structure-feedback is-error" role="alert">{message}</p>}
      </form>
    </Drawer>}
    {archiveTarget && <ConfirmDialog title={`Archive this ${archiveTarget.kind === "chapters" ? "chapter" : "lesson"}?`} detail={archiveTarget.kind === "chapters" ? "A chapter can be archived only after its active lessons are archived. Records and history remain preserved." : "The lesson leaves active structure; its resources, progress, and historical references remain preserved."} confirmLabel="Archive" pending={pending} onCancel={() => { if (!pending) setArchiveTarget(null); }} onConfirm={() => void archive()} />}
  </>;
}
