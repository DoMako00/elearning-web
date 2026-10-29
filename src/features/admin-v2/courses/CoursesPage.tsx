import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronRight, Copy, Filter, Pencil, Plus, Search, SlidersHorizontal, Users, Archive, X } from "lucide-react";
import humanAnatomy from "../../../Assets/course-library/human-anatomy.webp";
import medicalPhysiology from "../../../Assets/course-library/medical-physiology.webp";
import histologyBasics from "../../../Assets/course-library/histology-basics.webp";
import biochemistryEssentials from "../../../Assets/course-library/biochemistry-essentials.webp";
import { AdminV2DomainStatus, useAdminV2 } from "../layout/AdminV2Layout";
import { assignInstructor, createBrandCourse, getCourse as getCourseDto, listBrandAccess, listInstructorBrands, setCourseStatus } from "../api/adminAcademicApi";
import { BrandBadge, ConfirmDialog, Drawer, FormActions, FormField, StatusBadge } from "../shared/AdminV2Primitives";
import { InspectorFields, InspectorSection, Pagination, TableFrame } from "../shared/AdminV2Table";
import type { AdminV2Data, BrandCode, BrandFilter, CourseRecord } from "../types/adminV2.types";
import "./courses.css";
import { courseLevel, courseSemester, courseUnitLabel, expectedUnitType, institutionForBrand, institutionForUnit, semesterForUnit, unitForCourse, yearForUnit } from "../data/adminV2.selectors";

const PAGE_SIZE = 10;
export function CoursesPage() {
  const { data, setData, brand, setBrand, globalSearch, refreshServerDomains } = useAdminV2();
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState("all");
  const [level, setLevel] = useState("all");
  const [semester, setSemester] = useState("all");
  const [instructor, setInstructor] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState("c-101");
  const [editing, setEditing] = useState<CourseRecord | null | false>(false);
  const [confirmId, setConfirmId] = useState("");
  const [notice, setNotice] = useState("");
  const [formBrand, setFormBrand] = useState<BrandCode>("medway");
  const [formScope, setFormScope] = useState<CourseRecord["scope"]>("Curriculum");
  const [institutionId, setInstitutionId] = useState(data.institutions[0]?.id ?? "");
  const [yearId, setYearId] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [unitId, setUnitId] = useState("");
  const query = (search || globalSearch).toLowerCase();
  const formYears = data.academicYears.filter((year) => data.curricula.some((item) => item.id === year.curriculumId && item.institutionId === institutionId) && year.status === "Active");
  const formSemesters = data.semesters.filter((item) => item.academicYearId === yearId && item.status === "Active");
  const formYear = formYears.find((item) => item.id === yearId);
  const formUnits = data.curriculumUnits.filter((item) => item.institutionId === institutionId && item.academicYearId === yearId && item.semesterId === semesterId && item.status === "Approved");
  const instructorOptions = data.instructors;
  const defaultPlacementForBrand = (targetBrand: BrandCode) => {
    const targetInstitution = institutionForBrand(data, targetBrand);
    const nextYear = data.academicYears.find((item) =>
      item.status === "Active" &&
      data.curricula.some((curriculum) => curriculum.id === item.curriculumId && curriculum.institutionId === targetInstitution?.id),
    );
    const nextSemester = data.semesters.find((item) => item.academicYearId === nextYear?.id && item.status === "Active");
    const nextUnit = data.curriculumUnits.find((item) =>
      item.institutionId === targetInstitution?.id &&
      item.academicYearId === nextYear?.id &&
      item.semesterId === nextSemester?.id &&
      item.status === "Approved" &&
      item.type === expectedUnitType(targetBrand, nextYear?.title ?? ""),
    );
    return {
      institutionId: targetInstitution?.id ?? "",
      yearId: nextYear?.id ?? "",
      semesterId: nextSemester?.id ?? "",
      unitId: nextUnit?.id ?? "",
    };
  };
  const startCreate = () => {
    const nextBrand = brand === "all" ? "medway" : brand;
    const placement = defaultPlacementForBrand(nextBrand);
    setFormBrand(nextBrand); setFormScope("Curriculum"); setInstitutionId(placement.institutionId); setYearId(placement.yearId); setSemesterId(placement.semesterId); setUnitId(placement.unitId); setEditing(null);
  };
  const changeFormBrand = (nextBrand: BrandCode) => {
    const placement = defaultPlacementForBrand(nextBrand);
    setFormBrand(nextBrand); setInstitutionId(placement.institutionId); setYearId(placement.yearId); setSemesterId(placement.semesterId); setUnitId(placement.unitId);
  };
  const startEdit = (course: CourseRecord) => {
    const unit = unitForCourse(data, course);
    setFormBrand(course.brand); setFormScope(course.scope); setInstitutionId(course.academicInstitutionId ?? institutionForUnit(data, unit)?.id ?? institutionForBrand(data, course.brand)?.id ?? "");
    setYearId(yearForUnit(data, unit)?.id ?? ""); setSemesterId(semesterForUnit(data, unit)?.id ?? ""); setUnitId(unit?.id ?? ""); setEditing(course);
  };
  const rows = useMemo(() => data.courses.filter((course) =>
    (brand === "all" || course.brand === brand) && (scope === "all" || course.scope.toLowerCase() === scope) &&
    (level === "all" || courseLevel(data, course) === level) && (semester === "all" || courseSemester(data, course) === semester) &&
    (instructor === "all" || course.instructors.some((item) => item.instructorId === instructor || item.name === instructor)) &&
    (status === "all" || course.status.toLowerCase() === status) &&
    (!query || [course.title, courseUnitLabel(data, course), ...course.instructors.map((item) => item.name)].join(" ").toLowerCase().includes(query))
  ), [brand, data, instructor, level, query, scope, semester, status]);
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const visible = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selected = selectedId ? rows.find((course) => course.id === selectedId) ?? rows[0] : undefined;

  const saveCourse = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const leadValue = String(form.get("lead") ?? "");
    const coValue = String(form.get("co") ?? "");
    const leadInstructor = instructorOptions.find((item) => item.id === leadValue || item.fullName === leadValue);
    const coInstructor = instructorOptions.find((item) => item.id === coValue || item.fullName === coValue);
    const isEditing = editing !== null && editing !== false;
    const updated: CourseRecord = {
      id: isEditing ? editing.id : `c-${Date.now()}`,
      title: String(form.get("title") ?? "").trim(), brand: formBrand,
      curriculumUnitId: formScope === "Curriculum" ? unitId || null : null,
      scope: formScope,
      status: String(form.get("status")) as CourseRecord["status"],
      updated: "Today",
      academicInstitutionId: institutionId,
      brandId: isEditing ? editing.brandId : undefined,
      cataloguePresentation: expectedUnitType(formBrand, formYear?.title ?? "Year 1") === "Subject" ? "subject_based" : "module_based",
      instructors: [leadInstructor, coInstructor].filter((item): item is NonNullable<typeof item> => !!item).map((instructor) => ({ instructorId: instructor.id, name: instructor.fullName, role: "Unspecified" as const })) as CourseRecord["instructors"],
    };
    const expectedInstitution = institutionForBrand(data, formBrand);
    if (!expectedInstitution || expectedInstitution.id !== institutionId) {
      setNotice(formBrand === "nexus" ? "Nexus courses must belong to Delta University." : "Medway and Elite courses must belong to BUC.");
      return;
    }
    if (formScope === "Curriculum") {
      const selectedUnit = data.curriculumUnits.find((item) => item.id === unitId);
      if (!selectedUnit || selectedUnit.institutionId !== expectedInstitution.id) {
        setNotice(formBrand === "nexus" ? "Choose an approved Delta module for Nexus." : "Choose an approved BUC subject for Medway or Elite.");
        return;
      }
    }
    if (editing !== null && editing !== false) updated.instructors = [...updated.instructors, ...editing.instructors.slice(2)];
    if (!isEditing) {
      try {
        const persistedBrand = (await listBrandAccess()).find((item) => item.code === formBrand && item.status === "active");
        if (!persistedBrand) throw new Error("The selected Brand is not available to this Admin account.");
        const unit = updated.curriculumUnitId ? data.curriculumUnits.find((item) => item.id === updated.curriculumUnitId) : undefined;
        const courseId = await createBrandCourse(persistedBrand.id, { title: updated.title, classification: updated.scope === "Standalone" ? "standalone" : "academic_module_offering", cataloguePresentation: expectedUnitType(formBrand, formYear?.title ?? "Year 1") === "Subject" ? "subject_based" : "module_based", academicInstitutionId: unit?.institutionId ?? institutionId, academicModuleId: updated.scope === "Standalone" ? null : unit?.id ?? null, reason: "Create Admin V2 course" });
        if (updated.status !== "Draft") { const created = await getCourseDto(persistedBrand.id, courseId); await setCourseStatus(persistedBrand.id, courseId, { status: updated.status.toLowerCase(), expectedVersion: created.version, reason: "Set initial Admin V2 course status" }); }
        for (const assignment of updated.instructors) if (assignment.instructorId) {
          const instructorBrands = await listInstructorBrands(assignment.instructorId);
          if (!instructorBrands.some((item) => item.brandId === persistedBrand.id && item.status === "active")) throw new Error("Assign this Instructor to the course's Brand before assigning them to the Course.");
          await assignInstructor(persistedBrand.id, courseId, assignment.instructorId, "Assign Instructor to Admin V2 course");
        }
        refreshServerDomains(); setSelectedId(courseId); setEditing(false); setNotice(updated.instructors.length ? "Course created and teaching assignments saved." : "Course created and saved."); return;
      } catch (error) { setNotice(error instanceof Error ? error.message : "Course could not be saved."); return; }
    }
    setData((current) => ({ ...current, courses: isEditing ? current.courses.map((item) => item.id === updated.id ? updated : item) : [updated, ...current.courses] }));
    setSelectedId(updated.id); setEditing(false);
  };
  const updateCourse = (id: string, patch: Partial<CourseRecord>) => setData((current) => ({ ...current, courses: current.courses.map((item) => item.id === id ? { ...item, ...patch } : item) }));
  const duplicateCourse = async (course: CourseRecord) => { try { const brandId = course.brandId ?? (await listBrandAccess()).find((item) => item.code === course.brand)?.id; if (!brandId) throw new Error("The Course Brand is unavailable."); const copyTitle = `${course.title} (Copy)`; const id = await createBrandCourse(brandId, { title: copyTitle, classification: course.scope === "Standalone" ? "standalone" : "academic_module_offering", cataloguePresentation: course.cataloguePresentation ?? "module_based", academicInstitutionId: course.academicInstitutionId ?? institutionForBrand(data, course.brand)?.id, academicModuleId: course.scope === "Standalone" ? null : course.curriculumUnitId, reason: "Duplicate Admin V2 course" }); for (const assignment of course.instructors) if (assignment.instructorId) { const assignedBrands = await listInstructorBrands(assignment.instructorId); if (assignedBrands.some((item) => item.brandId === brandId && item.status === "active")) await assignInstructor(brandId, id, assignment.instructorId, "Copy course teaching assignment"); } refreshServerDomains(); setSelectedId(id); setNotice(course.instructors.length ? "Course duplicated and teaching assignments copied." : "Course duplicated as a draft."); } catch (error) { setNotice(error instanceof Error ? error.message : "Course could not be duplicated."); } };
  return <section className="admin-v2__page admin-v2__courses">
    <AdminV2DomainStatus />
    <div className="admin-v2__filterbar" data-admin-guide-target="courses-filters">
      <FilterField label="Brand"><select value={brand} onChange={(event) => setBrand(event.target.value as BrandFilter)} aria-label="Brand"><option value="all">All brands</option><option value="medway">Medway</option><option value="elite">Elite</option><option value="nexus">Nexus</option></select></FilterField>
      <FilterField label="Scope"><select value={scope} onChange={(event) => { setScope(event.target.value); setPage(1); }}><option value="all">All</option><option value="curriculum">Curriculum</option><option value="standalone">Standalone</option></select></FilterField>
      <FilterField label="Academic level"><select value={level} onChange={(event) => { setLevel(event.target.value); setPage(1); }}><option value="all">All levels</option>{[...new Set(data.courses.map((item) => courseLevel(data, item)))].map((item) => <option key={item}>{item}</option>)}</select></FilterField>
      <FilterField label="Semester"><select value={semester} onChange={(event) => { setSemester(event.target.value); setPage(1); }}><option value="all">All semesters</option>{[...new Set(data.courses.map((item) => courseSemester(data, item)))].map((item) => <option key={item}>{item}</option>)}</select></FilterField>
      <FilterField label="Instructor"><select value={instructor} onChange={(event) => { setInstructor(event.target.value); setPage(1); }}><option value="all">All instructors</option>{instructorOptions.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}</select></FilterField>
      {(scope !== "all" || level !== "all" || semester !== "all" || instructor !== "all" || status !== "all") && <button className="admin-v2__button" type="button" onClick={() => { setScope("all"); setLevel("all"); setSemester("all"); setInstructor("all"); setStatus("all"); setBrand("all"); }}><Filter size={14} /> Clear filters</button>}
    </div>
    <div className={`admin-v2__workgrid${selected ? " has-inspector" : ""}`}>
      <TableFrame title="Courses" count={`${rows.length} courses`} toolbar={<div className="admin-v2__table-tools" data-admin-guide-target="courses-tools"><label className="admin-v2__search"><Search size={15} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search courses..." aria-label="Search courses" /></label><button className={`admin-v2__button admin-v2__status-filter${status === "published" ? " is-active" : ""}`} aria-pressed={status === "published"} title={status === "published" ? "Show all course statuses" : "Show published courses only"} onClick={() => { setStatus((value) => value === "all" ? "published" : "all"); setPage(1); }}><SlidersHorizontal size={14} />{status === "published" ? "Published only" : "All statuses"}</button><button className="admin-v2__button is-primary" onClick={startCreate}><Plus size={15} /> New Course</button></div>} footer={<Pagination page={page} pageCount={pageCount} total={rows.length} pageSize={PAGE_SIZE} onPageChange={setPage} />}>
        <table data-admin-guide-target="courses-table" className="admin-v2__table"><thead><tr><th>Course title</th><th>Brand</th><th>Scope</th><th>Linked subject / module</th><th>Instructor</th><th>Status</th><th>Updated</th><th></th></tr></thead><tbody>{visible.map((course) => { const lead = course.instructors[0]?.name; const more = course.instructors.length - 1; return <tr key={course.id} className={selected?.id === course.id ? "is-selected" : ""} onClick={() => setSelectedId(course.id)}><td><strong>{course.title}</strong></td><td><BrandBadge brand={course.brand} /></td><td>{course.scope}</td><td className="is-link">{courseUnitLabel(data, course)}</td><td><span className="admin-v2__instructor-cell"><i>{lead ? initials(lead) : "—"}</i><b>{lead ?? "Unassigned"}</b>{more > 0 && <small>+{more}</small>}</span></td><td><StatusBadge status={course.status} /></td><td>{course.updated}</td><td><button className="admin-v2__row-menu" title="Edit course" aria-label={`Edit ${course.title}`} onClick={(event) => { event.stopPropagation(); startEdit(course); }}><Pencil size={14} /></button></td></tr>; })}</tbody></table>
        {!visible.length && <div className="admin-v2__empty">No courses match these filters.</div>}
      </TableFrame>
      {selected && <aside data-admin-guide-target="courses-inspector" className="admin-v2__inspector admin-v2__course-inspector">
        <header className="admin-v2__inspector-head"><button type="button" className="admin-v2__back" onClick={() => setSelectedId("")}><ArrowLeft size={14} /> Back to courses</button></header>
        <div className="admin-v2__course-summary"><div className={`admin-v2__course-art is-${selected.brand}`}><img src={courseThumbnail(data, selected)} alt="" /></div><div><h2>{selected.title}</h2><div className="admin-v2__course-badges"><StatusBadge status={selected.status} /><BrandBadge brand={selected.brand} /></div></div></div>
        <InspectorFields fields={[["Scope", selected.scope], ["Institution", institutionForUnit(data, unitForCourse(data, selected))?.shortName ?? "Not mapped"], ["Linked unit", courseUnitLabel(data, selected)], ["Academic level", courseLevel(data, selected)], ["Semester", courseSemester(data, selected)], ["Last updated", selected.updated]]} />
        <InspectorSection title="Course-Instructor Assignments" action={<button className="admin-v2__text-button" onClick={() => startEdit(selected)}><Users size={13} /> Manage instructors</button>}>
          <div className="admin-v2__assignment-list">{selected.instructors.map((item) => <div key={item.name}><span className="admin-v2__person-avatar">{item.name.split(" ").slice(1).map((part) => part[0]).join("")}</span><strong>{item.name}</strong><em>{item.role === "Unspecified" ? "Assigned" : item.role}</em>{item.allocation && <small>{item.allocation}%</small>}</div>)}{!selected.instructors.length && <p className="admin-v2__muted">No instructor assigned.</p>}</div>
        </InspectorSection>
        <InspectorSection title="Actions"><div className="admin-v2__action-list" data-admin-guide-target="courses-actions">
          <button onClick={() => duplicateCourse(selected)}><span><Copy size={15} /></span><b>Duplicate course<small>Create a new draft copy</small></b><ChevronRight size={15} /></button>
          <button className="is-danger" onClick={() => setConfirmId(selected.id)}><span><Archive size={15} /></span><b>{selected.status === "Archived" ? "Restore course" : "Archive course"}<small>Student access is retained</small></b><ChevronRight size={15} /></button>
        </div></InspectorSection>
        <InspectorSection title="Teaching content">
          <div className="admin-v2__teaching-content-note"><p>Assigned instructors build chapters and lessons, then upload videos or PDFs for approval.</p><Link to="/admin/content" className="admin-v2__button">Review submitted materials <ChevronRight size={13} /></Link></div>
        </InspectorSection>
        {notice && <div className="admin-v2__inline-notice" role="status"><button aria-label="Dismiss" onClick={() => setNotice("")}><X size={12} /></button>{notice}</div>}
      </aside>}
    </div>
    {editing !== false && <Drawer title={editing ? "Edit course" : "New course"} subtitle="Course identity, curriculum mapping, and instructor assignment" onClose={() => setEditing(false)} footer={<FormActions><button type="button" className="admin-v2__button" onClick={() => setEditing(false)}>Cancel</button><button type="submit" form="course-form" className="admin-v2__button is-primary">Save course</button></FormActions>}>
      <form id="course-form" className="admin-v2__form" onSubmit={saveCourse}>
        <FormField label="Course title" wide><input name="title" required defaultValue={editing ? editing.title : ""} placeholder="e.g. Gross Anatomy: Upper Limb" /></FormField>
        <FormField label="Brand"><select name="brand" value={formBrand} onChange={(event) => changeFormBrand(event.target.value as BrandCode)}><option value="medway">Medway</option><option value="elite">Elite</option><option value="nexus">Nexus</option></select></FormField>
        <FormField label="Scope"><select name="scope" value={formScope} onChange={(event) => setFormScope(event.target.value as CourseRecord["scope"])}><option>Curriculum</option><option>Standalone</option></select></FormField>
        {formScope === "Curriculum" && <>
          <FormField label="Institution"><select value={institutionId} onChange={(event) => { setInstitutionId(event.target.value); setYearId(""); setSemesterId(""); setUnitId(""); }} required><option value="">Select institution</option>{data.institutions.filter((item) => item.status === "Active" && item.id === institutionForBrand(data, formBrand)?.id).map((item) => <option key={item.id} value={item.id}>{item.shortName}</option>)}</select></FormField>
          <FormField label="Academic year"><select value={yearId} onChange={(event) => { setYearId(event.target.value); setSemesterId(""); setUnitId(""); }} required><option value="">Select year</option>{formYears.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></FormField>
          <FormField label="Semester"><select value={semesterId} onChange={(event) => { setSemesterId(event.target.value); setUnitId(""); }} required><option value="">Select semester</option>{formSemesters.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></FormField>
          <FormField label="Approved subject / module" wide><select name="curriculumUnitId" value={unitId} onChange={(event) => setUnitId(event.target.value)} required><option value="">Select approved unit</option>{formUnits.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.title}</option>)}</select><small className="v2-form-hint">Nexus uses Delta; Medway and Elite use BUC. The unit must belong to the selected brand’s institution.</small></FormField>
        </>}
        <FormField label="Status"><select name="status" defaultValue={editing ? editing.status : "Draft"}><option>Draft</option><option>Published</option><option>Archived</option></select></FormField>
        <FormField label="Instructor"><select name="lead" defaultValue={editing ? instructorValue(data, editing.instructors[0]) : ""}><option value="">Unassigned</option>{instructorOptions.map((item) => <option key={item.id} value={item.id} disabled={item.status === "Inactive" && !editing?.instructors.some((assignment) => assignment.instructorId === item.id || assignment.name === item.fullName)}>{item.fullName}{item.status === "Inactive" ? " (Inactive)" : ""}</option>)}</select></FormField>
        <FormField label="Second instructor (optional)"><select name="co" defaultValue={editing ? instructorValue(data, editing.instructors[1]) : ""}><option value="">None</option>{instructorOptions.map((item) => <option key={item.id} value={item.id} disabled={item.status === "Inactive" && !editing?.instructors.some((assignment) => assignment.instructorId === item.id || assignment.name === item.fullName)}>{item.fullName}{item.status === "Inactive" ? " (Inactive)" : ""}</option>)}</select></FormField>
      </form>
    </Drawer>}
    {confirmId && <ConfirmDialog title={data.courses.find((item) => item.id === confirmId)?.status === "Archived" ? "Restore this course?" : "Archive this course?"} detail="The change is submitted to the backend and the course list is refreshed." confirmLabel={data.courses.find((item) => item.id === confirmId)?.status === "Archived" ? "Restore course" : "Archive course"} onCancel={() => setConfirmId("")} onConfirm={() => { const archived = data.courses.find((item) => item.id === confirmId)?.status === "Archived"; updateCourse(confirmId, { status: archived ? "Draft" : "Archived" }); setConfirmId(""); }} />}
  </section>;
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) { return <label className="admin-v2__filter-field"><span>{label}</span>{children}</label>; }
function courseThumbnail(data: AdminV2Data, course: CourseRecord) {
  const text = `${course.title} ${courseUnitLabel(data, course)}`.toLowerCase();
  if (text.includes("biochem")) return biochemistryEssentials;
  if (text.includes("histology")) return histologyBasics;
  if (text.includes("physiology") || text.includes("pharmacology")) return medicalPhysiology;
  return humanAnatomy;
}
function initials(name: string) { return name.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase(); }
function instructorValue(data: AdminV2Data, assignment?: CourseRecord["instructors"][number]) {
  if (!assignment) return "";
  return assignment.instructorId ?? data.instructors.find((instructor) => instructor.fullName === assignment.name)?.id ?? "";
}
