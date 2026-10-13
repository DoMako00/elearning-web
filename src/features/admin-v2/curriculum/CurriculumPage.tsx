import { useMemo, useState, type FormEvent } from "react";
import { BookOpen, ChevronDown, ChevronRight, ChevronUp, GraduationCap, Pencil, Plus, X } from "lucide-react";
import { AdminV2DomainStatus, useAdminV2 } from "../layout/AdminV2Layout";
import { ConfirmDialog, Drawer, FormActions, FormField, StatusBadge } from "../shared/AdminV2Primitives";
import type { CurriculumUnitRecord } from "../types/adminV2.types";

type EditorState = { kind: "institution" | "year" | "semester" | "unit"; id?: string } | null;

export function CurriculumPage() {
  const { data, setData } = useAdminV2();
  const [institutionId, setInstitutionId] = useState("inst-buc");
  const [yearId, setYearId] = useState("year-buc-1");
  const [selectedUnitId, setSelectedUnitId] = useState("unit-buc-anatomy");
  const [unitSemesterId, setUnitSemesterId] = useState("sem-buc-y1-1");
  const [expanded, setExpanded] = useState<string[]>(["sem-buc-y1-1"]);
  const [editor, setEditor] = useState<EditorState>(null);
  const [archiveId, setArchiveId] = useState("");
  const activeInstitution = data.institutions.find((item) => item.id === institutionId && item.status === "Active") ?? data.institutions.find((item) => item.status === "Active");
  const curriculum = data.curricula.find((item) => item.institutionId === activeInstitution?.id);
  const years = useMemo(() => data.academicYears.filter((item) => item.curriculumId === curriculum?.id && item.status === "Active").sort((a, b) => a.order - b.order), [data.academicYears, curriculum?.id]);
  const selectedYear = years.find((item) => item.id === yearId) ?? years[0];
  const semesters = data.semesters.filter((item) => item.academicYearId === selectedYear?.id && item.status === "Active").sort((a, b) => a.order - b.order);
  const units = data.curriculumUnits.filter((item) => item.institutionId === activeInstitution?.id && item.academicYearId === selectedYear?.id && item.status !== "Archived");
  const selectedUnit = units.find((item) => item.id === selectedUnitId) ?? units[0];
  const currentEditorUnit = editor?.kind === "unit" ? data.curriculumUnits.find((item) => item.id === editor.id) : undefined;
  const currentEditorYear = editor?.kind === "year" ? data.academicYears.find((item) => item.id === editor.id) : undefined;
  const currentEditorSemester = editor?.kind === "semester" ? data.semesters.find((item) => item.id === editor.id) : undefined;

  const submitEditor = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const stamp = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
    if (editor?.kind === "institution") {
      const name = String(form.get("name") ?? "").trim();
      const shortName = String(form.get("shortName") ?? "").trim();
      const id = `inst-${Date.now()}`;
      const curriculumId = `cur-${Date.now()}`;
      setData((current) => ({ ...current, institutions: [...current.institutions, { id, name, shortName, status: "Active" }], curricula: [...current.curricula, { id: curriculumId, institutionId: id, title: `${shortName} Curriculum`, status: "Draft", updatedAt: stamp }] }));
      setInstitutionId(id); setYearId(""); setSelectedUnitId(""); setUnitSemesterId(""); setEditor(null); return;
    }
    if (editor?.kind === "year") {
      const title = String(form.get("title") ?? "").trim();
      if (editor.id) setData((current) => ({ ...current, academicYears: current.academicYears.map((item) => item.id === editor.id ? { ...item, title } : item) }));
      else {
        const year = { id: `year-${Date.now()}`, curriculumId: curriculum?.id ?? "", title, order: data.academicYears.filter((item) => item.curriculumId === curriculum?.id).length + 1, status: "Active" as const };
        setData((current) => ({ ...current, academicYears: [...current.academicYears, year] })); setYearId(year.id); setSelectedUnitId(""); setUnitSemesterId("");
      }
      setEditor(null); return;
    }
    if (editor?.kind === "semester") {
      const title = String(form.get("title") ?? "").trim();
      if (editor.id) setData((current) => ({ ...current, semesters: current.semesters.map((item) => item.id === editor.id ? { ...item, title } : item) }));
      else {
        const semester = { id: `sem-${Date.now()}`, academicYearId: selectedYear?.id ?? "", title, order: data.semesters.filter((item) => item.academicYearId === selectedYear?.id).length + 1, status: "Active" as const };
        setData((current) => ({ ...current, semesters: [...current.semesters, semester] })); setUnitSemesterId(semester.id); setExpanded((current) => [...current, semester.id]);
      }
      setEditor(null); return;
    }
    if (editor?.kind === "unit" && selectedYear) {
      const unit: CurriculumUnitRecord = {
        id: editor.id ?? `unit-${Date.now()}`, institutionId: activeInstitution?.id ?? "", academicYearId: selectedYear.id,
        semesterId: String(form.get("semesterId") ?? ""), type: String(form.get("type")) as CurriculumUnitRecord["type"],
        code: String(form.get("code") ?? "").trim(), title: String(form.get("title") ?? "").trim(),
        description: String(form.get("description") ?? "").trim(), status: String(form.get("status")) as CurriculumUnitRecord["status"],
        credits: Number(form.get("credits")) || undefined,
        order: currentEditorUnit?.semesterId === String(form.get("semesterId")) ? currentEditorUnit.order : data.curriculumUnits.filter((item) => item.semesterId === String(form.get("semesterId")) && item.status !== "Archived").length + 1,
      };
      setData((current) => ({ ...current, curriculumUnits: editor.id ? current.curriculumUnits.map((item) => item.id === editor.id ? unit : item) : [...current.curriculumUnits, unit] }));
      setSelectedUnitId(unit.id); setExpanded((current) => current.includes(unit.semesterId) ? current : [...current, unit.semesterId]); setEditor(null);
    }
  };

  const reorderUnit = (step: number) => {
    if (!selectedUnit) return;
    setData((current) => {
      const group = current.curriculumUnits.filter((item) => item.semesterId === selectedUnit.semesterId && item.status !== "Archived").sort((a, b) => a.order - b.order);
      const index = group.findIndex((item) => item.id === selectedUnit.id);
      const nextIndex = index + step;
      if (index < 0 || nextIndex < 0 || nextIndex >= group.length) return current;
      const first = group[index], second = group[nextIndex];
      return { ...current, curriculumUnits: current.curriculumUnits.map((item) => item.id === first.id ? { ...item, order: second.order } : item.id === second.id ? { ...item, order: first.order } : item) };
    });
  };

  return <section className="admin-v2__page admin-v2__curriculum">
    <AdminV2DomainStatus />
    <div className="v2-phase-toolbar">
      <div className="v2-phase-tabs"><span className="is-active" aria-current="page"><BookOpen size={15} /> Structure</span></div>
      <div className="v2-phase-toolbar__actions">
        <label><span>Institution / University</span><select value={activeInstitution?.id ?? ""} onChange={(event) => { const next = event.target.value; setInstitutionId(next); const nextCurriculum = data.curricula.find((item) => item.institutionId === next); const nextYear = data.academicYears.find((item) => item.curriculumId === nextCurriculum?.id && item.status === "Active"); const nextUnit = data.curriculumUnits.find((item) => item.institutionId === next && item.status !== "Archived"); setYearId(nextYear?.id ?? ""); setSelectedUnitId(nextUnit?.id ?? ""); setUnitSemesterId(data.semesters.find((item) => item.academicYearId === nextYear?.id && item.status === "Active")?.id ?? ""); }}><option value="">Select institution</option>{data.institutions.filter((item) => item.status === "Active").map((item) => <option key={item.id} value={item.id}>{item.shortName}</option>)}</select></label>
        <button className="admin-v2__button" type="button" onClick={() => setEditor({ kind: "institution" })}><Plus size={14} /> Add institution</button>
      </div>
    </div>
    <div className="v2-curriculum-grid">
      <section className="v2-phase-panel v2-curriculum-years">
        <header><div><span className="v2-overline">ACADEMIC STRUCTURE</span><h2>Academic years</h2></div></header>
        <div className="v2-curriculum-year-list">
          {years.map((year) => {
            const yearSemesters = data.semesters.filter((item) => item.academicYearId === year.id && item.status === "Active");
            const count = data.curriculumUnits.filter((item) => item.academicYearId === year.id && item.status !== "Archived").length;
            return <div key={year.id} className={`v2-year-item${selectedYear?.id === year.id ? " is-selected" : ""}`}>
              <button type="button" className="v2-year-item__select" aria-pressed={selectedYear?.id === year.id} onClick={() => { setYearId(year.id); setSelectedUnitId(data.curriculumUnits.find((item) => item.academicYearId === year.id && item.status !== "Archived")?.id ?? ""); setUnitSemesterId(data.semesters.find((item) => item.academicYearId === year.id && item.status === "Active")?.id ?? ""); }}>
                <strong>{year.title}</strong><small>{yearSemesters.length} semesters <i /> {count} units</small>
              </button>
              <span className="v2-year-item__actions"><i aria-hidden="true" /><button type="button" title={`Edit ${year.title}`} aria-label={`Edit ${year.title}`} onClick={() => setEditor({ kind: "year", id: year.id })}><Pencil size={13} /></button></span>
            </div>;
          })}
          {!years.length && <div className="v2-empty"><GraduationCap size={22} /><strong>No academic years yet</strong><span>Add a year for this institution's curriculum.</span><button className="admin-v2__button is-primary" onClick={() => setEditor({ kind: "year" })}><Plus size={14} /> Add academic year</button></div>}
        </div>
        {!!years.length && <button type="button" className="v2-outline-action" onClick={() => setEditor({ kind: "year" })}><Plus size={14} /> Add academic year</button>}
      </section>
      <section className="v2-phase-panel v2-curriculum-structure">
        <header><div><span className="v2-overline">{activeInstitution?.shortName ?? "Institution"}</span><h2>{selectedYear?.title ?? "Academic structure"}</h2></div>{selectedYear && <button className="admin-v2__button" onClick={() => setEditor({ kind: "semester" })}><Plus size={14} /> Add semester</button>}</header>
        <div className="v2-semester-list">
          {semesters.map((semester) => {
            const semesterUnits = units.filter((item) => item.semesterId === semester.id).sort((a, b) => a.order - b.order);
            const isOpen = expanded.includes(semester.id);
            return <section className={`v2-semester${isOpen ? " is-open" : ""}`} key={semester.id}>
              <header><button className="v2-semester__toggle" aria-expanded={isOpen} title={`${isOpen ? "Collapse" : "Expand"} ${semester.title}`} onClick={() => setExpanded((current) => isOpen ? current.filter((id) => id !== semester.id) : [...current, semester.id])}><ChevronDown size={15} /><span><strong>{semester.title}</strong><small>{semesterUnits.length} approved units</small></span></button><button className="admin-v2__icon-btn" title={`Edit ${semester.title}`} aria-label={`Edit ${semester.title}`} onClick={() => setEditor({ kind: "semester", id: semester.id })}><Pencil size={13} /></button></header>
              {isOpen && <div className="v2-semester__units">{semesterUnits.map((unit) => <button type="button" key={unit.id} className={`v2-unit-row${selectedUnit?.id === unit.id ? " is-selected" : ""}`} onClick={() => setSelectedUnitId(unit.id)}><span className="v2-unit-row__code">{unit.code}</span><span className="v2-unit-row__title"><strong>{unit.title}</strong><small>{unit.type} Â· {unit.credits ?? "â€”"} credits</small></span><StatusBadge status={unit.status} /><ChevronRight size={14} /></button>)}{!semesterUnits.length && <div className="v2-empty-inline">No approved units in this semester.</div>}<button className="v2-semester__add" onClick={() => { setUnitSemesterId(semester.id); setSelectedUnitId(""); setEditor({ kind: "unit" }); }}><Plus size={13} /> Add academic unit</button></div>}
            </section>;
          })}
          {!semesters.length && <div className="v2-empty"><strong>No semesters yet</strong><span>There are no semesters in this academic year.</span></div>}
        </div>
      </section>
      <aside className="v2-phase-panel v2-curriculum-inspector">
        {selectedUnit ? <>
          <header><div><span className="v2-overline">CURRICULUM UNIT</span><div className="v2-unit-inspector__code"><h2>{selectedUnit.code}</h2><span>{selectedUnit.type}</span></div></div></header>
          <div className="v2-unit-inspector__body">
            <h3>{selectedUnit.title}</h3><p>{selectedUnit.description || "No description provided."}</p>
            <dl className="v2-detail-grid"><div><dt>Institution</dt><dd>{activeInstitution?.shortName}</dd></div><div><dt>Academic year</dt><dd>{selectedYear?.title}</dd></div><div><dt>Semester</dt><dd>{data.semesters.find((item) => item.id === selectedUnit.semesterId)?.title}</dd></div><div><dt>Credits</dt><dd>{selectedUnit.credits ?? "Not set"}</dd></div><div><dt>Status</dt><dd><StatusBadge status={selectedUnit.status} /></dd></div></dl>
          </div>
          <footer className="v2-inspector-actions"><button className="admin-v2__button" onClick={() => reorderUnit(-1)} title="Move unit up"><ChevronUp size={14} /> Move up</button><button className="admin-v2__button" onClick={() => reorderUnit(1)} title="Move unit down"><ChevronDown size={14} /> Move down</button><button className="admin-v2__button" onClick={() => setEditor({ kind: "unit", id: selectedUnit.id })}><Pencil size={14} /> Edit unit</button><button className="admin-v2__button is-danger" onClick={() => setArchiveId(selectedUnit.id)}><X size={14} /> Archive unit</button></footer>
        </> : <div className="v2-empty"><BookOpen size={22} /><strong>No unit selected</strong><span>Choose a unit or add one to this curriculum.</span>{selectedYear && semesters.length > 0 && <button className="admin-v2__button is-primary" onClick={() => { setUnitSemesterId(semesters[0].id); setEditor({ kind: "unit" }); }}><Plus size={14} /> Add academic unit</button>}</div>}
      </aside>
    </div>
    {editor && <Drawer title={editor.kind === "institution" ? "Add institution" : editor.id ? `Edit ${editor.kind === "year" ? "academic year" : editor.kind === "semester" ? "semester" : "academic unit"}` : `Add ${editor.kind === "year" ? "academic year" : editor.kind === "semester" ? "semester" : "academic unit"}`} subtitle="Changes are saved to this local Admin preview." onClose={() => setEditor(null)} footer={<FormActions><button className="admin-v2__button" type="button" onClick={() => setEditor(null)}>Cancel</button><button className="admin-v2__button is-primary" type="submit" form="curriculum-editor">Save changes</button></FormActions>}>
      <form id="curriculum-editor" className="admin-v2__form" onSubmit={submitEditor}>
        {editor.kind === "institution" && <><FormField label="Institution name" wide><input name="name" required placeholder="e.g. Delta University" /></FormField><FormField label="Short name"><input name="shortName" required placeholder="e.g. DU" /></FormField></>}
        {editor.kind === "year" && <FormField label="Academic year" wide><input name="title" required defaultValue={currentEditorYear?.title} placeholder="e.g. Year 1" /></FormField>}
        {editor.kind === "semester" && <FormField label="Semester" wide><input name="title" required defaultValue={currentEditorSemester?.title} placeholder="e.g. Semester 1" /></FormField>}
        {editor.kind === "unit" && <>
          <FormField label="Semester" wide><select name="semesterId" defaultValue={(currentEditorUnit?.semesterId ?? unitSemesterId) || semesters[0]?.id || ""} required>{semesters.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></FormField>
          <FormField label="Code"><input name="code" required defaultValue={currentEditorUnit?.code} placeholder="e.g. M1.4" /></FormField>
          <FormField label="Unit type"><select name="type" defaultValue={currentEditorUnit?.type ?? (activeInstitution?.shortName === "BUC" && selectedYear?.order === 1 ? "Subject" : "Module")}><option>Subject</option><option>Module</option></select></FormField>
          <FormField label="Title" wide><input name="title" required defaultValue={currentEditorUnit?.title} placeholder="e.g. Cell Biology" /></FormField>
          <FormField label="Description" wide><textarea name="description" rows={3} defaultValue={currentEditorUnit?.description} /></FormField>
          <FormField label="Credits"><input name="credits" type="number" min="0" step="0.5" defaultValue={currentEditorUnit?.credits} /></FormField>
          <FormField label="Status"><select name="status" defaultValue={currentEditorUnit?.status ?? "Approved"}><option>Approved</option><option>Draft</option></select></FormField>
        </>}
      </form>
    </Drawer>}
    {archiveId && <ConfirmDialog title="Archive this academic unit?" detail="The unit will remain in the curriculum record and existing course mappings will be retained." confirmLabel="Archive unit" onCancel={() => setArchiveId("")} onConfirm={() => { setData((current) => ({ ...current, curriculumUnits: current.curriculumUnits.map((item) => item.id === archiveId ? { ...item, status: "Archived" } : item) })); setSelectedUnitId(""); setArchiveId(""); }} />}
  </section>;
}
