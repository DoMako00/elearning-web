import { useEffect, useMemo, useState } from "react";
import { Archive, Check, Plus, RefreshCw, X } from "lucide-react";
import { extractApiErrorMessage } from "../../../app/api/client";
import { listBrandAccess, listCourses, listInstitutions, type AcademicInstitution, type BrandAccess, type BrandCode, type BrandCourse } from "../api/adminAcademicApi";
import { createSemesterOffering, getSemesterOffering, includeSemesterOfferingCourse, listSemesterOfferings, removeSemesterOfferingCourse, updateSemesterOffering, type SemesterOffering } from "../api/semesterOfferingsApi";
import type { BrandFilter, RecordStatus } from "../types/adminV2.types";
import { BrandBadge, FormField, StatusBadge } from "../shared/AdminV2Primitives";

const dateLabel = (value: string | null | undefined) => value ? new Date(value).toLocaleDateString() : "—";
const dateInput = (value: string | null | undefined) => {
  if (!value) return "";
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};
const dateIso = (value: string) => value ? new Date(value).toISOString() : null;
const nextStatus = (status: SemesterOffering["status"]): SemesterOffering["status"] | null => status === "draft" ? "active" : status === "active" ? "closed" : status === "closed" ? "archived" : null;
const statusLabel: Record<SemesterOffering["status"], RecordStatus> = { draft: "Draft", active: "Active", closed: "Closed", archived: "Archived" };

export function SemesterOfferingsPanel({ brand }: { brand: BrandFilter }) {
  const [rows, setRows] = useState<SemesterOffering[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState<SemesterOffering | null>(null);
  const [brandOptions, setBrandOptions] = useState<BrandAccess[]>([]);
  const [institutions, setInstitutions] = useState<AcademicInstitution[]>([]);
  const [courses, setCourses] = useState<BrandCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [institutionId, setInstitutionId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [semesterId, setSemesterId] = useState("");

  const selectedBrand = brandOptions.find((item) => item.id === selectedBrandId);
  const allowedInstitutions = selectedBrand?.allowedAcademicInstitutions ?? [];
  const activeInstitution = institutions.find((item) => item.id === institutionId);
  const activeLevel = activeInstitution?.levels.find((item) => item.id === levelId);
  const selected = detail?.id === selectedId ? detail : rows.find((item) => item.id === selectedId) ?? null;
  const selectedSemester = selected && institutions.find((item) => item.id === selected.institution.id)?.levels.find((item) => item.id === selected.academicLevel.id)?.semesters.find((item) => item.id === selected.academicSemester.id);
  const included = (detail?.includedCourses ?? []).filter((item) => item.removedAt === null);
  const candidateCourses = useMemo(() => courses.filter((course) => course.status !== "archived"
    && course.academicInstitutionId === selected?.institution.id
    && selectedSemester?.modules.some((unit) => unit.id === course.academicModuleId)), [courses, selected, selectedSemester]);
  const availableCourses = candidateCourses.filter((course) => !included.some((item) => item.courseId === course.id));

  const loadRows = async (preferredId?: string) => {
    setLoading(true); setError("");
    try {
      const result = await listSemesterOfferings(brand === "all" ? {} : { brand });
      setRows(result.items);
      setSelectedId((current) => preferredId && result.items.some((item) => item.id === preferredId) ? preferredId : result.items.some((item) => item.id === current) ? current : result.items[0]?.id ?? "");
    } catch (cause) { setError(extractApiErrorMessage(cause, "Semester Offerings could not be loaded.")); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    let live = true;
    setLoading(true); setError("");
    Promise.all([listBrandAccess(), listInstitutions(), listSemesterOfferings(brand === "all" ? {} : { brand })])
      .then(([brands, academic, result]) => {
        if (!live) return;
        setBrandOptions(brands); setInstitutions(academic); setRows(result.items);
        setSelectedId((current) => result.items.some((item) => item.id === current) ? current : result.items[0]?.id ?? "");
        const fixedBrand = brand === "all" ? "" : brands.find((item) => item.code === brand)?.id ?? "";
        setSelectedBrandId((current) => brand === "all" ? current : fixedBrand);
      })
      .catch((cause) => { if (live) setError(extractApiErrorMessage(cause, "Semester Offering setup data could not be loaded.")); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [brand]);

  useEffect(() => {
    if (!selectedId) { setDetail(null); setCourses([]); return; }
    let live = true;
    setError("");
    void getSemesterOffering(selectedId).then(async (offering) => {
      const brandEntry = brandOptions.find((item) => item.id === offering.brand.id);
      const courseItems = brandEntry ? await listCourses(brandEntry.id) : [];
      if (live) { setDetail(offering); setCourses(courseItems); }
    }).catch((cause) => { if (live) setError(extractApiErrorMessage(cause, "Semester Offering detail could not be loaded.")); });
    return () => { live = false; };
  }, [selectedId, brandOptions]);

  const beginCreate = () => {
    setError(""); setNotice(""); setCreateOpen(true); setEditOpen(false);
    if (brand !== "all") setSelectedBrandId(brandOptions.find((item) => item.code === brand)?.id ?? "");
    setInstitutionId(""); setLevelId(""); setSemesterId("");
  };

  const create = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!selectedBrandId || mutating) return;
    const data = new FormData(event.currentTarget);
    const startsAt = String(data.get("startsAt") ?? ""); const endsAt = String(data.get("endsAt") ?? "");
    if (!startsAt || !endsAt || new Date(endsAt) <= new Date(startsAt)) { setError("The Offering end must be after its start."); return; }
    setMutating(true); setError(""); setNotice("");
    try {
      const offering = await createSemesterOffering(selectedBrandId, {
        academicInstitutionId: institutionId, academicLevelId: levelId, academicSemesterId: semesterId,
        code: String(data.get("code") ?? "").trim(), title: String(data.get("title") ?? "").trim(),
        description: String(data.get("description") ?? "").trim() || null,
        startsAt: dateIso(startsAt), endsAt: dateIso(endsAt),
        salesOpenAt: dateIso(String(data.get("salesOpenAt") ?? "")), salesCloseAt: dateIso(String(data.get("salesCloseAt") ?? "")),
        currency: "EGP", priceMinor: Number(data.get("priceMinor")),
      });
      setCreateOpen(false); setSelectedId(offering.id); setNotice("Draft Offering created."); await loadRows(offering.id);
    } catch (cause) { setError(extractApiErrorMessage(cause, "The Offering could not be created.")); }
    finally { setMutating(false); }
  };

  const update = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!selected || mutating) return;
    const data = new FormData(event.currentTarget); const startsAt = String(data.get("startsAt") ?? ""); const endsAt = String(data.get("endsAt") ?? "");
    if (!startsAt || !endsAt || new Date(endsAt) <= new Date(startsAt)) { setError("The Offering end must be after its start."); return; }
    setMutating(true); setError(""); setNotice("");
    try {
      await updateSemesterOffering(selected.id, { expectedVersion: selected.version, title: String(data.get("title") ?? "").trim(), description: String(data.get("description") ?? "").trim() || null, priceMinor: Number(data.get("priceMinor")), startsAt: dateIso(startsAt), endsAt: dateIso(endsAt), salesOpenAt: dateIso(String(data.get("salesOpenAt") ?? "")), salesCloseAt: dateIso(String(data.get("salesCloseAt") ?? "")) });
      setEditOpen(false); setNotice("Offering updated from the server."); await loadRows(); await refreshDetail(selected.id);
    } catch (cause) { setError(extractApiErrorMessage(cause, "The Offering could not be updated.")); }
    finally { setMutating(false); }
  };

  const refreshDetail = async (id = selectedId) => { if (!id) return; try { setDetail(await getSemesterOffering(id)); } catch (cause) { setError(extractApiErrorMessage(cause, "Offering detail could not be refreshed.")); } };
  const changeStatus = async () => {
    if (!selected || !nextStatus(selected.status) || mutating) return;
    setMutating(true); setError(""); setNotice("");
    try { await updateSemesterOffering(selected.id, { expectedVersion: selected.version, status: nextStatus(selected.status) }); setNotice(`Offering moved to ${nextStatus(selected.status)}.`); await loadRows(); await refreshDetail(selected.id); }
    catch (cause) { setError(extractApiErrorMessage(cause, "The Offering status could not be changed.")); }
    finally { setMutating(false); }
  };
  const includeCourse = async (courseId: string) => {
    if (!selected || !detail || mutating || !courseId) return;
    setMutating(true); setError(""); setNotice("");
    try { await includeSemesterOfferingCourse(selected.id, courseId, detail.version, included.length + 1); setNotice("Course included in the Offering."); await loadRows(); await refreshDetail(selected.id); }
    catch (cause) { setError(extractApiErrorMessage(cause, "Course could not be included.")); }
    finally { setMutating(false); }
  };
  const removeCourse = async (courseId: string) => {
    if (!selected || !detail || mutating) return;
    setMutating(true); setError(""); setNotice("");
    try { await removeSemesterOfferingCourse(selected.id, courseId, detail.version); setNotice("Course removed; Offering history is preserved."); await loadRows(); await refreshDetail(selected.id); }
    catch (cause) { setError(extractApiErrorMessage(cause, "Course could not be removed.")); }
    finally { setMutating(false); }
  };

  return <section className="admin-v2__table-card" aria-labelledby="semester-offerings-heading">
    <header className="admin-v2__table-toolbar"><div><strong id="semester-offerings-heading">Semester Offerings</strong><span>{loading ? "Loading…" : `${rows.length} server records`}</span></div><div className="admin-v2__table-tools"><button className="admin-v2__button" type="button" onClick={() => void loadRows()} disabled={loading || mutating}><RefreshCw size={14} /> Refresh</button><button className="admin-v2__button is-primary" type="button" onClick={beginCreate} disabled={mutating}><Plus size={14} /> Create Offering</button></div></header>
    {error && <p className="admin-v2__inline-notice" role="alert">{error}</p>}{notice && <p className="admin-v2__inline-notice" role="status">{notice}</p>}
    {createOpen && <form className="admin-v2__form" onSubmit={create}>
      <FormField label="Brand"><select required value={selectedBrandId} onChange={(event) => setSelectedBrandId(event.target.value)}><option value="">Select authorized Brand</option>{brandOptions.filter((item) => brand === "all" || item.code === brand).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></FormField>
      <FormField label="Institution"><select required value={institutionId} onChange={(event) => { setInstitutionId(event.target.value); setLevelId(""); setSemesterId(""); }}><option value="">Select Institution</option>{institutions.filter((item) => allowedInstitutions.some((allowed) => allowed.id === item.id)).map((item) => <option key={item.id} value={item.id}>{item.displayName}</option>)}</select></FormField>
      <FormField label="Academic year"><select required value={levelId} onChange={(event) => { setLevelId(event.target.value); setSemesterId(""); }}><option value="">Select year</option>{activeInstitution?.levels.filter((item) => item.status === "active").map((item) => <option key={item.id} value={item.id}>{item.displayTitle}</option>)}</select></FormField>
      <FormField label="Semester"><select required value={semesterId} onChange={(event) => setSemesterId(event.target.value)}><option value="">Select semester</option>{activeLevel?.semesters.filter((item) => item.status === "active").map((item) => <option key={item.id} value={item.id}>{item.displayTitle}</option>)}</select></FormField>
      <FormField label="Offering code"><input name="code" required maxLength={80} /></FormField><FormField label="Title"><input name="title" required maxLength={200} /></FormField>
      <FormField label="Price (minor units)"><input name="priceMinor" type="number" min="0" step="1" required /></FormField><FormField label="Currency"><input value="EGP" readOnly aria-label="Currency" /></FormField>
      <FormField label="Starts at"><input name="startsAt" type="datetime-local" required /></FormField><FormField label="Ends at"><input name="endsAt" type="datetime-local" required /></FormField>
      <FormField label="Sales open (optional)"><input name="salesOpenAt" type="datetime-local" /></FormField><FormField label="Sales close (optional)"><input name="salesCloseAt" type="datetime-local" /></FormField>
      <FormField label="Description (optional)" wide><textarea name="description" maxLength={4000} rows={2} /></FormField>
      <div className="admin-v2__table-tools"><button className="admin-v2__button" type="button" disabled={mutating} onClick={() => setCreateOpen(false)}>Cancel</button><button className="admin-v2__button is-primary" disabled={mutating || !selectedBrandId || !institutionId || !levelId || !semesterId}>{mutating ? "Saving…" : "Create draft"}</button></div>
    </form>}
    <div className="admin-v2__table-scroll"><table className="admin-v2__table"><thead><tr><th>Offering</th><th>Brand</th><th>Academic scope</th><th>Term</th><th>Courses</th><th>Status</th></tr></thead><tbody>{rows.map((item) => <tr key={item.id} onClick={() => { setSelectedId(item.id); setEditOpen(false); }} className={selected?.id === item.id ? "is-selected" : ""}><td><b>{item.title}<small>{item.code}</small></b></td><td><BrandBadge brand={item.brand.code as BrandCode} /></td><td>{item.institution.name} · {item.academicLevel.title} · {item.academicSemester.title}</td><td>{dateLabel(item.startsAt)} — {dateLabel(item.endsAt)}</td><td>{item.includedCourseCount}</td><td><StatusBadge status={statusLabel[item.status]} /></td></tr>)}</tbody></table>{!loading && !rows.length && <div className="admin-v2__empty">No Semester Offerings are stored for this Brand scope.</div>}</div>
    {selected && <section className="admin-v2__inspector-section"><header><h3>Offering details</h3><div className="admin-v2__table-tools"><button type="button" className="admin-v2__button" disabled={mutating} onClick={() => setEditOpen((value) => !value)}>{editOpen ? "Close edit" : "Edit"}</button>{nextStatus(selected.status) && <button type="button" className="admin-v2__button" disabled={mutating} onClick={() => void changeStatus()}>{selected.status === "draft" ? <Check size={14} /> : selected.status === "active" ? <X size={14} /> : <Archive size={14} />}{nextStatus(selected.status)}</button>}</div></header>
      {editOpen ? <form className="admin-v2__form" onSubmit={update}><FormField label="Title"><input name="title" required defaultValue={selected.title} /></FormField><FormField label="Price (minor units)"><input name="priceMinor" type="number" min="0" step="1" required defaultValue={selected.priceMinor} /></FormField><FormField label="Starts at"><input name="startsAt" type="datetime-local" required defaultValue={dateInput(selected.startsAt)} /></FormField><FormField label="Ends at"><input name="endsAt" type="datetime-local" required defaultValue={dateInput(selected.endsAt)} /></FormField><FormField label="Sales open"><input name="salesOpenAt" type="datetime-local" defaultValue={dateInput(selected.salesOpenAt)} /></FormField><FormField label="Sales close"><input name="salesCloseAt" type="datetime-local" defaultValue={dateInput(selected.salesCloseAt)} /></FormField><FormField label="Description" wide><textarea name="description" rows={2} defaultValue={selected.description ?? ""} /></FormField><button className="admin-v2__button is-primary" disabled={mutating}>{mutating ? "Saving…" : "Save Offering"}</button></form> : <dl className="admin-v2__fields">{[["Offering ID", selected.id], ["Brand", <BrandBadge brand={selected.brand.code as BrandCode} />], ["Institution", selected.institution.name], ["Academic level", selected.academicLevel.title], ["Semester", selected.academicSemester.title], ["Price", `${(selected.priceMinor / 100).toLocaleString()} ${selected.currency}`], ["Term", `${dateLabel(selected.startsAt)} — ${dateLabel(selected.endsAt)}`], ["Sales window", `${dateLabel(selected.salesOpenAt)} — ${dateLabel(selected.salesCloseAt)}`], ["Version", selected.version]].map(([label, value]) => <div key={String(label)}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
      <div className="admin-v2__member-list">{included.map((course) => <div key={course.courseId}><span aria-hidden="true">•</span><b>{course.title}<small>{course.code} · included</small></b><button type="button" className="admin-v2__button is-danger" disabled={mutating || selected.status === "archived"} onClick={() => void removeCourse(course.courseId)}>Remove</button></div>)}{!included.length && <p className="admin-v2__empty-inline">No courses are included in this Offering.</p>}</div>
      <label className="admin-v2__field"><span>Add a compatible Brand Course</span><select value="" disabled={mutating || !availableCourses.length || selected.status === "archived"} onChange={(event) => void includeCourse(event.target.value)}><option value="">{availableCourses.length ? "Select a course to include" : "No compatible course available"}</option>{availableCourses.map((course) => <option key={course.id} value={course.id}>{course.code} · {course.title}</option>)}</select></label>
    </section>}
  </section>;
}
