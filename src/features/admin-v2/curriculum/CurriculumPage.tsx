import { useMemo, useState, type FormEvent } from "react";
import { BookOpen, ChevronDown, ChevronRight, ChevronUp, GraduationCap, Pencil, Plus, X } from "lucide-react";
import { AdminV2DomainStatus, useAdminV2 } from "../layout/AdminV2Layout";
import { ConfirmDialog, Drawer, FormActions, FormField, StatusBadge } from "../shared/AdminV2Primitives";
import { getAcademicRecord, writeAcademicRecord, type AcademicRecordEntity } from "../api/adminAcademicApi";
import { canonicalAcademicUnitType } from "../api/adminV2Mappers";

type EditorState = { kind: "institution" | "year" | "semester" | "unit"; id?: string } | null;

export function CurriculumPage() {
  const { data, refreshServerDomains, domainLoading } = useAdminV2();
  const [institutionId, setInstitutionId] = useState("inst-buc");
  const [yearId, setYearId] = useState("year-buc-1");
  const [selectedUnitId, setSelectedUnitId] = useState("unit-buc-anatomy");
  const [unitSemesterId, setUnitSemesterId] = useState("sem-buc-y1-1");
  const [expanded, setExpanded] = useState<string[]>(["sem-buc-y1-1"]);
  const [editor, setEditor] = useState<EditorState>(null);
  const [archiveId, setArchiveId] = useState("");
  const [mutationPending, setMutationPending] = useState(false);
  const [mutationError, setMutationError] = useState("");
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

  const createAcademic = (entity:AcademicRecordEntity,fields:Record<string,unknown>)=>writeAcademicRecord(entity,undefined,{...fields,reason:"Admin V2 curriculum record creation"});
  const updateAcademic = async(entity:AcademicRecordEntity,id:string,fields:Record<string,unknown>)=>{
    const current=await getAcademicRecord(entity,id);
    const expectedVersion=Number(current.version);
    if(!Number.isSafeInteger(expectedVersion)||expectedVersion<1)throw new Error("The current academic record version is unavailable. Refresh before editing.");
    return writeAcademicRecord(entity,id,{...fields,expectedVersion,reason:"Admin V2 curriculum record update"});
  };
  const submitEditor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if(mutationPending||!editor)return;
    const form = new FormData(event.currentTarget);
    setMutationPending(true);setMutationError("");
    try{
      if(editor.kind==="institution"){
        const name=String(form.get("name")??"").trim(),shortName=String(form.get("shortName")??"").trim();
        const slug=shortName.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
        const saved=await createAcademic("institutions",{code:shortName,displayName:name,slug,status:"active"});
        if(typeof saved.id==="string")setInstitutionId(saved.id);
        setYearId("");setSelectedUnitId("");setUnitSemesterId("");
      }else if(editor.kind==="year"){
        const title=String(form.get("title")??"").trim();
        if(editor.id)await updateAcademic("levels",editor.id,{displayTitle:title});
        else{
          if(!activeInstitution)throw new Error("Select a persisted academic institution first.");
          const currentLevels=data.academicYears.filter(item=>item.curriculumId===activeInstitution.id);
          const parsed=title.match(/\d+/)?.[0];
          const levelNumber=parsed?Number(parsed):Math.max(0,...currentLevels.map(item=>item.levelNumber??item.order))+1;
          const saved=await createAcademic("levels",{academicInstitutionId:activeInstitution.id,levelNumber,displayTitle:title,sortOrder:Math.max(0,...currentLevels.map(item=>item.order))+1,status:"active"});
          if(typeof saved.id==="string")setYearId(saved.id);setSelectedUnitId("");setUnitSemesterId("");
        }
      }else if(editor.kind==="semester"){
        const title=String(form.get("title")??"").trim();
        if(editor.id)await updateAcademic("semesters",editor.id,{displayTitle:title});
        else{
          if(!selectedYear)throw new Error("Select a persisted academic year first.");
          const currentSemesters=data.semesters.filter(item=>item.academicYearId===selectedYear.id);
          const parsed=title.match(/\d+/)?.[0];
          const semesterNumber=parsed?Number(parsed):Math.max(0,...currentSemesters.map(item=>item.semesterNumber??item.order))+1;
          const saved=await createAcademic("semesters",{academicLevelId:selectedYear.id,semesterNumber,displayTitle:title,sortOrder:Math.max(0,...currentSemesters.map(item=>item.order))+1,status:"active"});
          if(typeof saved.id==="string"){setUnitSemesterId(saved.id);setExpanded(current=>current.includes(saved.id as string)?current:[...current,saved.id as string]);}
        }
      }else if(editor.kind==="unit"&&selectedYear&&activeInstitution){
        const semesterId=String(form.get("semesterId")??"");
        if(editor.id&&currentEditorUnit&&currentEditorUnit.semesterId!==semesterId)throw new Error("An academic unit cannot be moved between semesters because existing course mappings may depend on its placement.");
        const targetSemester=semesters.find(item=>item.id===semesterId);
        if(!targetSemester)throw new Error("Choose an active semester in the selected academic year.");
        const title=String(form.get("title")??"").trim();
        const creditsInput=String(form.get("credits")??"").trim();
        const credits=creditsInput===""?null:Number(creditsInput);
        if(credits!==null&&(!Number.isFinite(credits)||credits<0||Math.round(credits*100)!==credits*100))throw new Error("Credits must be a non-negative value with at most two decimal places.");
        const status=String(form.get("status")??"Approved");
        const fields={displayTitle:title,description:String(form.get("description")??"").trim(),credits,sortOrder:currentEditorUnit?.order??(Math.max(0,...data.curriculumUnits.filter(item=>item.semesterId===semesterId&&item.status!=="Archived").map(item=>item.order))+1),reviewStatus:status==="Approved"?"approved":"unreviewed"};
        const saved=editor.id?await updateAcademic("modules",editor.id,fields):await createAcademic("modules",{academicInstitutionId:activeInstitution.id,academicSemesterId:semesterId,code:String(form.get("code")??"").trim(),sourceDisplayLabel:title,sourceType:"admin",...fields});
        if(typeof saved.id==="string")setSelectedUnitId(saved.id);
        setUnitSemesterId(semesterId);setExpanded(current=>current.includes(semesterId)?current:[...current,semesterId]);
      }
      setEditor(null);refreshServerDomains();
    }catch(error){setMutationError(error instanceof Error?error.message:"The academic change could not be saved.");}
    finally{setMutationPending(false);}
  };

  const reorderUnit = async (step: number) => {
    if (!selectedUnit) return;
    const group=data.curriculumUnits.filter(item=>item.semesterId===selectedUnit.semesterId&&item.status!=="Archived").sort((a,b)=>a.order-b.order);
    const index=group.findIndex(item=>item.id===selectedUnit.id),nextIndex=index+step;
    if(index<0||nextIndex<0||nextIndex>=group.length||mutationPending)return;
    const first=group[index],second=group[nextIndex];setMutationPending(true);setMutationError("");
    try{
      await updateAcademic("modules",first.id,{sortOrder:second.order});
      try{await updateAcademic("modules",second.id,{sortOrder:first.order});}
      catch(error){try{await updateAcademic("modules",first.id,{sortOrder:first.order});}catch{throw new Error("The order update was only partially reconciled. Refresh the curriculum before making another change.");}throw error;}
      refreshServerDomains();
    }catch(error){setMutationError(error instanceof Error?error.message:"The unit order could not be saved.");}
    finally{setMutationPending(false);}
  };

  const confirmArchive=async()=>{
    if(!archiveId||mutationPending)return;setMutationPending(true);setMutationError("");
    try{await updateAcademic("modules",archiveId,{reviewStatus:"retired"});setSelectedUnitId("");setArchiveId("");refreshServerDomains();}
    catch(error){setMutationError(error instanceof Error?error.message:"The academic unit could not be archived.");}
    finally{setMutationPending(false);}
  };

  return <section className="admin-v2__page admin-v2__curriculum">
    <AdminV2DomainStatus />
    {mutationError&&<div className="admin-v2__inline-notice" role="alert">{mutationError}</div>}
    <div className="v2-phase-toolbar">
      <div className="v2-phase-tabs"><span className="is-active" aria-current="page"><BookOpen size={15} /> Structure</span></div>
      <div className="v2-phase-toolbar__actions">
        <label><span>Institution / University</span><select value={activeInstitution?.id ?? ""} onChange={(event) => { const next = event.target.value; setInstitutionId(next); const nextCurriculum = data.curricula.find((item) => item.institutionId === next); const nextYear = data.academicYears.find((item) => item.curriculumId === nextCurriculum?.id && item.status === "Active"); const nextUnit = data.curriculumUnits.find((item) => item.institutionId === next && item.status !== "Archived"); setYearId(nextYear?.id ?? ""); setSelectedUnitId(nextUnit?.id ?? ""); setUnitSemesterId(data.semesters.find((item) => item.academicYearId === nextYear?.id && item.status === "Active")?.id ?? ""); }}><option value="">Select institution</option>{data.institutions.filter((item) => item.status === "Active").map((item) => <option key={item.id} value={item.id}>{item.shortName}</option>)}</select></label>
        <button className="admin-v2__button" type="button" disabled={mutationPending||domainLoading} onClick={() => setEditor({ kind: "institution" })}><Plus size={14} /> Add institution</button>
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
              <span className="v2-year-item__actions"><i aria-hidden="true" /><button type="button" disabled={mutationPending||domainLoading} title={`Edit ${year.title}`} aria-label={`Edit ${year.title}`} onClick={() => setEditor({ kind: "year", id: year.id })}><Pencil size={13} /></button></span>
            </div>;
          })}
          {!years.length && <div className="v2-empty"><GraduationCap size={22} /><strong>No academic years yet</strong><span>Add a year for this institution's curriculum.</span><button className="admin-v2__button is-primary" disabled={mutationPending||domainLoading} onClick={() => setEditor({ kind: "year" })}><Plus size={14} /> Add academic year</button></div>}
        </div>
        {!!years.length && <button type="button" className="v2-outline-action" disabled={mutationPending||domainLoading} onClick={() => setEditor({ kind: "year" })}><Plus size={14} /> Add academic year</button>}
      </section>
      <section className="v2-phase-panel v2-curriculum-structure">
        <header><div><span className="v2-overline">{activeInstitution?.shortName ?? "Institution"}</span><h2>{selectedYear?.title ?? "Academic structure"}</h2></div>{selectedYear && <button className="admin-v2__button" disabled={mutationPending||domainLoading} onClick={() => setEditor({ kind: "semester" })}><Plus size={14} /> Add semester</button>}</header>
        <div className="v2-semester-list">
          {semesters.map((semester) => {
            const semesterUnits = units.filter((item) => item.semesterId === semester.id).sort((a, b) => a.order - b.order);
            const isOpen = expanded.includes(semester.id);
            return <section className={`v2-semester${isOpen ? " is-open" : ""}`} key={semester.id}>
              <header><button className="v2-semester__toggle" aria-expanded={isOpen} title={`${isOpen ? "Collapse" : "Expand"} ${semester.title}`} onClick={() => setExpanded((current) => isOpen ? current.filter((id) => id !== semester.id) : [...current, semester.id])}><ChevronDown size={15} /><span><strong>{semester.title}</strong><small>{semesterUnits.length} approved units</small></span></button><button className="admin-v2__icon-btn" disabled={mutationPending||domainLoading} title={`Edit ${semester.title}`} aria-label={`Edit ${semester.title}`} onClick={() => setEditor({ kind: "semester", id: semester.id })}><Pencil size={13} /></button></header>
              {isOpen && <div className="v2-semester__units">{semesterUnits.map((unit) => <button type="button" key={unit.id} className={`v2-unit-row${selectedUnit?.id === unit.id ? " is-selected" : ""}`} onClick={() => setSelectedUnitId(unit.id)}><span className="v2-unit-row__code">{unit.code}</span><span className="v2-unit-row__title"><strong>{unit.title}</strong><small>{unit.type} Â· {unit.credits ?? "â€”"} credits</small></span><StatusBadge status={unit.status} /><ChevronRight size={14} /></button>)}{!semesterUnits.length && <div className="v2-empty-inline">No approved units in this semester.</div>}<button className="v2-semester__add" disabled={mutationPending||domainLoading} onClick={() => { setUnitSemesterId(semester.id); setSelectedUnitId(""); setEditor({ kind: "unit" }); }}><Plus size={13} /> Add academic unit</button></div>}
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
          <footer className="v2-inspector-actions"><button className="admin-v2__button" disabled={mutationPending||domainLoading} onClick={() => void reorderUnit(-1)} title="Move unit up"><ChevronUp size={14} /> Move up</button><button className="admin-v2__button" disabled={mutationPending||domainLoading} onClick={() => void reorderUnit(1)} title="Move unit down"><ChevronDown size={14} /> Move down</button><button className="admin-v2__button" disabled={mutationPending||domainLoading} onClick={() => setEditor({ kind: "unit", id: selectedUnit.id })}><Pencil size={14} /> Edit unit</button><button className="admin-v2__button is-danger" disabled={mutationPending||domainLoading} onClick={() => setArchiveId(selectedUnit.id)}><X size={14} /> Archive unit</button></footer>
        </> : <div className="v2-empty"><BookOpen size={22} /><strong>No unit selected</strong><span>Choose a unit or add one to this curriculum.</span>{selectedYear && semesters.length > 0 && <button className="admin-v2__button is-primary" disabled={mutationPending||domainLoading} onClick={() => { setUnitSemesterId(semesters[0].id); setEditor({ kind: "unit" }); }}><Plus size={14} /> Add academic unit</button>}</div>}
      </aside>
    </div>
    {editor && <Drawer title={editor.kind === "institution" ? "Add institution" : editor.id ? `Edit ${editor.kind === "year" ? "academic year" : editor.kind === "semester" ? "semester" : "academic unit"}` : `Add ${editor.kind === "year" ? "academic year" : editor.kind === "semester" ? "semester" : "academic unit"}`} subtitle="Changes are saved to the academic catalogue with audit evidence." onClose={() => !mutationPending&&setEditor(null)} footer={<FormActions><button className="admin-v2__button" type="button" disabled={mutationPending} onClick={() => setEditor(null)}>Cancel</button><button className="admin-v2__button is-primary" type="submit" form="curriculum-editor" disabled={mutationPending||domainLoading}>{mutationPending?"Saving…":"Save changes"}</button></FormActions>}>
      <form id="curriculum-editor" className="admin-v2__form" onSubmit={submitEditor}>
        {editor.kind === "institution" && <><FormField label="Institution name" wide><input name="name" required placeholder="e.g. Delta University" /></FormField><FormField label="Short name"><input name="shortName" required placeholder="e.g. DU" /></FormField></>}
        {editor.kind === "year" && <FormField label="Academic year" wide><input name="title" required defaultValue={currentEditorYear?.title} placeholder="e.g. Year 1" /></FormField>}
        {editor.kind === "semester" && <FormField label="Semester" wide><input name="title" required defaultValue={currentEditorSemester?.title} placeholder="e.g. Semester 1" /></FormField>}
        {editor.kind === "unit" && <>
          <FormField label="Semester" wide><select name="semesterId" defaultValue={(currentEditorUnit?.semesterId ?? unitSemesterId) || semesters[0]?.id || ""} required>{semesters.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></FormField>
          <FormField label="Code"><input name="code" required defaultValue={currentEditorUnit?.code} placeholder="e.g. M1.4" /></FormField>
          <FormField label="Unit type"><select name="type" value={canonicalAcademicUnitType(activeInstitution?.shortName??"",selectedYear?.levelNumber??selectedYear?.order??1)} disabled aria-label="Unit type is determined by institution and academic year"><option>Subject</option><option>Module</option></select><small className="admin-v2__form-note">Determined by the institution’s academic structure.</small></FormField>
          <FormField label="Title" wide><input name="title" required defaultValue={currentEditorUnit?.title} placeholder="e.g. Cell Biology" /></FormField>
          <FormField label="Description" wide><textarea name="description" rows={3} defaultValue={currentEditorUnit?.description} /></FormField>
          <FormField label="Credits"><input name="credits" type="number" min="0" step="0.5" defaultValue={currentEditorUnit?.credits} /></FormField>
          <FormField label="Status"><select name="status" defaultValue={currentEditorUnit?.status ?? "Approved"}><option>Approved</option><option>Draft</option></select></FormField>
        </>}
      </form>
    </Drawer>}
    {archiveId && <ConfirmDialog title="Archive this academic unit?" detail="The unit will remain in the curriculum record and existing course mappings will be retained." confirmLabel={mutationPending?"Archiving…":"Archive unit"} onCancel={() => !mutationPending&&setArchiveId("")} onConfirm={confirmArchive} />}
  </section>;
}
