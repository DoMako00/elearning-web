import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Plus, Search, UserRoundCog } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { AdminSideDrawer } from "../components/AdminSideDrawer";
import type { AdminBrandContext, AdminBrandView } from "../api";
import {
  adminDeliveryRequest,
  type DeliveryCourse,
} from "../api/adminDelivery.http";

type InstructorStatus = "active" | "inactive" | "archived";
type AssignmentStatus = "active" | "inactive";

interface InstructorRecord {
  readonly id: string;
  readonly code: string;
  readonly instructorCode: string;
  readonly displayName: string;
  readonly status: InstructorStatus;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface InstructorBrandAssignment {
  readonly id: string;
  readonly brandId: string;
  readonly instructorId: string;
  readonly status: AssignmentStatus;
  readonly version: number;
}

function requestKey(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `instructor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function brandName(
  brands: readonly AdminBrandContext[],
  brandId: string,
): string {
  return (
    brands.find((brand) => brand.brandId === brandId)?.brandDisplayName ??
    "Brand"
  );
}

export function AdminInstructorsLivePage() {
  const { brand, brandView, availableBrands } = useOutletContext<{
    readonly brand?: AdminBrandContext;
    readonly brandView: AdminBrandView;
    readonly availableBrands: readonly AdminBrandContext[];
  }>();
  const [instructors, setInstructors] = useState<readonly InstructorRecord[]>(
    [],
  );
  const [brandAssignments, setBrandAssignments] = useState<
    readonly InstructorBrandAssignment[]
  >([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | InstructorStatus>("all");
  const [selectedId, setSelectedId] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [revision, setRevision] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [code, setCode] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [reason, setReason] = useState("");
  const [courseBrandId, setCourseBrandId] = useState(brand?.brandId ?? "");
  const [courseOptions, setCourseOptions] = useState<readonly DeliveryCourse[]>(
    [],
  );
  const [courseId, setCourseId] = useState("");
  const [courseLoading, setCourseLoading] = useState(false);
  const commandLock = useRef(false);
  const pendingCommands = useRef(new Map<string, string>());

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    void Promise.all([
      adminDeliveryRequest<InstructorRecord[]>("/v1/admin/instructors", {
        signal: controller.signal,
      }),
      ...availableBrands.map((availableBrand) =>
        adminDeliveryRequest<InstructorBrandAssignment[]>(
          `/v1/admin/brands/${encodeURIComponent(availableBrand.brandId)}/instructors`,
          { signal: controller.signal },
        ),
      ),
    ])
      .then(([instructorRows, ...assignmentGroups]) => {
        if (controller.signal.aborted) return;
        if (
          !Array.isArray(instructorRows) ||
          assignmentGroups.some((rows) => !Array.isArray(rows))
        ) {
          throw new Error("The instructor directory returned invalid data.");
        }
        setInstructors(instructorRows);
        setBrandAssignments(assignmentGroups.flat());
        setSelectedId((current) =>
          instructorRows.some((item) => item.id === current)
            ? current
            : (instructorRows[0]?.id ?? ""),
        );
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Instructor records could not be loaded.",
          );
          setInstructors([]);
          setBrandAssignments([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [availableBrands, revision]);

  useEffect(() => {
    if (brand?.brandId) {
      setCourseBrandId(brand.brandId);
      return;
    }
    if (
      brandView === "all" &&
      !availableBrands.some((item) => item.brandId === courseBrandId)
    ) {
      setCourseBrandId(availableBrands[0]?.brandId ?? "");
    }
  }, [availableBrands, brand?.brandId, brandView, courseBrandId]);

  useEffect(() => {
    if (!courseBrandId) {
      setCourseOptions([]);
      setCourseId("");
      return;
    }

    const controller = new AbortController();
    setCourseLoading(true);
    setError("");
    void adminDeliveryRequest<DeliveryCourse[]>(
      `/v1/admin/brands/${encodeURIComponent(courseBrandId)}/courses`,
      { signal: controller.signal },
    )
      .then((rows) => {
        if (controller.signal.aborted) return;
        if (!Array.isArray(rows))
          throw new Error("The brand course list is invalid.");
        setCourseOptions(rows.filter((course) => course.status !== "archived"));
        setCourseId("");
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setCourseOptions([]);
          setError(
            cause instanceof Error
              ? cause.message
              : "Brand courses could not be loaded.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCourseLoading(false);
      });

    return () => controller.abort();
  }, [courseBrandId]);

  const selected = instructors.find((item) => item.id === selectedId);
  const selectedAssignments = brandAssignments.filter(
    (item) => item.instructorId === selectedId,
  );
  const activeBrandIds = new Set(
    selectedAssignments
      .filter((item) => item.status === "active")
      .map((item) => item.brandId),
  );

  useEffect(() => {
    setEditDisplayName(selected?.displayName ?? "");
    setEditCode(selected?.instructorCode ?? selected?.code ?? "");
  }, [
    selected?.id,
    selected?.displayName,
    selected?.instructorCode,
    selected?.code,
  ]);
  const filteredInstructors = useMemo(() => {
    const query = search.trim().toLowerCase();
    return instructors.filter((instructor) => {
      const scopeMatches =
        !brand ||
        brandAssignments.some(
          (assignment) =>
            assignment.instructorId === instructor.id &&
            assignment.brandId === brand.brandId,
        );
      const statusMatches = status === "all" || instructor.status === status;
      const textMatches =
        !query ||
        [
          instructor.displayName,
          instructor.code,
          instructor.instructorCode,
          instructor.status,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      return scopeMatches && statusMatches && textMatches;
    });
  }, [brand, brandAssignments, instructors, search, status]);

  function commandId(signature: string): string {
    const existing = pendingCommands.current.get(signature);
    if (existing) return existing;
    const next = requestKey();
    pendingCommands.current.set(signature, next);
    return next;
  }

  async function saveCommand(
    signature: string,
    path: string,
    method: "POST" | "PATCH",
    body: Record<string, unknown>,
  ): Promise<boolean> {
    if (commandLock.current) return false;
    commandLock.current = true;
    setSaving(true);
    setError("");
    setNotice("");

    try {
      await adminDeliveryRequest(path, {
        method,
        key: commandId(signature),
        body,
      });
      pendingCommands.current.delete(signature);
      setNotice("The instructor change was saved by the backend.");
      setReason("");
      setRevision((value) => value + 1);
      return true;
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The instructor change could not be saved.",
      );
      return false;
    } finally {
      commandLock.current = false;
      setSaving(false);
    }
  }

  async function createInstructor(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    const normalizedName = displayName.trim();
    const normalizedCode = code.trim();
    const normalizedReason = reason.trim();
    if (!normalizedName || !normalizedCode || !normalizedReason) return;
    const body = {
      displayName: normalizedName,
      code: normalizedCode,
      reason: normalizedReason,
    };
    const signature = "create-instructor:" + JSON.stringify(body);
    const saved = await saveCommand(
      signature,
      "/v1/admin/instructors",
      "POST",
      body,
    );
    if (!saved) return;
    setDisplayName("");
    setCode("");
    setReason("");
    setShowCreate(false);
  }

  async function changeGlobalStatus(
    nextStatus: InstructorStatus,
  ): Promise<void> {
    if (!selected) return;
    const normalizedReason = reason.trim();
    if (!normalizedReason) {
      setError("Enter a reason for the status change.");
      return;
    }
    const body = {
      status: nextStatus,
      expectedVersion: selected.version,
      reason: normalizedReason,
    };
    const path = `/v1/admin/instructors/${encodeURIComponent(selected.id)}/status`;
    await saveCommand(
      "instructor-status:" + JSON.stringify({ path, body }),
      path,
      "PATCH",
      body,
    );
  }

  async function changeBrandAssignment(
    targetBrandId: string,
    nextStatus: AssignmentStatus,
  ): Promise<void> {
    if (!selected) return;
    const normalizedReason = reason.trim();
    if (!normalizedReason) {
      setError("Enter a reason for the brand assignment change.");
      return;
    }
    const assignment = selectedAssignments.find(
      (item) => item.brandId === targetBrandId,
    );
    const basePath = `/v1/admin/brands/${encodeURIComponent(targetBrandId)}/instructors`;
    if (!assignment) {
      if (nextStatus !== "active") return;
      const body = { instructorId: selected.id, reason: normalizedReason };
      await saveCommand(
        "brand-assignment:" + JSON.stringify({ basePath, body }),
        basePath,
        "POST",
        body,
      );
      return;
    }
    const path = `${basePath}/${encodeURIComponent(selected.id)}/status`;
    const body = {
      status: nextStatus,
      expectedVersion: assignment.version,
      reason: normalizedReason,
    };
    await saveCommand(
      "brand-assignment-status:" + JSON.stringify({ path, body }),
      path,
      "PATCH",
      body,
    );
  }

  async function assignCourse(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    if (!selected || !courseBrandId || !courseId) return;
    const normalizedReason = reason.trim();
    if (!normalizedReason) {
      setError("Enter a reason for the course assignment.");
      return;
    }
    if (!activeBrandIds.has(courseBrandId)) {
      setError(
        "Assign the instructor to this brand before assigning a course.",
      );
      return;
    }
    const path = `/v1/admin/brands/${encodeURIComponent(courseBrandId)}/courses/${encodeURIComponent(courseId)}/instructors`;
    const body = { instructorId: selected.id, reason: normalizedReason };
    const saved = await saveCommand(
      "course-assignment:" + JSON.stringify({ path, body }),
      path,
      "POST",
      body,
    );
    if (!saved) return;
    setCourseId("");
  }

  const visibleCourseOptions = courseOptions.filter(
    (course) =>
      !course.instructorAssignments.some(
        (assignment) =>
          assignment.instructorId === selectedId &&
          assignment.status === "active",
      ),
  );

  return (
    <section
      className="admin-page admin-instructors-live"
      aria-label="Instructor directory"
    >
      <header className="admin-page-header">
        <div>
          <h1>Instructors</h1>
          <p>
            Manage instructor profiles, brand access and course assignments.
            Instructor-facing workspaces can be added later.
          </p>
        </div>
        <button
          type="button"
          className="is-primary"
          onClick={() => setShowCreate((value) => !value)}
        >
          <Plus aria-hidden="true" /> Add instructor
        </button>
      </header>

      <p className="admin-workspace-context">
        <span>
          <UserRoundCog aria-hidden="true" />
          {brand?.brandDisplayName ??
            (brandView === "all" ? "All authorized brands" : brandView)}
        </span>
        <span className="admin-workspace-readonly">Live backend records</span>
      </p>

      {notice && (
        <p className="admin-workspace-inline-state" role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className="admin-workspace-inline-state" role="alert">
          {error}
        </p>
      )}

      <AdminSideDrawer
        open={showCreate}
        title="Create instructor"
        eyebrow="Instructor directory"
        dismissible={!saving}
        onClose={() => setShowCreate(false)}
      >
        <form
          className="admin-workspace-form"
          onSubmit={(event) => void createInstructor(event)}
          aria-busy={saving}
        >
          {error && <p role="alert">{error}</p>}
          <p>
            The API accepts an instructor code and display name. Contact,
            schedule and performance records are not part of this endpoint.
          </p>
          <label>
            Display name
            <input
              required
              maxLength={160}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </label>
          <label>
            Instructor code
            <input
              required
              maxLength={80}
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
          </label>
          <label>
            Reason
            <textarea
              required
              maxLength={500}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
          <div className="admin-workspace-actions">
            <button
              type="button"
              disabled={saving}
              onClick={() => setShowCreate(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                saving || !displayName.trim() || !code.trim() || !reason.trim()
              }
            >
              {saving ? "Creating…" : "Create instructor"}
            </button>
          </div>
        </form>
      </AdminSideDrawer>

      <div className="admin-workspace-toolbar">
        <label>
          <Search aria-hidden="true" />
          <span className="admin-sr-only">Search instructors</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or code…"
          />
        </label>
        <select
          aria-label="Filter instructors by status"
          value={status}
          onChange={(event) => setStatus(event.target.value as typeof status)}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
        </select>
        <button
          type="button"
          disabled={loading}
          onClick={() => setRevision((value) => value + 1)}
        >
          Refresh
        </button>
      </div>

      <div className="admin-workspace-split admin-instructors-live__split">
        <article className="admin-workspace-card">
          <header>
            <h2>Instructor directory</h2>
            <span>
              {loading ? "Loading…" : `${filteredInstructors.length} records`}
            </span>
          </header>
          {loading ? (
            <p role="status">Loading instructor records…</p>
          ) : error && !instructors.length ? (
            <p role="alert">Instructor records are unavailable.</p>
          ) : filteredInstructors.length === 0 ? (
            <p>No instructors match this context and filter.</p>
          ) : (
            <div className="admin-workspace-table-wrap">
              <table className="admin-workspace-table">
                <caption className="admin-sr-only">
                  Backend instructor identities
                </caption>
                <thead>
                  <tr>
                    <th>Instructor</th>
                    <th>Code</th>
                    <th>Brands</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInstructors.map((instructor) => {
                    const assignments = brandAssignments.filter(
                      (item) =>
                        item.instructorId === instructor.id &&
                        item.status === "active",
                    );
                    return (
                      <tr
                        key={instructor.id}
                        className={
                          selectedId === instructor.id ? "is-selected" : ""
                        }
                      >
                        <td>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedId(instructor.id);
                              setDetailsOpen(true);
                              setError("");
                              setNotice("");
                            }}
                          >
                            <UserRoundCog aria-hidden="true" />
                            <strong>{instructor.displayName}</strong>
                          </button>
                        </td>
                        <td>{instructor.instructorCode || instructor.code}</td>
                        <td>
                          {assignments.length
                            ? assignments
                                .map((item) =>
                                  brandName(availableBrands, item.brandId),
                                )
                                .join(", ")
                            : "No active brand"}
                        </td>
                        <td>{instructor.status}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <AdminSideDrawer
          open={detailsOpen}
          title="Instructor details"
          eyebrow="Identity and assignments"
          className="admin-instructor-edit-drawer"
          dismissible={!saving}
          onClose={() => setDetailsOpen(false)}
        >
        <aside
          className="admin-workspace-card"
          aria-label="Selected instructor details"
        >
          {error && <p role="alert">{error}</p>}
          {notice && <p role="status">{notice}</p>}
          {!selected ? (
            <p>
              {loading ? "Loading…" : "Select an instructor to view details."}
            </p>
          ) : (
            <>
              <header>
                <div>
                  <h2>{selected.displayName}</h2>
                  <span>
                    {selected.instructorCode || selected.code} ·{" "}
                    {selected.status}
                  </span>
                </div>
              </header>
              <dl className="admin-workspace-detail-list">
                <div>
                  <dt>Created</dt>
                  <dd>{new Date(selected.createdAt).toLocaleDateString()}</dd>
                </div>
                <div>
                  <dt>Last updated</dt>
                  <dd>{new Date(selected.updatedAt).toLocaleDateString()}</dd>
                </div>
                <div>
                  <dt>Version</dt>
                  <dd>{selected.version}</dd>
                </div>
              </dl>

              <form
                className="admin-workspace-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  const body = {
                    displayName: editDisplayName.trim(),
                    code: editCode.trim(),
                    expectedVersion: selected.version,
                    reason: reason.trim(),
                  };
                  const path = `/v1/admin/instructors/${encodeURIComponent(selected.id)}`;
                  void saveCommand(
                    "update-instructor:" + JSON.stringify({ path, body }),
                    path,
                    "PATCH",
                    body,
                  );
                }}
              >
                <h3>Edit instructor identity</h3>
                <label>
                  Display name
                  <input
                    required
                    maxLength={160}
                    value={editDisplayName}
                    onChange={(event) => setEditDisplayName(event.target.value)}
                  />
                </label>
                <label>
                  Instructor code
                  <input
                    required
                    maxLength={80}
                    value={editCode}
                    onChange={(event) => setEditCode(event.target.value)}
                  />
                </label>
                <label>
                  Reason
                  <textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                  />
                </label>
                <button
                  type="submit"
                  disabled={
                    saving ||
                    !reason.trim() ||
                    !editDisplayName.trim() ||
                    !editCode.trim()
                  }
                >
                  Save identity
                </button>
              </form>

              <section
                className="admin-workspace-form"
                aria-label="Brand assignments"
              >
                <h3>Brand assignments</h3>
                {availableBrands.map((availableBrand) => {
                  const assignment = selectedAssignments.find(
                    (item) => item.brandId === availableBrand.brandId,
                  );
                  const active = assignment?.status === "active";
                  return (
                    <div
                      className="admin-workspace-actions-inline"
                      key={availableBrand.brandId}
                    >
                      <span>
                        {availableBrand.brandDisplayName} ·{" "}
                        {assignment?.status ?? "not assigned"}
                      </span>
                      <button
                        type="button"
                        disabled={saving || !reason.trim()}
                        onClick={() =>
                          void changeBrandAssignment(
                            availableBrand.brandId,
                            active ? "inactive" : "active",
                          )
                        }
                      >
                        {active
                          ? "Deactivate"
                          : assignment
                            ? "Reactivate"
                            : "Assign"}
                      </button>
                    </div>
                  );
                })}
              </section>

              <form
                className="admin-workspace-form"
                onSubmit={(event) => void assignCourse(event)}
              >
                <h3>Assign to course</h3>
                <label>
                  Brand
                  <select
                    value={courseBrandId}
                    onChange={(event) => setCourseBrandId(event.target.value)}
                  >
                    <option value="">Select an assigned brand</option>
                    {availableBrands
                      .filter((item) => activeBrandIds.has(item.brandId))
                      .map((item) => (
                        <option key={item.brandId} value={item.brandId}>
                          {item.brandDisplayName}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  Course
                  <select
                    required
                    value={courseId}
                    disabled={
                      !courseBrandId ||
                      courseLoading ||
                      !visibleCourseOptions.length
                    }
                    onChange={(event) => setCourseId(event.target.value)}
                  >
                    <option value="">
                      {courseLoading ? "Loading courses…" : "Select a course"}
                    </option>
                    {visibleCourseOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title} · {item.code}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="submit"
                  disabled={
                    saving || courseLoading || !courseId || !reason.trim()
                  }
                >
                  Assign course
                </button>
              </form>

              <button
                type="button"
                className="is-secondary"
                disabled={saving || !reason.trim()}
                onClick={() =>
                  void changeGlobalStatus(
                    selected.status === "active" ? "inactive" : "active",
                  )
                }
              >
                {selected.status === "active"
                  ? "Deactivate instructor"
                  : "Activate instructor"}
              </button>
              {!availableBrands.length && (
                <p role="alert">No authorized brand context is available.</p>
              )}
              <p className="admin-workspace-note">
                Email, schedule and performance screens are not available in the
                current backend contract.
              </p>
            </>
          )}
        </aside>
        </AdminSideDrawer>
      </div>
    </section>
  );
}
