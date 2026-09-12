import { ArrowLeft, BookOpen, CheckCircle2, FileText, Film, FolderPlus, GraduationCap, Layers3, Link2, Plus, Video } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useOutletContext, useParams, useSearchParams, useNavigate } from "react-router-dom";
import type { AdminBrandCode, AdminBrandView } from "../../../features/admin/api";
import { adminDeliveryRequest, deliveryCoursePath, type DeliveryChapter, type DeliveryLesson, type DeliveryResource, type DeliveryCourse, type DeliveryModule, type ResourceKind } from "../../../features/admin/api/adminDelivery.http";

import { AdminCourseTemplateForm } from "../../../features/admin/courses/AdminCourseTemplateForm";

type Resource = DeliveryResource & { kind: ResourceKind };
type Lesson = DeliveryLesson & { resources: Resource[] };
type Chapter = DeliveryChapter & { lessons: Lesson[] };
const labels: Record<ResourceKind, string> = { video: "Video / session metadata", document: "Document / PDF", quiz: "Quiz / exam", file: "File", link: "Link metadata" };

export function AdminCourseBuilderPage() {
  const { courseId } = useParams();
  const [query]=useSearchParams();
  const navigate=useNavigate();
  const { brand, brandView } = useOutletContext<{brandView:AdminBrandView;brand?:{brandId:string;brandCode:AdminBrandCode;brandDisplayName:string}}>();
  const [course,setCourse]=useState<DeliveryCourse>();
  const [module,setModule]=useState<DeliveryModule>();
  const [chapters,setChapters]=useState<Chapter[]>([]);
  const [activeChapter,setActiveChapter]=useState<string>();
  const [activeLesson,setActiveLesson]=useState<string>();
  const [chapterTitle,setChapterTitle]=useState("");
  const [lessonTitle,setLessonTitle]=useState("");
  const [resourceTitle,setResourceTitle]=useState("");
  const [resourceKind,setResourceKind]=useState<ResourceKind>("document");
  const [reason,setReason]=useState("");
  const [resourceStatus,setResourceStatus]=useState<"draft"|"published">("draft");
  const [notice,setNotice]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [revision,setRevision]=useState(0);
  const pending=useRef<{signature:string;key:string}|undefined>(undefined);
  const busy=useRef(false);
  const selectedBrandId=query.get("brandId")??(brandView!=="all"?brand?.brandId:undefined);
  const initialInstitutionId=query.get("institutionId")??"";
  const initialLevelId=query.get("levelId")??"";
  const initialSemesterId=query.get("semesterId")??"";
  const initialModuleId=query.get("moduleId")??"";
  const initialCode=query.get("code")??"";
  const initialTitle=query.get("title")??"";
  const initialCataloguePresentation=query.get("presentation")==="subject_based"?"subject_based":"module_based";
  const scope=selectedBrandId&&courseId&&courseId!=="new"?deliveryCoursePath(selectedBrandId,courseId):"";
  const currentScope=useRef(scope);
  currentScope.current=scope;

  async function loadStructure(path:string,signal?:AbortSignal) {
    const [chapterRows,lessonRows,resourceRows]=await Promise.all([
      adminDeliveryRequest<DeliveryChapter[]>(path+"/chapters",{signal}),
      adminDeliveryRequest<DeliveryLesson[]>(path+"/lessons",{signal}),
      adminDeliveryRequest<DeliveryResource[]>(path+"/resources",{signal}),
    ]);
    if (![chapterRows,lessonRows,resourceRows].every(Array.isArray)) throw new Error("The API returned an invalid course structure.");
    if(currentScope.current!==path||signal?.aborted)return;
    setChapters(chapterRows.map(ch=>({...ch,lessons:lessonRows.filter(ls=>ls.courseChapterId===ch.id).map(ls=>({...ls,resources:resourceRows.filter(r=>r.courseLessonId===ls.id).map(r=>({...r,kind:r.resourceKind}))}))})));
  }
  useEffect(()=>{
    const controller=new AbortController();
    setCourse(undefined);setModule(undefined);setChapters([]);setError("");setLoading(true);
    setActiveChapter(undefined);setActiveLesson(undefined);setChapterTitle("");setLessonTitle("");setResourceTitle("");setReason("");setNotice("");pending.current=undefined;
    if(!scope){setLoading(false);return;}
    void (async()=>{
      try {
        const loaded=await adminDeliveryRequest<DeliveryCourse>(scope,{signal:controller.signal});
        if(loaded.id!==courseId||loaded.brandId!==selectedBrandId)throw new Error("The API returned a different course context.");
        const academic=loaded.academicModuleId?await adminDeliveryRequest<DeliveryModule>("/v1/admin/curriculum/modules/"+encodeURIComponent(loaded.academicModuleId),{signal:controller.signal}):undefined;
        await loadStructure(scope,controller.signal);
        if(!controller.signal.aborted){setCourse(loaded);setModule(academic);}
      }catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Could not load course delivery.");}
      finally{if(!controller.signal.aborted)setLoading(false);}
    })();
    return()=>controller.abort();
  },[scope,revision]);

  const chapter=chapters.find(item=>item.id===activeChapter)??chapters[0];
  const lesson=chapter?.lessons.find(item=>item.id===activeLesson)??chapter?.lessons[0];
  const resourceIcon=(kind:ResourceKind)=>kind==="video"?<Video aria-hidden="true"/>:kind==="document"||kind==="file"?<FileText aria-hidden="true"/>:kind==="link"?<Link2 aria-hidden="true"/>:<CheckCircle2 aria-hidden="true"/>;
  const nextOrder=(items:readonly {sortOrder:number}[])=>Math.max(0,...items.map(item=>item.sortOrder))+1;
  async function save(entity:"chapters"|"lessons"|"resources",fields:Record<string,unknown>) {
    if(!course||!scope||busy.current||course.id!==courseId||course.brandId!==selectedBrandId)return;
    if(!reason.trim()){setError("Enter a reason for this change.");return;}
    const path=scope;
    const body={...fields,reason:reason.trim()};
    const signature=JSON.stringify({path,entity,body});
    if(pending.current?.signature!==signature)pending.current={signature,key:crypto.randomUUID()};
    busy.current=true;setSaving(true);setError("");setNotice("");
    try {
      const result=await adminDeliveryRequest<{recordId:string}>(path+"/"+entity,{body,key:pending.current.key,method:"POST"});
      if(currentScope.current!==path)return;
      pending.current=undefined;
      if(entity==="chapters"){setChapterTitle("");setActiveChapter(result.recordId);}
      if(entity==="lessons"){setLessonTitle("");setActiveLesson(result.recordId);}
      if(entity==="resources")setResourceTitle("");
      setNotice("Metadata saved. No file content was uploaded.");
      try {await loadStructure(path);}catch {setError("Metadata was saved, but refreshing failed. Reload before adding more.");setCourse(undefined);}
    }catch(e){if(currentScope.current===path)setError(e instanceof Error?e.message:"Could not save metadata.");}
    finally{busy.current=false;setSaving(false);}
  }
  const addChapter=()=>{if(chapterTitle.trim())void save("chapters",{title:chapterTitle.trim(),sortOrder:nextOrder(chapters),status:"draft"});};
  const addLesson=()=>{if(chapter&&lessonTitle.trim())void save("lessons",{title:lessonTitle.trim(),courseChapterId:chapter.id,sortOrder:nextOrder(chapter.lessons),status:"draft"});};
  const addResource=()=>{if(lesson&&resourceTitle.trim())void save("resources",{title:resourceTitle.trim(),courseLessonId:lesson.id,resourceKind,sortOrder:nextOrder(lesson.resources),status:resourceKind==="video"?"draft":resourceStatus});};
  const totals=useMemo(()=>({lessons:chapters.reduce((n,ch)=>n+ch.lessons.length,0),resources:chapters.reduce((n,ch)=>n+ch.lessons.reduce((m,ls)=>m+ls.resources.length,0),0)}),[chapters]);

  if(courseId==="new")return <section className="admin-page admin-course-builder"><Link to="/admin/courses">Back to courses</Link><h1>Create course</h1><AdminCourseTemplateForm key={`${selectedBrandId??"new"}:${initialModuleId}:${initialCataloguePresentation}`} initialBrandId={selectedBrandId} initialInstitutionId={initialInstitutionId} initialLevelId={initialLevelId} initialSemesterId={initialSemesterId} initialModuleId={initialModuleId} initialCode={initialCode} initialTitle={initialTitle} initialCataloguePresentation={initialCataloguePresentation} onSaved={result=>navigate(`/admin/courses/${result.courseId}/builder?brandId=${encodeURIComponent(result.brandId)}`,{replace:true})}/></section>;
  if(!scope)return <section className="admin-page"><h1>Course builder</h1><p>Select the course's brand to manage delivery.</p><Link to="/admin/courses">Back to courses</Link></section>;
  if(loading||!course)return <section className="admin-page" aria-busy={loading}><h1>Course builder</h1>{loading?<p>Loading course and module context…</p>:<><p role="alert">{error||"Course unavailable."}</p><button type="button" onClick={()=>setRevision(value=>value+1)}>Reload</button></>}<Link to="/admin/courses">Back to courses</Link></section>;
  return <section className="admin-page admin-course-builder" aria-label="Course content builder">
    <header className="admin-course-builder__header"><div><Link className="admin-course-builder__back" to="/admin/courses"><ArrowLeft aria-hidden="true" />Back to courses</Link><div className="admin-course-builder__title"><div className={`admin-course-cover is-${course.brand.code}`}><BookOpen aria-hidden="true" /></div><div><span className={`admin-course-brand is-${course.brand.code}`}>{course.brand.name}</span><h1>{course.title}</h1><p>{module ? `${module.code} · ${module.sourceDisplayLabel}` : "Standalone course"}</p></div></div></div><div className="admin-course-builder__actions"><button type="button" disabled={saving} onClick={() => setRevision(value=>value+1)}>Reload structure</button><button type="button" disabled>Upload pending storage integration</button></div></header>
    <AdminCourseTemplateForm key={`${course.id}:${course.version}`} course={course} onSaved={()=>setRevision(value=>value+1)}/>
    <div className="admin-course-builder__notice" role="status"><Layers3 aria-hidden="true" /><span><strong>Course structure workspace</strong> Organize chapters, lessons, and resources against the approved academic module. Metadata only. Binary storage and uploads are not connected.</span></div>
    {error && <p role="alert" className="admin-course-builder__notice">{error}</p>}
    <label className="builder-inline-form">Reason for change<input maxLength={500} value={reason} disabled={saving} onChange={event=>setReason(event.target.value)} placeholder="Explain this metadata change" /></label>
    <div className="admin-course-builder__grid"><aside className="admin-course-builder__outline"><header><div><h2>Course outline</h2><span>{chapters.length} chapters · {totals.lessons} lessons · {totals.resources} resources</span></div><FolderPlus aria-hidden="true" /></header>{chapters.length===0 && <p className="builder-empty">No chapters yet. Add the first chapter below.</p>}{chapters.map((item) => <div className="builder-chapter" key={item.id}><button className={item.id === chapter?.id ? "is-active" : ""} type="button" onClick={() => { setActiveChapter(item.id); setActiveLesson(item.lessons[0]?.id); }}><span>{item.title}</span><small>{item.lessons.length}</small></button>{item.id === chapter?.id && item.lessons.map((entry) => <button className={`builder-lesson${entry.id === lesson?.id ? " is-active" : ""}`} key={entry.id} type="button" onClick={() => setActiveLesson(entry.id)}><span>{entry.title}</span><small>{entry.resources.length}</small></button>)}</div>)}<div className="builder-inline-form"><input disabled={saving} maxLength={240} aria-label="New chapter title" value={chapterTitle} onChange={(event) => setChapterTitle(event.target.value)} placeholder="New chapter title" /><button type="button" disabled={saving||!chapterTitle.trim()||!reason.trim()} onClick={addChapter} aria-label="Add chapter"><Plus aria-hidden="true" /></button></div></aside>
      <main className="admin-course-builder__main"><div className="builder-panel"><header><div><span className="builder-eyebrow">{chapter?.title ?? "Select a chapter"}</span><h2>{lesson?.title ?? "Add your first lesson"}</h2></div><GraduationCap aria-hidden="true" /></header>{lesson ? <div className="builder-resources"><div className="builder-section-label">Resources in this lesson</div>{lesson.resources.map((item) => <div className="builder-resource" key={item.id}>{resourceIcon(item.kind)}<div><strong>{item.title}</strong><span>{labels[item.kind]}</span></div><span className={`builder-resource-status is-${item.status}`}>{item.kind === "video" ? `${item.status} · approval not connected` : item.status === "published" ? "Published metadata" : item.status === "archived" ? "Archived" : "Draft"}</span></div>)}{lesson.resources.length === 0 && <div className="builder-empty">No resources yet. Add a PDF, exam, link, or session below.</div>}<div className="builder-add-resource"><input disabled={saving} maxLength={240} aria-label="Resource title" value={resourceTitle} onChange={(event) => setResourceTitle(event.target.value)} placeholder="Resource title" /><select disabled={saving} aria-label="Resource type" value={resourceKind} onChange={(event) => setResourceKind(event.target.value as ResourceKind)}>{Object.entries(labels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><select aria-label="Resource metadata status" disabled={saving||resourceKind==="video"} value={resourceKind==="video"?"draft":resourceStatus} onChange={event=>setResourceStatus(event.target.value as "draft"|"published")}><option value="draft">Draft metadata</option><option value="published">Published metadata</option></select><button className="is-primary" type="button" disabled={saving||!lesson||!resourceTitle.trim()||!reason.trim()} onClick={addResource}><Plus aria-hidden="true" />Add resource</button></div><p className="builder-policy"><Film aria-hidden="true" /><span><strong>Publishing policy:</strong> documents, files, quizzes, and links may have published metadata; no content has been uploaded. Video/session metadata stays Draft. Approval and binary storage are not connected.</span></p></div> : <div className="builder-empty builder-empty--lesson">Create a lesson from the form below to start adding resources.</div>}<div className="builder-add-lesson"><input disabled={saving} maxLength={240} aria-label="New lesson title" value={lessonTitle} onChange={(event) => setLessonTitle(event.target.value)} placeholder="Lesson title" /><button type="button" disabled={saving||!chapter||!lessonTitle.trim()||!reason.trim()} onClick={addLesson}><Plus aria-hidden="true" />Add lesson to {chapter?.title ?? "chapter"}</button></div></div><div className="builder-panel builder-panel--guide"><h3>How this maps to the curriculum</h3><p>{module ? `This course is anchored to ${module.code} ${module.sourceDisplayLabel}. Keep each chapter and lesson focused on that approved module; do not create a second academic module from the builder.` : "This is a standalone course with no shared academic module mapping."}</p></div></main>
    </div>{module?.chapters?.length ? <section className="builder-panel builder-panel--academic-outline" aria-label="Academic chapter outline"><header><div><span className="builder-eyebrow">Shared academic reference</span><h2>{module.code} chapter outline</h2></div><GraduationCap aria-hidden="true" /></header><p>Use the approved catalogue outline as a guide. These references do not become delivery chapters until you add them to this course.</p><ol>{module.chapters.map((academicChapter)=><li key={academicChapter.id}><span><strong>{academicChapter.code}</strong> {academicChapter.title}</span><button type="button" disabled={saving} onClick={()=>setChapterTitle(academicChapter.title)}>Use as new chapter</button></li>)}</ol></section> : null}{notice && <div className="admin-course-toast" role="status">{notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss notice">×</button></div>}
  </section>;
}
