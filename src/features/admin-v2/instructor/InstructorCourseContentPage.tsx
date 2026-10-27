import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, ChevronDown, FileCheck2, FileText, Folder, Lock, Plus, Search, Upload, UploadCloud, Video } from "lucide-react";
import { Navigate, useParams } from "react-router-dom";
import { useAdminV2 } from "../layout/AdminV2Layout";
import { createStructureRecord, listStructure, type BrandCourse } from "../api/adminAcademicApi";
import { createLessonResource, createMediaAsset, listContentReviewRequests, listLessonMedia, listLessonResources, submitContentReview, uploadAndVerifyMedia, type ContentReviewRequestDto } from "../api/adminContentApi";
import type { BrandAccess } from "../api/adminAcademicApi";
import { getWorkspaceCopy } from "../copy/workspace-copy";
import { friendlyError, type FriendlyErrorInfo } from "../utils/friendlyError";
import { FriendlyErrorNotice } from "../shared/FriendlyErrorNotice";
import "./instructor-course-builder.css";

export function InstructorCourseContentPage() {
  const { courseId = "" } = useParams();
  const { workspace } = useAdminV2();
  const copy = getWorkspaceCopy(workspace.workspace);
  const queryClient = useQueryClient();
  const course = workspace.courses.find(item => item.id === courseId);
  const brand = course ? workspace.brands.find(item => item.id === course.brandId) : undefined;
  const apiBrand:BrandAccess|undefined = brand ? { id:brand.id,code:brand.code,name:brand.name,status:"active",allowedAcademicInstitutions:[] } : undefined;
  const apiCourse:BrandCourse|undefined = course ? { id:course.id,brandId:course.brandId,code:course.code,title:course.title,status:course.status as BrandCourse["status"],classification:"academic_module_offering",cataloguePresentation:"module_based",academicInstitutionId:course.academicInstitutionId,academicModuleId:course.academicModuleId,version:1,updatedAt:new Date().toISOString() } : undefined;
  const structure = useQuery({ queryKey:["instructor","course-content",courseId], queryFn:()=>listStructure(course!.brandId,course!.id), enabled:Boolean(course), retry:1 });
  const reviews = useQuery({ queryKey:["admin","content-review-requests"], queryFn:({signal})=>listContentReviewRequests(signal), enabled:Boolean(course) });
  const [selectedLessonId,setSelectedLessonId]=useState("");
  const [chapterTitle,setChapterTitle]=useState("");
  const [lessonTitle,setLessonTitle]=useState("");
  const [lessonDescription,setLessonDescription]=useState("");
  const [resourceTitle,setResourceTitle]=useState("");
  const [file,setFile]=useState<File|null>(null);
  const [videoDuration,setVideoDuration]=useState("");
  const [notice,setNotice]=useState("");
  const [treeSearch,setTreeSearch]=useState("");
  const [creating,setCreating]=useState<"chapter"|"lesson"|null>(null);
  const [collapsed,setCollapsed]=useState<Set<string>>(()=>new Set());
  const [errorInfo,setErrorInfo]=useState<FriendlyErrorInfo|null>(null);
  const chapters=structure.data?.chapters.filter(item=>item.status!=="archived")??[];
  const lessons=structure.data?.lessons.filter(item=>item.status!=="archived")??[];
  const selectedLesson=lessons.find(item=>item.id===selectedLessonId)??lessons[0];
  const selectedChapter=chapters.find(item=>item.id===selectedLesson?.courseChapterId);
  const resources=useQuery({queryKey:["instructor","lesson-resources",courseId,selectedLesson?.id],queryFn:()=>listLessonResources(course!.brandId,course!.id),enabled:Boolean(course&&selectedLesson)});
  const lessonResources=resources.data?.filter(item=>item.courseLessonId===selectedLesson?.id)??[];
  const courseReviews=useMemo(()=>reviews.data?.items.filter(item=>item.courseId===courseId)??[],[reviews.data?.items,courseId]);
  const reviewByTarget=new Map<string,ContentReviewRequestDto>(courseReviews.map(item=>[item.targetId,item]));
  const refresh=async()=>{await Promise.all([queryClient.invalidateQueries({queryKey:["instructor","course-content",courseId]}),queryClient.invalidateQueries({queryKey:["instructor","lesson-resources",courseId]}),queryClient.invalidateQueries({queryKey:["admin","content-review-requests"]})]);};

  const createChapter=useMutation({mutationFn:()=>{if(!course||!chapterTitle.trim())throw new Error("Enter a chapter title.");return createStructureRecord(course.brandId,course.id,"chapters",{title:chapterTitle.trim(),sortOrder:Math.max(0,...chapters.map(item=>item.sortOrder))+1,status:"draft",reason:"Instructor created a course chapter draft"});},onSuccess:async()=>{setChapterTitle("");setNotice("Chapter draft created.");setErrorInfo(null);await refresh();},onError:e=>setErrorInfo(friendlyError(e))});
  const createLesson=useMutation({mutationFn:()=>{if(!course||!selectedChapter||!lessonTitle.trim())throw new Error("Select a chapter and enter a lesson title.");return createStructureRecord(course.brandId,course.id,"lessons",{title:lessonTitle.trim(),description:lessonDescription.trim()||null,courseChapterId:selectedChapter.id,sortOrder:Math.max(0,...lessons.filter(item=>item.courseChapterId===selectedChapter.id).map(item=>item.sortOrder))+1,status:"draft",reason:"Instructor created a course lesson draft"});},onSuccess:async()=>{setLessonTitle("");setLessonDescription("");setNotice("Lesson draft created.");setErrorInfo(null);await refresh();},onError:e=>setErrorInfo(friendlyError(e))});
  const uploadResource=useMutation({mutationFn:async()=>{
    if(!course||!apiBrand||!apiCourse||!selectedLesson||!selectedChapter)throw new Error("Select an active lesson first.");
    if(!file||!resourceTitle.trim())throw new Error("Choose a video or PDF and enter its title.");
    const isPdf=file.type==="application/pdf"||file.name.toLowerCase().endsWith(".pdf");
    const isMp4=file.type==="video/mp4"||file.name.toLowerCase().endsWith(".mp4");
    if(!isPdf&&!isMp4)throw new Error("Only PDF and MP4 files are accepted.");
    const seconds=isMp4?Number(videoDuration):undefined;
    if(isMp4&&(!Number.isSafeInteger(seconds)||seconds!<1||seconds!>86400))throw new Error("Enter the video's duration in seconds.");
    const scope={brand:apiBrand,course:apiCourse,chapter:selectedChapter,lesson:selectedLesson} as const;
    const resourceId=await createLessonResource(scope,resourceTitle.trim(),Math.max(0,...lessonResources.map(item=>item.sortOrder))+1,isPdf?"document":"video");
    const asset=await createMediaAsset(scope,resourceId,resourceTitle.trim(),file,seconds);
    const media=await listLessonMedia({brand:apiBrand,course:apiCourse,lesson:selectedLesson});
    await uploadAndVerifyMedia({brand:apiBrand,course:apiCourse,chapter:selectedChapter,lesson:selectedLesson},asset,file,media.uploadPolicy);
    await submitContentReview(course.brandId,course.id,{targetType:"resource",targetId:resourceId,reason:"Instructor submitted lesson resource for Super Admin review."});
    return resourceId;
  },onSuccess:async()=>{setFile(null);setResourceTitle("");setVideoDuration("");setNotice("File uploaded and verified. It is now waiting for administrator review before students can access it.");setErrorInfo(null);await refresh();},onError:e=>setErrorInfo(friendlyError(e))});

  if(!course)return <Navigate to="/admin/instructor/courses" replace />;
  const q=treeSearch.trim().toLowerCase();
  const matchesLesson=(item:{title:string})=>!q||item.title.toLowerCase().includes(q);
  const visibleChapters=chapters.filter(chapter=>!q||chapter.title.toLowerCase().includes(q)||lessons.some(item=>item.courseChapterId===chapter.id&&matchesLesson(item)));
  const isVideoFile=Boolean(file&&(file.type==="video/mp4"||file.name.toLowerCase().endsWith(".mp4")));
  const approvedCount=lessonResources.filter(item=>reviewByTarget.get(item.id)?.status==="approved").length;
  const waitingCount=lessonResources.filter(item=>reviewByTarget.get(item.id)?.status==="submitted").length;
  const returnedCount=lessonResources.filter(item=>reviewByTarget.get(item.id)?.status==="rejected").length;
  const toggleChapter=(id:string)=>setCollapsed(current=>{const next=new Set(current);if(next.has(id))next.delete(id);else next.add(id);return next;});
  const openCreate=(mode:"chapter"|"lesson")=>setCreating(current=>current===mode?null:mode);
  return <section className="instructor-course-builder" aria-label={`${course.title} course builder`}>
    <div className="instructor-course-builder__grid">
      <aside className="instructor-course-builder__outline">
        <h2>Course structure</h2>
        <label className="instructor-course-builder__search"><Search size={16} /><input value={treeSearch} onChange={e=>setTreeSearch(e.target.value)} placeholder="Find chapter or lesson" aria-label="Find chapter or lesson" /></label>
        <div className="instructor-course-builder__add-row">
          <button data-instructor-guide-target="chapter-form" type="button" className="is-primary" aria-expanded={creating==="chapter"} onClick={()=>openCreate("chapter")}><Plus size={15} /> Chapter</button>
          <button data-instructor-guide-target="lesson-form" type="button" aria-expanded={creating==="lesson"} disabled={!selectedChapter} title={selectedChapter?undefined:"Create a chapter first"} onClick={()=>openCreate("lesson")}><Plus size={15} /> Lesson</button>
        </div>
        {creating==="chapter"&&<form className="instructor-course-builder__create" onSubmit={e=>{e.preventDefault();createChapter.mutate(undefined,{onSuccess:()=>setCreating(null)});}}><label><span>New chapter</span><input autoFocus value={chapterTitle} onChange={e=>setChapterTitle(e.target.value)} maxLength={240} placeholder="e.g. Introduction" /></label><div><button type="button" onClick={()=>setCreating(null)}>Cancel</button><button type="submit" className="is-primary" disabled={!chapterTitle.trim()||createChapter.isPending}>Add chapter</button></div></form>}
        {creating==="lesson"&&selectedChapter&&<form className="instructor-course-builder__create" onSubmit={e=>{e.preventDefault();createLesson.mutate(undefined,{onSuccess:()=>setCreating(null)});}}><label><span>New lesson in {selectedChapter.title}</span><input autoFocus value={lessonTitle} onChange={e=>setLessonTitle(e.target.value)} maxLength={240} placeholder="Lesson title" /></label><label><span>Lesson summary</span><input value={lessonDescription} onChange={e=>setLessonDescription(e.target.value)} maxLength={2000} placeholder="Optional summary" /></label><div><button type="button" onClick={()=>setCreating(null)}>Cancel</button><button type="submit" className="is-primary" disabled={!lessonTitle.trim()||createLesson.isPending}>Add lesson</button></div></form>}
        <div data-instructor-guide-target="lesson-list" className="instructor-course-builder__tree">
          {structure.isLoading ? <div className="instructor-course-builder__tree-skeleton" role="status" aria-label="Loading course structure">{[0, 1].map(index => <div className="instructor-course-builder__chapter-skeleton" key={index}><BuilderSkeleton width="58%" height="16px" />{index === 0 && <BuilderSkeleton width="82%" height="34px" />}</div>)}</div> : structure.isError ? <FriendlyErrorNotice error={friendlyError(structure.error)} onRetry={() => void structure.refetch()} /> : !chapters.length ? <div className="instructor-course-builder__empty"><BookOpen size={20} /><strong>No chapters yet</strong><span>Add a chapter to start building this course.</span></div> : !visibleChapters.length ? <div className="instructor-course-builder__empty"><Search size={20} /><strong>No matches</strong><span>Try another chapter or lesson name.</span></div> : visibleChapters.map(chapter => { const isOpen=Boolean(q)||!collapsed.has(chapter.id); return <section key={chapter.id} className="instructor-course-builder__chapter">
            <header><button type="button" className="instructor-course-builder__chapter-toggle" onClick={()=>toggleChapter(chapter.id)} aria-expanded={isOpen} aria-label={`${isOpen?"Collapse":"Expand"} ${chapter.title}`}><ChevronDown size={15} className={isOpen?"":"is-closed"} /></button><Folder size={16} /><strong>{chapter.title}</strong>{chapter.status!=="published"&&<small>{chapter.status}</small>}</header>
            {isOpen&&lessons.filter(item => item.courseChapterId === chapter.id&&matchesLesson(item)).map(lesson => <button key={lesson.id} type="button" className={`instructor-course-builder__lesson${selectedLesson?.id === lesson.id ? " is-selected" : ""}`} onClick={() => setSelectedLessonId(lesson.id)} aria-current={selectedLesson?.id === lesson.id}><FileText size={15} /><span>{lesson.title}</span><small>{lesson.status}</small></button>)}
          </section>; })}
        </div>
        {!structure.isLoading&&<footer>{chapters.length} {chapters.length===1?"chapter":"chapters"} · {lessons.length} {lessons.length===1?"lesson":"lessons"}</footer>}
      </aside>

      <section className="instructor-course-builder__lesson-workspace">
        {structure.isLoading ? <div className="instructor-course-builder__workspace-skeleton" role="status" aria-label="Loading lesson workspace"><div className="instructor-course-builder__workspace-heading-skeleton"><BuilderSkeleton width="38%" height="24px" /><BuilderSkeleton width="56px" height="24px" /></div><BuilderSkeleton width="22%" height="12px" /><BuilderSkeleton width="100%" height="48px" /><BuilderSkeleton width="22%" height="12px" /><div className="instructor-course-builder__resource-skeletons">{[0, 1].map(index => <div key={index}><BuilderSkeleton width="38px" height="38px" /><span><BuilderSkeleton width="50%" height="11px" /><BuilderSkeleton width="30%" height="9px" /></span><BuilderSkeleton width="72px" height="22px" /></div>)}</div><BuilderSkeleton width="100%" height="130px" /></div> : !selectedLesson ? <div className="instructor-course-builder__empty-workspace"><FileText size={28} /><h2>Select a lesson</h2><p>Choose a lesson from the course structure or create a new one to manage its files.</p></div> : <>
          <header className="instructor-course-builder__lesson-heading"><h2>{selectedLesson.title}</h2><span className={`instructor-course-builder__status is-${selectedLesson.status}`}>{statusText(selectedLesson.status)}</span>{selectedChapter&&<small>{selectedChapter.title}</small>}</header>
          <div className="instructor-course-builder__scroll">
            {notice && <p role="status" className="instructor-course-builder__notice">{notice}</p>}
            <FriendlyErrorNotice error={errorInfo} />
            {resources.isError && <FriendlyErrorNotice error={friendlyError(resources.error)} onRetry={() => void resources.refetch()} />}
            <section className="instructor-course-builder__block"><h3>Description</h3><p className={selectedLesson.description?"instructor-course-builder__description":"instructor-course-builder__description is-empty"}>{selectedLesson.description||"No description added for this lesson."}</p></section>
            <section className="instructor-course-builder__block instructor-course-builder__resource-list" aria-labelledby="lesson-files-heading"><header><h3 id="lesson-files-heading">Videos &amp; files</h3><small>{lessonResources.length} {lessonResources.length===1?"resource":"resources"}</small></header>
              {resources.isLoading ? <div className="instructor-course-builder__resource-skeletons" role="status" aria-label="Loading lesson files">{[0, 1].map(index => <div key={index}><BuilderSkeleton width="38px" height="38px" /><span><BuilderSkeleton width="50%" height="11px" /><BuilderSkeleton width="30%" height="9px" /></span><BuilderSkeleton width="72px" height="22px" /></div>)}</div> : lessonResources.map(resource => { const review = reviewByTarget.get(resource.id); return <article key={resource.id} className="instructor-course-builder__resource"><span className="instructor-course-builder__resource-icon">{resource.resourceKind==="video"?<Video size={18} />:<FileText size={18} />}</span><div><strong>{resource.title}</strong><small>{resource.resourceKind} · {resource.status}</small></div>{reviews.isLoading ? <BuilderSkeleton width="72px" height="22px" /> : <span className={`instructor-course-builder__review-state is-${review?.status ?? "draft"}`}>{review?.status ?? "Not submitted"}</span>}{review?.status === "rejected" && <p role="alert">{copy.content.reviewNotePrefix}{review.rejectionReason}</p>}</article>; })}
              {!lessonResources.length && !resources.isLoading && <div className="instructor-course-builder__no-files"><FileCheck2 size={20} /><strong>No files attached</strong><span>Upload a PDF or MP4 below. Submitted files stay private until approved.</span></div>}
            </section>
            <form data-instructor-guide-target="resource-title" className="instructor-course-builder__block instructor-course-builder__upload" onSubmit={e => { e.preventDefault(); uploadResource.mutate(); }}>
              <h3>Upload video or PDF</h3>
              <label className="instructor-course-builder__field"><span>Resource title</span><input data-instructor-guide-target="resource-title-input" value={resourceTitle} onChange={e => setResourceTitle(e.target.value)} maxLength={240} required placeholder="e.g. Chapter slides" /></label>
              <label data-instructor-guide-target="resource-file" className={`instructor-course-builder__file${file?" has-file":""}`}><UploadCloud size={26} /><strong>{file?.name ?? "Drop a video or PDF here, or browse files"}</strong><small>PDF documents and MP4 videos</small><span className="instructor-course-builder__browse">{file?"Change file":"Browse files"}</span><input type="file" accept=".pdf,application/pdf,.mp4,video/mp4" onChange={e => setFile(e.target.files?.[0] ?? null)} required /></label>
              {isVideoFile ? <label className="instructor-course-builder__field instructor-course-builder__field--narrow"><span>Video duration (seconds)</span><input type="number" min={1} max={86400} value={videoDuration} onChange={e => setVideoDuration(e.target.value)} required /></label> : null}
              <p className="instructor-course-builder__private-note"><Lock size={14} /> {copy.content.uploadHelperText}</p>
              <div className="instructor-course-builder__actions"><button type="button" onClick={()=>{setFile(null);setResourceTitle("");setVideoDuration("");}} disabled={!file&&!resourceTitle&&!videoDuration}>Clear</button><button data-instructor-guide-target="resource-submit" type="submit" className="is-primary" disabled={!file || !resourceTitle.trim() || uploadResource.isPending}>{uploadResource.isPending ? "Uploading and verifying…" : <><Upload size={15} /> {copy.content.uploadButtonLabel}</>}</button></div>
            </form>
          </div>
        </>}
      </section>

      <aside className="instructor-course-builder__settings">
        {structure.isLoading ? <div className="instructor-course-builder__settings-skeleton" role="status" aria-label="Loading lesson settings"><BuilderSkeleton width="52%" height="20px" /><div>{[0, 1, 2].map(index => <span key={index}><BuilderSkeleton width="64px" height="11px" /><BuilderSkeleton width="90px" height="11px" /></span>)}</div><BuilderSkeleton width="40%" height="16px" /><BuilderSkeleton width="100%" height="110px" /><BuilderSkeleton width="40%" height="16px" /><BuilderSkeleton width="100%" height="46px" /></div> : <>
        <h2>Lesson settings</h2>
        <dl className="instructor-course-builder__metadata"><div><dt>Content type</dt><dd><Video size={15} /> {lessonResources.some(item=>item.resourceKind==="video")?"Video lesson":lessonResources.length?"Document lesson":"Not set"}</dd></div><div><dt>Chapter</dt><dd><Folder size={15} /> <span>{selectedChapter?.title ?? "Select a lesson"}</span></dd></div><div><dt>Visibility</dt><dd><Lock size={15} /> Private draft</dd></div></dl>
        <section className="instructor-course-builder__side-section"><h3>Learning materials</h3>
          {selectedLesson&&lessonResources.length?<ul className="instructor-course-builder__material-list">{lessonResources.map(resource=><li key={resource.id}><FileText size={15} /><span>{resource.title}</span></li>)}</ul>:<div className="instructor-course-builder__materials-empty"><FileText size={20} /><span><strong>No files attached</strong><small>{selectedLesson?"Add PDFs, slides or other resources for this lesson.":"Select a lesson to add resources."}</small></span></div>}
        </section>
        <section className="instructor-course-builder__side-section"><h3>File approval</h3>
          <div className="instructor-course-builder__approval"><FileCheck2 size={17} /><span>{!selectedLesson||!lessonResources.length?"No files to submit":`${approvedCount} approved · ${waitingCount} waiting${returnedCount?` · ${returnedCount} returned`:""}`}</span></div>
          <small>Lesson files stay private until approved by an administrator.</small>
        </section>
        </>}
      </aside>
    </div>
  </section>;
}
export default InstructorCourseContentPage;

function statusText(status:string){return status?status.charAt(0).toUpperCase()+status.slice(1):"";}

function BuilderSkeleton({ width = "100%", height = "10px" }: { width?: string; height?: string }) {
  return <span className="instructor-course-builder__skeleton" style={{ width, height }} aria-hidden="true" />;
}
