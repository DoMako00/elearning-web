import { useEffect, useRef, useState, type FormEvent } from 'react';
import { adminDeliveryRequest, catalogueBrandAccessPath, catalogueInstitutionsPath, deliveryCoursePath, type CatalogueBrand, type CatalogueInstitution, type DeliveryCourse } from '../api/adminDelivery.http';

/** Uses the existing admin session and writes a draft commercial course only. */
export function AdminCourseTemplateForm({ course, initialBrandId = '', initialInstitutionId = '', initialLevelId = '', initialSemesterId = '', initialModuleId = '', initialCode = '', initialTitle = '', initialCataloguePresentation = 'module_based', onSaved }: {
  course?: DeliveryCourse;
  initialBrandId?: string;
  initialInstitutionId?: string;
  initialLevelId?: string;
  initialSemesterId?: string;
  initialModuleId?: string;
  initialCode?: string;
  initialTitle?: string;
  initialCataloguePresentation?: DeliveryCourse['cataloguePresentation'];
  onSaved: (result:{brandId:string;courseId:string})=>void;
}) {
  const [brands,setBrands]=useState<CatalogueBrand[]>([]);
  const [institutions,setInstitutions]=useState<CatalogueInstitution[]>([]);
  const [brandId,setBrandId]=useState(course?.brandId??initialBrandId);
  const [institutionId,setInstitutionId]=useState(course?.academicInstitutionId??initialInstitutionId);
  const [levelId,setLevelId]=useState(initialLevelId);
  const [semesterId,setSemesterId]=useState(initialSemesterId);
  const [moduleId,setModuleId]=useState(course?.academicModuleId??initialModuleId);
  const [classification,setClassification]=useState<DeliveryCourse['classification']>(course?.classification??'academic_module_offering');
  const [cataloguePresentation,setCataloguePresentation]=useState<DeliveryCourse['cataloguePresentation']>(course?.cataloguePresentation??initialCataloguePresentation??'module_based');
  const [title,setTitle]=useState(course?.title??initialTitle);
  const [code,setCode]=useState(course?.code??initialCode);
  const [reason,setReason]=useState('');
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const [revision,setRevision]=useState(0);
  const pending=useRef<{signature:string;key:string}|undefined>(undefined);
  const busy=useRef(false);
  const mounted=useRef(true);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  useEffect(()=>{
    const controller=new AbortController();setLoading(true);setError('');
    void Promise.all([
      adminDeliveryRequest<CatalogueBrand[]>(catalogueBrandAccessPath,{signal:controller.signal}),
      adminDeliveryRequest<CatalogueInstitution[]>(catalogueInstitutionsPath,{signal:controller.signal}),
    ]).then(([brandRows,institutionRows])=>{
      if(controller.signal.aborted)return;
      if(!Array.isArray(brandRows)||!Array.isArray(institutionRows))throw new Error('The catalogue response is invalid.');
      setBrands(brandRows);setInstitutions(institutionRows);
      const selectedModuleId=course?.academicModuleId??initialModuleId;
      const selectedInstitutionId=course?.academicInstitutionId??initialInstitutionId;
      const institution=institutionRows.find(item=>item.id===selectedInstitutionId)??institutionRows.find(item=>item.levels.some(level=>level.semesters.some(semester=>semester.modules.some(module=>module.id===selectedModuleId))));
      const level=(initialLevelId&&institution?.levels.find(item=>item.id===initialLevelId))||institution?.levels.find(item=>item.semesters.some(semester=>semester.modules.some(module=>module.id===selectedModuleId)));
      const semester=(initialSemesterId&&level?.semesters.find(item=>item.id===initialSemesterId))||level?.semesters.find(item=>item.modules.some(module=>module.id===selectedModuleId));
      setInstitutionId(institution?.id??selectedInstitutionId??'');
      setLevelId(level?.id??initialLevelId);
      setSemesterId(semester?.id??initialSemesterId);
      setModuleId(selectedModuleId);
    }).catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Could not load academic catalogues.');})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return()=>controller.abort();
  },[course?.id,initialInstitutionId,initialLevelId,initialModuleId,initialSemesterId,revision]);

  const brand=brands.find(item=>item.id===brandId&&item.status==='active');
  const allowed=institutions.filter(item=>item.status==='active'&&brand?.allowedAcademicInstitutions.some(access=>access.id===item.id));
  const institution=allowed.find(item=>item.id===institutionId);
  const levels=institution?.levels.filter(item=>item.status==='active')??[];
  const level=levels.find(item=>item.id===levelId);
  const semesters=level?.semesters.filter(item=>item.status==='active')??[];
  const semester=semesters.find(item=>item.id===semesterId);
  const modules=semester?.modules??[];
  const module=modules.find(item=>item.id===moduleId&&!['blocked','retired'].includes(item.reviewStatus));
  const suggestCourseCode=(moduleCode:string)=>`${(brand?.code.trim().slice(0,3).toUpperCase()||'CRS')}-${(moduleCode.trim().replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toUpperCase()||'MODULE')}`.slice(0,80);
  function resetInstitution(id:string){setInstitutionId(id);setLevelId('');setSemesterId('');setModuleId('');}
  async function save(event:FormEvent){
    event.preventDefault();if(busy.current)return;
    if(!brand){setError('Select a commercial brand.');return;}
    if(!institution){setError('Select an academic catalogue allowed for this brand.');return;}
    if(classification==='academic_module_offering'&&!module){setError('Select an available module from this academic catalogue.');return;}
    const path=course?deliveryCoursePath(brandId,course.id):`/v1/admin/brands/${encodeURIComponent(brandId)}/courses`;
    const body={title:title.trim(),classification,cataloguePresentation,academicInstitutionId:institution.id,academicModuleId:classification==='academic_module_offering'?module!.id:null,reason:reason.trim(),...(course?{expectedVersion:course.version}:{code:code.trim()})};
    const signature=JSON.stringify({path,body});
    if(pending.current?.signature!==signature)pending.current={signature,key:crypto.randomUUID()};
    busy.current=true;setSaving(true);setError('');
    try{
      const result=await adminDeliveryRequest<{brandId:string;courseId:string}>(path,{body,key:pending.current.key,method:course?'PATCH':'POST'});
      if(!mounted.current)return;
      pending.current=undefined;onSaved(result);
    }catch(e){if(mounted.current)setError(e instanceof Error?e.message:'Could not save the course template.');}
    finally{busy.current=false;if(mounted.current)setSaving(false);}
  }
  return <form className="builder-panel admin-course-template" onSubmit={save} aria-busy={loading||saving}>
    <header><div><span className="builder-eyebrow">Commercial course · academic reference</span><h2>Course template</h2></div></header>
    {error&&<p role="alert" className="admin-course-dialog__error">{error}</p>}
    {loading?<p role="status">Loading academic catalogues…</p>:<>
      <fieldset disabled={saving} className="admin-course-template__fields">
        <label>Commercial brand<select required disabled={!!course} value={brandId} onChange={event=>{
          const next=brands.find(item=>item.id===event.target.value);setBrandId(event.target.value);
          if(!next?.allowedAcademicInstitutions.some(item=>item.id===institutionId))resetInstitution('');
        }}><option value="">Select a commercial brand</option>{brands.filter(item=>item.status==='active').map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>Academic catalogue<select required disabled={!brand} value={institution?.id??''} onChange={event=>resetInstitution(event.target.value)}><option value="">Select a university catalogue</option>{allowed.map(item=><option key={item.id} value={item.id}>{item.displayName}</option>)}</select></label>
        <label>Course classification<select value={classification} onChange={event=>{setClassification(event.target.value as DeliveryCourse['classification']);setModuleId('');}}><option value="academic_module_offering">Academic module offering</option><option value="standalone">Standalone within this catalogue</option></select></label>
        <label>Course presentation<select value={cataloguePresentation} onChange={event=>setCataloguePresentation(event.target.value as DeliveryCourse['cataloguePresentation'])}><option value="module_based">Module-based course</option><option value="subject_based">Subject-based course</option></select></label>
        <label>Level<select disabled={!institution||classification==='standalone'} required={classification==='academic_module_offering'} value={levelId} onChange={event=>{setLevelId(event.target.value);setSemesterId('');setModuleId('');}}><option value="">Select a level</option>{levels.map(item=><option key={item.id} value={item.id}>{item.displayTitle}</option>)}</select></label>
        <label>Semester<select disabled={!level||classification==='standalone'} required={classification==='academic_module_offering'} value={semesterId} onChange={event=>{setSemesterId(event.target.value);setModuleId('');}}><option value="">Select a semester</option>{semesters.map(item=><option key={item.id} value={item.id}>{item.displayTitle}</option>)}</select></label>
        <label>Module<select disabled={!semester||classification==='standalone'} required={classification==='academic_module_offering'} value={moduleId} onChange={event=>{
          const next=modules.find(item=>item.id===event.target.value);
          setModuleId(event.target.value);
          if(!course&&next){setTitle(current=>current.trim()?current:next.sourceDisplayLabel);setCode(current=>current.trim()?current:suggestCourseCode(next.code));}
        }}><option value="">Select a module</option>{modules.map(item=><option key={item.id} value={item.id} disabled={['blocked','retired'].includes(item.reviewStatus)}>{item.code} · {item.sourceDisplayLabel}{['blocked','retired'].includes(item.reviewStatus)?` (${item.reviewStatus})`:''}</option>)}</select></label>
        <label>Course code<input required maxLength={80} disabled={!!course} value={code} onChange={event=>setCode(event.target.value)} /></label>
        <label>Course title<input required maxLength={240} value={title} onChange={event=>setTitle(event.target.value)} /></label>
        <label className="admin-course-template__reason">Reason for change<input required maxLength={500} value={reason} onChange={event=>setReason(event.target.value)} /></label>
      </fieldset>
      {module&&<div className="builder-empty admin-course-template__module-reference">
        <strong>{module.code} · {module.sourceDisplayLabel}</strong>
        <span>{module.resourceCount} catalogue resource references · Review: {module.reviewStatus}. Metadata references only.</span>
        {module.chapters?.length ? <div className="admin-course-template__chapters" aria-label="Academic chapter outline">
          <strong>Academic chapter outline</strong>
          <ol>{module.chapters.map(chapter=><li key={chapter.id}><span>{chapter.code} · {chapter.title}</span></li>)}</ol>
          <small>These are shared catalogue references. Delivery chapters are created separately in the builder.</small>
        </div> : <span>No chapter outline is registered for this module yet.</span>}
      </div>}
      {brand&&allowed.length===0&&<p>No academic catalogues are available for this brand.</p>}
      <p>New course templates are saved as drafts. Commercial ownership stays with the selected brand.</p>
      <button className="is-primary" type="submit" disabled={saving||!institution||!title.trim()||!code.trim()||!reason.trim()||(classification==='academic_module_offering'&&!module)}>{saving?'Saving…':course?'Save course template':'Create draft course'}</button>
      <button type="button" disabled={saving} onClick={()=>setRevision(value=>value+1)}>Reload catalogue</button>
    </>}
  </form>;
}
