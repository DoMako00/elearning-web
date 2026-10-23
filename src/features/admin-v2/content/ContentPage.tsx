import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Archive, BookOpen, CalendarClock, ChevronRight, Eye, ExternalLink, FileText, FolderOpen, HardDrive, MoreHorizontal, Pencil, Play, Search, Settings2, Upload, Video } from "lucide-react";
import { AdminV2DomainStatus, useAdminV2 } from "../layout/AdminV2Layout";
import { ContentStructureExplorer } from "./ContentStructureExplorer";
import { ConfirmDialog, Drawer, FormActions, FormField, StatusBadge } from "../shared/AdminV2Primitives";
import type { ContentResource, ContentResourceType, CourseChapter, CourseLesson, CourseRecord } from "../types/adminV2.types";
import { listBrandAccess, listCourses, listStructure } from "../api/adminAcademicApi";
import { archiveLessonResource, configureVideoViewLimit, createLessonResource, createMediaAsset, listLessonMedia, listLessonResources, updateLessonResource, uploadAndVerifyMedia } from "../api/adminContentApi";
import { ContentReviewQueue } from "./ContentReviewQueue";

type ContentTab = "Resources" | "Details";
type ResourceAction = "preview" | "edit" | "publish" | "archive";
type Editor = { kind: "upload" } | { kind: "edit"; id: string } | null;
type LibraryTab = "Content Library" | "Media Library";
type MediaResourceEntry = { item: ContentResource; lesson: CourseLesson; chapter: CourseChapter | undefined; course: CourseRecord };

export function ContentPage() {
  const [searchParams] = useSearchParams();
  const { data, brand, workspace, refreshServerDomains, reportDomainError } = useAdminV2();
  const [courseId, setCourseId] = useState(searchParams.get("courseId") ?? data.courses[0]?.id ?? "");
  const [lessonId, setLessonId] = useState(searchParams.get("lessonId") ?? "");
  const [resourceId, setResourceId] = useState("");
  const [tab, setTab] = useState<ContentTab>("Resources");
  const [libraryTab, setLibraryTab] = useState<LibraryTab>("Content Library");
  const [mediaSearch, setMediaSearch] = useState("");
  const [mediaType, setMediaType] = useState<"all" | ContentResourceType>("all");
  const [mediaStatus, setMediaStatus] = useState<"active" | "all" | ContentResource["status"]>("active");
  const [mediaCourse, setMediaCourse] = useState("all");
  const [mediaResourceId, setMediaResourceId] = useState("");
  const [editor, setEditor] = useState<Editor>(null);
  const [type, setType] = useState<ContentResourceType>("Video");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [confirmId, setConfirmId] = useState("");
  const [actionMenuId, setActionMenuId] = useState("");
  const [mutationPending, setMutationPending] = useState(false);
  const previewUrls: Record<string, string> = {};
  const availableCourses = useMemo(() => data.courses.filter((item) => item.status !== "Archived" && (brand === "all" || item.brand === brand)), [brand, data.courses]);
  const course = availableCourses.find((item) => item.id === courseId);
  const chapters = useMemo(() => data.chapters.filter((item) => item.courseId === courseId && item.status === "Active").sort((a, b) => a.order - b.order), [data.chapters, courseId]);
  const activeLessons = useMemo(() => data.lessons.filter((item) => item.courseId === courseId && item.status !== "Archived"), [data.lessons, courseId]);
  const lessons = chapters.flatMap((item) => activeLessons.filter((child) => child.chapterId === item.id).sort((a, b) => a.order - b.order));
  const lesson = lessons.find((item) => item.id === lessonId) ?? lessons[0];
  const chapter = lesson ? chapters.find((item) => item.id === lesson.chapterId) : undefined;
  const resources = data.contentResources.filter((item) => item.lessonId === lesson?.id && item.status !== "Archived" && item.status !== "Withdrawn").sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const allMediaResources = useMemo<MediaResourceEntry[]>(() => data.contentResources.map((item) => {
    const mediaLesson = data.lessons.find((entry) => entry.id === item.lessonId);
    const mediaCourse = mediaLesson ? data.courses.find((entry) => entry.id === mediaLesson.courseId) : undefined;
    const mediaChapter = mediaLesson ? data.chapters.find((entry) => entry.id === mediaLesson.chapterId) : undefined;
    return mediaLesson && mediaCourse && (brand === "all" || mediaCourse.brand === brand) ? { item, lesson: mediaLesson, chapter: mediaChapter, course: mediaCourse } : null;
  }).filter((entry): entry is MediaResourceEntry => Boolean(entry)), [brand, data.chapters, data.contentResources, data.courses, data.lessons]);
  const filteredMediaResources = useMemo(() => {
    const query = mediaSearch.trim().toLowerCase();
    return allMediaResources.filter(({ item, lesson: mediaLesson, chapter: mediaChapter, course: mediaCourseRecord }) => {
      const matchesQuery = !query || [item.title, item.fileName, item.description, mediaLesson.title, mediaChapter?.title, mediaCourseRecord.title].some((value) => value?.toLowerCase().includes(query));
      const matchesStatus = mediaStatus === "all" || (mediaStatus === "active" ? item.status !== "Archived" && item.status !== "Withdrawn" : item.status === mediaStatus);
      return matchesQuery && (mediaType === "all" || item.type === mediaType) && matchesStatus && (mediaCourse === "all" || mediaCourseRecord.id === mediaCourse);
    });
  }, [allMediaResources, mediaCourse, mediaSearch, mediaStatus, mediaType]);
  const selectedMediaEntry = allMediaResources.find((entry) => entry.item.id === mediaResourceId);
  const selectedResource = libraryTab === "Media Library" ? selectedMediaEntry?.item : resources.find((item) => item.id === resourceId);
  const resourceTypes = Array.from(new Set(resources.map((item) => item.type)));
  const editingResource = editor?.kind === "edit" ? data.contentResources.find((item) => item.id === editor.id) : undefined;

  useEffect(() => {
    if (libraryTab === "Media Library" && !selectedMediaEntry && filteredMediaResources[0]) setMediaResourceId(filteredMediaResources[0].item.id);
  }, [filteredMediaResources, libraryTab, selectedMediaEntry]);
  useEffect(() => {
    if (availableCourses.some((item) => item.id === courseId)) return;
    const nextCourse = availableCourses[0];
    setCourseId(nextCourse?.id ?? "");
    const firstChapter = data.chapters.filter((item) => item.courseId === nextCourse?.id && item.status === "Active").sort((a, b) => a.order - b.order)[0];
    const firstLesson = data.lessons.filter((item) => item.chapterId === firstChapter?.id && item.status !== "Archived").sort((a, b) => a.order - b.order)[0];
    setLessonId(firstLesson?.id ?? "");
    setResourceId("");
  }, [availableCourses, courseId, data.chapters, data.lessons]);
  useEffect(() => {
    if (mediaCourse !== "all" && !availableCourses.some((item) => item.id === mediaCourse)) setMediaCourse("all");
  }, [availableCourses, mediaCourse]);
  useEffect(() => {
    const nextCourseId = searchParams.get("courseId");
    if (!nextCourseId) return;
    setCourseId(nextCourseId);
    setLessonId(searchParams.get("lessonId") ?? "");
    setResourceId("");
  }, [searchParams]);

  const selectCourse = (nextId: string) => {
    setCourseId(nextId);
    setMediaCourse(nextId || "all");
    const firstChapter = data.chapters.filter((item) => item.courseId === nextId && item.status === "Active").sort((a, b) => a.order - b.order)[0];
    const firstLesson = data.lessons.filter((item) => item.chapterId === firstChapter?.id && item.status !== "Archived").sort((a, b) => a.order - b.order)[0];
    setLessonId(firstLesson?.id ?? "");
    setResourceId("");
  };
  const selectMediaCourse = (nextId: string) => {
    setMediaCourse(nextId);
    if (nextId !== "all") selectCourse(nextId);
  };
  const selectLesson = (id: string) => { setLessonId(id); setResourceId(""); setActionMenuId(""); };
  const openMediaLesson = (entry: MediaResourceEntry) => {
    setCourseId(entry.course.id);
    setLessonId(entry.lesson.id);
    setResourceId(entry.item.id);
    setLibraryTab("Content Library");
    setTab("Resources");
    setActionMenuId("");
  };
  const openUpload = (nextFile?: File) => {
    const extension = nextFile?.name.split(".").pop()?.toLowerCase();
    setType(nextFile && (nextFile.type === "application/pdf" || extension === "pdf") ? "PDF" : "Video");
    setFile(nextFile ?? null);
    setError("");
    setEditor({ kind: "upload" });
  };
  const resolveResourceScope = async (item: ContentResource) => {
    const courseRecord = data.courses.find((candidate) => candidate.id === item.courseId) ?? data.courses.find((candidate) => data.lessons.some((candidateLesson) => candidateLesson.id === item.lessonId && candidateLesson.courseId === candidate.id));
    if (!courseRecord) throw new Error("The resource's Course is not available in the current Admin scope.");
    const brands = await listBrandAccess();
    const apiBrand = brands.find((candidate) => candidate.id === courseRecord.brandId);
    if (!apiBrand) throw new Error("The resource's Brand is unavailable or outside your Admin scope.");
    const apiCourses = await listCourses(apiBrand.id);
    const apiCourse = apiCourses.find((candidate) => candidate.id === courseRecord.id);
    if (!apiCourse) throw new Error("The Course is no longer available.");
    const structure = await listStructure(apiBrand.id, apiCourse.id);
    const apiLesson = structure.lessons.find((candidate) => candidate.id === item.lessonId);
    const apiChapter = structure.chapters.find((candidate) => candidate.id === apiLesson?.courseChapterId);
    const resource = (await listLessonResources(apiBrand.id, apiCourse.id)).find((candidate) => candidate.id === item.id);
    if (!apiLesson || !apiChapter || !resource) throw new Error("The Lesson Resource no longer exists in the current Course structure.");
    return { scope: { brand: apiBrand, course: apiCourse, chapter: apiChapter, lesson: apiLesson }, resource };
  };
  const submitResource = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mutationPending) return;
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    if (editor?.kind === "edit" && editingResource) {
      if (description) { setError("Descriptions are not persisted by the current Lesson Resource API. The title is the only editable text field."); return; }
      setMutationPending(true);
      try { const { scope, resource } = await resolveResourceScope(editingResource); await updateLessonResource(scope, resource, { title }); refreshServerDomains(); setEditor(null); }
      catch (cause) { refreshServerDomains(); setError(cause instanceof Error ? cause.message : "The resource could not be updated."); }
      finally { setMutationPending(false); }
      return;
    }
    if (!lesson) return;
    if (!file) { setError("Choose a local file to continue."); return; }
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const valid = type === "PDF" ? extension === "pdf" || file.type === "application/pdf" : file.type === "mp4" || file.type === "video/mp4" || extension === "mp4";
    if (!valid) { setError(type === "PDF" ? "Choose a PDF file." : "Choose a supported video file."); return; }
    const videoDurationSeconds = type === "Video" ? Number(form.get("videoDurationSeconds")) : undefined;
    const maxCompletedViews = type === "Video" ? Number(form.get("maxCompletedViews") ?? 3) : undefined;
    if (type === "Video" && (!Number.isSafeInteger(videoDurationSeconds) || videoDurationSeconds! < 1 || videoDurationSeconds! > 86400 || !Number.isSafeInteger(maxCompletedViews) || maxCompletedViews! < 1 || maxCompletedViews! > 100)) { setError("Enter a video duration in seconds and a completed-view limit from 1 to 100."); return; }
    setMutationPending(true);
    try {
      const courseRecord = data.courses.find((candidate) => candidate.id === courseId);
      if (!courseRecord) throw new Error("Select a Course before uploading.");
      const brands = await listBrandAccess();
      const apiBrand = brands.find((candidate) => candidate.id === courseRecord.brandId);
      if (!apiBrand) throw new Error("The Course Brand is unavailable or outside your Admin scope.");
      const apiCourse = (await listCourses(apiBrand.id)).find((candidate) => candidate.id === courseRecord.id);
      const structure = apiCourse ? await listStructure(apiBrand.id, apiCourse.id) : undefined;
      const apiLesson = structure?.lessons.find((candidate) => candidate.id === lesson.id);
      const apiChapter = structure?.chapters.find((candidate) => candidate.id === apiLesson?.courseChapterId);
      if (!apiCourse || !apiLesson || !apiChapter) throw new Error("The selected Lesson is no longer available.");
      const scope = { brand: apiBrand, course: apiCourse, chapter: apiChapter, lesson: apiLesson };
      const existingResources = await listLessonResources(apiBrand.id, apiCourse.id);
      const nextSortOrder = existingResources
        .filter((resource) => resource.courseLessonId === apiLesson.id)
        .reduce((highest, resource) => Math.max(highest, resource.sortOrder), 0) + 1;
      const resourceId = await createLessonResource(scope, title || file.name.replace(/\.[^.]+$/, ""), nextSortOrder, type === "PDF" ? "document" : "video");
      const inventory = await listLessonMedia(scope);
      const asset = await createMediaAsset(scope, resourceId, title || file.name.replace(/\.[^.]+$/, ""), file, videoDurationSeconds, maxCompletedViews);
      await uploadAndVerifyMedia(scope, asset, file, inventory.uploadPolicy);
      setResourceId(resourceId);
      setFile(null);
      setEditor(null);
      refreshServerDomains();
    } catch (cause) { refreshServerDomains(); setError(cause instanceof Error ? cause.message : "The upload could not be completed."); }
    finally { setMutationPending(false); }
  };
  const saveRelease = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    reportDomainError("Lesson release scheduling is not available in the current mounted Admin API. No local change was saved.");
  };
  const setLessonVisibility = (visibility: CourseLesson["visibility"]) => {
    if (lesson && visibility !== lesson.visibility) reportDomainError("Lesson visibility is read-only because no mounted visibility mutation is available. No local change was saved.");
  };
  const archiveResource = async (id: string) => {
    if (mutationPending) return;
    const item = data.contentResources.find((resource) => resource.id === id);
    if (!item) return;
    setMutationPending(true);
    try {
      const { scope, resource } = await resolveResourceScope(item);
      const inventory = await listLessonMedia(scope);
      const assets = inventory.assets.filter((candidate) => candidate.resourceId === resource.id);
      if (item.mediaAssetId && !assets.some((candidate) => candidate.id === item.mediaAssetId)) throw new Error("The linked media asset is not available in this course. Nothing was archived.");
      await archiveLessonResource(scope, resource, assets);
      refreshServerDomains();
      if (resourceId === id) setResourceId("");
      if (mediaResourceId === id) setMediaResourceId("");
      setConfirmId("");
    }
    catch (cause) { reportDomainError(cause instanceof Error ? cause.message : "The resource could not be archived."); }
    finally { setMutationPending(false); }
  };
  const runResourceAction = async (action: ResourceAction, item: ContentResource) => {
    if (mutationPending) return;
    setActionMenuId("");
    if (action === "preview") reportDomainError("Protected media preview requires Student authorization; no Admin preview URL is available.");
    if (action === "edit") setEditor({ kind: "edit", id: item.id });
    if (action === "publish") {
      reportDomainError("Student access is published only when a Super Admin approves the Instructor's submitted content version in the review queue.");
    }
    if (action === "archive") setConfirmId(item.id);
  };
  const saveVideoConfiguration = async (item: ContentResource, videoDurationSeconds: number, maxCompletedViews: number, reason: string) => {
    if (mutationPending || !item.mediaAssetId || !Number.isSafeInteger(item.mediaVersion) || !reason.trim()) return;
    setMutationPending(true);
    try {
      const { scope } = await resolveResourceScope(item);
      await configureVideoViewLimit(scope, { id: item.mediaAssetId, version: item.mediaVersion! }, { videoDurationSeconds, maxCompletedViews, reason });
      refreshServerDomains();
    } catch (cause) { reportDomainError(cause instanceof Error ? cause.message : "Video playback settings could not be saved."); }
    finally { setMutationPending(false); }
  };
  return <section className="admin-v2__page admin-v2__content-page">
    <AdminV2DomainStatus />
    {workspace.workspace === "super_admin" && <ContentReviewQueue />}
    <nav className="v2-phase-tabs v2-content-tabs" aria-label="Content sections">
      <button type="button" className={libraryTab === "Content Library" ? "is-active" : ""} aria-current={libraryTab === "Content Library" ? "page" : undefined} onClick={() => setLibraryTab("Content Library")}><FolderOpen size={15} />Content Library</button>
      <button type="button" className={libraryTab === "Media Library" ? "is-active" : ""} aria-current={libraryTab === "Media Library" ? "page" : undefined} onClick={() => setLibraryTab("Media Library")}><HardDrive size={15} />Media Library</button>
    </nav>
    {libraryTab === "Content Library" ? <div className="v2-content-grid">
      <section className="v2-phase-panel v2-content-tree">
        <ContentStructureExplorer course={course} availableCourses={availableCourses} courseId={courseId} brandLabel={brand === "all" ? "All brands" : brand} chapters={chapters} lessons={lessons} selectedLessonId={lesson?.id ?? ""} onSelectCourse={selectCourse} onSelectLesson={selectLesson} />
      </section>
      <section className="v2-phase-panel v2-content-main">
        {lesson && course ? <>
          <div className="v2-content-breadcrumb"><span>{course.title}</span><ChevronRight size={14} /><span>{chapter?.title}</span><ChevronRight size={14} /><strong>{lesson.title}</strong></div>
          <header className="v2-content-lesson-head">
            <div className="v2-content-lesson-identity"><span className="v2-overline">SELECTED LESSON</span><h2>{lesson.title}</h2><div className="v2-content-lesson-meta"><StatusBadge status={lesson.status} /><span className="v2-content-meta-label">Lesson</span>{resourceTypes.map((resourceType) => <span className={"v2-content-type-chip is-" + resourceType.toLowerCase()} key={resourceType}>{resourceType}</span>)}<span className="v2-content-updated">Updated {lesson.updatedAt}</span></div></div>
            <Link className="admin-v2__button v2-content-builder-link" to={"/admin/courses/" + course.id + "/builder"}><FolderOpen size={14} />Open in Course Builder</Link>
          </header>
          <div className="v2-content-subtabs" role="tablist" aria-label="Lesson content views">
            <button type="button" role="tab" aria-selected={tab === "Resources"} className={tab === "Resources" ? "is-active" : ""} onClick={() => setTab("Resources")}>Resources <span>{resources.length}</span></button>
            <button type="button" role="tab" aria-selected={tab === "Details"} className={tab === "Details" ? "is-active" : ""} onClick={() => setTab("Details")}>Details</button>
            <button type="button" role="tab" disabled title="Not included in this phase">Settings</button>
            <button type="button" role="tab" disabled title="No lesson analytics are available locally">Analytics</button>
          </div>
          {tab === "Resources" ? <>
            <div className="v2-resource-toolbar"><div><h3>Lesson Resources</h3><span>Instructor files stay private until a submitted version is approved below.</span></div></div>
            <div className="v2-resource-columns" aria-hidden="true"><span>Resource</span><span>Type</span><span>Duration / pages</span><span>Status</span><span>Actions</span></div>
            <div className="v2-resource-list">
              {resources.map((item) => <ResourceRow key={item.id} item={item} selected={selectedResource?.id === item.id} previewUrl={previewUrls[item.id]} menuOpen={actionMenuId === item.id} onSelect={() => setResourceId(item.id)} onToggleMenu={() => setActionMenuId((current) => current === item.id ? "" : item.id)} onAction={(action) => runResourceAction(action, item)} />)}
              {!resources.length && <div className="v2-empty v2-resource-empty"><FileText size={22} /><strong>No resources attached</strong><span>Upload a Video or PDF to start this lesson's library.</span></div>}
            </div>
            <div className="v2-empty v2-resource-empty"><Upload size={20}/><strong>Uploads are managed by the Instructor</strong><span>Submitted lesson files will appear here. Review and approval happen above.</span></div>
          </> : <div className="v2-content-details"><h3>Lesson details</h3><p>{lesson.description || "No lesson description has been added yet."}</p><dl className="v2-detail-grid"><div><dt>Course</dt><dd>{course.title}</dd></div><div><dt>Chapter</dt><dd>{chapter?.title}</dd></div><div><dt>Lesson order</dt><dd>{lesson.order}</dd></div><div><dt>Status</dt><dd><StatusBadge status={lesson.status} /></dd></div></dl></div>}
        </> : <div className="v2-empty"><FolderOpen size={22} /><strong>Select a lesson</strong><span>Choose a course with an active chapter and lesson to manage resources.</span>{course && <Link className="admin-v2__button" to={"/admin/courses/" + course.id + "/builder"}>Open Course Builder</Link>}</div>}
      </section>
      <aside className="v2-phase-panel v2-content-settings">
        <form className="v2-content-schedule" onSubmit={saveRelease}>
          <header><CalendarClock size={17} /><h3>Scheduling &amp; Release</h3></header>
          {lesson ? <>
            <input type="hidden" name="visibility" value={lesson.visibility} />
            <FormField label="Release mode"><select name="releaseMode" defaultValue={lesson.releaseMode} key={lesson.id + lesson.releaseMode}><option>Immediate</option><option>Scheduled</option></select></FormField>
            <FormField label="Release date"><input name="releaseAt" type="datetime-local" defaultValue={lesson.releaseAt ?? ""} key={lesson.id + lesson.releaseAt} /></FormField>
            <div className="v2-content-release-state"><span className={lesson.releaseMode === "Scheduled" ? "is-scheduled" : ""} /><div><strong>{lesson.releaseMode === "Scheduled" ? "Scheduled release" : "Immediate release"}</strong><small>{lesson.releaseMode === "Scheduled" && lesson.releaseAt ? lesson.releaseAt.replace("T", " ") : "Available according to course access"}</small></div></div>
            <button type="submit" className="admin-v2__button is-primary">Save release settings</button>
          </> : <p className="v2-helper-note">Select a lesson to manage release settings.</p>}
        </form>
        <section className="v2-settings-section v2-content-visibility"><header><Settings2 size={16} /><h3>Visibility &amp; Access</h3></header>
          <label className="v2-content-visibility-field"><span>Visibility</span><select value={lesson?.visibility ?? "Hidden"} disabled={!lesson} onChange={(event) => setLessonVisibility(event.target.value as CourseLesson["visibility"])}><option>Visible</option><option>Hidden</option></select></label>
          <div className="v2-setting-line"><span>Access rule</span><strong>Enrolled students only</strong></div>
          <p className="v2-helper-note">Enrollment does not authorize playback. Protected media delivery is controlled by the Student access API.</p>
        </section>
        <section className="v2-settings-section v2-content-context"><header><BookOpen size={16} /><h3>Lesson Context</h3></header>
          <div className="v2-content-context-stats"><div><strong>{resources.length}</strong><span>Resources</span></div><div><strong>{resources.filter((item) => item.status === "Published").length}</strong><span>Published</span></div><div><strong>{resources.filter((item) => item.status === "Draft").length}</strong><span>Drafts</span></div></div>
          <div className="v2-content-context-release"><span>Lesson release</span><strong>{lesson?.releaseMode ?? "N/A"}</strong></div>
          {selectedResource ? <div className="v2-content-selected-file"><span className={"v2-resource-icon is-" + selectedResource.type.toLowerCase()}>{selectedResource.type === "Video" ? <Video size={17} /> : <FileText size={17} />}</span><div><strong>{selectedResource.title}</strong><small>{selectedResource.fileName}</small></div><StatusBadge status={selectedResource.status} /><small className="v2-content-selected-file__meta">{selectedResource.type} | {formatSize(selectedResource.fileSize)} | Updated {selectedResource.updatedAt}</small></div> : <p className="v2-content-resource-hint">Select a resource to inspect its file details.</p>}
        </section>
      </aside>
    </div> : <MediaLibrary
      entries={filteredMediaResources}
      totalCount={allMediaResources.length}
      selectedId={mediaResourceId}
      search={mediaSearch}
      typeFilter={mediaType}
      statusFilter={mediaStatus}
      courseFilter={mediaCourse}
      courses={availableCourses}
      previewUrls={previewUrls}
      menuOpenId={actionMenuId}
      canUpload={workspace.workspace === "instructor" && Boolean(lesson) && !mutationPending}
      onSearch={setMediaSearch}
      onTypeFilter={setMediaType}
      onStatusFilter={setMediaStatus}
      onCourseFilter={selectMediaCourse}
      onSelect={(entry) => setMediaResourceId(entry.item.id)}
      onToggleMenu={(id) => setActionMenuId((current) => current === id ? "" : id)}
      onAction={runResourceAction}
      onOpenLesson={openMediaLesson}
      onUpload={() => openUpload()}
      onConfigureVideo={saveVideoConfiguration}
      mutationPending={mutationPending}
    />}
    {editor && <Drawer title={editor.kind === "upload" ? "Upload resource" : "Edit resource"} subtitle={editor.kind === "upload" ? "Upload privately and verify the file through the backend." : "Update the saved resource metadata."} onClose={() => { setEditor(null); setFile(null); setError(""); }} footer={<FormActions><button type="button" className="admin-v2__button" onClick={() => { setEditor(null); setFile(null); }}>Cancel</button><button type="submit" disabled={mutationPending} className="admin-v2__button is-primary" form="content-resource-form">{mutationPending ? "Saving…" : editor.kind === "upload" ? "Upload resource" : "Save metadata"}</button></FormActions>}>
      <form id="content-resource-form" className="admin-v2__form" onSubmit={submitResource}>
        {editor.kind === "upload" && <><FormField label="Resource type"><select value={type} onChange={(event) => setType(event.target.value as ContentResourceType)}><option>Video</option><option>PDF</option></select></FormField><FormField label="File" wide><input type="file" accept={type === "PDF" ? ".pdf,application/pdf" : ".mp4,video/mp4"} required onChange={(event: ChangeEvent<HTMLInputElement>) => { setFile(event.target.files?.[0] ?? null); setError(""); }} />{file && <small className="v2-file-note">{file.name} | {formatSize(file.size)} | private backend upload</small>}</FormField>{type === "Video" && <><FormField label="Video duration (seconds)"><input name="videoDurationSeconds" type="number" min={1} max={86400} step={1} required defaultValue="" /></FormField><FormField label="Maximum completed views"><input name="maxCompletedViews" type="number" min={1} max={100} step={1} defaultValue={3} required /></FormField><p className="v2-helper-note">A completed view is counted after the backend observes at least 90% plausible forward playback. The default is 3 views per Student.</p></>}</>}
        <FormField label="Title" wide><input name="title" required defaultValue={editingResource?.title ?? file?.name.replace(/\.[^.]+$/, "") ?? ""} key={editingResource?.id ?? file?.name ?? "new"} /></FormField>
        <FormField label="Description" wide><textarea name="description" rows={4} defaultValue={editingResource?.description ?? ""} key={editingResource?.id ?? "new-description"} /></FormField>
        {editor.kind === "edit" && editingResource && <p className="v2-helper-note">Original file: {editingResource.fileName}. File bytes are not persisted or replaceable here.</p>}
        {error && <p className="v2-form-error" role="alert">{error}</p>}
      </form>
    </Drawer>}
    {confirmId && <ConfirmDialog title="Archive this library resource?" detail="It will disappear from the active library and published media will be withdrawn. Database history is retained. Archiving does not delete private R2 objects." confirmLabel="Archive resource" onCancel={() => setConfirmId("")} onConfirm={() => void archiveResource(confirmId)} />}
  </section>;
}

function MediaLibrary({
  entries,
  totalCount,
  selectedId,
  search,
  typeFilter,
  statusFilter,
  courseFilter,
  courses,
  previewUrls,
  menuOpenId,
  canUpload,
  onSearch,
  onTypeFilter,
  onStatusFilter,
  onCourseFilter,
  onSelect,
  onToggleMenu,
  onAction,
  onOpenLesson,
  onUpload,
  onConfigureVideo,
  mutationPending,
}: {
  entries: MediaResourceEntry[];
  totalCount: number;
  selectedId: string;
  search: string;
  typeFilter: "all" | ContentResourceType;
  statusFilter: "active" | "all" | ContentResource["status"];
  courseFilter: string;
  courses: CourseRecord[];
  previewUrls: Record<string, string>;
  menuOpenId: string;
  canUpload: boolean;
  onSearch: (value: string) => void;
  onTypeFilter: (value: "all" | ContentResourceType) => void;
  onStatusFilter: (value: "active" | "all" | ContentResource["status"]) => void;
  onCourseFilter: (value: string) => void;
  onSelect: (entry: MediaResourceEntry) => void;
  onToggleMenu: (id: string) => void;
  onAction: (action: ResourceAction, item: ContentResource) => void;
  onOpenLesson: (entry: MediaResourceEntry) => void;
  onUpload: () => void;
  onConfigureVideo: (item: ContentResource, videoDurationSeconds: number, maxCompletedViews: number, reason: string) => Promise<void>;
  mutationPending: boolean;
}) {
  const selected = entries.find((entry) => entry.item.id === selectedId);
  return <div className="v2-media-library">
    <header className="v2-media-library__header">
      <div><span className="v2-overline">MEDIA LIBRARY</span><h2>All media</h2><p>Manage Video and PDF resources across your course lessons.</p></div>
      <div className="v2-media-library__summary"><strong>{totalCount}</strong><span>resources</span></div>
    </header>
    <div className="v2-media-library__toolbar">
      <label className="v2-media-search"><Search size={15} /><span className="admin-v2__sr-only">Search media</span><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search media, lessons, files..." /></label>
      <label><span>Type</span><select value={typeFilter} onChange={(event) => onTypeFilter(event.target.value as "all" | ContentResourceType)}><option value="all">All types</option><option value="Video">Video</option><option value="PDF">PDF</option></select></label>
      <label><span>Status</span><select value={statusFilter} onChange={(event) => onStatusFilter(event.target.value as "active" | "all" | ContentResource["status"])}><option value="active">Active resources</option><option value="all">All statuses</option><option value="Draft">Draft</option><option value="Published">Published</option><option value="Withdrawn">Withdrawn</option><option value="Archived">Archived</option></select></label>
      <label><span>Course</span><select value={courseFilter} onChange={(event) => onCourseFilter(event.target.value)}><option value="all">All courses</option>{courses.map((course) => <option value={course.id} key={course.id}>{course.title}</option>)}</select></label>
      <button type="button" className="admin-v2__button is-primary v2-media-upload" disabled={!canUpload} title={canUpload ? "Upload to the selected lesson" : "Select a lesson in Content Library first"} onClick={onUpload}><Upload size={14} />Upload resource</button>
    </div>
    <div className="v2-media-library__body">
      <section className="v2-phase-panel v2-media-library__table">
        <div className="v2-media-library__table-head"><span>Resource</span><span>Lesson / course</span><span>Type</span><span>File</span><span>Status</span><span>Actions</span></div>
        <div className="v2-media-library__rows">
          {entries.map((entry) => <MediaLibraryRow key={entry.item.id} entry={entry} selected={entry.item.id === selectedId} previewUrl={previewUrls[entry.item.id]} menuOpen={menuOpenId === entry.item.id} onSelect={() => onSelect(entry)} onToggleMenu={() => onToggleMenu(entry.item.id)} onAction={onAction} />)}
          {!entries.length && <div className="v2-empty v2-media-library__empty"><HardDrive size={22} /><strong>No media matches these filters</strong><span>Try another search or choose a different type, status, or course.</span></div>}
        </div>
        <footer className="v2-media-library__table-footer"><span>Showing {entries.length} of {totalCount} resources</span><span>Backend resource records</span></footer>
      </section>
      <aside className="v2-phase-panel v2-media-library__inspector">
        <header><div><span className="v2-overline">SELECTED RESOURCE</span><h3>Media details</h3></div>{selected && <StatusBadge status={selected.item.status} />}</header>
        {selected ? <div className="v2-media-library__inspector-body">
          <div className="v2-media-library__identity"><span className={"v2-resource-icon is-" + selected.item.type.toLowerCase()}>{selected.item.type === "Video" ? <Video size={19} /> : <FileText size={19} />}</span><div><strong>{selected.item.title}</strong><span>{selected.item.type} resource</span></div></div>
          <dl className="v2-detail-grid"><div><dt>File</dt><dd>{selected.item.fileName}</dd></div><div><dt>Size</dt><dd>{formatSize(selected.item.fileSize)}</dd></div><div><dt>Duration / pages</dt><dd>{formatMediaMeta(selected.item)}</dd></div><div><dt>Updated</dt><dd>{selected.item.updatedAt}</dd></div><div><dt>Visibility</dt><dd>{selected.item.visibility}</dd></div></dl>
          {selected.item.type === "Video" ? <form className="admin-v2__form" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const values = new FormData(event.currentTarget); void onConfigureVideo(selected.item, Number(values.get("videoDurationSeconds")), Number(values.get("maxCompletedViews")), String(values.get("reason") ?? "")); }}>
            <p className="v2-helper-note">Completed views count after the backend observes at least 90% plausible forward playback. Default limit: 3 per Student.</p>
            <FormField label="Video duration (seconds)"><input name="videoDurationSeconds" type="number" min={1} max={86400} step={1} required defaultValue={selected.item.durationSeconds ?? ""} /></FormField>
            <FormField label="Maximum completed views"><input name="maxCompletedViews" type="number" min={1} max={100} step={1} required defaultValue={selected.item.maxCompletedViews ?? 3} /></FormField>
            <FormField label="Reason"><input name="reason" minLength={3} maxLength={500} required defaultValue="Configure protected video playback policy" /></FormField>
            <button type="submit" className="admin-v2__button" disabled={mutationPending || !selected.item.mediaAssetId || !Number.isSafeInteger(selected.item.mediaVersion)} title={!selected.item.mediaAssetId ? "Upload a media asset before configuring playback" : undefined}>{mutationPending ? "Saving…" : "Save playback settings"}</button>
            {!selected.item.mediaAssetId && <p className="v2-helper-note">Playback limits are available after a video media asset is uploaded.</p>}
          </form> : null}
          <div className="v2-media-library__context"><span>Attached to</span><strong>{selected.lesson.title}</strong><small>{selected.chapter?.title ?? "Course structure"} · {selected.course.title}</small></div>
          <button type="button" className="admin-v2__button is-primary v2-media-library__open" onClick={() => onOpenLesson(selected)}><ExternalLink size={14} />Open lesson in Content Library</button>
        </div> : <div className="v2-resource-inspector-empty"><HardDrive size={22} /><strong>Select a resource</strong><span>Choose a Video or PDF to view its metadata and lesson context.</span></div>}
      </aside>
    </div>
  </div>;
}

function MediaLibraryRow({ entry, selected, previewUrl, menuOpen, onSelect, onToggleMenu, onAction }: { entry: MediaResourceEntry; selected: boolean; previewUrl?: string; menuOpen: boolean; onSelect: () => void; onToggleMenu: () => void; onAction: (action: ResourceAction, item: ContentResource) => void }) {
  const { item, lesson, chapter, course } = entry;
  const thumbnail = item.type === "Video"
    ? previewUrl ? <video src={previewUrl} muted playsInline preload="metadata" aria-label={item.title} /> : <><Video size={22} /><i><Play size={10} fill="currentColor" /></i></>
    : <><FileText size={22} /><small>PDF</small></>;
  return <article className={["v2-media-library__row", selected ? "is-selected" : ""].join(" ")} aria-selected={selected} onClick={onSelect}>
    <button type="button" className="v2-media-library__primary" onClick={onSelect} title={"View details for " + item.title}><span className={["v2-resource-thumb", "is-" + item.type.toLowerCase()].join(" ")}>{thumbnail}</span><span><strong>{item.title}</strong><small>{item.description || item.fileName}</small><em>{item.fileName} · {formatSize(item.fileSize)}</em></span></button>
    <span className="v2-media-library__lesson"><strong>{lesson.title}</strong><small>{chapter?.title ?? "Course structure"} · {course.title}</small></span>
    <span className={"v2-resource-type is-" + item.type.toLowerCase()}>{item.type}</span>
    <span className="v2-media-library__file"><strong>{formatMediaMeta(item)}</strong><small>{item.updatedAt}</small></span>
    <StatusBadge status={item.status} />
    <div className="v2-resource-menu-wrap" onClick={(event) => event.stopPropagation()}><button type="button" className="v2-resource-more" aria-label={"Actions for " + item.title} aria-haspopup="menu" aria-expanded={menuOpen} title="Resource actions" onClick={onToggleMenu}><MoreHorizontal size={17} /></button>{menuOpen && <div className="v2-resource-action-menu" role="menu" aria-label={"Actions for " + item.title}><button type="button" role="menuitem" disabled={!previewUrl} title={previewUrl ? "Preview local file" : "Preview is unavailable after refresh"} onClick={() => onAction("preview", item)}><Eye size={14} />Preview</button><button type="button" role="menuitem" onClick={() => onAction("edit", item)}><Pencil size={14} />Edit metadata</button>{item.status === "Draft" && <button type="button" role="menuitem" onClick={() => onAction("publish", item)}><Upload size={14} />Publish</button>}{item.status !== "Archived" && <button type="button" role="menuitem" onClick={() => onAction("archive", item)}><Archive size={14} />Archive from library</button>}</div>}</div>
  </article>;
}

function ResourceRow({ item, selected, previewUrl, menuOpen, onSelect, onToggleMenu, onAction }: { item: ContentResource; selected: boolean; previewUrl?: string; menuOpen: boolean; onSelect: () => void; onToggleMenu: () => void; onAction: (action: ResourceAction) => void }) {
  const thumbnail = item.type === "Video"
    ? previewUrl ? <video src={previewUrl} muted playsInline preload="metadata" aria-label={item.title} /> : <><Video size={23} /><i><Play size={10} fill="currentColor" /></i></>
    : <><FileText size={23} /><small>PDF</small></>;
  return <article className={["v2-resource-row", selected ? "is-selected" : ""].join(" ")} onClick={onSelect}>
    <button type="button" className="v2-resource-primary" aria-pressed={selected} title={"View details for " + item.title} onClick={onSelect}>
      <span className={["v2-resource-thumb", "is-" + item.type.toLowerCase()].join(" ")}>{thumbnail}</span>
      <span className="v2-resource-copy"><strong>{item.title}</strong><small>{item.description || item.fileName}</small><small className="v2-resource-file-meta">{item.description ? item.fileName + " | " + formatSize(item.fileSize) : formatSize(item.fileSize)}</small></span>
    </button>
    <span className={"v2-resource-type is-" + item.type.toLowerCase()}>{item.type}</span>
    <span className="v2-resource-media-meta"><strong>{formatMediaMeta(item)}</strong></span>
    <StatusBadge status={item.status} />
    <div className="v2-resource-menu-wrap" onClick={(event) => event.stopPropagation()}>
      <button type="button" className="v2-resource-more" aria-label={"Actions for " + item.title} aria-haspopup="menu" aria-expanded={menuOpen} title="Resource actions" onClick={onToggleMenu}><MoreHorizontal size={17} /></button>
      {menuOpen && <div className="v2-resource-action-menu" role="menu" aria-label={"Actions for " + item.title}>
        <button type="button" role="menuitem" disabled={!previewUrl} title={previewUrl ? "Preview local file" : "Preview is unavailable after refresh"} onClick={() => onAction("preview")}><Eye size={14} />Preview</button>
        <button type="button" role="menuitem" onClick={() => onAction("edit")}><Pencil size={14} />Edit metadata</button>
        {item.status === "Draft" && <button type="button" role="menuitem" onClick={() => onAction("publish")}><Upload size={14} />Publish</button>}
        {item.status !== "Archived" && <button type="button" role="menuitem" onClick={() => onAction("archive")}><Archive size={14} />Archive from library</button>}
      </div>}
    </div>
  </article>;
}
function formatSize(bytes: number) { return bytes < 1024 * 1024 ? Math.max(1, Math.round(bytes / 1024)) + " KB" : (bytes / (1024 * 1024)).toFixed(1) + " MB"; }
function formatDuration(seconds?: number) {
  if (!seconds || seconds <= 0) return "N/A";
  return Math.floor(seconds / 60) + ":" + Math.floor(seconds % 60).toString().padStart(2, "0");
}
function formatMediaMeta(item: ContentResource) {
  if (item.type === "Video" && item.durationSeconds) return formatDuration(item.durationSeconds);
  if (item.type === "PDF" && item.pageCount) return item.pageCount + " pages";
  return "N/A";
}
