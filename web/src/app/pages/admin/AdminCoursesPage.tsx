import { ArrowLeft, BookOpen, Layers3, Plus, Search, ShieldCheck, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import type { AdminBrandView } from '../../../features/admin/api';
import {
  adminDeliveryRequest,
  catalogueBrandAccessPath,
  catalogueInstitutionsPath,
  type CatalogueBrand,
  type CatalogueInstitution,
  type CatalogueLevel,
  type CatalogueModule,
  type CatalogueSemester,
  type DeliveryCourse,
} from '../../../features/admin/api/adminDelivery.http';

type CourseModuleContext = {
  institution: CatalogueInstitution;
  level: CatalogueLevel;
  semester: CatalogueSemester;
  module: CatalogueModule;
};

type ExistingCourseRow = {
  kind: 'course';
  id: string;
  course: DeliveryCourse;
  context?: CourseModuleContext;
};

type ModuleTemplateRow = CourseModuleContext & {
  kind: 'module-template';
  id: string;
  brand: CatalogueBrand;
};

type CourseDirectoryRow = ExistingCourseRow | ModuleTemplateRow;

const PAGE_SIZE = 10;

function activeInstructorLabel(course: DeliveryCourse) {
  return course.instructorAssignments.filter((item) => item.status === 'active').map((item) => item.displayName).join(', ') || 'Unassigned';
}

function safeCourseCode(brandCode: string, moduleCode: string) {
  const prefix = brandCode.trim().slice(0, 3).toUpperCase() || 'CRS';
  const code = moduleCode.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toUpperCase() || 'MODULE';
  return `${prefix}-${code}`.slice(0, 80);
}

function moduleTemplateLink(row: ModuleTemplateRow) {
  const params = new URLSearchParams({
    brandId: row.brand.id,
    institutionId: row.institution.id,
    levelId: row.level.id,
    semesterId: row.semester.id,
    moduleId: row.module.id,
    code: safeCourseCode(row.brand.code, row.module.code),
    title: row.module.sourceDisplayLabel,
  });
  return `/admin/courses/new/builder?${params.toString()}`;
}

function rowSearchText(row: CourseDirectoryRow) {
  if (row.kind === 'course') {
    return [
      row.course.title,
      row.course.code,
      row.course.brand.name,
      row.course.academicInstitution?.displayName,
      row.course.academicModule?.code,
      row.course.academicModule?.sourceDisplayLabel,
      row.context?.level.displayTitle,
      row.context?.semester.displayTitle,
      activeInstructorLabel(row.course),
    ].join(' ');
  }
  return [
    row.module.sourceDisplayLabel,
    row.module.code,
    row.brand.name,
    row.institution.displayName,
    row.level.displayTitle,
    row.semester.displayTitle,
    row.module.reviewStatus,
  ].join(' ');
}

function rowSortKey(row: CourseDirectoryRow) {
  if (row.kind === 'course') return `0:${row.course.title}`;
  return `1:${row.institution.displayName}:${row.level.levelNumber}:${row.semester.semesterNumber}:${row.module.code}`;
}

export function AdminCoursesPage() {
  const { brandView } = useOutletContext<{brandView:AdminBrandView}>();
  const [brands, setBrands] = useState<CatalogueBrand[]>([]);
  const [institutions, setInstitutions] = useState<CatalogueInstitution[]>([]);
  const [courses, setCourses] = useState<DeliveryCourse[]>([]);
  const [brandId, setBrandId] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  const [levelId, setLevelId] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [catalogueLoading, setCatalogueLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const controller = new AbortController();
    setCatalogueLoading(true);
    setError('');
    setCourses([]);
    setBrands([]);
    setInstitutions([]);
    setSelectedId('');
    void Promise.all([
      adminDeliveryRequest<CatalogueBrand[]>(catalogueBrandAccessPath, { signal: controller.signal }),
      adminDeliveryRequest<CatalogueInstitution[]>(catalogueInstitutionsPath, { signal: controller.signal }),
    ]).then(([brandRows, institutionRows]) => {
      if (controller.signal.aborted) return;
      if (!Array.isArray(brandRows) || !Array.isArray(institutionRows)) throw new Error('The academic catalogue response is invalid.');
      setBrands(brandRows);
      setInstitutions(institutionRows);
      setBrandId(brandView === 'all' ? '' : brandRows.find((item) => item.code === brandView)?.id ?? '');
      setInstitutionId('');
      setLevelId('');
      setSemesterId('');
    }).catch((e) => {
      if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Could not load the academic catalogue.');
    }).finally(() => {
      if (!controller.signal.aborted) setCatalogueLoading(false);
    });
    return () => controller.abort();
  }, [brandView, revision]);

  useEffect(() => {
    if (!brands.length) {
      setCourses([]);
      return;
    }
    const controller = new AbortController();
    setCoursesLoading(true);
    setError('');
    setCourses([]);
    const selectedBrands = brandId ? brands.filter((item) => item.id === brandId) : brands;
    void Promise.all(selectedBrands.map((brand) => adminDeliveryRequest<DeliveryCourse[]>(`/v1/admin/brands/${encodeURIComponent(brand.id)}/courses`, { signal: controller.signal })))
      .then((groups) => {
        if (controller.signal.aborted) return;
        if (groups.some((rows) => !Array.isArray(rows))) throw new Error('The course directory response is invalid.');
        setCourses(groups.flat());
      }).catch((e) => {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Could not load courses.');
      }).finally(() => {
        if (!controller.signal.aborted) setCoursesLoading(false);
      });
    return () => controller.abort();
  }, [brands, brandId]);

  useEffect(() => setPage(1), [brandId, institutionId, levelId, semesterId, status, search]);

  const selectedBrands = useMemo(() => {
    const active = brands.filter((item) => item.status === 'active');
    return brandId ? active.filter((item) => item.id === brandId) : active;
  }, [brandId, brands]);

  const moduleContextById = useMemo(() => {
    const map = new Map<string, CourseModuleContext>();
    for (const institution of institutions) {
      for (const level of institution.levels) {
        for (const semester of level.semesters) {
          for (const module of semester.modules) {
            map.set(module.id, { institution, level, semester, module });
          }
        }
      }
    }
    return map;
  }, [institutions]);

  const allowedInstitutions = useMemo(() => {
    const allowedIds = new Set(selectedBrands.flatMap((brand) => brand.allowedAcademicInstitutions.map((item) => item.id)));
    return institutions.filter((item) => item.status === 'active' && allowedIds.has(item.id));
  }, [institutions, selectedBrands]);

  const levels = useMemo(() => {
    const source = institutionId ? allowedInstitutions.filter((item) => item.id === institutionId) : allowedInstitutions;
    return [...new Map(source.flatMap((institution) => institution.levels.filter((level) => level.status === 'active')).map((level) => [level.id, level])).values()]
      .sort((a, b) => a.levelNumber - b.levelNumber);
  }, [allowedInstitutions, institutionId]);

  const semesters = useMemo(() => {
    const source = institutionId ? allowedInstitutions.filter((item) => item.id === institutionId) : allowedInstitutions;
    return [...new Map(source.flatMap((institution) => institution.levels)
      .filter((level) => !levelId || level.id === levelId)
      .flatMap((level) => level.semesters.filter((semester) => semester.status === 'active'))
      .map((semester) => [semester.id, semester])).values()].sort((a, b) => a.semesterNumber - b.semesterNumber);
  }, [allowedInstitutions, institutionId, levelId]);

  const templateRows = useMemo<ModuleTemplateRow[]>(() => {
    const existingModuleKeys = new Set(courses.filter((course) => course.academicModuleId).map((course) => `${course.brandId}:${course.academicModuleId}`));
    return selectedBrands.flatMap((brand) => brand.allowedAcademicInstitutions.flatMap((access) => {
      const institution = institutions.find((item) => item.id === access.id && item.status === 'active');
      if (!institution) return [];
      return institution.levels.filter((level) => level.status === 'active').flatMap((level) => level.semesters.filter((semester) => semester.status === 'active').flatMap((semester) => semester.modules
        .filter((module) => !['blocked', 'retired'].includes(module.reviewStatus))
        .filter((module) => !existingModuleKeys.has(`${brand.id}:${module.id}`))
        .map((module) => ({ kind: 'module-template' as const, id: `module-template:${brand.id}:${module.id}`, brand, institution, level, semester, module }))));
    }));
  }, [courses, institutions, selectedBrands]);

  const rows = useMemo<CourseDirectoryRow[]>(() => [
    ...courses.map((course): ExistingCourseRow => ({ kind: 'course', id: `course:${course.id}`, course, context: course.academicModuleId ? moduleContextById.get(course.academicModuleId) : undefined })),
    ...templateRows,
  ], [courses, moduleContextById, templateRows]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const context = row.kind === 'course' ? row.context : row;
      const rowStatus = row.kind === 'course' ? row.course.status : 'ready';
      return (status === 'all' || rowStatus === status)
        && (!institutionId || context?.institution.id === institutionId)
        && (!levelId || context?.level.id === levelId)
        && (!semesterId || context?.semester.id === semesterId)
        && (!query || rowSearchText(row).toLowerCase().includes(query));
    }).sort((a, b) => rowSortKey(a).localeCompare(rowSortKey(b)));
  }, [institutionId, levelId, rows, search, semesterId, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const selected = filtered.find((row) => row.id === selectedId) ?? filtered[0];
  const newCourse = selected?.kind === 'module-template'
    ? moduleTemplateLink(selected)
    : `/admin/courses/new/builder${brandId ? `?brandId=${encodeURIComponent(brandId)}` : ''}`;
  const loading = catalogueLoading || coursesLoading;
  const rowCountLabel = loading ? 'Loading courses…' : error ? 'Courses unavailable' : `${filtered.length} course templates`;

  return <section className="admin-page admin-courses admin-courses-page" aria-label="Course directory">
    <header className="admin-page-header">
      <div><h1>Courses</h1><p>Manage brand-owned courses, map them to curriculum modules, and track delivery readiness.</p></div>
      <Link className="is-primary" to={newCourse}><Plus aria-hidden="true" />Create course</Link>
    </header>
    <div className="admin-course-filterbar">
      <label>Commercial brand<select value={brandId} onChange={(event) => { setBrandId(event.target.value); setInstitutionId(''); setLevelId(''); setSemesterId(''); }}><option value="">All commercial brands</option>{brands.filter((brand) => brand.status === 'active').map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label>
      <label>Academic catalogue<select value={institutionId} onChange={(event) => { setInstitutionId(event.target.value); setLevelId(''); setSemesterId(''); }}><option value="">All catalogues</option>{allowedInstitutions.map((item) => <option key={item.id} value={item.id}>{item.displayName}</option>)}</select></label>
      <label>Academic level<select value={levelId} onChange={(event) => { setLevelId(event.target.value); setSemesterId(''); }}><option value="">All levels</option>{levels.map((item) => <option key={item.id} value={item.id}>{item.displayTitle}</option>)}</select></label>
      <label>Semester<select value={semesterId} onChange={(event) => setSemesterId(event.target.value)}><option value="">All semesters</option>{semesters.map((item) => <option key={item.id} value={item.id}>{item.displayTitle}</option>)}</select></label>
      <label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="ready">Ready to create</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
      <button type="button" className="admin-course-reset" disabled={loading} onClick={() => setRevision((value) => value + 1)}>Reload courses</button>
    </div>
    <div className={`admin-courses-workspace${selected ? ' has-detail' : ''}`}>
      <article className="admin-course-directory" aria-busy={loading}>
        <header>
          <div><h2>Course directory</h2><span>{rowCountLabel}</span></div>
          <label className="admin-course-search"><Search aria-hidden="true" /><input type="search" aria-label="Search courses and academic modules" placeholder="Search courses or modules…" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        </header>
        {error ? <p role="alert" className="builder-empty">{error}</p> : loading ? <p role="status" className="builder-empty">Loading course templates…</p> : rows.length === 0 ? <div className="builder-empty"><BookOpen aria-hidden="true" /><h3>No catalogue modules are available</h3><p>Load academic catalogues first, then create commercial courses from module templates.</p><button type="button" onClick={() => setRevision((value) => value + 1)}>Reload catalogue</button></div> : <>
          <div className="admin-course-table-wrap">
            <table className="admin-course-table">
              <caption className="admin-sr-only">Commercial courses and academic module templates</caption>
              <thead><tr><th>Course title</th><th>Brand</th><th>Scope</th><th>Linked module</th><th>Lead instructor</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((row) => {
                const isSelected = selected?.id === row.id;
                if (row.kind === 'course') return <tr key={row.id} className={isSelected ? 'is-selected' : ''}>
                  <td><button type="button" className="admin-course-title" onClick={() => setSelectedId(row.id)}><strong>{row.course.title}</strong><small>{row.course.code}</small><em>Selected</em></button></td>
                  <td><span className={`admin-course-brand is-${row.course.brand.code}`}><ShieldCheck aria-hidden="true" />{row.course.brand.name}</span></td>
                  <td>{row.course.classification === 'academic_module_offering' ? 'Curriculum' : 'Standalone'}</td>
                  <td className="admin-course-module">{row.course.academicModule ? <><strong>{row.course.academicModule.code}</strong><span>{row.course.academicModule.sourceDisplayLabel}</span></> : 'Not linked'}</td>
                  <td><span className={activeInstructorLabel(row.course) === 'Unassigned' ? 'admin-course-unassigned' : undefined}>{activeInstructorLabel(row.course)}</span></td>
                  <td><span className={`admin-course-status is-${row.course.status}`}><i />{row.course.status}</span></td>
                  <td><Link className="admin-course-action-link" to={`/admin/courses/${encodeURIComponent(row.course.id)}/builder?brandId=${encodeURIComponent(row.course.brandId)}`}>Build</Link></td>
                </tr>;
                return <tr key={row.id} className={`is-template${isSelected ? ' is-selected' : ''}`}>
                  <td><button type="button" className="admin-course-title" onClick={() => setSelectedId(row.id)}><strong>{row.module.sourceDisplayLabel}</strong><small>{row.institution.displayName} · {row.level.displayTitle} · {row.semester.displayTitle}</small><em>Selected</em></button></td>
                  <td><span className={`admin-course-brand is-${row.brand.code}`}><ShieldCheck aria-hidden="true" />{row.brand.name}</span></td>
                  <td>Curriculum</td>
                  <td className="admin-course-module"><strong>{row.module.code}</strong><span>{row.module.sourceDisplayLabel}</span></td>
                  <td><span className="admin-course-unassigned">Unassigned</span></td>
                  <td><span className="admin-course-status is-ready"><i />Ready</span></td>
                  <td><Link className="admin-course-action-link" to={moduleTemplateLink(row)}>New course</Link></td>
                </tr>;
              })}</tbody>
            </table>
          </div>
          {filtered.length === 0 && <p className="builder-empty">No courses or modules match these filters.</p>}
          <footer className="admin-course-pagination"><button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button><span>Page {currentPage} of {totalPages}</span><button type="button" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>Next</button></footer>
        </>}
      </article>
      {selected && <CourseDetailPanel row={selected} onClose={() => setSelectedId('')} />}
    </div>
  </section>;
}

function CourseDetailPanel({ row, onClose }: { row: CourseDirectoryRow; onClose: () => void }) {
  if (row.kind === 'course') {
    return <aside className="admin-course-detail" aria-label="Course details">
      <div className="admin-course-detail__top"><Link to="/admin/courses"><ArrowLeft aria-hidden="true" />Back to courses</Link><Link className="admin-course-new" to={`/admin/courses/${encodeURIComponent(row.course.id)}/builder?brandId=${encodeURIComponent(row.course.brandId)}`}>Build course</Link></div>
      <div className="admin-course-detail__identity"><div className={`admin-course-cover is-${row.course.brand.code}`}><BookOpen aria-hidden="true" /></div><div><h2>{row.course.title}</h2><span className={`admin-course-status is-${row.course.status}`}><i />{row.course.status}</span><span className={`admin-course-brand is-${row.course.brand.code}`}><ShieldCheck aria-hidden="true" />{row.course.brand.name}</span><small>{row.course.code}</small></div><button type="button" className="admin-course-detail__close" onClick={onClose} aria-label="Close course details"><X aria-hidden="true" /></button></div>
      <div className="admin-course-detail__body"><dl className="admin-course-metadata"><div><dt>Scope</dt><dd>{row.course.classification === 'academic_module_offering' ? 'Curriculum' : 'Standalone'}</dd></div><div><dt>Linked module</dt><dd>{row.course.academicModule ? `${row.course.academicModule.code} ${row.course.academicModule.sourceDisplayLabel}` : 'Not linked'}</dd></div><div><dt>Academic catalogue</dt><dd>{row.course.academicInstitution?.displayName ?? 'Not assigned'}</dd></div><div><dt>Brand</dt><dd>{row.course.brand.name}</dd></div><div><dt>Version</dt><dd>{row.course.version}</dd></div><div><dt>Last updated</dt><dd>{new Date(row.course.updatedAt).toLocaleDateString()}</dd></div></dl><section className="admin-course-assignments"><header><div><h3>Course-Instructor Assignments <span>{row.course.instructorAssignments.length}</span></h3><p>Assignments are managed after the course template exists.</p></div><button type="button" disabled>Manage</button></header>{row.course.instructorAssignments.length ? <ul>{row.course.instructorAssignments.map((item) => <li key={item.instructorId}><b>{item.displayName.slice(0, 2).toUpperCase()}</b><span><strong>{item.displayName}</strong><small>{item.status}</small></span></li>)}</ul> : <p className="admin-course-assignment-empty">No instructors assigned yet.</p>}</section><div className="admin-course-actions"><Link to={`/admin/courses/${encodeURIComponent(row.course.id)}/builder?brandId=${encodeURIComponent(row.course.brandId)}`}><Layers3 aria-hidden="true" /><span>Edit course template and structure</span><small>Manage the course shell, chapters, lessons, and metadata.</small></Link></div></div>
    </aside>;
  }
  return <aside className="admin-course-detail" aria-label="Academic module template details">
    <div className="admin-course-detail__top"><Link to="/admin/courses"><ArrowLeft aria-hidden="true" />Back to courses</Link><Link className="admin-course-new" to={moduleTemplateLink(row)}><Plus aria-hidden="true" />New Course</Link></div>
    <div className="admin-course-detail__identity"><div className={`admin-course-cover is-${row.brand.code}`}><BookOpen aria-hidden="true" /></div><div><h2>{row.module.sourceDisplayLabel}</h2><span className="admin-course-status is-ready"><i />Ready template</span><span className={`admin-course-brand is-${row.brand.code}`}><ShieldCheck aria-hidden="true" />{row.brand.name}</span><small>{row.module.code}</small></div><button type="button" className="admin-course-detail__close" onClick={onClose} aria-label="Close module details"><X aria-hidden="true" /></button></div>
    <div className="admin-course-detail__body"><dl className="admin-course-metadata"><div><dt>Scope</dt><dd>Curriculum</dd></div><div><dt>Linked module</dt><dd>{row.module.code} {row.module.sourceDisplayLabel}</dd></div><div><dt>Academic catalogue</dt><dd>{row.institution.displayName}</dd></div><div><dt>Commercial brand</dt><dd>{row.brand.name}</dd></div><div><dt>Academic level</dt><dd>{row.level.displayTitle}</dd></div><div><dt>Semester</dt><dd>{row.semester.displayTitle}</dd></div><div><dt>Review state</dt><dd>{row.module.reviewStatus}</dd></div><div><dt>Resource refs</dt><dd>{row.module.resourceCount}</dd></div></dl><section className="admin-course-assignments"><header><div><h3>Course-Instructor Assignments <span>0</span></h3><p>Create the course first, then assign instructors to this brand-owned template.</p></div><button type="button" disabled>Manage</button></header><p className="admin-course-assignment-empty">No instructors assigned because this is still an academic module template.</p></section><div className="admin-course-actions"><Link to={moduleTemplateLink(row)}><Plus aria-hidden="true" /><span>Create course from this module</span><small>Preselects brand, catalogue, level, semester, and module in the Course Builder.</small></Link><button type="button" disabled><Layers3 aria-hidden="true" /><span>Module outline</span><small>{row.module.chapters.length ? `${row.module.chapters.length} academic chapters available after creation.` : 'No academic chapter outline registered yet.'}</small></button></div></div>
  </aside>;
}
