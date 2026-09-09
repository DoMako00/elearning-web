import { BookOpen, Plus, Search, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import type { AdminBrandView } from '../../../features/admin/api';
import { adminDeliveryRequest, catalogueBrandAccessPath, type CatalogueBrand, type DeliveryCourse } from '../../../features/admin/api/adminDelivery.http';

export function AdminCoursesPage() {
  const {brandView}=useOutletContext<{brandView:AdminBrandView}>();
  const [brands,setBrands]=useState<CatalogueBrand[]>([]);
  const [courses,setCourses]=useState<DeliveryCourse[]>([]);
  const [brandId,setBrandId]=useState('');
  const [search,setSearch]=useState('');
  const [status,setStatus]=useState('all');
  const [institutionId,setInstitutionId]=useState('');
  const [selectedId,setSelectedId]=useState('');
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [revision,setRevision]=useState(0);
  const [page,setPage]=useState(1);
  useEffect(()=>{
    const controller=new AbortController();setLoading(true);setError('');setCourses([]);setBrands([]);
    void adminDeliveryRequest<CatalogueBrand[]>(catalogueBrandAccessPath,{signal:controller.signal})
      .then(rows=>{
        if(controller.signal.aborted)return;
        if(!Array.isArray(rows))throw new Error('The brand catalogue response is invalid.');
        setBrands(rows);setBrandId(brandView==='all'?'':rows.find(item=>item.code===brandView)?.id??'');
      }).catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Could not load brands.');})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return()=>controller.abort();
  },[brandView,revision]);
  useEffect(()=>{
    if(!brands.length)return;
    const controller=new AbortController();setLoading(true);setError('');setCourses([]);setSelectedId('');
    const selected=brandId?brands.filter(item=>item.id===brandId):brands;
    void Promise.all(selected.map(brand=>adminDeliveryRequest<DeliveryCourse[]>(`/v1/admin/brands/${encodeURIComponent(brand.id)}/courses`,{signal:controller.signal})))
      .then(groups=>{
        if(controller.signal.aborted)return;
        if(groups.some(rows=>!Array.isArray(rows)))throw new Error('The course directory response is invalid.');
        setCourses(groups.flat());
      }).catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Could not load courses.');})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return()=>controller.abort();
  },[brands,brandId]);
  useEffect(()=>setPage(1),[brandId,institutionId,status,search]);
  const filtered=useMemo(()=>courses.filter(course=>
    (status==='all'||course.status===status)&&(!institutionId||course.academicInstitutionId===institutionId)&&
    [course.title,course.code,course.brand.name,course.academicInstitution?.displayName,course.academicModule?.code,course.academicModule?.sourceDisplayLabel,...course.instructorAssignments.map(item=>item.displayName)].join(' ').toLowerCase().includes(search.trim().toLowerCase())
  ).sort((a,b)=>a.title.localeCompare(b.title)),[courses,status,institutionId,search]);
  const institutions=[...new Map(brands.flatMap(brand=>brand.allowedAcademicInstitutions).map(item=>[item.id,item])).values()];
  const selected=courses.find(course=>course.id===selectedId);
  const totalPages=Math.max(1,Math.ceil(filtered.length/10));
  const currentPage=Math.min(page,totalPages);
  const builder=(course:DeliveryCourse)=>`/admin/courses/${encodeURIComponent(course.id)}/builder?brandId=${encodeURIComponent(course.brandId)}`;
  const newCourse=`/admin/courses/new/builder${brandId?`?brandId=${encodeURIComponent(brandId)}`:''}`;
  return <section className="admin-page admin-courses-page" aria-label="Course directory">
    <header className="admin-page-header"><div><h1>Courses</h1><p>Commercial course templates linked to university catalogues.</p></div><Link className="is-primary" to={newCourse}><Plus aria-hidden="true"/>Create course</Link></header>
    <div className="admin-course-filterbar">
      <label>Commercial brand<select value={brandId} onChange={event=>setBrandId(event.target.value)}><option value="">All commercial brands</option>{brands.map(brand=><option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label>
      <label>Academic catalogue<select value={institutionId} onChange={event=>setInstitutionId(event.target.value)}><option value="">All catalogues</option>{institutions.map(item=><option key={item.id} value={item.id}>{item.displayName}</option>)}</select></label>
      <label>Status<select value={status} onChange={event=>setStatus(event.target.value)}><option value="all">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
      <button type="button" disabled={loading} onClick={()=>setRevision(value=>value+1)}>Reload courses</button>
    </div>
    <div className={`admin-courses-workspace${selected?' has-detail':''}`}>
      <article className="admin-course-directory" aria-busy={loading}>
        <header><div><h2>Course directory</h2><span>{loading?'Loading courses…':error?'Courses unavailable':`${filtered.length} courses`}</span></div><label className="admin-course-search"><Search aria-hidden="true"/><input type="search" aria-label="Search courses" placeholder="Search courses…" value={search} onChange={event=>setSearch(event.target.value)}/></label></header>
        {error?<p role="alert" className="builder-empty">{error}</p>:loading?<p role="status" className="builder-empty">Loading course templates…</p>:courses.length===0?<div className="builder-empty"><BookOpen aria-hidden="true"/><h3>No courses yet</h3><p>Create a course by selecting a brand and academic catalogue</p><Link to={newCourse}>Create course</Link></div>:<>
          <div className="admin-course-table-wrap"><table className="admin-course-table"><caption className="admin-sr-only">Commercial courses and their academic catalogues</caption><thead><tr><th>Course title</th><th>Brand</th><th>Academic catalogue</th><th>Linked module</th><th>Instructors</th><th>Status</th><th>Actions</th></tr></thead><tbody>{filtered.slice((currentPage-1)*10,currentPage*10).map(course=><tr key={course.id} className={selectedId===course.id?'is-selected':''}>
            <td><button type="button" className="admin-course-title" onClick={()=>setSelectedId(course.id)}><strong>{course.title}</strong><small>{course.code}</small></button></td>
            <td><span className={`admin-course-brand is-${course.brand.code}`}><ShieldCheck aria-hidden="true"/>{course.brand.name}</span></td>
            <td>{course.academicInstitution?.displayName??'No catalogue assigned'}</td>
            <td className="admin-course-module">{course.academicModule?<><strong>{course.academicModule.code}</strong><span>{course.academicModule.sourceDisplayLabel}</span></>:'Not linked'}</td>
            <td>{course.instructorAssignments.filter(item=>item.status==='active').map(item=>item.displayName).join(', ')||'No instructors assigned'}</td>
            <td><span className={`admin-course-status is-${course.status}`}>{course.status}</span></td><td><Link to={builder(course)}>Build course</Link></td>
          </tr>)}</tbody></table></div>
          {filtered.length===0&&<p className="builder-empty">No courses match these filters.</p>}
          <footer className="admin-course-pagination"><button type="button" disabled={currentPage===1} onClick={()=>setPage(currentPage-1)}>Previous</button><span>Page {currentPage} of {totalPages}</span><button type="button" disabled={currentPage===totalPages} onClick={()=>setPage(currentPage+1)}>Next</button></footer>
        </>}
      </article>
      {selected&&<aside className="admin-course-detail"><header><h2>{selected.title}</h2><button type="button" onClick={()=>setSelectedId('')} aria-label="Close course detail">×</button></header><div className="admin-course-detail__body"><dl className="admin-course-metadata"><div><dt>Commercial brand</dt><dd>{selected.brand.name}</dd></div><div><dt>Academic catalogue</dt><dd>{selected.academicInstitution?.displayName??'Not assigned'}</dd></div><div><dt>Classification</dt><dd>{selected.classification==='academic_module_offering'?'Academic module offering':'Standalone'}</dd></div><div><dt>Linked module</dt><dd>{selected.academicModule?`${selected.academicModule.code} · ${selected.academicModule.sourceDisplayLabel}`:'Not linked'}</dd></div><div><dt>Status</dt><dd>{selected.status}</dd></div></dl><Link to={builder(selected)}>Edit course template and structure</Link></div></aside>}
    </div>
  </section>;
}
