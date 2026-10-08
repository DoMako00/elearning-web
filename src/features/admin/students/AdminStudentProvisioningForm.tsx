import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  adminDeliveryRequest,
  catalogueBrandAccessPath,
  catalogueInstitutionsPath,
  type CatalogueBrand,
  type CatalogueInstitution,
} from "../api/adminDelivery.http";
import { createAdminStudent } from "../api/adminOperationsApi";
import type { AdminBrandCode } from "../api/adminOperationsApi";
import {
  AdminStudentSetupCredential,
  type StudentSetupCredential,
} from "./AdminStudentSetupCredential";

interface AdminStudentProvisioningFormProps {
  readonly initialBrandCode?: AdminBrandCode;
  readonly onCreated: () => void;
  readonly onDone: () => void;
}

interface ProvisioningValues {
  readonly fullName: string;
  readonly phone: string;
  readonly brandCode: AdminBrandCode | "";
  readonly institutionCode: string;
  readonly levelNumber: string;
  readonly semesterNumber: string;
  readonly studentCode: string;
}

const emptyValues: ProvisioningValues = {
  fullName: "",
  phone: "",
  brandCode: "",
  institutionCode: "",
  levelNumber: "",
  semesterNumber: "",
  studentCode: "",
};

function requestKey(signature: string): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `student-provision-${Date.now()}-${signature.length}`;
}

export function AdminStudentProvisioningForm({
  initialBrandCode,
  onCreated,
  onDone,
}: AdminStudentProvisioningFormProps) {
  const [brands, setBrands] = useState<readonly CatalogueBrand[]>([]);
  const [institutions, setInstitutions] = useState<
    readonly CatalogueInstitution[]
  >([]);
  const [values, setValues] = useState<ProvisioningValues>({
    ...emptyValues,
    brandCode: initialBrandCode ?? "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [credentialMessage, setCredentialMessage] = useState("");
  const [createdCredential, setCreatedCredential] =
    useState<StudentSetupCredential | null>(null);
  const pendingRequest = useRef<{ signature: string; key: string } | undefined>(
    undefined,
  );

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    void Promise.all([
      adminDeliveryRequest<CatalogueBrand[]>(catalogueBrandAccessPath, {
        signal: controller.signal,
      }),
      adminDeliveryRequest<CatalogueInstitution[]>(catalogueInstitutionsPath, {
        signal: controller.signal,
      }),
    ])
      .then(([brandRows, institutionRows]) => {
        if (controller.signal.aborted) return;
        if (!Array.isArray(brandRows) || !Array.isArray(institutionRows)) {
          throw new Error(
            "The account provisioning reference data is invalid.",
          );
        }
        setBrands(brandRows.filter((item) => item.status === "active"));
        setInstitutions(
          institutionRows.filter((item) => item.status === "active"),
        );
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Provisioning reference data could not be loaded.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const selectedBrand = brands.find((item) => item.code === values.brandCode);
  const allowedInstitutionCodes = useMemo(
    () =>
      new Set(
        selectedBrand?.allowedAcademicInstitutions.map(
          (item) => item.code.toLowerCase(),
        ) ?? [],
      ),
    [selectedBrand],
  );
  const allowedInstitutions = institutions.filter(
    (item) =>
      item.status === "active" &&
      allowedInstitutionCodes.has(item.code.toLowerCase()),
  );
  const institution = allowedInstitutions.find(
    (item) => item.code === values.institutionCode,
  );
  const levels =
    institution?.levels.filter((item) => item.status === "active") ?? [];
  const level = levels.find(
    (item) => String(item.levelNumber) === values.levelNumber,
  );
  const semesters =
    level?.semesters.filter((item) => item.status === "active") ?? [];
  const canSubmit = Boolean(
    values.fullName.trim() &&
    /^\+[1-9][0-9]{7,14}$/.test(values.phone.trim()) &&
    selectedBrand &&
    institution &&
    level &&
    semesters.some(
      (item) => String(item.semesterNumber) === values.semesterNumber,
    ),
  );

  function update<K extends keyof ProvisioningValues>(
    key: K,
    value: ProvisioningValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setError("");
  }

  function resetForm() {
    setValues({ ...emptyValues, brandCode: initialBrandCode ?? "" });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || !selectedBrand || !institution || !level || saving)
      return;

    const body = {
      fullName: values.fullName.trim(),
      phone: values.phone.trim(),
      brandCode: selectedBrand.code as AdminBrandCode,
      academicInstitutionCode: institution.code as "buc" | "delta",
      academicLevelNumber: level.levelNumber,
      academicSemesterNumber: Number(values.semesterNumber),
      ...(values.studentCode.trim()
        ? { studentCode: values.studentCode.trim() }
        : {}),
    };
    const signature = JSON.stringify(body);
    if (pendingRequest.current?.signature !== signature) {
      pendingRequest.current = { signature, key: requestKey(signature) };
    }

    setSaving(true);
    setError("");
    setCredentialMessage("");
    try {
      const created = await createAdminStudent(body, pendingRequest.current.key);
      pendingRequest.current = undefined;
      if (created.accountIdentifier && created.setupCode) {
        setCreatedCredential({
          platformEmail: created.platformEmail,
          accountIdentifier: created.accountIdentifier,
          setupCode: created.setupCode,
          setupExpiresAt: created.setupExpiresAt,
        });
      } else {
        setCredentialMessage(
          created.claimCredentialDelivery ??
            "The student was created, but this response did not include a new setup code. Use the audited setup-code reset action; do not submit the form again.",
        );
      }
      onCreated();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Student provisioning could not be completed.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (createdCredential) {
    return (
      <AdminStudentSetupCredential
        credential={createdCredential}
        onDone={() => {
          setCreatedCredential(null);
          setCredentialMessage("");
          resetForm();
          onDone();
        }}
      />
    );
  }

  if (credentialMessage) {
    return (
      <section className="admin-student-setup-credential">
        <header><h3>Student account provisioned</h3></header>
        <p role="status">{credentialMessage}</p>
        <p>The account is already created. A new submission is not needed.</p>
        <footer><button type="button" onClick={onDone}>Done</button></footer>
      </section>
    );
  }

  return (
    <form
      className="admin-workspace-form"
      onSubmit={submit}
      aria-busy={loading || saving}
    >
      {error && <p role="alert">{error}</p>}
      {loading ? (
        <p role="status">Loading allowed brands and academic placements…</p>
      ) : (
        <>
          <label>
            Full name
            <input
              required
              maxLength={160}
              value={values.fullName}
              onChange={(event) => update("fullName", event.target.value)}
            />
          </label>
          <label>
            Phone
            <input
              required
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="+201234567890"
              maxLength={16}
              value={values.phone}
              onChange={(event) => update("phone", event.target.value)}
            />
          </label>
          <label>
            Brand
            <select
              required
              value={values.brandCode}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  brandCode: event.target
                    .value as ProvisioningValues["brandCode"],
                  institutionCode: "",
                  levelNumber: "",
                  semesterNumber: "",
                }))
              }
            >
              <option value="">Select a brand</option>
              {brands.map((item) => (
                <option key={item.id} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Academic institution
            <select
              required
              disabled={!selectedBrand}
              value={values.institutionCode}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  institutionCode: event.target.value,
                  levelNumber: "",
                  semesterNumber: "",
                }))
              }
            >
              <option value="">Select an institution</option>
              {allowedInstitutions.map((item) => (
                <option key={item.id} value={item.code}>
                  {item.displayName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Academic level / year
            <select
              required
              disabled={!institution}
              value={values.levelNumber}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  levelNumber: event.target.value,
                  semesterNumber: "",
                }))
              }
            >
              <option value="">Select a level</option>
              {levels.map((item) => (
                <option key={item.id} value={item.levelNumber}>
                  {item.displayTitle}
                </option>
              ))}
            </select>
          </label>
          <label>
            Semester
            <select
              required
              disabled={!level}
              value={values.semesterNumber}
              onChange={(event) => update("semesterNumber", event.target.value)}
            >
              <option value="">Select a semester</option>
              {semesters.map((item) => (
                <option key={item.id} value={item.semesterNumber}>
                  {item.displayTitle}
                </option>
              ))}
            </select>
          </label>
          <label>
            Student / university code (optional)
            <input
              maxLength={64}
              value={values.studentCode}
              onChange={(event) => update("studentCode", event.target.value)}
            />
          </label>
          <p className="admin-workspace-note">
            This provisions an unclaimed Student account and academic placement.
            The backend generates the internal platform identity. The Student uses
            the one-time setup code to activate the account with Google.
          </p>
          <button type="submit" disabled={loading || saving || !canSubmit}>
            {saving ? "Creating student…" : "Create student"}
          </button>
        </>
      )}
    </form>
  );
}
