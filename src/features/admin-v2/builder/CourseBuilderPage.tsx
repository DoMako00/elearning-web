import { useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, ChevronDown, ChevronRight, FileText, FolderPlus, Layers3, Plus, X } from "lucide-react";
import { AdminV2DomainStatus, useAdminV2 } from "../layout/AdminV2Layout";
import { createStructureRecord, listBrandAccess } from "../api/adminAcademicApi";
import { ConfirmDialog, FormField, StatusBadge } from "../shared/AdminV2Primitives";
import type { CourseLesson } from "../types/adminV2.types";

export function CourseBuilderPage() {
  const { courseId = "" } = useParams();
  const navigate = useNavigate();
  const { data, setData, refreshServerDomains, reportDomainError } = useAdminV2();
  const course = data.courses.find((item) => item.id === courseId);
  const chapters = useMemo(() => data.chapters.filter((item) => item.courseId === courseId && item.status === "Active").sort((a, b) => a.order - b.order), [data.chapters, courseId]);
  const [activeChapterId, setActiveChapterId] = useState("");
  const [activeLessonId, setActiveLessonId] = useState("");
  const [confirm, setConfirm] = useState<{ kind: "chapter" | "lesson"; id: string } | null>(null);
  const chapter = chapters.find((item) => item.id === activeChapterId) ?? chapters[0];
  const lessons = data.lessons.filter((item) => item.chapterId === chapter?.id && item.status !== "Archived").sort((a, b) => a.order - b.order);
  const lesson = data.lessons.find((item) => item.id === activeLessonId && item.status !== "Archived") ?? lessons[0];
  const totalLessons = data.lessons.filter((item) => item.courseId === courseId && item.status !== "Archived").length;
  const lessonResources = lesson ? data.contentResources.filter((item) => item.lessonId === lesson.id) : [];

  const createChapter = async () => {
    if (!course) return;
    try { const brandId = course.brandId ?? (await listBrandAccess()).find((item) => item.code === course.brand)?.id; if (!brandId) throw new Error("The Course Brand is unavailable."); const id = await createStructureRecord(brandId, courseId, "chapters", { title: `Chapter ${chapters.length + 1}`, sortOrder: chapters.length + 1, status: "draft", reason: "Create Course Builder chapter" }); refreshServerDomains(); setActiveChapterId(id); setActiveLessonId(""); } catch (error) { reportDomainError(error instanceof Error ? error.message : "Chapter could not be saved."); }
  };
  const createLesson = async (chapterId: string) => {
    const order = data.lessons.filter((item) => item.chapterId === chapterId && item.status !== "Archived").length + 1;
    if (!course) return;
    try { const brandId = course.brandId ?? (await listBrandAccess()).find((item) => item.code === course.brand)?.id; if (!brandId) throw new Error("The Course Brand is unavailable."); const id = await createStructureRecord(brandId, courseId, "lessons", { courseChapterId: chapterId, title: `Lesson ${order}`, sortOrder: order, status: "draft", reason: "Create Course Builder lesson" }); refreshServerDomains(); setActiveChapterId(chapterId); setActiveLessonId(id); } catch (error) { reportDomainError(error instanceof Error ? error.message : "Lesson could not be saved."); }
  };
  const saveChapter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!chapter) return;
    const title = String(new FormData(event.currentTarget).get("title") ?? "").trim();
    setData((current) => ({ ...current, chapters: current.chapters.map((item) => item.id === chapter.id ? { ...item, title, updatedAt: new Date().toLocaleDateString() } : item) }));
  };
  const saveLesson = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!lesson) return;
    const form = new FormData(event.currentTarget);
    const updated: CourseLesson = { ...lesson, title: String(form.get("title") ?? "").trim(), description: String(form.get("description") ?? "").trim(), chapterId: String(form.get("chapterId") ?? lesson.chapterId), status: String(form.get("status")) as CourseLesson["status"], releaseMode: lesson.deliverySettingsAvailable === false ? lesson.releaseMode : String(form.get("releaseMode")) as CourseLesson["releaseMode"], releaseAt: lesson.deliverySettingsAvailable === false ? lesson.releaseAt : String(form.get("releaseAt") ?? "") || null, visibility: lesson.deliverySettingsAvailable === false ? lesson.visibility : String(form.get("visibility")) as CourseLesson["visibility"], updatedAt: new Date().toLocaleDateString() };
    setData((current) => {
      const moved = updated.chapterId !== lesson.chapterId;
      const nextOrder = moved ? current.lessons.filter((item) => item.chapterId === updated.chapterId && item.status !== "Archived").length + 1 : lesson.order;
      return { ...current, lessons: current.lessons.map((item) => item.id === lesson.id ? { ...updated, order: nextOrder } : moved && item.chapterId === lesson.chapterId && item.order > lesson.order ? { ...item, order: item.order - 1 } : item) };
    });
    setActiveChapterId(updated.chapterId);
  };
  const reorder = (kind: "chapter" | "lesson", step: number) => setData((current) => {
    const list = kind === "chapter" ? current.chapters.filter((item) => item.courseId === courseId && item.status === "Active").sort((a, b) => a.order - b.order) : current.lessons.filter((item) => item.chapterId === lesson?.chapterId && item.status !== "Archived").sort((a, b) => a.order - b.order);
    const selectedId = kind === "chapter" ? chapter?.id : lesson?.id;
    const index = list.findIndex((item) => item.id === selectedId), other = index + step;
    if (index < 0 || other < 0 || other >= list.length) return current;
    const first = list[index], second = list[other];
    return kind === "chapter" ? { ...current, chapters: current.chapters.map((item) => item.id === first.id ? { ...item, order: second.order } : item.id === second.id ? { ...item, order: first.order } : item) } : { ...current, lessons: current.lessons.map((item) => item.id === first.id ? { ...item, order: second.order } : item.id === second.id ? { ...item, order: first.order } : item) };
  });
  const archiveSelected = () => {
    if (!confirm) return;
    setData((current) => confirm.kind === "chapter" ? { ...current, chapters: current.chapters.map((item) => item.id === confirm.id ? { ...item, status: "Archived" } : item) } : { ...current, lessons: current.lessons.map((item) => item.id === confirm.id ? { ...item, status: "Archived" } : item) });
    if (confirm.kind === "chapter") { setActiveChapterId(""); setActiveLessonId(""); } else setActiveLessonId("");
    setConfirm(null);
  };

  if (!course) return <section className="admin-v2__page"><AdminV2DomainStatus /><div className="v2-empty"><strong>Course not found</strong><span>This course may have been removed from the current catalogue.</span><button className="admin-v2__button" onClick={() => navigate("/admin/courses")}><ArrowLeft size={14} /> Back to courses</button></div></section>;

  return <section className="admin-v2__page admin-v2__builder">
    <AdminV2DomainStatus />
    <div className="v2-workspace-toolbar"><div><span className="v2-overline">COURSE STRUCTURE</span><h2>{course.title}</h2><p>Curriculum mapping and teaching structure are managed separately.</p></div><div><button className="admin-v2__button" onClick={() => navigate("/admin/courses")}><ArrowLeft size={14} /> Courses</button><button className="admin-v2__button is-primary" onClick={createChapter} disabled={course.status === "Archived"}><FolderPlus size={15} /> Add chapter</button></div></div>
    <div className="v2-builder-grid">
      <section className="v2-phase-panel v2-builder-tree">
        <header><div><span className="v2-overline">STRUCTURE</span><h3>Chapters & lessons</h3></div><span className="v2-count">{chapters.length}</span></header>
        <div className="v2-tree-scroll">
          <div className="v2-tree-course"><BookOpen size={16} /><span><strong>{course.title}</strong><small>{chapters.length} chapters Â· {totalLessons} lessons</small></span></div>
          {chapters.map((item) => {
            const children = data.lessons.filter((entry) => entry.chapterId === item.id && entry.status !== "Archived").sort((a, b) => a.order - b.order);
            const open = item.id === (chapter?.id ?? "");
            return <div className={`v2-tree-chapter${open ? " is-active" : ""}`} key={item.id}>
              <button className="v2-tree-chapter__label" aria-expanded={open} title={`Select ${item.title}`} onClick={() => { setActiveChapterId(item.id); setActiveLessonId(""); }}><ChevronDown size={14} /><Layers3 size={15} /><span>{item.title}<small>{children.length} lessons</small></span></button>
              {open && <div className="v2-tree-lessons">{children.map((child) => <button key={child.id} title={`Select ${child.title}`} aria-pressed={lesson?.id === child.id} className={`v2-tree-lesson${lesson?.id === child.id ? " is-selected" : ""}`} onClick={() => setActiveLessonId(child.id)}><FileText size={14} /><span>{child.title}</span><i className={child.status === "Published" ? "is-published" : ""} /></button>)}<button className="v2-tree-add" onClick={() => createLesson(item.id)}><Plus size={13} /> Add lesson</button></div>}
            </div>;
          })}
          {!chapters.length && <div className="v2-empty"><Layers3 size={21} /><strong>No course structure</strong><span>Add a chapter, then define its lessons.</span></div>}
        </div>
      </section>
      <section className="v2-phase-panel v2-builder-editor">
        {lesson ? <form className="v2-editor-form" onSubmit={saveLesson}>
          <nav className="v2-editor-breadcrumb" aria-label="Course structure"><span>{course.title}</span><ChevronRight size={13} /><span>{chapter?.title}</span><ChevronRight size={13} /><strong>{lesson.title}</strong></nav>
          <header className="v2-editor-header"><div><span className="v2-overline">SELECTED LESSON</span><h2>{lesson.title}</h2></div><StatusBadge status={lesson.status} /></header>
          <div className="v2-editor-fields">
            <section className="v2-editor-group"><h3>BASIC INFORMATION</h3><div className="v2-editor-group__fields"><FormField label="Lesson title" wide><input name="title" required defaultValue={lesson.title} key={lesson.id + lesson.title} /></FormField><FormField label="Description" wide><textarea name="description" rows={4} defaultValue={lesson.description} key={lesson.id + lesson.description} placeholder="Describe what students will learn in this lesson." /></FormField></div></section>
            <section className="v2-editor-group"><h3>ORDER / STRUCTURE</h3><div className="v2-editor-group__fields"><FormField label="Chapter" wide><select name="chapterId" defaultValue={lesson.chapterId} key={lesson.id + lesson.chapterId}>{chapters.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></FormField></div></section>
            <section className="v2-editor-group"><h3>PUBLISHING</h3><div className="v2-editor-group__fields"><FormField label="Lesson status"><select name="status" defaultValue={lesson.status} key={lesson.id + lesson.status}><option>Draft</option><option>Published</option></select></FormField><FormField label="Visibility"><select name="visibility" disabled={lesson.deliverySettingsAvailable === false} defaultValue={lesson.deliverySettingsAvailable === false ? "unavailable" : lesson.visibility} key={lesson.id + lesson.visibility}><option>Visible</option><option>Hidden</option><option value="unavailable">Unavailable in current API</option></select></FormField><FormField label="Release mode"><select name="releaseMode" disabled={lesson.deliverySettingsAvailable === false} defaultValue={lesson.deliverySettingsAvailable === false ? "unavailable" : lesson.releaseMode} key={lesson.id + lesson.releaseMode}><option>Immediate</option><option>Scheduled</option><option value="unavailable">Unavailable in current API</option></select></FormField><FormField label="Release date"><input type="date" name="releaseAt" disabled={lesson.deliverySettingsAvailable === false} defaultValue={lesson.releaseAt ?? ""} key={lesson.id + lesson.releaseAt} /></FormField></div></section>
          </div>
          <section className="v2-lesson-summary"><div><span>CHAPTER</span><strong>{chapter?.title ?? "â€”"}</strong></div><div><span>POSITION</span><strong>Lesson {lesson.order}</strong></div><div><span>UPDATED</span><strong>{lesson.updatedAt}</strong></div><div><span>RESOURCES</span><strong>{lessonResources.length}</strong></div><button type="button" onClick={() => navigate(`/admin/content?courseId=${course.id}&lessonId=${lesson.id}`)}>Manage in Content <ArrowRight size={14} /></button></section>
          <footer className="v2-editor-footer"><button type="button" className="admin-v2__button is-danger" onClick={() => setConfirm({ kind: "lesson", id: lesson.id })}><X size={14} /> Archive lesson</button><button type="submit" className="admin-v2__button is-primary">Save lesson</button></footer>
        </form> : chapter ? <form className="v2-editor-form" onSubmit={saveChapter}>
          <header><div><span className="v2-overline">CHAPTER {chapter.order}</span><h2>Chapter details</h2></div></header>
          <div className="v2-editor-fields"><FormField label="Chapter title" wide><input name="title" required defaultValue={chapter.title} key={chapter.id + chapter.title} /></FormField><p className="v2-editor-note">{lessons.length ? "Lessons in this chapter appear in Course Builder and Content. Video and PDF resources are managed in Content." : "No lessons in this chapter yet. Add one from the structure tree."}</p></div>
          <footer className="v2-editor-footer"><button type="button" className="admin-v2__button is-danger" onClick={() => setConfirm({ kind: "chapter", id: chapter.id })}><X size={14} /> Archive chapter</button><button type="submit" className="admin-v2__button is-primary">Save chapter</button></footer>
        </form> : <div className="v2-empty"><FileText size={21} /><strong>Select a lesson</strong><span>Choose a lesson from the structure tree.</span></div>}
      </section>
      <aside className="v2-phase-panel v2-builder-inspector">
        <header><div><span className="v2-overline">STRUCTURE SUMMARY</span><h3>Course metadata</h3></div></header>
        <div className="v2-builder-inspector__body">
          <div className="v2-summary-card"><BookOpen size={17} /><div><strong>{course.title}</strong><small>{course.scope} course</small></div></div>
          <dl className="v2-detail-grid"><div><dt>Chapters</dt><dd>{chapters.length}</dd></div><div><dt>Active lessons</dt><dd>{totalLessons}</dd></div><div><dt>Selected chapter</dt><dd>{chapter?.title ?? "None"}</dd></div><div><dt>Selected lesson</dt><dd>{lesson?.title ?? "None"}</dd></div><div><dt>Resources</dt><dd>{lessonResources.length}</dd></div></dl>
          {chapter && <div className="v2-order-actions"><strong>Chapter order</strong><button className="admin-v2__button" onClick={() => reorder("chapter", -1)} title="Move chapter up"><ChevronDown size={14} className="is-up" /> Move up</button><button className="admin-v2__button" onClick={() => reorder("chapter", 1)} title="Move chapter down"><ChevronDown size={14} /> Move down</button></div>}
          {lesson && <div className="v2-order-actions"><strong>Lesson order</strong><button className="admin-v2__button" onClick={() => reorder("lesson", -1)} title="Move lesson up"><ChevronDown size={14} className="is-up" /> Move up</button><button className="admin-v2__button" onClick={() => reorder("lesson", 1)} title="Move lesson down"><ChevronDown size={14} /> Move down</button></div>}
          {!chapter && <p className="v2-helper-note">A lesson is separate from its Video and PDF resources. Build structure here, attach files in Content.</p>}
        </div>
      </aside>
    </div>
    {confirm && <ConfirmDialog title={`Archive this ${confirm.kind}?`} detail={confirm.kind === "chapter" ? "The chapter and its lessons remain in local records but are hidden from active structure." : "The lesson and its resources remain in local records but the lesson leaves the active structure."} confirmLabel={`Archive ${confirm.kind}`} onCancel={() => setConfirm(null)} onConfirm={archiveSelected} />}
  </section>;
}
