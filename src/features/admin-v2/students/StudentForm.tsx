import {
  AtSign,
  Building2,
  GraduationCap,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { FormEvent } from "react";
import type { BrandCode, StudentDraft } from "../types/adminV2.types";
import { FormField } from "../shared/AdminV2Primitives";

export function StudentForm({
  initial,
  brand,
  mode = "create",
  submitLabel = "Create student",
  errorMessage,
  onSubmit,
}: {
  initial?: Partial<StudentDraft>;
  brand: BrandCode;
  mode?: "create" | "edit";
  submitLabel?: string;
  errorMessage?: string;
  onSubmit: (draft: StudentDraft) => void;
}) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit({
      fullName: String(form.get("fullName") ?? "").trim(),
      accountIdentifier: String(form.get("accountIdentifier") ?? "").trim(),
      email: "",
      phone: String(form.get("phone") ?? "").trim(),
      brand: String(form.get("brand")) as BrandCode,
      institution: String(
        form.get("institution"),
      ) as StudentDraft["institution"],
      academicLevel: String(form.get("academicLevel")),
      semester: String(form.get("semester")),
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
              defaultValue={initial?.brand ?? brand}
              disabled={mode === "edit"}
            >
              <option value="medway">Medway</option>
              <option value="elite">Elite</option>
              <option value="nexus">Nexus</option>
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
          <FormField label="Institution">
            <select
              name="institution"
              disabled={mode === "edit"}
              defaultValue={
                initial?.institution ?? (brand === "nexus" ? "Delta" : "BUC")
              }
            >
              <option>BUC</option>
              <option>Delta</option>
            </select>
          </FormField>
          <FormField label="Program">
            <input
              name="program"
              disabled={mode === "edit"}
              defaultValue={initial?.program ?? "Medicine (MBBS)"}
              placeholder="Medicine (MBBS)"
            />
          </FormField>
          <FormField label="Academic level">
            <select
              name="academicLevel"
              disabled={mode === "edit"}
              defaultValue={initial?.academicLevel ?? "Year 1"}
            >
              {Array.from({ length: 6 }, (_, index) => `Year ${index + 1}`).map(
                (item) => (
                  <option key={item}>{item}</option>
                ),
              )}
            </select>
          </FormField>
          <FormField label="Semester">
            <select
              name="semester"
              disabled={mode === "edit"}
              defaultValue={initial?.semester ?? "Semester 1"}
            >
              {Array.from(
                { length: 12 },
                (_, index) => `Semester ${index + 1}`,
              ).map((item) => (
                <option key={item}>{item}</option>
              ))}
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
