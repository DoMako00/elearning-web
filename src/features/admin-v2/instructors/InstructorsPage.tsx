import { useEffect, useMemo, useState } from "react";
import { Archive, BookOpen, Check, CircleUserRound, Mail, Pencil, Plus, Search, ShieldCheck, UserRound, X } from "lucide-react";
import { AdminV2DomainStatus, useAdminV2 } from "../layout/AdminV2Layout";
import { assignInstructorToBrand, createDirectoryInstructor, getInstructor as getInstructorDto, listBrandAccess, setInstructorStatus, writeInstructor } from "../api/adminAcademicApi";
import { brandName } from "../data/adminV2.defaults";
import { BrandBadge, ConfirmDialog, Drawer, FormActions, FormField, StatusBadge } from "../shared/AdminV2Primitives";
import { InspectorFields, InspectorSection, Pagination, TableFrame } from "../shared/AdminV2Table";
import type { AdminV2Data, AuditEvent, BrandCode, BrandFilter, InstructorRecord, InstructorStatus } from "../types/adminV2.types";

const PAGE_SIZE = 8;
const brands: BrandCode[] = ["medway", "elite", "nexus"];
type DrawerMode = "create" | "edit" | "brand" | "course" | false;
type InstructorFormState = { fullName: string; email: string; phone: string; specialties: string; status: InstructorStatus; brands: BrandCode[] };

const emptyForm = (): InstructorFormState => ({ fullName: "", email: "", phone: "", specialties: "", status: "Active", brands: [] });
const displayInitials = (name: string) => name.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
const assignmentMatches = (assignment: { instructorId?: string; name: string }, instructor: InstructorRecord) => assignment.instructorId === instructor.id || (!assignment.instructorId && assignment.name === instructor.fullName);
const nowLabel = () => new Date().toISOString().slice(0, 10);

export function InstructorsPage() {
  const { data, setData, brand: globalBrand, globalSearch, refreshServerDomains, reportDomainError } = useAdminV2();
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState<BrandFilter>("all");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | InstructorStatus>("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(data.instructors[0]?.id ?? "");
  const [drawer, setDrawer] = useState<DrawerMode>(false);
  const [form, setForm] = useState<InstructorFormState>(emptyForm);
  const [courseIds, setCourseIds] = useState<string[]>([]);
  const [courseRole, setCourseRole] = useState<"Lead Instructor" | "Co-Instructor">("Co-Instructor");
  const [confirmCourseId, setConfirmCourseId] = useState("");
  const [activeTab, setActiveTab] = useState<"Overview" | "Schedule" | "Performance" | "Activity">("Overview");
  useEffect(() => { if (!selectedId && data.instructors.length) setSelectedId(data.instructors[0]!.id); }, [data.instructors, selectedId]);

  const specialties = useMemo(() => [...new Set(data.instructors.flatMap((instructor) => instructor.specialties))].sort(), [data.instructors]);
  const instructorBrands = (instructorId: string) => {
    const assigned = data.instructorBrandAssignments.filter((assignment) => assignment.instructorId === instructorId).map((assignment) => assignment.brand);
    const fromCourses = data.courses.filter((course) => course.instructors.some((assignment) => assignment.instructorId === instructorId)).map((course) => course.brand);
    return [...new Set([...assigned, ...fromCourses])];
  };
  const coursesFor = (instructor: InstructorRecord) => data.courses.filter((course) => course.instructors.some((assignment) => assignmentMatches(assignment, instructor)));
  const rows = useMemo(() => {
    const query = `${search} ${globalSearch}`.trim().toLowerCase();
    return data.instructors.filter((instructor) => {
      const assignedBrands = instructorBrands(instructor.id);
      const matchesGlobalBrand = globalBrand === "all" || assignedBrands.includes(globalBrand);
      const matchesBrand = brandFilter === "all" || assignedBrands.includes(brandFilter);
      const matchesSpecialty = specialtyFilter === "all" || instructor.specialties.includes(specialtyFilter);
      const matchesQuery = !query || [instructor.fullName, instructor.email, instructor.phone ?? "", ...instructor.specialties].join(" ").toLowerCase().includes(query);
      return matchesGlobalBrand && matchesBrand && matchesSpecialty && (statusFilter === "all" || instructor.status === statusFilter) && matchesQuery;
    });
  }, [brandFilter, data.courses, data.instructorBrandAssignments, data.instructors, globalBrand, globalSearch, search, specialtyFilter, statusFilter]);
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const visible = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selected = selectedId ? rows.find((instructor) => instructor.id === selectedId) : undefined;
  const selectedCourses = selected ? coursesFor(selected) : [];
  const selectedBrands = selected ? instructorBrands(selected.id) : [];
  const availableCourses = selected ? data.courses.filter((course) => {
    const current = course.instructors.some((assignment) => assignmentMatches(assignment, selected));
    return !current && course.status !== "Archived" && (selectedBrands.length === 0 || selectedBrands.includes(course.brand));
  }) : [];
  const activity = selected ? data.auditEvents.filter((event) => event.targetType === "Instructor" && event.targetId === selected.id) : [];
  const selectAndReset = (id: string) => { setSelectedId(id); setPage(1); };

  const openCreate = () => { setForm(emptyForm()); setDrawer("create"); };
  const openEdit = (instructor: InstructorRecord) => {
    setForm({ fullName: instructor.fullName, email: instructor.email, phone: instructor.phone ?? "", specialties: instructor.specialties.join(", "), status: instructor.status, brands: instructorBrands(instructor.id) });
    setDrawer("edit");
  };
  const openBrandAssignment = () => { if (selected) { setForm((current) => ({ ...current, brands: selectedBrands })); setDrawer("brand"); } };
  const openCourseAssignment = () => { if (selected?.status === "Active") { setCourseIds([]); setCourseRole("Co-Instructor"); setDrawer("course"); } };

  const saveInstructor = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fullName = form.fullName.trim();
    const email = form.email.trim().toLowerCase();
    if (!fullName) return;
    const editing = drawer === "edit" ? selected : undefined;
    if (form.phone.trim()) { reportDomainError("Public Instructor phone is not enabled; no phone value was saved."); return; }
    const specialties = [...new Set(form.specialties.split(",").map((item) => item.trim()).filter(Boolean))];
    if (!editing) {
      try {
        const instructorId = await createDirectoryInstructor({ code: `INS-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, displayName: fullName, publicEmail: email || null, specialties, reason: "Create Admin V2 instructor directory record" });
        const persistedBrands = await listBrandAccess();
        for (const code of form.brands) { const item = persistedBrands.find((candidate) => candidate.code === code && candidate.status === "active"); if (!item) throw new Error("One selected Brand is not available to this Admin account."); await assignInstructorToBrand(item.id, instructorId, "Assign Instructor to Brand"); }
        if (form.status === "Inactive") { const created = await getInstructorDto(instructorId); await setInstructorStatus(instructorId, { status: "inactive", expectedVersion: created.version, reason: "Set Instructor inactive" }); }
        refreshServerDomains(); setSelectedId(instructorId); setDrawer(false); return;
      } catch (error) { reportDomainError(error instanceof Error ? error.message : "The Instructor record could not be created."); return; }
    }
    try {
      const current = await getInstructorDto(editing.id);
      await writeInstructor(editing.id, { displayName: fullName, publicEmail: email || null, specialties, expectedVersion: current.version, reason: "Update Instructor public directory metadata" });
      if ((form.status === "Active") !== (current.status === "active")) await setInstructorStatus(editing.id, { status: form.status === "Active" ? "active" : "inactive", expectedVersion: current.version + 1, reason: "Update Instructor lifecycle" });
      refreshServerDomains(); setSelectedId(editing.id); setDrawer(false);
    } catch (error) { reportDomainError(error instanceof Error ? error.message : "The Instructor record could not be updated."); }
  };

  const saveBrands = () => {
    if (!selected) return;
    setData((current) => {
      const nextAssignments = form.brands.map((brandCode) => ({ id: `iba-${selected.id}-${brandCode}`, instructorId: selected.id, brand: brandCode, createdAt: nowLabel() }));
      return { ...current, instructorBrandAssignments: [...current.instructorBrandAssignments.filter((assignment) => assignment.instructorId !== selected.id), ...nextAssignments] };
    });
    setDrawer(false);
  };

  const saveCourses = () => {
    if (!selected || selected.status !== "Active" || !courseIds.length) return;
    setData((current) => {
      const chosen = new Set(courseIds);
      const nextCourses = current.courses.map((course) => {
        if (!chosen.has(course.id)) return course;
        const hasAssignment = course.instructors.some((assignment) => assignmentMatches(assignment, selected));
        if (hasAssignment) return course;
        const existing = courseRole === "Lead Instructor" ? course.instructors.map((assignment) => assignment.role === "Lead Instructor" ? { ...assignment, role: "Co-Instructor" as const, allocation: 50 } : assignment) : course.instructors;
        return { ...course, instructors: [...existing, { instructorId: selected.id, name: selected.fullName, role: courseRole, allocation: courseRole === "Lead Instructor" ? 100 : undefined }] };
      });
      return { ...current, courses: nextCourses };
    });
    setDrawer(false);
  };

  const unassignCourse = () => {
    if (!selected || !confirmCourseId) return;
    setData((current) => ({ ...current, courses: current.courses.map((item) => item.id === confirmCourseId ? { ...item, instructors: item.instructors.filter((assignment) => !assignmentMatches(assignment, selected)) } : item) }));
    setConfirmCourseId("");
  };

  const resetFilters = () => { setSearch(""); setBrandFilter("all"); setSpecialtyFilter("all"); setStatusFilter("all"); setPage(1); };

  return <section className="admin-v2__page admin-v2__instructors-page">
    <AdminV2DomainStatus />
    <div className="admin-v2__instructor-layout">
      <TableFrame title="Global Instructor Directory" count={`${rows.length} instructors`} toolbar={<div className="admin-v2__instructor-directory-toolbar"><button type="button" className="admin-v2__button is-primary" onClick={openCreate}><Plus size={15} /> Add Instructor</button></div>} footer={<Pagination page={page} pageCount={pageCount} total={rows.length} pageSize={PAGE_SIZE} onPageChange={setPage} />}>
        <div className="admin-v2__instructor-filters"><label className="admin-v2__search"><Search size={15} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search instructors..." aria-label="Search instructors" /></label><select value={brandFilter} onChange={(event) => { setBrandFilter(event.target.value as BrandFilter); setPage(1); }} aria-label="Filter by brand"><option value="all">All brands</option>{brands.map((item) => <option key={item} value={item}>{brandName(item)}</option>)}</select><select value={specialtyFilter} onChange={(event) => { setSpecialtyFilter(event.target.value); setPage(1); }} aria-label="Filter by specialty"><option value="all">All specialties</option>{specialties.map((item) => <option key={item}>{item}</option>)}</select><select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as "all" | InstructorStatus); setPage(1); }} aria-label="Filter by status"><option value="all">All status</option><option>Active</option><option>Inactive</option></select>{(search || brandFilter !== "all" || specialtyFilter !== "all" || statusFilter !== "all") && <button type="button" className="admin-v2__button" onClick={resetFilters}>Clear</button>}</div>
        <table className="admin-v2__table admin-v2__instructor-table"><thead><tr><th>Instructor</th><th>Specialties</th><th>Brands</th><th>Active courses</th><th>Status</th><th></th></tr></thead><tbody>{visible.map((instructor) => { const assignedBrands = instructorBrands(instructor.id); const assignedCourses = coursesFor(instructor); return <tr key={instructor.id} className={selected?.id === instructor.id ? "is-selected" : ""} onClick={() => selectAndReset(instructor.id)}><td><span className="admin-v2__instructor-identity"><i>{displayInitials(instructor.fullName)}</i><span><strong>{instructor.fullName}</strong><small>{instructor.email}</small></span></span></td><td><span className="admin-v2__specialty-cell"><span>{instructor.specialties[0] ?? "Not provided"}</span>{instructor.specialties.length > 1 && <small>+{instructor.specialties.length - 1}</small>}</span></td><td><span className="admin-v2__brand-chip-list">{assignedBrands.slice(0, 3).map((item) => <BrandBadge key={item} brand={item} />)}{!assignedBrands.length && <span className="admin-v2__muted">Unassigned</span>}</span></td><td><strong className="admin-v2__course-count">{assignedCourses.length}</strong></td><td><StatusBadge status={instructor.status} /></td><td><button type="button" className="admin-v2__row-menu" title={`Edit ${instructor.fullName}`} aria-label={`Edit ${instructor.fullName}`} onClick={(event) => { event.stopPropagation(); setSelectedId(instructor.id); openEdit(instructor); }}><Pencil size={14} /></button></td></tr>; })}</tbody></table>{!visible.length && <div className="admin-v2__empty"><UserRound size={20} /><strong>No instructors match these filters.</strong><span>Try a different search or add a new instructor to the directory.</span><button type="button" className="admin-v2__button is-primary" onClick={openCreate}><Plus size={14} /> Add Instructor</button></div>}
      </TableFrame>
      {selected ? <aside className="admin-v2__inspector admin-v2__instructor-inspector"><header className="admin-v2__instructor-inspector-head"><div className="admin-v2__instructor-profile"><span className="admin-v2__instructor-large-avatar">{displayInitials(selected.fullName)}</span><div><h2>{selected.fullName}</h2><StatusBadge status={selected.status} /><p>{selected.specialties[0] ?? "Not provided"}</p><small><Mail size={12} /> {selected.email || "Email not provided"}</small><small>Instructor ID: {selected.id.toUpperCase()}</small></div></div><button type="button" className="admin-v2__icon-btn" title="Close instructor inspector" aria-label="Close instructor inspector" onClick={() => setSelectedId("")}><X size={17} /></button></header><div className="admin-v2__instructor-tabs" role="tablist">{(["Overview", "Schedule", "Performance", "Activity"] as const).map((tab) => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? "is-active" : ""} disabled={tab === "Performance"} title={tab === "Performance" ? "Performance data is not available from the current backend API" : undefined} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div><InspectorTabContent tab={activeTab} instructor={selected} data={data} brands={selectedBrands} courses={selectedCourses} activity={activity} onEdit={() => openEdit(selected)} onAssignBrand={openBrandAssignment} onAssignCourse={openCourseAssignment} onUnassignCourse={setConfirmCourseId} /></aside> : <aside className="admin-v2__inspector admin-v2__instructor-inspector admin-v2__empty-inspector"><CircleUserRound size={25} /><strong>Select an instructor</strong><span>Choose a directory row to review brand and course assignments.</span></aside>}
    </div>
    {drawer === "create" || drawer === "edit" ? <Drawer title={drawer === "create" ? "Add instructor" : "Edit instructor"} subtitle="Directory profile and brand assignment metadata" onClose={() => setDrawer(false)} footer={<FormActions><button type="button" className="admin-v2__button" onClick={() => setDrawer(false)}>Cancel</button><button type="submit" form="instructor-form" className="admin-v2__button is-primary">Save instructor</button></FormActions>}><form id="instructor-form" className="admin-v2__form admin-v2__instructor-form" onSubmit={saveInstructor}><div className="admin-v2__instructor-form-intro"><span><UserRound size={17} /></span><div><strong>{drawer === "create" ? "New directory profile" : "Update directory profile"}</strong><small>Instructor identity stays separate from course and curriculum records.</small></div></div><FormField label="Full name" wide><input required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} placeholder="e.g. Dr. Sarah A. Vitale" /></FormField><FormField label="Public directory email"><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Optional public contact" /></FormField><FormField label="Phone (not configured)"><input value={form.phone} disabled placeholder="Not provided by directory" /></FormField><FormField label="Specialties" wide><input value={form.specialties} onChange={(event) => setForm({ ...form, specialties: event.target.value })} placeholder="e.g. Anatomy, Physiology" /><small className="admin-v2__form-note">Public email and specialties are saved. Ratings and reviews are not created.</small></FormField><FormField label="Status"><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as InstructorStatus })}><option>Active</option><option>Inactive</option></select></FormField><div className="admin-v2__instructor-brand-field"><span>Brand assignments</span><div>{brands.map((item) => <label key={item}><input type="checkbox" checked={form.brands.includes(item)} onChange={() => setForm({ ...form, brands: form.brands.includes(item) ? form.brands.filter((value) => value !== item) : [...form.brands, item] })} /><BrandBadge brand={item} /></label>)}</div></div></form></Drawer> : null}
    {drawer === "brand" && selected ? <Drawer title="Assign to brands" subtitle={`${selected.fullName} Â· assignment metadata only`} onClose={() => setDrawer(false)} footer={<FormActions><button type="button" className="admin-v2__button" onClick={() => setDrawer(false)}>Cancel</button><button type="button" className="admin-v2__button is-primary" onClick={saveBrands}>Save assignments</button></FormActions>}><div className="admin-v2__assignment-picker"><p>Select the commercial brands this instructor may be associated with. This does not grant access by itself.</p>{brands.map((item) => <label key={item}><input type="checkbox" checked={form.brands.includes(item)} onChange={() => setForm({ ...form, brands: form.brands.includes(item) ? form.brands.filter((value) => value !== item) : [...form.brands, item] })} /><BrandBadge brand={item} /><span>{brandName(item)} instructor directory</span></label>)}</div></Drawer> : null}
    {drawer === "course" && selected ? <Drawer title="Assign to course" subtitle={`${selected.fullName} Â· active courses only`} onClose={() => setDrawer(false)} footer={<FormActions><button type="button" className="admin-v2__button" onClick={() => setDrawer(false)}>Cancel</button><button type="button" className="admin-v2__button is-primary" disabled={!courseIds.length} onClick={saveCourses}>Assign selected</button></FormActions>}><div className="admin-v2__assignment-picker"><div className="admin-v2__picker-heading"><p>Choose courses aligned to this instructor's assigned brands.</p><label>Role<select value={courseRole} onChange={(event) => setCourseRole(event.target.value as "Lead Instructor" | "Co-Instructor")}><option>Co-Instructor</option><option>Lead Instructor</option></select></label></div>{availableCourses.map((course) => <label key={course.id}><input type="checkbox" checked={courseIds.includes(course.id)} onChange={() => setCourseIds((current) => current.includes(course.id) ? current.filter((id) => id !== course.id) : [...current, course.id])} /><span><strong>{course.title}</strong><small>{brandName(course.brand)} Â· {course.status}</small></span><BrandBadge brand={course.brand} /></label>)}{!availableCourses.length && <div className="admin-v2__empty-inline">No eligible unassigned courses are available for this instructor.</div>}</div></Drawer> : null}
    {confirmCourseId && selected ? <ConfirmDialog title="Remove course assignment?" detail={`This removes ${selected.fullName} from ${data.courses.find((course) => course.id === confirmCourseId)?.title ?? "this course"}.`} confirmLabel="Remove assignment" onCancel={() => setConfirmCourseId("")} onConfirm={unassignCourse} /> : null}
  </section>;
}

function InspectorTabContent({ tab, instructor, data, brands, courses, activity, onEdit, onAssignBrand, onAssignCourse, onUnassignCourse }: { tab: "Overview" | "Schedule" | "Performance" | "Activity"; instructor: InstructorRecord; data: AdminV2Data; brands: BrandCode[]; courses: AdminV2Data["courses"]; activity: AuditEvent[]; onEdit: () => void; onAssignBrand: () => void; onAssignCourse: () => void; onUnassignCourse: (courseId: string) => void }) {
  if (tab === "Schedule") return <div className="admin-v2__instructor-tab-body"><InspectorSection title="Local teaching schedule"><div className="admin-v2__schedule-list">{courses.map((course) => { const lessons = data.lessons.filter((lesson) => lesson.courseId === course.id && lesson.status !== "Archived"); return <article key={course.id}><BookOpen size={15} /><div><strong>{course.title}</strong><small>{lessons.length ? `${lessons.length} lessons Â· ${lessons.filter((lesson) => lesson.releaseMode === "Scheduled").length} scheduled releases` : "No lesson timing configured"}</small></div></article>; })}{!courses.length && <div className="admin-v2__empty-inline">No local course timing is available for this instructor.</div>}</div></InspectorSection></div>;
  if (tab === "Performance") return <div className="admin-v2__instructor-tab-body"><div className="admin-v2__empty-inspector-tab"><ShieldCheck size={20} /><strong>Performance data is not available</strong><span>Completion and teaching analytics will appear after real local activity is recorded.</span></div></div>;
  if (tab === "Activity") return <div className="admin-v2__instructor-tab-body"><InspectorSection title="Instructor activity"><div className="admin-v2__activity-list">{activity.map((event) => <article key={event.id}><span className={`admin-v2__activity-dot is-${event.status.toLowerCase()}`} /><div><strong>{event.action}</strong><small>{event.metadata ?? event.targetLabel} Â· {new Date(event.timestamp).toLocaleString()}</small></div></article>)}{!activity.length && <div className="admin-v2__empty-inline">No recorded activity for this instructor yet.</div>}</div></InspectorSection></div>;
  return <div className="admin-v2__instructor-tab-body"><InspectorSection title="Brand affiliations" action={<button type="button" className="admin-v2__text-button" onClick={onAssignBrand}><Plus size={13} /> Assign to Brand</button>}><div className="admin-v2__instructor-brand-grid">{brands.map((item) => <div className="admin-v2__instructor-brand-card" key={item}><BrandBadge brand={item} /><span>Assigned</span><Check size={15} /></div>)}{!brands.length && <div className="admin-v2__empty-inline">No brand assignments yet.</div>}</div></InspectorSection><InspectorSection title={`Current course assignments (${courses.length})`} action={<button type="button" className="admin-v2__text-button" disabled={instructor.status !== "Active"} title={instructor.status !== "Active" ? "Activate this instructor before adding a course assignment." : "Assign to course"} onClick={onAssignCourse}><Plus size={13} /> Assign to Course</button>}><div className="admin-v2__instructor-course-list">{courses.map((course) => <div className="admin-v2__instructor-course-row" key={course.id}><span className="admin-v2__course-icon"><BookOpen size={15} /></span><div><strong>{course.title}</strong><small>{course.id.toUpperCase()} Â· {brandName(course.brand)} Â· {course.instructors.find((item) => assignmentMatches(item, instructor))?.role ?? "Instructor"}</small></div><button type="button" title={`Remove ${course.title} assignment`} aria-label={`Remove ${course.title} assignment`} onClick={() => onUnassignCourse(course.id)}><X size={14} /></button></div>)}{!courses.length && <div className="admin-v2__empty-inline">No course assignments yet.</div>}</div></InspectorSection><InspectorSection title="Profile metadata"><InspectorFields fields={[["Email", instructor.email], ["Phone", instructor.phone || "Not provided"], ["Specialties", instructor.specialties.join(" Â· ") || "Not set"], ["Instructor ID", instructor.id.toUpperCase()], ["Updated", instructor.updatedAt]]} /></InspectorSection><div className="admin-v2__instructor-inspector-actions"><button type="button" className="admin-v2__button" onClick={onEdit}><Pencil size={14} /> Edit Instructor</button>{instructor.status === "Inactive" ? <span className="admin-v2__instructor-warning"><Archive size={13} /> Inactive instructors cannot receive new assignments.</span> : null}</div></div>;
}
