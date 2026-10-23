import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, FileText, Plus, Upload } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useAdminV2 } from "../layout/AdminV2Layout";
import { createStructureRecord, listStructure, type BrandCourse } from "../api/adminAcademicApi";
import { createLessonResource, createMediaAsset, listContentReviewRequests, listLessonMedia, listLessonResources, submitContentReview, uploadAndVerifyMedia, type ContentReviewRequestDto } from "../api/adminContentApi";
import type { BrandAccess } from "../api/adminAcademicApi";

const messageOf = (error:unknown) => error instanceof Error ? error.message : "The course content request failed.";

export function InstructorCourseContentPage() {
  const { courseId = "" } = useParams();
  const { workspace } = useAdminV2();
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
  const [error,setError]=useState("");
  const chapters=structure.data?.chapters.filter(item=>item.status!=="archived")??[];
  const lessons=structure.data?.lessons.filter(item=>item.status!=="archived")??[];
  const selectedLesson=lessons.find(item=>item.id===selectedLessonId)??lessons[0];
  const selectedChapter=chapters.find(item=>item.id===selectedLesson?.courseChapterId);
  const resources=useQuery({queryKey:["instructor","lesson-resources",courseId,selectedLesson?.id],queryFn:()=>listLessonResources(course!.brandId,course!.id),enabled:Boolean(course&&selectedLesson)});
  const lessonResources=resources.data?.filter(item=>item.courseLessonId===selectedLesson?.id)??[];
  const courseReviews=useMemo(()=>reviews.data?.items.filter(item=>item.courseId===courseId)??[],[reviews.data?.items,courseId]);
  const reviewByTarget=new Map<string,ContentReviewRequestDto>(courseReviews.map(item=>[item.targetId,item]));
  const refresh=async()=>{await Promise.all([queryClient.invalidateQueries({queryKey:["instructor","course-content",courseId]}),queryClient.invalidateQueries({queryKey:["instructor","lesson-resources",courseId]}),queryClient.invalidateQueries({queryKey:["admin","content-review-requests"]})]);};

  const createChapter=useMutation({mutationFn:()=>{if(!course||!chapterTitle.trim())throw new Error("Enter a chapter title.");return createStructureRecord(course.brandId,course.id,"chapters",{title:chapterTitle.trim(),sortOrder:Math.max(0,...chapters.map(item=>item.sortOrder))+1,status:"draft",reason:"Instructor created a course chapter draft"});},onSuccess:async()=>{setChapterTitle("");setNotice("Chapter draft created.");setError("");await refresh();},onError:e=>setError(messageOf(e))});
  const createLesson=useMutation({mutationFn:()=>{if(!course||!selectedChapter||!lessonTitle.trim())throw new Error("Select a chapter and enter a lesson title.");return createStructureRecord(course.brandId,course.id,"lessons",{title:lessonTitle.trim(),description:lessonDescription.trim()||null,courseChapterId:selectedChapter.id,sortOrder:Math.max(0,...lessons.filter(item=>item.courseChapterId===selectedChapter.id).map(item=>item.sortOrder))+1,status:"draft",reason:"Instructor created a course lesson draft"});},onSuccess:async()=>{setLessonTitle("");setLessonDescription("");setNotice("Lesson draft created.");setError("");await refresh();},onError:e=>setError(messageOf(e))});
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
  },onSuccess:async()=>{setFile(null);setResourceTitle("");setVideoDuration("");setNotice("File uploaded and verified. It is now waiting for Super Admin review before students can access it.");setError("");await refresh();},onError:e=>setError(messageOf(e))});

  if(!course)return <Navigate to="/admin/instructor/courses" replace />;
  return <section className="admin-v2__page">
    <header className="admin-v2__page-header"><div><Link to="/admin/instructor/courses" className="admin-v2__back-link"><ArrowLeft size={13}/> My Courses</Link><h1>{course.title}</h1><p>{course.brandName} · {course.code} · chapters, lessons, and review-gated resources.</p></div><span className="admin-v2__status-chip"><BookOpen size={14}/>{course.status}</span></header>
    {notice&&<p role="status" className="admin-v2__inline-notice">{notice}</p>}{error&&<p role="alert" className="admin-v2__inline-notice">{error}</p>}
    <div className="admin-v2__workgrid has-inspector">
      <section className="admin-v2__table-card">
        <header className="admin-v2__table-toolbar"><div><strong>Course structure</strong><span>{chapters.length} chapters · {lessons.length} lessons</span></div></header>
        {structure.isLoading?<div role="status" className="admin-v2__empty">Loading your course structure…</div>:structure.isError?<div role="alert" className="admin-v2__empty">{messageOf(structure.error)} <button type="button" className="admin-v2__button" onClick={()=>void structure.refetch()}>Retry</button></div>:<div className="admin-v2__table-scroll">
          {!chapters.length&&<div className="admin-v2__empty">No chapters yet. Add a chapter to start building this course.</div>}
          {chapters.map(chapter=><section key={chapter.id} className="admin-v2__inspector-section"><header><h3>{chapter.title}</h3><small>{chapter.status} · {lessons.filter(item=>item.courseChapterId===chapter.id).length} lessons</small></header>
            {lessons.filter(item=>item.courseChapterId===chapter.id).map(lesson=><button key={lesson.id} type="button" className={`admin-v2__nav-link${selectedLesson?.id===lesson.id?" is-active":""}`} style={{width:"100%",justifyContent:"space-between"}} onClick={()=>setSelectedLessonId(lesson.id)}><span>{lesson.title}</span><span>{lesson.status}</span></button>)}
          </section>)}
        </div>}
        <div className="admin-v2__inspector-content">
          <form className="admin-v2__table-tools" onSubmit={e=>{e.preventDefault();createChapter.mutate();}}><label className="admin-v2__field"><span>New chapter</span><input value={chapterTitle} onChange={e=>setChapterTitle(e.target.value)} maxLength={240} placeholder="e.g. Introduction" /></label><button className="admin-v2__button" type="submit" disabled={!chapterTitle.trim()||createChapter.isPending}><Plus size={13}/>Add chapter</button></form>
          {selectedChapter&&<form className="admin-v2__table-tools" onSubmit={e=>{e.preventDefault();createLesson.mutate();}}><label className="admin-v2__field"><span>Lesson in {selectedChapter.title}</span><input value={lessonTitle} onChange={e=>setLessonTitle(e.target.value)} maxLength={240} placeholder="Lesson title" /></label><label className="admin-v2__field"><span>Description</span><input value={lessonDescription} onChange={e=>setLessonDescription(e.target.value)} maxLength={2000} placeholder="Optional lesson summary" /></label><button className="admin-v2__button" type="submit" disabled={!lessonTitle.trim()||createLesson.isPending}><Plus size={13}/>Add lesson</button></form>}
        </div>
      </section>
      <aside className="admin-v2__inspector admin-v2__course-inspector">
        {!selectedLesson?<div className="admin-v2__empty-inspector"><FileText size={21}/><strong>Select or create a lesson</strong><span>Lesson files stay private until a Super Admin approves the submitted version.</span></div>:<>
          <header className="admin-v2__inspector-title"><div><h2>{selectedLesson.title}</h2><small>{selectedChapter?.title??"Course lesson"} · {selectedLesson.status}</small></div></header>
          {resources.isError&&<p role="alert" className="admin-v2__inline-notice">{messageOf(resources.error)}</p>}
          <div className="admin-v2__inspector-section"><header><h3>Lesson files</h3><span>{lessonResources.length} resources</span></header>
            {lessonResources.map(resource=>{const review=reviewByTarget.get(resource.id);return <div key={resource.id} className="admin-v2__inspector-content"><strong>{resource.title}</strong><small>{resource.resourceKind} · {resource.status} · {review?.status??"Not submitted"}</small>{review?.status==="rejected"&&<p role="alert">Review note: {review.rejectionReason}</p>}</div>;})}
            {!lessonResources.length&&!resources.isLoading&&<div className="admin-v2__empty-inline">No files attached to this lesson yet.</div>}
          </div>
          <form className="admin-v2__inspector-section" onSubmit={e=>{e.preventDefault();uploadResource.mutate();}}><header><h3>Upload video or PDF</h3><Upload size={14}/></header><div className="admin-v2__inspector-content">
            <label className="admin-v2__field"><span>Title</span><input value={resourceTitle} onChange={e=>setResourceTitle(e.target.value)} maxLength={240} required /></label>
            <label className="admin-v2__field"><span>File</span><input type="file" accept=".pdf,application/pdf,.mp4,video/mp4" onChange={e=>setFile(e.target.files?.[0]??null)} required /></label>
            {file?.type==="video/mp4"||file?.name.toLowerCase().endsWith(".mp4")?<label className="admin-v2__field"><span>Video duration (seconds)</span><input type="number" min={1} max={86400} value={videoDuration} onChange={e=>setVideoDuration(e.target.value)} required /></label>:null}
            <p className="admin-v2__muted">Instructor uploads remain private while the backend verifies them. Submit the resource for review; only approval publishes it to students.</p>
            <button className="admin-v2__button is-primary" type="submit" disabled={!file||!resourceTitle.trim()||uploadResource.isPending}>{uploadResource.isPending?"Uploading and verifying…":<><Upload size={13}/>Upload and submit for review</>}</button>
          </div></form>
        </>}
      </aside>
    </div>
  </section>;
}

export default InstructorCourseContentPage;
