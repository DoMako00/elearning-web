import {
  AtSign,
  Building2,
  GraduationCap,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { BrandCode, StudentDraft } from "../types/adminV2.types";
import { FormField } from "../shared/AdminV2Primitives";
import type { AcademicInstitution, BrandAccess } from "../api/adminAcademicApi";

const isActive = (status: string) => status.toLowerCase() === "active";

export function StudentForm({
  initial,
  brand,
  brandOptions,
  institutions,
  optionsLoading,
  optionsError,
  mode = "create",
  submitLabel = "Create student",
  errorMessage,
  onSubmit,
}: {
  initial?: Partial<Omit<StudentDraft, "institution">> & { institution?: string };
  brand?: BrandCode;
  brandOptions: readonly BrandAccess[];
  institutions: readonly AcademicInstitution[];
  optionsLoading: boolean;
  optionsError?: string;
  mode?: "create" | "edit";
  submitLabel?: string;
  errorMessage?: string;
  onSubmit: (draft: StudentDraft) => void;
}) {
  const [selectedBrand, setSelectedBrand] = useState<BrandCode | "">(initial?.brand ?? brand ?? "");
  const [selectedInstitutionId, setSelectedInstitutionId] = useState("");
  const [selectedLevelId, setSelectedLevelId] = useState("");
  const [selectedSemesterId, setSelectedSemesterId] = useState("");
  const activeBrandOptions = useMemo(() => brandOptions.filter((item) => isActive(item.status)), [brandOptions]);
  const selectedBrandAccess = activeBrandOptions.find((item) => item.code === selectedBrand);
  const initialInstitution = institutions.find((item) =>
    item.id === initial?.academicInstitutionId ||
    item.code.toLowerCase() === initial?.institution?.toLowerCase() ||
    item.displayName.toLowerCase().startsWith(initial?.institution?.toLowerCase() ?? "\u0000"),
  );
  const allowedInstitutionIds = new Set(selectedBrandAccess?.allowedAcademicInstitutions.filter((item) => isActive(item.status)).map((item) => item.id) ?? []);
  const institutionOptions = useMemo(() => institutions.filter((item) =>
    isActive(item.status) && (allowedInstitutionIds.has(item.id) || (mode === "edit" && item.id === initialInstitution?.id)),
  ), [institutions, mode, selectedBrandAccess, initialInstitution?.id]);
  const selectedInstitution = institutionOptions.find((item) => item.id === selectedInstitutionId);
  const levelOptions = selectedInstitution?.levels.filter((item) => isActive(item.status)) ?? [];
  const selectedLevel = levelOptions.find((item) => item.id === selectedLevelId);
  const semesterOptions = selectedLevel?.semesters.filter((item) => isActive(item.status)) ?? [];
  const selectedSemester = semesterOptions.find((item) => item.id === selectedSemesterId);

  useEffect(() => {
    if (institutionOptions.some((item) => item.id === selectedInstitutionId)) return;
    const nextInstitution = initialInstitution && institutionOptions.some((item) => item.id === initialInstitution.id)
      ? initialInstitution
      : institutionOptions[0];
    setSelectedInstitutionId(nextInstitution?.id ?? "");
    const nextLevel = nextInstitution?.levels.find((item) => item.id === initial?.academicLevelId && isActive(item.status))
      ?? nextInstitution?.levels.find((item) => isActive(item.status) && item.displayTitle === initial?.academicLevel)
      ?? nextInstitution?.levels.find((item) => isActive(item.status));
    setSelectedLevelId(nextLevel?.id ?? "");
    const nextSemester = nextLevel?.semesters.find((item) => item.id === initial?.academicSemesterId && isActive(item.status))
      ?? nextLevel?.semesters.find((item) => isActive(item.status) && item.displayTitle === initial?.semester)
      ?? nextLevel?.semesters.find((item) => isActive(item.status));
    setSelectedSemesterId(nextSemester?.id ?? "");
  }, [
    institutionOptions,
    selectedInstitutionId,
    initialInstitution?.id,
    initial?.academicLevel,
    initial?.academicLevelId,
    initial?.semester,
    initial?.academicSemesterId,
  ]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedBrandAccess || !selectedInstitution || !selectedLevel || !selectedSemester) return;
    const institutionCode = selectedInstitution.code.toLowerCase();
    if (institutionCode !== "buc" && institutionCode !== "delta") return;
    const form = new FormData(event.currentTarget);
    onSubmit({
      fullName: String(form.get("fullName") ?? "").trim(),
      accountIdentifier: String(form.get("accountIdentifier") ?? "").trim(),
      email: "",
      phone: String(form.get("phone") ?? "").trim(),
      brand: selectedBrandAccess.code,
      institution: institutionCode === "delta" ? "Delta" : "BUC",
      academicInstitutionId: selectedInstitution.id,
      academicInstitutionCode: institutionCode,
      academicLevel: selectedLevel.displayTitle,
      academicLevelId: selectedLevel.id,
      academicLevelNumber: selectedLevel.levelNumber,
      semester: selectedSemester.displayTitle,
      academicSemesterId: selectedSemester.id,
      academicSemesterNumber: selectedSemester.semesterNumber,
      program: String(form.get("program") ?? "").trim(),
    });
  };
  return (
    <form
      id="shared-student-form"
      className="admin-v2__form admin-v2__student-form"
      onSubmit={submit}
    >
      <div className="admin-v2__student-form-intro">
        <span className="admin-v2__student-form-icon">
          <UserRound size={19} />
        </span>
        <div>
          <strong>Set up a Student account</strong>
          <p>
            Create a provisioned profile. The Student links their own verified
            email during claim.
          </p>
        </div>
        <span className="admin-v2__student-form-step">01 / 02</span>
      </div>
      <section className="admin-v2__student-form-card is-identity">
        <header>
          <span>
            <ShieldCheck size={14} />
            Account identity
          </span>
          <small>Required for access</small>
        </header>
        <div className="admin-v2__student-form-grid">
          <FormField label="Full name" wide>
            <input
              name="fullName"
              required
              defaultValue={initial?.fullName ?? ""}
              placeholder="Student full name"
              autoComplete="name"
            />
          </FormField>
          <FormField label="Phone (optional)" wide>
            <div className="admin-v2__student-form-input">
              <Phone size={15} aria-hidden="true" />
              <input
                name="phone"
                type="tel"
                required={false}
                defaultValue={mode === "create" ? (initial?.phone ?? "") : ""}
                placeholder={
                  mode === "edit"
                    ? "Leave blank to keep current number"
                    : "+201234567890"
                }
                autoComplete="tel"
              />
            </div>
            <small className="admin-v2__field-help">
              {mode === "edit"
                ? "The stored contact is masked. Enter a replacement number only if it changes."
                : "Optional contact detail only. Never used to sign in or receive a code."}
            </small>
          </FormField>
          <FormField label="Student code (optional)">
            <div className="admin-v2__student-form-input">
              <AtSign size={15} aria-hidden="true" />
              <input
                name="accountIdentifier"
                defaultValue={
                  initial?.accountIdentifier === "—"
                    ? ""
                    : (initial?.accountIdentifier ?? "")
                }
                placeholder="Optional internal code"
              />
            </div>
            <small className="admin-v2__field-help">
              The backend generates the Account Identifier separately.
            </small>
          </FormField>
          <FormField label="Brand">
            <select
              name="brand"
              required
              value={selectedBrand}
              disabled={mode === "edit" || optionsLoading || !!optionsError}
              onChange={(event) => {
                const nextBrand = event.target.value as BrandCode;
                setSelectedBrand(nextBrand);
                const nextAccess = activeBrandOptions.find((item) => item.code === nextBrand);
                const allowedIds = new Set(nextAccess?.allowedAcademicInstitutions.filter((item) => isActive(item.status)).map((item) => item.id) ?? []);
                const nextInstitution = institutions.find((item) => isActive(item.status) && allowedIds.has(item.id));
                setSelectedInstitutionId(nextInstitution?.id ?? "");
                const nextLevel = nextInstitution?.levels.find((item) => isActive(item.status));
                setSelectedLevelId(nextLevel?.id ?? "");
                setSelectedSemesterId(nextLevel?.semesters.find((item) => isActive(item.status))?.id ?? "");
              }}
            >
              <option value="">Choose a Brand</option>
              {activeBrandOptions.map((item) => <option key={item.id} value={item.code}>{item.name}</option>)}
            </select>
          </FormField>
        </div>
      </section>
      <section className="admin-v2__student-form-card">
        <header>
          <span>
            <GraduationCap size={14} />
            Academic placement
          </span>
          <small>Where this Student belongs</small>
        </header>
        <div className="admin-v2__student-form-grid">
          {optionsLoading && <p className="admin-v2__field-help" role="status">Loading persisted Brand and academic placement options…</p>}
          {optionsError && <p className="admin-v2__student-form-error" role="alert">{optionsError}</p>}
          <FormField label="Institution">
            <select
              name="institution"
              required
              value={selectedInstitutionId}
              disabled={optionsLoading || !!optionsError}
              onChange={(event) => {
                const nextInstitution = institutionOptions.find((item) => item.id === event.target.value);
                setSelectedInstitutionId(nextInstitution?.id ?? "");
                const nextLevel = nextInstitution?.levels.find((item) => isActive(item.status));
                setSelectedLevelId(nextLevel?.id ?? "");
                setSelectedSemesterId(nextLevel?.semesters.find((item) => isActive(item.status))?.id ?? "");
              }}
            >
              <option value="">Choose institution</option>
              {institutionOptions.map((item) => <option key={item.id} value={item.id}>{item.displayName}</option>)}
            </select>
          </FormField>
          <FormField label="Program">
            <input
              name="program"
              disabled={mode === "edit"}
              defaultValue={initial?.program ?? ""}
              placeholder="Program label (optional)"
            />
          </FormField>
          <FormField label="Academic level">
            <select
              name="academicLevel"
              required
              value={selectedLevelId}
              disabled={optionsLoading || !!optionsError}
              onChange={(event) => {
                const nextLevel = levelOptions.find((item) => item.id === event.target.value);
                setSelectedLevelId(nextLevel?.id ?? "");
                setSelectedSemesterId(nextLevel?.semesters.find((item) => isActive(item.status))?.id ?? "");
              }}
            >
              <option value="">Choose academic level</option>
              {levelOptions.map((item) => <option key={item.id} value={item.id}>{item.displayTitle}</option>)}
            </select>
          </FormField>
          <FormField label="Semester">
            <select
              name="semester"
              required
              value={selectedSemesterId}
              disabled={optionsLoading || !!optionsError}
              onChange={(event) => setSelectedSemesterId(event.target.value)}
            >
              <option value="">Choose semester</option>
              {semesterOptions.map((item) => <option key={item.id} value={item.id}>{item.displayTitle}</option>)}
            </select>
          </FormField>
        </div>
      </section>
      <div className="admin-v2__student-form-security">
        <Building2 size={15} />
        <span>
          <strong>The backend generates a one-time setup credential.</strong>
          <small>
            It is shown only after successful provisioning; email linking and
            OTP happen only after the Student links a real email in Settings.
          </small>
        </span>
      </div>
      {errorMessage && (
        <p className="admin-v2__student-form-error" role="alert">
          {errorMessage}
        </p>
      )}
      <button className="admin-v2__sr-only" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}
