import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, FileCheck2, FileText, Plus, Upload } from "lucide-react";
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
  return <section className="instructor-course-builder" aria-label={`${course.title} course builder`}>
    <div className="instructor-course-builder__grid">
      <aside className="instructor-course-builder__outline">
        <header><div><span>COURSE STRUCTURE</span><h2>Chapters &amp; lessons</h2></div>{structure.isLoading ? <BuilderSkeleton width="78px" height="9px" /> : <small>{chapters.length} chapters · {lessons.length} lessons</small>}</header>
        <div data-instructor-guide-target="lesson-list" className="instructor-course-builder__tree">
          {structure.isLoading ? <div className="instructor-course-builder__tree-skeleton" role="status" aria-label="Loading course structure">{[0, 1, 2].map(index => <div className="instructor-course-builder__chapter-skeleton" key={index}><BuilderSkeleton width="72%" height="9px" />{index === 0 && <><BuilderSkeleton width="84%" height="25px" /><BuilderSkeleton width="68%" height="25px" /></>}</div>)}</div> : structure.isError ? <FriendlyErrorNotice error={friendlyError(structure.error)} onRetry={() => void structure.refetch()} /> : !chapters.length ? <div className="instructor-course-builder__empty"><BookOpen size={20} /><strong>No chapters yet</strong><span>Add a chapter to start building this course.</span></div> : chapters.map(chapter => <section key={chapter.id} className="instructor-course-builder__chapter">
            <header><BookOpen size={15} /><strong>{chapter.title}</strong><small>{chapter.status}</small></header>
            {lessons.filter(item => item.courseChapterId === chapter.id).map(lesson => <button key={lesson.id} type="button" className={`instructor-course-builder__lesson${selectedLesson?.id === lesson.id ? " is-selected" : ""}`} onClick={() => setSelectedLessonId(lesson.id)}><FileText size={14} /><span>{lesson.title}</span><small>{lesson.status}</small></button>)}
          </section>)}
        </div>
        {structure.isLoading ? <div className="instructor-course-builder__forms-skeleton" aria-hidden="true"><BuilderSkeleton width="55%" height="8px" /><BuilderSkeleton height="31px" /><BuilderSkeleton width="60%" height="8px" /><BuilderSkeleton height="31px" /></div> : <div className="instructor-course-builder__create-forms">
          <form data-instructor-guide-target="chapter-form" onSubmit={e => { e.preventDefault(); createChapter.mutate(); }}><label><span>New chapter</span><input value={chapterTitle} onChange={e => setChapterTitle(e.target.value)} maxLength={240} placeholder="e.g. Introduction" /></label><button type="submit" disabled={!chapterTitle.trim() || createChapter.isPending}><Plus size={14} /> Add chapter</button></form>
          {selectedChapter && <form data-instructor-guide-target="lesson-form" onSubmit={e => { e.preventDefault(); createLesson.mutate(); }}><label><span>New lesson in {selectedChapter.title}</span><input value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} maxLength={240} placeholder="Lesson title" /></label><label><span>Lesson summary</span><input value={lessonDescription} onChange={e => setLessonDescription(e.target.value)} maxLength={2000} placeholder="Optional summary" /></label><button type="submit" disabled={!lessonTitle.trim() || createLesson.isPending}><Plus size={14} /> Add lesson</button></form>}
        </div>}
      </aside>

      <section className="instructor-course-builder__lesson-workspace">
        {structure.isLoading ? <div className="instructor-course-builder__workspace-skeleton" role="status" aria-label="Loading lesson workspace"><div className="instructor-course-builder__workspace-heading-skeleton"><span><BuilderSkeleton width="112px" height="8px" /><BuilderSkeleton width="68%" height="20px" /><BuilderSkeleton width="43%" height="8px" /></span><BuilderSkeleton width="54px" height="22px" /></div><BuilderSkeleton width="92px" height="8px" /><div className="instructor-course-builder__resource-skeletons">{[0, 1, 2].map(index => <div key={index}><BuilderSkeleton width="34px" height="34px" /><span><BuilderSkeleton width="57%" height="8px" /><BuilderSkeleton width="36%" height="7px" /></span><BuilderSkeleton width="64px" height="17px" /></div>)}</div></div> : !selectedLesson ? <div className="instructor-course-builder__empty-workspace"><FileText size={28} /><h2>Select a lesson</h2><p>Choose a lesson from the course structure or create a new one to manage its files.</p></div> : <>
          <header className="instructor-course-builder__lesson-heading"><div><span>LESSON WORKSPACE</span><h1>{selectedLesson.title}</h1><small>{selectedChapter?.title ?? "Course lesson"} · {selectedLesson.status}</small></div><span className={`instructor-course-builder__status is-${selectedLesson.status}`}>{selectedLesson.status}</span></header>
          {notice && <p role="status" className="instructor-course-builder__notice">{notice}</p>}
          <FriendlyErrorNotice error={errorInfo} />
          {resources.isError && <FriendlyErrorNotice error={friendlyError(resources.error)} onRetry={() => void resources.refetch()} />}
          <section className="instructor-course-builder__resource-list" aria-labelledby="lesson-files-heading"><header><div><span>LESSON MATERIALS</span><h2 id="lesson-files-heading">Videos &amp; files</h2></div><small>{lessonResources.length} resources</small></header>
            {resources.isLoading ? <div className="instructor-course-builder__resource-skeletons" role="status" aria-label="Loading lesson files">{[0, 1, 2].map(index => <div key={index}><BuilderSkeleton width="34px" height="34px" /><span><BuilderSkeleton width="58%" height="8px" /><BuilderSkeleton width="36%" height="7px" /></span><BuilderSkeleton width="65px" height="17px" /></div>)}</div> : lessonResources.map(resource => { const review = reviewByTarget.get(resource.id); return <article key={resource.id} className="instructor-course-builder__resource"><span className="instructor-course-builder__resource-icon"><FileText size={17} /></span><div><strong>{resource.title}</strong><small>{resource.resourceKind} · {resource.status}</small></div>{reviews.isLoading ? <BuilderSkeleton width="66px" height="17px" /> : <span className={`instructor-course-builder__review-state is-${review?.status ?? "draft"}`}>{review?.status ?? "Not submitted"}</span>}{review?.status === "rejected" && <p role="alert">{copy.content.reviewNotePrefix}{review.rejectionReason}</p>}</article>; })}
            {!lessonResources.length && !resources.isLoading && <div className="instructor-course-builder__no-files"><FileCheck2 size={22} /><strong>No files attached</strong><span>Add a PDF or video from Lesson settings. Submitted files stay private until approved.</span></div>}
          </section>
        </>}
      </section>

      <aside className="instructor-course-builder__settings">
        {structure.isLoading ? <div className="instructor-course-builder__settings-skeleton" role="status" aria-label="Loading lesson settings"><BuilderSkeleton width="112px" height="8px" /><BuilderSkeleton width="76%" height="16px" /><div>{[0, 1, 2].map(index => <span key={index}><BuilderSkeleton width="36px" height="8px" /><BuilderSkeleton width="74px" height="8px" /></span>)}</div><BuilderSkeleton width="100%" height="86px" /><BuilderSkeleton width="100%" height="36px" /><BuilderSkeleton width="100%" height="36px" /></div> : <>
        <header><span>LESSON SETTINGS</span><h2>{selectedLesson?.title ?? "Course access"}</h2></header>
        <dl className="instructor-course-builder__metadata"><div><dt>Course</dt><dd>{course.title}</dd></div><div><dt>Chapter</dt><dd>{selectedChapter?.title ?? "Select a lesson"}</dd></div><div><dt>Visibility</dt><dd><span className="instructor-course-builder__private"><FileCheck2 size={13} /> Private draft</span></dd></div></dl>
        {selectedLesson ? <form data-instructor-guide-target="resource-title" className="instructor-course-builder__upload" onSubmit={e => { e.preventDefault(); uploadResource.mutate(); }}>
          <header><h3>Upload video or PDF</h3><Upload size={15} /></header>
          <label className="instructor-course-builder__field"><span>Resource title</span><input data-instructor-guide-target="resource-title-input" value={resourceTitle} onChange={e => setResourceTitle(e.target.value)} maxLength={240} required placeholder="e.g. Chapter slides" /></label>
          <label data-instructor-guide-target="resource-file" className="instructor-course-builder__file"><Upload size={19} /><strong>{file?.name ?? "Choose a PDF or MP4"}</strong><small>PDF documents and MP4 videos</small><input type="file" accept=".pdf,application/pdf,.mp4,video/mp4" onChange={e => setFile(e.target.files?.[0] ?? null)} required /></label>
          {file?.type === "video/mp4" || file?.name.toLowerCase().endsWith(".mp4") ? <label className="instructor-course-builder__field"><span>Video duration (seconds)</span><input type="number" min={1} max={86400} value={videoDuration} onChange={e => setVideoDuration(e.target.value)} required /></label> : null}
          <p>{copy.content.uploadHelperText}</p>
          <button data-instructor-guide-target="resource-submit" type="submit" disabled={!file || !resourceTitle.trim() || uploadResource.isPending}>{uploadResource.isPending ? "Uploading and verifying…" : <><Upload size={14} /> {copy.content.uploadButtonLabel}</>}</button>
        </form> : <div className="instructor-course-builder__approval"><FileCheck2 size={18} /><strong>Choose a lesson first</strong><p>Select a lesson to upload files and track its approval status.</p></div>}
        <div className="instructor-course-builder__approval"><FileCheck2 size={16} /><span><strong>File approval</strong><small>Lesson files remain private to students until an administrator approves them.</small></span></div>
        </>}
      </aside>
    </div>
  </section>;
}
export default InstructorCourseContentPage;

function BuilderSkeleton({ width = "100%", height = "10px" }: { width?: string; height?: string }) {
  return <span className="instructor-course-builder__skeleton" style={{ width, height }} aria-hidden="true" />;
}
