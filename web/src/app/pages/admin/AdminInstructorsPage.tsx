import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  MoreVertical,
  Plus,
  RotateCcw,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { AdminBrandCode, AdminBrandView } from "../../../features/admin/api";
import { AdminInstructorDetailPanel } from "../../../features/admin/instructors/AdminInstructorDetailPanel";
import {
  adminInstructorFixtures,
  instructorCourseCatalog,
  instructorSpecialtyOptions,
  type AdminInstructorFixture,
} from "../../../features/admin/instructors/adminInstructors.fixtures";

type BrandFilter = "all" | "medway" | "elite" | "both" | "unassigned";
type StatusFilter = "all" | "active" | "inactive";
type PreviewDialogMode = "add" | "edit" | "assign-brand" | "assign-course" | null;

const brandLabel = (brandCode: AdminBrandCode) => brandCode === "medway" ? "Medway" : "Elite";
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);
  return matches;
}

export function AdminInstructorsPage() {
  const { brandView } = useOutletContext<{ brandView: AdminBrandView }>();
  const [instructors, setInstructors] = useState<readonly AdminInstructorFixture[]>(adminInstructorFixtures);
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState<BrandFilter>(brandView);
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [selectedId, setSelectedId] = useState(adminInstructorFixtures[0].id);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [detailOpen, setDetailOpen] = useState(true);
  const [menuId, setMenuId] = useState<string>();
  const [feedback, setFeedback] = useState("");
  const [dialogMode, setDialogMode] = useState<PreviewDialogMode>(null);
  const [dialogError, setDialogError] = useState("");
  const [draftName, setDraftName] = useState("");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftEmail, setDraftEmail] = useState("");
  const [draftBrand, setDraftBrand] = useState<AdminBrandCode>(brandView === "elite" ? "elite" : "medway");
  const [draftCourseId, setDraftCourseId] = useState<string>(instructorCourseCatalog.find((course) => course.brandCode === (brandView === "elite" ? "elite" : "medway"))?.id ?? instructorCourseCatalog[0].id);
  const lastTriggerRef = useRef<HTMLElement | null>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const drawer = useMediaQuery("(max-width: 1499px)");

  useEffect(() => {
    const concrete = brandView === "elite" ? "elite" : "medway";
    setBrandFilter(brandView);
    setDraftBrand(concrete);
    setDraftCourseId(instructorCourseCatalog.find((course) => course.brandCode === concrete)?.id ?? instructorCourseCatalog[0].id);
    setPage(1);
  }, [brandView]);

  const filteredInstructors = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    return instructors.filter((instructor) => {
      const activeBrands = instructor.brandAssignments.filter((assignment) => assignment.status === "active").map((assignment) => assignment.brandCode);
      const brandMatches = brandFilter === "all"
        || (brandFilter === "medway" && activeBrands.includes("medway"))
        || (brandFilter === "elite" && activeBrands.includes("elite"))
        || (brandFilter === "both" && activeBrands.includes("medway") && activeBrands.includes("elite"))
        || (brandFilter === "unassigned" && activeBrands.length === 0);
      const specialtyMatches = specialtyFilter === "all" || instructor.specialties.includes(specialtyFilter);
      const statusMatches = statusFilter === "all" || instructor.status === statusFilter;
      const searchIndex = [instructor.displayName, instructor.academicTitle, instructor.email, ...instructor.specialties, ...instructor.courseAssignments.flatMap((course) => [course.courseName, course.courseCode])].join(" ").toLocaleLowerCase();
      return brandMatches && specialtyMatches && statusMatches && (!normalizedSearch || searchIndex.includes(normalizedSearch));
    });
  }, [brandFilter, instructors, search, specialtyFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredInstructors.length / pageSize));
  const visibleInstructors = filteredInstructors.slice((page - 1) * pageSize, page * pageSize);
  const selectedInstructor = instructors.find((instructor) => instructor.id === selectedId) ?? instructors[0];
  const allVisibleSelected = visibleInstructors.length > 0 && visibleInstructors.every((instructor) => selectedRows.has(instructor.id));
  const someVisibleSelected = visibleInstructors.some((instructor) => selectedRows.has(instructor.id)) && !allVisibleSelected;
  const filtersActive = search.trim() !== "" || brandFilter !== brandView || specialtyFilter !== "all" || statusFilter !== "all";

  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  useEffect(() => { if (selectAllRef.current) selectAllRef.current.indeterminate = someVisibleSelected; }, [someVisibleSelected]);
  useEffect(() => {
    if (filteredInstructors.length && !filteredInstructors.some((instructor) => instructor.id === selectedId)) {
      setSelectedId(filteredInstructors[0].id);
    }
  }, [filteredInstructors, selectedId]);

  const announce = (message: string) => {
    setFeedback("");
    window.setTimeout(() => setFeedback(message), 0);
  };

  const resetFilters = () => {
    setSearch("");
    setBrandFilter(brandView);
    setSpecialtyFilter("all");
    setStatusFilter("all");
    setPage(1);
    announce(`Directory filters reset to the ${brandView === "all" ? "All Brands" : brandLabel(brandView)} context.`);
  };

  const changeFilter = (update: () => void) => { update(); setPage(1); };

  const selectInstructor = (id: string, trigger?: HTMLElement) => {
    lastTriggerRef.current = trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setSelectedId(id);
    setDetailOpen(true);
    setMenuId(undefined);
  };

  const openDialog = (mode: Exclude<PreviewDialogMode, null>, trigger?: HTMLElement) => {
    lastTriggerRef.current = trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setDialogError("");
    setDialogMode(mode);
    if (mode === "add") {
      setDraftName(""); setDraftTitle(""); setDraftEmail("");
    } else if (mode === "edit") {
      setDraftName(selectedInstructor.displayName); setDraftTitle(selectedInstructor.academicTitle); setDraftEmail(selectedInstructor.email);
    }
  };

  const closeDialog = () => {
    setDialogMode(null);
    setDialogError("");
    window.setTimeout(() => lastTriggerRef.current?.focus(), 0);
  };

  const toggleBrand = (brandCode: AdminBrandCode, forceActive?: boolean) => {
    setInstructors((current) => current.map((instructor) => {
      if (instructor.id !== selectedInstructor.id) return instructor;
      const existing = instructor.brandAssignments.find((assignment) => assignment.brandCode === brandCode);
      const nextActive = forceActive ?? existing?.status !== "active";
      const brandAssignments = existing
        ? instructor.brandAssignments.map((assignment) => assignment.brandCode === brandCode ? { ...assignment, status: nextActive ? "active" as const : "inactive" as const } : assignment)
        : [...instructor.brandAssignments, { brandCode, status: "active" as const, teachingRole: "Course instructor", assignedAt: "2026-08-27" }];
      const courseAssignments = nextActive ? instructor.courseAssignments : instructor.courseAssignments.map((course) => course.brandCode === brandCode ? { ...course, active: false } : course);
      return { ...instructor, brandAssignments, courseAssignments, updatedAt: "2026-08-27" };
    }));
    const wasActive = selectedInstructor.brandAssignments.some((assignment) => assignment.brandCode === brandCode && assignment.status === "active");
    const nowActive = forceActive ?? !wasActive;
    announce(`${brandLabel(brandCode)} affiliation ${nowActive ? "activated" : "deactivated"} in this frontend preview. The global identity and other brand remain unchanged.`);
  };

  const toggleGlobalStatus = (id: string) => {
    setInstructors((current) => current.map((instructor) => instructor.id === id ? { ...instructor, status: instructor.status === "active" ? "inactive" as const : "active" as const, updatedAt: "2026-08-27" } : instructor));
    const instructor = instructors.find((item) => item.id === id);
    if (instructor) announce(`${instructor.displayName} is now ${instructor.status === "active" ? "inactive" : "active"} in this frontend preview.`);
    setMenuId(undefined);
  };

  const submitDialog = () => {
    if (dialogMode === "add") {
      if (!draftName.trim() || !draftTitle.trim() || !draftEmail.trim()) { setDialogError("Name, academic title, and fixture email are required."); return; }
      const ordinal = 10100 + instructors.length;
      const id = `ins-${ordinal}`;
      const created: AdminInstructorFixture = {
        id, reference: `INS-${ordinal}`, displayName: draftName.trim(), initials: draftName.trim().split(/\s+/).filter((part) => !/^dr\.?$/i.test(part)).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "IN",
        academicTitle: draftTitle.trim(), specialties: ["Clinical Medicine"], bio: "Frontend-local instructor preview created for this session.", email: draftEmail.trim(), presence: "offline", status: "active", createdAt: "2026-08-27", updatedAt: "2026-08-27", brandAssignments: [], courseAssignments: [], schedule: [], performance: [], activity: [],
      };
      setInstructors((current) => [...current, created]);
      setSelectedId(id); setDetailOpen(true); setBrandFilter("all"); setPage(Math.ceil((instructors.length + 1) / pageSize));
      announce(`${created.displayName} was added to this session only. No backend record was created.`);
      closeDialog(); return;
    }
    if (dialogMode === "edit") {
      if (!draftName.trim() || !draftTitle.trim() || !draftEmail.trim()) { setDialogError("Name, academic title, and fixture email are required."); return; }
      setInstructors((current) => current.map((instructor) => instructor.id === selectedInstructor.id ? { ...instructor, displayName: draftName.trim(), academicTitle: draftTitle.trim(), email: draftEmail.trim(), updatedAt: "2026-08-27" } : instructor));
      announce(`${draftName.trim()} was updated for this session only.`); closeDialog(); return;
    }
    if (dialogMode === "assign-brand") {
      if (selectedInstructor.brandAssignments.some((assignment) => assignment.brandCode === draftBrand && assignment.status === "active")) { setDialogError(`${brandLabel(draftBrand)} is already an active affiliation.`); return; }
      toggleBrand(draftBrand, true); closeDialog(); return;
    }
    if (dialogMode === "assign-course") {
      const selectedCourse = instructorCourseCatalog.find((course) => course.id === draftCourseId);
      if (!selectedCourse) { setDialogError("Choose a course."); return; }
      const hasActiveBrand = selectedInstructor.brandAssignments.some((assignment) => assignment.brandCode === selectedCourse.brandCode && assignment.status === "active");
      if (!hasActiveBrand) { setDialogError(`Assignment blocked: ${selectedInstructor.displayName} needs an active ${brandLabel(selectedCourse.brandCode)} affiliation before receiving this course.`); return; }
      const alreadyAssigned = selectedInstructor.courseAssignments.some((course) => course.brandCode === selectedCourse.brandCode && course.courseCode === selectedCourse.courseCode);
      if (alreadyAssigned) { setDialogError(`${selectedCourse.courseName} is already assigned in ${brandLabel(selectedCourse.brandCode)}.`); return; }
      setInstructors((current) => current.map((instructor) => instructor.id === selectedInstructor.id ? { ...instructor, courseAssignments: [...instructor.courseAssignments, { ...selectedCourse, id: `${instructor.id}-${selectedCourse.id}`, teachingRole: "Course instructor", active: true }], updatedAt: "2026-08-27" } : instructor));
      announce(`${selectedCourse.courseName} was assigned within ${brandLabel(selectedCourse.brandCode)} for this session only.`); closeDialog();
    }
  };

  return <section className="admin-page admin-instructors" aria-label="Global Instructor Directory">
    <div className={`admin-instructors-workspace${detailOpen ? " has-detail" : ""}`}>
      <article className="admin-instructor-directory">
        <header className="admin-instructor-directory__header">
          <div><h2>Global Instructor Directory</h2><span>{instructors.length} instructors</span></div>
          <div>
            {selectedRows.size > 0 && <span className="admin-instructor-selection" role="status"><Check aria-hidden="true" />{selectedRows.size} selected</span>}
            <button className="admin-instructor-button is-secondary" type="button" onClick={() => announce("Export is unavailable in the frontend preview.")}><Download aria-hidden="true" />Export</button>
            <button className="admin-instructor-button is-primary" type="button" onClick={(event) => openDialog("add", event.currentTarget)}><Plus aria-hidden="true" />Add Instructor</button>
          </div>
        </header>

        <div className="admin-instructor-filters">
          <label className="admin-instructor-filter-search"><span className="admin-sr-only">Search instructors</span><Search aria-hidden="true" /><input type="search" value={search} onChange={(event) => changeFilter(() => setSearch(event.target.value))} placeholder="Search instructors…" /></label>
          <label><span className="admin-sr-only">Filter by brand</span><select value={brandFilter} onChange={(event) => changeFilter(() => setBrandFilter(event.target.value as BrandFilter))}><option value="all">All Brands</option><option value="medway">Medway</option><option value="elite">Elite</option><option value="both">Both Brands</option><option value="unassigned">Unassigned</option></select></label>
          <label><span className="admin-sr-only">Filter by specialty</span><select value={specialtyFilter} onChange={(event) => changeFilter(() => setSpecialtyFilter(event.target.value))}><option value="all">All Specialties</option>{instructorSpecialtyOptions.map((specialty) => <option key={specialty}>{specialty}</option>)}</select></label>
          <label><span className="admin-sr-only">Filter by global status</span><select value={statusFilter} onChange={(event) => changeFilter(() => setStatusFilter(event.target.value as StatusFilter))}><option value="all">All Statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
          {filtersActive && <button className="admin-instructor-reset" type="button" onClick={resetFilters}><RotateCcw aria-hidden="true" />Reset</button>}
        </div>

        <div className="admin-instructor-table-wrap">
          <table className="admin-instructor-table">
            <caption className="admin-sr-only">Global instructors with independent brand and course assignments</caption>
            <thead><tr><th className="is-check"><input ref={selectAllRef} type="checkbox" aria-label="Select all instructors on this page" checked={allVisibleSelected} onChange={() => setSelectedRows((current) => { const next = new Set(current); visibleInstructors.forEach((instructor) => allVisibleSelected ? next.delete(instructor.id) : next.add(instructor.id)); return next; })} /></th><th>Instructor</th><th className="is-specialty">Specialties</th><th>Brands</th><th>Active Courses</th><th>Status</th><th><span className="admin-sr-only">Actions</span></th></tr></thead>
            <tbody>{visibleInstructors.map((instructor) => {
              const activeBrands = instructor.brandAssignments.filter((assignment) => assignment.status === "active").map((assignment) => assignment.brandCode);
              const activeCourses = instructor.courseAssignments.filter((course) => course.active && (brandFilter === "all" || brandFilter === "both" || brandFilter === "unassigned" || course.brandCode === brandFilter));
              const medwayCourses = instructor.courseAssignments.filter((course) => course.active && course.brandCode === "medway").length;
              const eliteCourses = instructor.courseAssignments.filter((course) => course.active && course.brandCode === "elite").length;
              const isSelected = instructor.id === selectedId && detailOpen;
              return <tr key={instructor.id} className={isSelected ? "is-selected" : ""} aria-selected={isSelected} onDoubleClick={() => selectInstructor(instructor.id)}>
                <td className="is-check"><input type="checkbox" aria-label={`Select ${instructor.displayName}`} checked={selectedRows.has(instructor.id)} onChange={() => setSelectedRows((current) => { const next = new Set(current); next.has(instructor.id) ? next.delete(instructor.id) : next.add(instructor.id); return next; })} /></td>
                <td><button className="admin-instructor-person" type="button" aria-label={`View ${instructor.displayName}${isSelected ? ", selected" : ""}`} onClick={(event) => selectInstructor(instructor.id, event.currentTarget)}><span className="admin-instructor-avatar" aria-hidden="true">{instructor.initials}<i className={`is-${instructor.presence}`} /></span><span><strong>{instructor.displayName}</strong><small>{instructor.email}</small>{isSelected && <em>Selected</em>}</span></button></td>
                <td className="is-specialty"><span className="admin-instructor-specialty" title={instructor.specialties.join(", ")}>{instructor.specialties[0]}{instructor.specialties.length > 1 && <small aria-label={`${instructor.specialties.length - 1} additional specialty`}>+{instructor.specialties.length - 1}</small>}</span></td>
                <td><div className="admin-instructor-brands" aria-label={activeBrands.length ? `Active brands: ${activeBrands.map(brandLabel).join(" and ")}` : "No active brand assignment"}>{activeBrands.includes("medway") && <span className="is-medway">M</span>}{activeBrands.includes("elite") && <span className="is-elite">E</span>}<small>{activeBrands.length === 2 ? "Both brands" : activeBrands.length === 1 ? brandLabel(activeBrands[0]) : "Unassigned"}</small></div></td>
                <td><span className="admin-instructor-course-count" aria-label={`${activeCourses.length} active courses. Medway ${medwayCourses}, Elite ${eliteCourses}.`}>{activeCourses.length}<small>{brandFilter === "all" || brandFilter === "both" ? `M ${medwayCourses} · E ${eliteCourses}` : brandFilter === "unassigned" ? "No brand" : brandLabel(brandFilter)}</small></span></td>
                <td><span className={`admin-instructor-status is-${instructor.status}`}><i />{instructor.status === "active" ? "Active" : "Inactive"}</span></td>
                <td className="is-actions"><button type="button" aria-label={`Open actions for ${instructor.displayName}`} aria-expanded={menuId === instructor.id} onClick={() => { setSelectedId(instructor.id); setMenuId((current) => current === instructor.id ? undefined : instructor.id); }}><MoreVertical aria-hidden="true" /></button>{menuId === instructor.id && <div className="admin-instructor-row-menu" role="menu"><button type="button" role="menuitem" onClick={() => selectInstructor(instructor.id)}>View Instructor</button><button type="button" role="menuitem" onClick={(event) => { selectInstructor(instructor.id); openDialog("edit", event.currentTarget); }}>Edit preview</button><button type="button" role="menuitem" onClick={(event) => { selectInstructor(instructor.id); openDialog("assign-brand", event.currentTarget); }}>Assign to Brand</button><button type="button" role="menuitem" onClick={(event) => { selectInstructor(instructor.id); openDialog("assign-course", event.currentTarget); }}>Assign to Course</button><button type="button" role="menuitem" onClick={() => toggleGlobalStatus(instructor.id)}>{instructor.status === "active" ? "Deactivate preview" : "Activate preview"}</button></div>}</td>
              </tr>;
            })}</tbody>
          </table>
          {visibleInstructors.length === 0 && <div className="admin-instructor-directory-empty"><UserRound aria-hidden="true" /><strong>No instructors match these filters</strong><span>Reset the directory filters or try a broader search.</span><button type="button" onClick={resetFilters}>Reset filters</button></div>}
        </div>

        <footer className="admin-instructor-pagination">
          <span>{filteredInstructors.length ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filteredInstructors.length)} of ${filteredInstructors.length}` : "0 instructors"}</span>
          <div><button type="button" aria-label="Previous instructor page" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft aria-hidden="true" /></button><strong>Page {page} of {totalPages}</strong><button type="button" aria-label="Next instructor page" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}><ChevronRight aria-hidden="true" /></button></div>
          <label><span className="admin-sr-only">Instructors per page</span><select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}><option value={8}>8 / page</option><option value={10}>10 / page</option></select></label>
        </footer>
      </article>

      {detailOpen && selectedInstructor && <>
        {drawer && <button className="admin-instructor-drawer-backdrop" type="button" aria-label="Close instructor detail drawer" onClick={() => { setDetailOpen(false); lastTriggerRef.current?.focus(); }} />}
        <AdminInstructorDetailPanel instructor={selectedInstructor} drawer={drawer} onClose={() => { setDetailOpen(false); lastTriggerRef.current?.focus(); }} onFeedback={announce} onOpenAssignBrand={() => openDialog("assign-brand")} onOpenAssignCourse={() => openDialog("assign-course")} />
      </>}
    </div>

    <span className="admin-sr-only" role="status" aria-live="polite">{feedback}</span>
    {feedback && <div className="admin-instructor-toast" role="status"><Check aria-hidden="true" /><span>{feedback}</span><button type="button" aria-label="Dismiss notification" onClick={() => setFeedback("")}><X aria-hidden="true" /></button></div>}

    {dialogMode && <PreviewDialog mode={dialogMode} instructor={selectedInstructor} error={dialogError} draftName={draftName} draftTitle={draftTitle} draftEmail={draftEmail} draftBrand={draftBrand} draftCourseId={draftCourseId} onName={setDraftName} onTitle={setDraftTitle} onEmail={setDraftEmail} onBrand={setDraftBrand} onCourse={setDraftCourseId} onClose={closeDialog} onSubmit={submitDialog} />}
  </section>;
}

function PreviewDialog({ mode, instructor, error, draftName, draftTitle, draftEmail, draftBrand, draftCourseId, onName, onTitle, onEmail, onBrand, onCourse, onClose, onSubmit }: {
  mode: Exclude<PreviewDialogMode, null>; instructor: AdminInstructorFixture; error: string; draftName: string; draftTitle: string; draftEmail: string; draftBrand: AdminBrandCode; draftCourseId: string;
  onName: (value: string) => void; onTitle: (value: string) => void; onEmail: (value: string) => void; onBrand: (value: AdminBrandCode) => void; onCourse: (value: string) => void; onClose: () => void; onSubmit: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const title = mode === "add" ? "Add Instructor Preview" : mode === "edit" ? "Edit Global Identity" : mode === "assign-brand" ? "Manage Brand Assignments" : "Assign to Course";
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const firstInput = dialogRef.current?.querySelector<HTMLElement>("input, select");
    (firstInput ?? closeRef.current)?.focus();
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  return <div className="admin-instructor-dialog-layer">
    <button className="admin-instructor-dialog-backdrop" type="button" aria-label={`Close ${title}`} onClick={onClose} />
    <div ref={dialogRef} className="admin-instructor-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-instructor-dialog-title">
      <header><div><span>Frontend preview only</span><h2 id="admin-instructor-dialog-title">{title}</h2></div><button ref={closeRef} type="button" aria-label={`Close ${title}`} onClick={onClose}><X aria-hidden="true" /></button></header>
      <div className="admin-instructor-dialog__body">
        {(mode === "add" || mode === "edit") && <>
          <label>Display name<input value={draftName} onChange={(event) => onName(event.target.value)} placeholder="Dr. Fictional Instructor" /></label>
          <label>Academic title<input value={draftTitle} onChange={(event) => onTitle(event.target.value)} placeholder="Lecturer in Clinical Medicine" /></label>
          <label>Fixture email<input type="email" value={draftEmail} onChange={(event) => onEmail(event.target.value)} placeholder="instructor@example.edu" /></label>
        </>}
        {mode === "assign-brand" && <><p><strong>{instructor.displayName}</strong> keeps one global identity. Manage Medway and Elite independently; this preview never creates an All Brands affiliation.</p><ul className="admin-instructor-brand-manager">{(["medway", "elite"] as const).map((brandCode) => { const assignment = instructor.brandAssignments.find((item) => item.brandCode === brandCode); return <li key={brandCode}><strong>{brandLabel(brandCode)}</strong><span>{assignment ? assignment.status === "active" ? "Active" : "Inactive / Historical" : "Not assigned"}</span><small>{assignment?.teachingRole ?? "No teaching role"}</small></li>; })}</ul><label>Teaching brand<select value={draftBrand} onChange={(event) => onBrand(event.target.value as AdminBrandCode)}><option value="medway">Medway</option><option value="elite">Elite</option></select></label></>}
        {mode === "assign-course" && <><p>Course assignments require an active affiliation in the same brand. Invalid cross-brand assignments are blocked locally.</p><label>Brand-scoped course<select value={draftCourseId} onChange={(event) => onCourse(event.target.value)}>{instructorCourseCatalog.map((course) => <option key={course.id} value={course.id}>{brandLabel(course.brandCode)} · {course.courseCode} · {course.courseName}</option>)}</select></label></>}
        {error && <div className="admin-instructor-dialog__error" role="alert">{error}</div>}
        <div className="admin-instructor-dialog__note">Changes remain in this browser session. No backend record, invitation, email, or message is created.</div>
      </div>
      <footer><button type="button" onClick={onClose}>Cancel</button><button className="is-primary" type="button" onClick={onSubmit}>{mode === "assign-course" ? "Validate & Assign" : mode === "assign-brand" ? (instructor.brandAssignments.find((item) => item.brandCode === draftBrand)?.status === "active" ? "Deactivate Brand" : "Activate / Assign Brand") : "Save Preview"}</button></footer>
    </div>
  </div>;
}
