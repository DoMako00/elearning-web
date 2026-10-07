import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  adminDeliveryRequest,
  catalogueBrandAccessPath,
  catalogueInstitutionsPath,
  deliveryCoursePath,
  type CatalogueBrand,
  type CatalogueInstitution,
  type DeliveryCourse,
  type DeliveryStatus,
} from "../api/adminDelivery.http";

interface AdminCourseTemplateFormProps {
  readonly course?: DeliveryCourse;
  readonly initialBrandId?: string;
  readonly initialInstitutionId?: string;
  readonly initialLevelId?: string;
  readonly initialSemesterId?: string;
  readonly initialModuleId?: string;
  readonly initialCode?: string;
  readonly initialTitle?: string;
  readonly initialCataloguePresentation?: DeliveryCourse["cataloguePresentation"];
  readonly onSaved: (result: {
    readonly brandId: string;
    readonly courseId: string;
  }) => void;
}

interface PendingRequest {
  readonly signature: string;
  readonly key: string;
}

function createRequestKey(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return (
    "admin-course-" + Date.now() + "-" + Math.random().toString(36).slice(2)
  );
}

function suggestCourseCode(
  brandCode: string | undefined,
  moduleCode: string,
): string {
  const brandPrefix = brandCode?.trim().slice(0, 3).toUpperCase() || "CRS";
  const moduleSuffix =
    moduleCode
      .trim()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .toUpperCase() || "MODULE";

  return (brandPrefix + "-" + moduleSuffix).slice(0, 80);
}

export function AdminCourseTemplateForm({
  course,
  initialBrandId = "",
  initialInstitutionId = "",
  initialLevelId = "",
  initialSemesterId = "",
  initialModuleId = "",
  initialCode = "",
  initialTitle = "",
  initialCataloguePresentation = "module_based",
  onSaved,
}: AdminCourseTemplateFormProps) {
  const [brands, setBrands] = useState<readonly CatalogueBrand[]>([]);
  const [institutions, setInstitutions] = useState<
    readonly CatalogueInstitution[]
  >([]);
  const [brandId, setBrandId] = useState(course?.brandId ?? initialBrandId);
  const [institutionId, setInstitutionId] = useState(
    course?.academicInstitutionId ?? initialInstitutionId,
  );
  const [levelId, setLevelId] = useState(initialLevelId);
  const [semesterId, setSemesterId] = useState(initialSemesterId);
  const [moduleId, setModuleId] = useState(
    course?.academicModuleId ?? initialModuleId,
  );
  const [classification, setClassification] = useState<
    DeliveryCourse["classification"]
  >(course?.classification ?? "academic_module_offering");
  const [cataloguePresentation, setCataloguePresentation] = useState<
    DeliveryCourse["cataloguePresentation"]
  >(course?.cataloguePresentation ?? initialCataloguePresentation);
  const [title, setTitle] = useState(course?.title ?? initialTitle);
  const [code, setCode] = useState(course?.code ?? initialCode);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  const pendingRequest = useRef<PendingRequest | undefined>(undefined);
  const busy = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

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
          throw new Error("The academic catalogue response is invalid.");
        }

        setBrands(brandRows);
        setInstitutions(institutionRows);

        const selectedModuleId = course?.academicModuleId ?? initialModuleId;
        const selectedInstitutionId =
          course?.academicInstitutionId ?? initialInstitutionId;
        const matchingInstitution =
          institutionRows.find((item) => item.id === selectedInstitutionId) ??
          institutionRows.find((item) =>
            item.levels.some((level) =>
              level.semesters.some((semester) =>
                semester.modules.some(
                  (moduleItem) => moduleItem.id === selectedModuleId,
                ),
              ),
            ),
          );
        const matchingLevel =
          (initialLevelId &&
            matchingInstitution?.levels.find(
              (item) => item.id === initialLevelId,
            )) ||
          matchingInstitution?.levels.find((level) =>
            level.semesters.some((semester) =>
              semester.modules.some(
                (moduleItem) => moduleItem.id === selectedModuleId,
              ),
            ),
          );
        const matchingSemester =
          (initialSemesterId &&
            matchingLevel?.semesters.find(
              (item) => item.id === initialSemesterId,
            )) ||
          matchingLevel?.semesters.find((semester) =>
            semester.modules.some(
              (moduleItem) => moduleItem.id === selectedModuleId,
            ),
          );

        setInstitutionId(matchingInstitution?.id ?? selectedInstitutionId);
        setLevelId(matchingLevel?.id ?? initialLevelId);
        setSemesterId(matchingSemester?.id ?? initialSemesterId);
        setModuleId(selectedModuleId);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load the academic catalogues.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [
    course?.id,
    initialInstitutionId,
    initialLevelId,
    initialModuleId,
    initialSemesterId,
    revision,
  ]);

  const selectedBrand = brands.find(
    (item) => item.id === brandId && item.status === "active",
  );
  const allowedInstitutions = institutions.filter(
    (item) =>
      item.status === "active" &&
      selectedBrand?.allowedAcademicInstitutions.some(
        (access) => access.id === item.id,
      ),
  );
  const selectedInstitution = allowedInstitutions.find(
    (item) => item.id === institutionId,
  );
  const levels =
    selectedInstitution?.levels.filter((item) => item.status === "active") ??
    [];
  const selectedLevel = levels.find((item) => item.id === levelId);
  const semesters =
    selectedLevel?.semesters.filter((item) => item.status === "active") ?? [];
  const selectedSemester = semesters.find((item) => item.id === semesterId);
  const modules = selectedSemester?.modules ?? [];
  const selectedModule = modules.find(
    (item) =>
      item.id === moduleId &&
      !["blocked", "retired"].includes(item.reviewStatus),
  );

  async function saveCourse(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (busy.current) return;

    if (!selectedBrand) {
      setError("Select an active commercial brand.");
      return;
    }
    if (!selectedInstitution) {
      setError("Select an academic catalogue allowed for this brand.");
      return;
    }
    if (classification === "academic_module_offering" && !selectedModule) {
      setError("Select an available module from this academic catalogue.");
      return;
    }
    if (!reason.trim()) {
      setError("Enter a reason for this change.");
      return;
    }

    const path = course
      ? deliveryCoursePath(brandId, course.id)
      : "/v1/admin/brands/" + encodeURIComponent(brandId) + "/courses";
    const body = {
      title: title.trim(),
      classification,
      cataloguePresentation,
      academicInstitutionId: selectedInstitution.id,
      academicModuleId:
        classification === "academic_module_offering"
          ? selectedModule?.id
          : null,
      reason: reason.trim(),
      ...(course ? { expectedVersion: course.version } : { code: code.trim() }),
    };
    const signature = JSON.stringify({ path, body });

    if (pendingRequest.current?.signature !== signature) {
      pendingRequest.current = { signature, key: createRequestKey() };
    }

    busy.current = true;
    setSaving(true);
    setError("");

    try {
      const result = await adminDeliveryRequest<{
        readonly brandId: string;
        readonly courseId: string;
      }>(path, {
        body,
        key: pendingRequest.current.key,
        method: course ? "PATCH" : "POST",
      });

      if (!mounted.current) return;
      pendingRequest.current = undefined;
      onSaved(result);
    } catch (cause) {
      if (mounted.current) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not save the course template.",
        );
      }
    } finally {
      busy.current = false;
      if (mounted.current) setSaving(false);
    }
  }

  async function changeCourseStatus(nextStatus: DeliveryStatus): Promise<void> {
    if (!course || busy.current) return;
    if (!reason.trim()) {
      setError("Enter a reason for this change.");
      return;
    }
    if (
      nextStatus === "archived" &&
      !window.confirm(
        "Archive this course? Students will no longer find it in the catalogue.",
      )
    ) {
      return;
    }

    const path = deliveryCoursePath(course.brandId, course.id) + "/status";
    const body = {
      status: nextStatus,
      reason: reason.trim(),
      expectedVersion: course.version,
    };
    const signature = JSON.stringify({ path, body });
    if (pendingRequest.current?.signature !== signature) {
      pendingRequest.current = { signature, key: createRequestKey() };
    }

    busy.current = true;
    setSaving(true);
    setError("");

    try {
      await adminDeliveryRequest<void>(path, {
        method: "PATCH",
        key: pendingRequest.current.key,
        body,
      });
      if (!mounted.current) return;

      pendingRequest.current = undefined;
      onSaved({ brandId: course.brandId, courseId: course.id });
    } catch (cause) {
      if (mounted.current) {
        setError(
          cause instanceof Error
            ? cause.message
            : "The course status could not be changed.",
        );
      }
    } finally {
      busy.current = false;
      if (mounted.current) setSaving(false);
    }
  }

  function resetInstitution(nextInstitutionId: string): void {
    setInstitutionId(nextInstitutionId);
    setLevelId("");
    setSemesterId("");
    setModuleId("");
  }

  function setInitialCourseFromModule(nextModuleId: string): void {
    const nextModule = modules.find((item) => item.id === nextModuleId);
    setModuleId(nextModuleId);
    if (!course && nextModule) {
      setTitle((current) =>
        current.trim() ? current : nextModule.sourceDisplayLabel,
      );
      setCode((current) =>
        current.trim()
          ? current
          : suggestCourseCode(selectedBrand?.code, nextModule.code),
      );
    }
  }

  const nextStatus: DeliveryStatus | undefined =
    course?.status === "draft"
      ? "published"
      : course?.status === "published"
        ? "archived"
        : course?.status === "archived"
          ? "draft"
          : undefined;
  const nextStatusLabel =
    nextStatus === "published"
      ? "Publish course"
      : nextStatus === "archived"
        ? "Archive course"
        : nextStatus === "draft"
          ? "Restore to draft"
          : "";

  return (
    <form
      className="builder-panel admin-course-template"
      onSubmit={(event) => void saveCourse(event)}
      aria-busy={loading || saving}
    >
      <header>
        <div>
          <span className="builder-eyebrow">
            Commercial course · academic reference
          </span>
          <h2>Course template</h2>
        </div>
      </header>

      {error && (
        <p role="alert" className="admin-course-dialog__error">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status">Loading academic catalogues…</p>
      ) : (
        <>
          <fieldset disabled={saving} className="admin-course-template__fields">
            <label>
              Commercial brand
              <select
                required
                disabled={Boolean(course)}
                value={brandId}
                onChange={(event) => {
                  const nextBrandId = event.target.value;
                  const nextBrand = brands.find(
                    (item) => item.id === nextBrandId,
                  );
                  setBrandId(nextBrandId);
                  if (
                    !nextBrand?.allowedAcademicInstitutions.some(
                      (item) => item.id === institutionId,
                    )
                  ) {
                    resetInstitution("");
                  }
                }}
              >
                <option value="">Select a commercial brand</option>
                {brands
                  .filter((item) => item.status === "active")
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </select>
            </label>

            <label>
              Academic catalogue
              <select
                required
                disabled={!selectedBrand}
                value={selectedInstitution?.id ?? ""}
                onChange={(event) => resetInstitution(event.target.value)}
              >
                <option value="">Select a university catalogue</option>
                {allowedInstitutions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.displayName}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Course classification
              <select
                value={classification}
                onChange={(event) => {
                  setClassification(
                    event.target.value as DeliveryCourse["classification"],
                  );
                  setModuleId("");
                }}
              >
                <option value="academic_module_offering">
                  Academic module offering
                </option>
                <option value="standalone">
                  Standalone within this catalogue
                </option>
              </select>
            </label>

            <label>
              Course presentation
              <select
                value={cataloguePresentation}
                onChange={(event) =>
                  setCataloguePresentation(
                    event.target
                      .value as DeliveryCourse["cataloguePresentation"],
                  )
                }
              >
                <option value="module_based">Module-based course</option>
                <option value="subject_based">Subject-based course</option>
              </select>
            </label>

            <label>
              Level
              <select
                disabled={
                  !selectedInstitution || classification === "standalone"
                }
                required={classification === "academic_module_offering"}
                value={levelId}
                onChange={(event) => {
                  setLevelId(event.target.value);
                  setSemesterId("");
                  setModuleId("");
                }}
              >
                <option value="">Select a level</option>
                {levels.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.displayTitle}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Semester
              <select
                disabled={!selectedLevel || classification === "standalone"}
                required={classification === "academic_module_offering"}
                value={semesterId}
                onChange={(event) => {
                  setSemesterId(event.target.value);
                  setModuleId("");
                }}
              >
                <option value="">Select a semester</option>
                {semesters.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.displayTitle}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Module
              <select
                disabled={!selectedSemester || classification === "standalone"}
                required={classification === "academic_module_offering"}
                value={moduleId}
                onChange={(event) =>
                  setInitialCourseFromModule(event.target.value)
                }
              >
                <option value="">Select a module</option>
                {modules.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                    disabled={["blocked", "retired"].includes(
                      item.reviewStatus,
                    )}
                  >
                    {item.code} · {item.sourceDisplayLabel}
                    {["blocked", "retired"].includes(item.reviewStatus)
                      ? " (" + item.reviewStatus + ")"
                      : ""}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Course code
              <input
                required
                maxLength={80}
                disabled={Boolean(course)}
                value={code}
                onChange={(event) => setCode(event.target.value)}
              />
            </label>

            <label>
              Course title
              <input
                required
                maxLength={240}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>

            <label className="admin-course-template__reason">
              Reason for change
              <input
                required
                maxLength={500}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </label>
          </fieldset>

          {selectedModule && (
            <div className="builder-empty admin-course-template__module-reference">
              <strong>
                {selectedModule.code} · {selectedModule.sourceDisplayLabel}
              </strong>
              <span>
                {selectedModule.resourceCount} catalogue resource references ·
                Review: {selectedModule.reviewStatus}. Metadata references only.
              </span>
              {selectedModule.chapters?.length ? (
                <div
                  className="admin-course-template__chapters"
                  aria-label="Academic chapter outline"
                >
                  <strong>Academic chapter outline</strong>
                  <ol>
                    {selectedModule.chapters.map((chapter) => (
                      <li key={chapter.id}>
                        <span>
                          {chapter.code} · {chapter.title}
                        </span>
                      </li>
                    ))}
                  </ol>
                  <small>
                    These are shared catalogue references. Delivery chapters are
                    created separately in the builder.
                  </small>
                </div>
              ) : (
                <span>
                  No chapter outline is registered for this module yet.
                </span>
              )}
            </div>
          )}

          {selectedBrand && allowedInstitutions.length === 0 && (
            <p>No academic catalogues are available for this brand.</p>
          )}
          <p>
            New course templates are saved as drafts. Commercial ownership stays
            with the selected brand.
          </p>
          <button
            className="is-primary"
            type="submit"
            disabled={
              saving ||
              !selectedInstitution ||
              !title.trim() ||
              !code.trim() ||
              !reason.trim() ||
              (classification === "academic_module_offering" && !selectedModule)
            }
          >
            {saving
              ? "Saving…"
              : course
                ? "Save course template"
                : "Create draft course"}
          </button>

          {course && nextStatus && (
            <div className="admin-course-template__status">
              <span>
                Current status: <strong>{course.status}</strong>
              </span>
              <button
                type="button"
                disabled={saving || !reason.trim()}
                onClick={() => void changeCourseStatus(nextStatus)}
              >
                {saving ? "Saving…" : nextStatusLabel}
              </button>
            </div>
          )}
          <button
            type="button"
            disabled={saving}
            onClick={() => setRevision((value) => value + 1)}
          >
            Reload catalogue
          </button>
        </>
      )}
    </form>
  );
}
