import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  GraduationCap,
  Laptop,
  LoaderCircle,
  LockKeyhole,
  MoreVertical,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  UsersRound,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type {
  AdminBrandContext,
  AdminBrandView,
  AdminStudentDetail,
  AdminStudentStatus,
} from "../../../features/admin/api";
import {
  changeAdminStudentStatus,
  revokeAdminStudentDevice,
  revokeAdminStudentSession,
} from "../../../features/admin/api/adminOperationsApi";
import {
  loadAdminStudentDetail,
  studentStatusLabel,
  useAdminStudents,
  type AdminStudentRow,
} from "../../../features/admin/students/adminStudents.adapter";
import { AdminStudentProvisioningForm } from "../../../features/admin/students/AdminStudentProvisioningForm";
import { AdminStudentSubscriptionsPanel } from "../../../features/admin/students/AdminStudentSubscriptionsPanel";
import { AdminSideDrawer } from "../../../features/admin/components/AdminSideDrawer";

type DetailTab = "profile" | "access" | "devices" | "sessions";

interface AdminStudentsOutletContext {
  readonly brand?: AdminBrandContext;
  readonly brandView: AdminBrandView;
  readonly availableBrands: readonly AdminBrandContext[];
}

interface StudentStatCard {
  readonly title: string;
  readonly value?: number;
  readonly icon: LucideIcon;
}

const number = new Intl.NumberFormat("en-EG");
const PAGE_SIZE = 8;

function createRequestKey(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return (
    "admin-student-" + Date.now() + "-" + Math.random().toString(36).slice(2)
  );
}

function initials(name?: string | null): string {
  return (name ?? "Student")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function shortDate(value?: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function relativeTime(value?: string | null): string {
  if (!value) return "No activity";
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "No activity";

  const hoursAgo = Math.round((timestamp - Date.now()) / 3_600_000);
  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
    hoursAgo,
    "hour",
  );
}

function splitTerm(
  value?: string | null,
): Readonly<{ level: string; semester: string }> {
  const [level = "—", semester = "—"] =
    value?.split("/").map((part) => part.trim()) ?? [];
  return { level, semester };
}

function StatusBadge({ status }: Readonly<{ status: AdminStudentStatus }>) {
  return (
    <span className={"admin-students-status is-" + status}>
      <i aria-hidden="true" />
      {studentStatusLabel[status]}
    </span>
  );
}

function BrandBadge({ row }: Readonly<{ row: AdminStudentRow }>) {
  return (
    <span className={"admin-students-brand is-" + row.platform.platformCode}>
      <ShieldCheck aria-hidden="true" />
      {row.platform.platformDisplayName}
    </span>
  );
}

interface DetailPanelProps {
  readonly row?: AdminStudentRow;
  readonly detail?: AdminStudentDetail;
  readonly detailLoading: boolean;
  readonly tab: DetailTab;
  readonly preview: boolean;
  readonly mutating: boolean;
  readonly onTab: (tab: DetailTab) => void;
  readonly onClose: () => void;
  readonly onStatusChange: (status: "active" | "suspended" | "disabled") => void;
  readonly onRevokeSession: (sessionId: string, appUserId: string) => void;
  readonly onRevokeDevice: (deviceId: string, appUserId: string) => void;
}

function DetailPanel({
  row,
  detail,
  detailLoading,
  tab,
  preview,
  mutating,
  onTab,
  onClose,
  onStatusChange,
  onRevokeSession,
  onRevokeDevice,
}: DetailPanelProps) {
  if (!row) {
    return (
      <aside className="admin-students-detail admin-students-detail--empty">
        <UserRound aria-hidden="true" />
        <strong>Select a student</strong>
        <p>
          Choose a row to inspect its account, subscriptions, devices, and
          sessions.
        </p>
      </aside>
    );
  }

  const term = splitTerm(row.academicTermOrYear);
  const tabs: readonly DetailTab[] = [
    "profile",
    "access",
    "devices",
    "sessions",
  ];
  const fields: readonly (readonly [string, string])[] = [
    ["Full name", row.displayName ?? "Not available"],
    ["Student code", row.studentIdMasked ?? "Not provided"],
    ["Platform/contact email", row.emailMasked ?? "Not available"],
    ["Phone", row.phoneMasked ?? "Not provided"],
    [
      "Academic institution",
      row.academicInstitution ?? row.university ?? "Not provided",
    ],
    ["Academic level", row.academicLevel ?? term.level],
    ["Semester", row.academicSemester ?? term.semester],
    ["Program", row.program ?? "Not provided"],
    ["Account created", shortDate(detail?.createdAt)],
    ["Expected graduation", shortDate(row.expectedGraduationDate)],
    ["Brand", row.platform.platformDisplayName],
  ];

  return (
    <aside
      className="admin-students-detail"
      aria-label={(row.displayName ?? "Student") + " details"}
    >
      <header className="admin-students-detail__header">
        <span className="admin-students-avatar">
          {initials(row.displayName)}
        </span>
        <div>
          <strong>{row.displayName ?? "Student profile"}</strong>
          <StatusBadge status={row.status} />
          <small>
            {row.studentIdMasked ?? "No student code"} ·{" "}
            {row.emailMasked ?? "Email unavailable"}
          </small>
        </div>
        <button
          type="button"
          className="admin-students-icon-button"
          onClick={onClose}
          aria-label="Close student details"
        >
          <X aria-hidden="true" />
        </button>
      </header>

      <div
        className="admin-students-tabs"
        role="tablist"
        aria-label="Student details"
      >
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={tab === item}
            onClick={() => onTab(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="admin-students-detail__body">
        {tab === "profile" && (
          <>
            <section>
              <h3>Student overview</h3>
              <dl className="admin-students-fields">
                {fields.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
            <section>
              <h3>Account status</h3>
              <div className="admin-students-quick-actions">
                {row.status === "pending" ? (
                  <>
                    <p>This provisioned account is pending brand approval. Approval activates its pending membership; rejection disables the account and revokes that membership.</p>
                    <button
                      type="button"
                      disabled={mutating}
                      onClick={() => onStatusChange("active")}
                    >
                      <ShieldCheck aria-hidden="true" />
                      Approve student
                    </button>
                    <button
                      type="button"
                      disabled={mutating}
                      onClick={() => onStatusChange("disabled")}
                    >
                      <X aria-hidden="true" />
                      Reject student
                    </button>
                  </>
                ) : row.status === "suspended" ? (
                  <button
                    type="button"
                    disabled={mutating}
                    onClick={() => onStatusChange("active")}
                  >
                    <RotateCcw aria-hidden="true" />
                    Restore student
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={mutating || row.status !== "active"}
                    onClick={() => onStatusChange("suspended")}
                  >
                    <LockKeyhole aria-hidden="true" />
                    Suspend student
                  </button>
                )}
              </div>
            </section>
            <section>
              <h3>Activity summary</h3>
              <dl className="admin-students-fields admin-students-activity">
                <div>
                  <dt>Last activity</dt>
                  <dd>{relativeTime(row.lastSeenAt)}</dd>
                </div>
                <div>
                  <dt>Sessions reported</dt>
                  <dd>
                    {detail?.sessions.length ?? row.activeSessionCount ?? "—"}
                  </dd>
                </div>
              </dl>
            </section>
          </>
        )}

        {tab === "access" &&
          (preview ? (
            <section className="admin-students-tab-empty">
              <ShieldCheck aria-hidden="true" />
              <h3>Access summary</h3>
              <p>
                {detail
                  ? detail.access.activeGrantCount +
                    " active grants and " +
                    detail.access.activeSubscriptionCount +
                    " active subscriptions are present in this preview record."
                  : "Detailed access data is unavailable for this record."}
              </p>
            </section>
          ) : (
            <AdminStudentSubscriptionsPanel
              brandCode={row.platform.platformCode}
              studentProfileId={row.id}
            />
          ))}

        {tab === "devices" && (
          <section>
            <h3>Devices</h3>
            {detailLoading && <p role="status">Loading device records…</p>}
            {!detailLoading && detail?.devices.length === 0 && (
              <p>No device records are available.</p>
            )}
            {detail?.devices.map((device) => (
              <article className="admin-students-fields" key={device.id}>
                <div>
                  <strong>
                    {device.deviceLabel ??
                      device.deviceType ??
                      "Registered device"}
                  </strong>
                  <span> · {device.trustStatus}</span>
                  <small>Last seen {shortDate(device.lastSeenAt)}</small>
                </div>
                {device.trustStatus !== "revoked" && (
                  <button
                    type="button"
                    disabled={mutating}
                    onClick={() => onRevokeDevice(device.id, device.userId)}
                  >
                    Revoke device
                  </button>
                )}
              </article>
            ))}
          </section>
        )}

        {tab === "sessions" && (
          <section>
            <h3>Sessions</h3>
            {detailLoading && <p role="status">Loading session records…</p>}
            {!detailLoading && detail?.sessions.length === 0 && (
              <p>No session records are available.</p>
            )}
            {detail?.sessions.map((session) => (
              <article className="admin-students-fields" key={session.id}>
                <div>
                  <strong>{session.status} session</strong>
                  <small>
                    Last activity {shortDate(session.lastActivityAt)} · Expires{" "}
                    {shortDate(session.expiresAt)}
                  </small>
                </div>
                {session.status === "active" && (
                  <button
                    type="button"
                    disabled={mutating}
                    onClick={() => onRevokeSession(session.id, session.userId)}
                  >
                    Revoke session
                  </button>
                )}
              </article>
            ))}
          </section>
        )}
      </div>
    </aside>
  );
}

export function AdminStudentsPage() {
  const { brand, brandView, availableBrands } =
    useOutletContext<AdminStudentsOutletContext>();
  const [createOpen, setCreateOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [mutating, setMutating] = useState(false);
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState<AdminBrandView>(brandView);
  const [level, setLevel] = useState("all");
  const [status, setStatus] = useState<"all" | AdminStudentStatus>("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string>();
  const [detail, setDetail] = useState<AdminStudentDetail>();
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    readonly title: string;
    readonly getSignature: (reason: string) => string;
    readonly execute: (reason: string, key: string) => Promise<void>;
  }>();
  const [actionReason, setActionReason] = useState("");
  const [tab, setTab] = useState<DetailTab>("profile");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const { dataset, loading, error, retry, api } = useAdminStudents(
    brand,
    availableBrands,
    { search, status, brandCode: brandFilter },
  );
  const allCheckbox = useRef<HTMLInputElement>(null);
  const mutationLock = useRef(false);
  const detailRequest = useRef(0);
  const pendingMutationKeys = useRef(new Map<string, string>());

  useEffect(() => {
    setBrandFilter(brandView);
    setPage(1);
  }, [brandView]);

  const rows = dataset?.rows ?? [];
  const levels = useMemo(
    () => [
      ...new Set(
        rows
          .map((row) => splitTerm(row.academicTermOrYear).level)
          .filter((item) => item !== "—"),
      ),
    ],
    [rows],
  );
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((student) => {
      const term = splitTerm(student.academicTermOrYear);
      const matchesSearch =
        !query ||
        [student.displayName, student.emailMasked, student.studentIdMasked]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesBrand =
        brandFilter === "all" || student.platform.platformCode === brandFilter;
      const matchesLevel = level === "all" || term.level === level;
      const matchesStatus = status === "all" || student.status === status;

      return matchesSearch && matchesBrand && matchesLevel && matchesStatus;
    });
  }, [brandFilter, level, rows, search, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selectedStudent = rows.find((item) => item.id === selectedId);
  const filtersActive = Boolean(
    search || brandFilter !== brandView || level !== "all" || status !== "all",
  );
  const allSelected =
    visible.length > 0 && visible.every((item) => selectedRows.has(item.id));
  const someSelected =
    visible.some((item) => selectedRows.has(item.id)) && !allSelected;

  const stats: readonly StudentStatCard[] = [
    {
      title: "Active students",
      value: dataset?.stats.activeStudents,
      icon: UsersRound,
    },
    {
      title: "Medway students",
      value: dataset?.stats.medwayStudents,
      icon: GraduationCap,
    },
    {
      title: "Elite students",
      value: dataset?.stats.eliteStudents,
      icon: UserRound,
    },
    {
      title: "Nexus students",
      value: dataset?.stats.nexusStudents,
      icon: UsersRound,
    },
  ];

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    if (allCheckbox.current) allCheckbox.current.indeterminate = someSelected;
  }, [someSelected]);

  async function chooseStudent(student: AdminStudentRow): Promise<void> {
    const requestId = detailRequest.current + 1;
    detailRequest.current = requestId;
    setSelectedId(student.id);
    setDetail(undefined);
    setDetailLoading(true);
    setDetailOpen(true);
    setTab("profile");

    try {
      const resolved = await loadAdminStudentDetail(api, student);
      if (detailRequest.current === requestId) setDetail(resolved);
    } finally {
      if (detailRequest.current === requestId) setDetailLoading(false);
    }
  }

  function resetFilters(): void {
    setSearch("");
    setBrandFilter(brandView);
    setLevel("all");
    setStatus("all");
    setPage(1);
  }

  function getMutationKey(signature: string): string {
    const existing = pendingMutationKeys.current.get(signature);
    if (existing) return existing;

    const key = createRequestKey();
    pendingMutationKeys.current.set(signature, key);
    return key;
  }

  async function confirmAndRunAction(
    title: string,
    getSignature: (reason: string) => string,
    action: (reason: string, idempotencyKey: string) => Promise<void>,
  ): Promise<void> {
    if (!selectedStudent || mutationLock.current) return;
    setActionReason("");
    setActionError("");
    setPendingAction({ title, getSignature, execute: action });
  }

  async function executePendingAction(): Promise<void> {
    if (!selectedStudent || !pendingAction || mutationLock.current || !actionReason.trim()) return;
    const normalizedReason = actionReason.trim();
    const signature = pendingAction.getSignature(normalizedReason);
    const idempotencyKey = getMutationKey(signature);
    mutationLock.current = true;
    setMutating(true);
    setActionError("");
    setNotice("");

    try {
      await pendingAction.execute(normalizedReason, idempotencyKey);
      pendingMutationKeys.current.delete(signature);
      setNotice("The requested account action was saved by the backend.");
      await retry();
      const refreshedDetail = await loadAdminStudentDetail(
        api,
        selectedStudent,
      );
      setDetail(refreshedDetail);
      setPendingAction(undefined);
    } catch (cause) {
      setActionError(
        cause instanceof Error
          ? cause.message
          : "The account action could not be completed.",
      );
    } finally {
      mutationLock.current = false;
      setMutating(false);
    }
  }

  function changeStatus(nextStatus: "active" | "suspended" | "disabled"): void {
    if (!selectedStudent) return;

    const studentId = selectedStudent.id;
    void confirmAndRunAction(
      nextStatus === "disabled"
        ? "Reject this pending Student? The account will be disabled and its brand membership revoked."
        : nextStatus === "suspended"
          ? "Suspend this Student account? Active backend sessions will be revoked."
          : selectedStudent.status === "pending"
            ? "Approve this pending Student and activate the brand membership?"
            : "Restore this Student account?",
      (reason) =>
        "student-status:" + studentId + ":" + nextStatus + ":" + reason,
      (reason, key) =>
        changeAdminStudentStatus(studentId, nextStatus, reason, key),
    );
  }

  function revokeSession(sessionId: string, appUserId: string): void {
    if (!selectedStudent) return;

    const brandId = selectedStudent.platform.platformId;
    void confirmAndRunAction(
      "Revoke this backend session? The action will be recorded in the audit trail.",
      (reason) => "session:" + brandId + ":" + sessionId + ":" + reason,
      (reason, key) =>
        revokeAdminStudentSession(
          { brandId, appUserId, sessionId, reason },
          key,
        ),
    );
  }

  function revokeDevice(deviceId: string, appUserId: string): void {
    if (!selectedStudent) return;

    const brandId = selectedStudent.platform.platformId;
    void confirmAndRunAction(
      "Revoke this registered device? The action will be recorded in the audit trail.",
      (reason) => "device:" + brandId + ":" + deviceId + ":" + reason,
      (reason, key) =>
        revokeAdminStudentDevice({ brandId, appUserId, deviceId, reason }, key),
    );
  }

  function toggleRow(studentId: string): void {
    setSelectedRows((current) => {
      const next = new Set(current);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  }

  function toggleVisibleRows(): void {
    setSelectedRows((current) => {
      const next = new Set(current);
      visible.forEach((item) => {
        if (allSelected) next.delete(item.id);
        else next.add(item.id);
      });
      return next;
    });
  }

  function handleStudentCreated(): void {
    setNotice(
      "The account and academic placement were saved. Review and securely share the one-time setup details before closing the drawer.",
    );
    void retry();
  }

  return (
    <section
      className="admin-page admin-students-page"
      aria-label="Students management"
    >
      <header className="admin-students-heading">
        <div>
          <h2>Students</h2>
          <p>
            Manage student accounts, access, registered devices, and sessions.
          </p>
        </div>
        {dataset?.mode === "preview" && (
          <span className="admin-students-preview">Local preview data</span>
        )}
      </header>

      {notice && (
        <div className="admin-workspace-inline-state" role="status">
          <ShieldCheck aria-hidden="true" />
          <div>
            <h3>Saved</h3>
            <p>{notice}</p>
          </div>
        </div>
      )}
      {actionError && (
        <div className="admin-workspace-inline-state" role="alert">
          <Activity aria-hidden="true" />
          <div>
            <h3>Action failed</h3>
            <p>{actionError}</p>
          </div>
        </div>
      )}

      <AdminSideDrawer
        open={createOpen}
        eyebrow="Student provisioning"
        title="Create Student account"
        className="admin-students-create-drawer"
        onClose={() => setCreateOpen(false)}
      >
        {createOpen && (
          <AdminStudentProvisioningForm
            initialBrandCode={brand?.brandCode}
            onCreated={handleStudentCreated}
            onDone={() => setCreateOpen(false)}
          />
        )}
      </AdminSideDrawer>

      <div className="admin-students-stats">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const value =
            loading || error || stat.value === undefined
              ? "—"
              : number.format(stat.value);

          return (
            <article key={stat.title}>
              <span>
                <Icon aria-hidden="true" />
              </span>
              <div>
                <small>{stat.title}</small>
                <strong>{value}</strong>
                <em>
                  {dataset?.mode === "preview"
                    ? "Preview records"
                    : "Loaded records"}
                </em>
              </div>
            </article>
          );
        })}
      </div>

      <div
        className={
          "admin-students-workspace" + (detailOpen ? " has-detail" : "")
        }
      >
        <article className="admin-students-directory">
          <div className="admin-students-toolbar">
            <label className="admin-students-search">
              <span className="admin-sr-only">
                Search students by name, email, or student code
              </span>
              <Search aria-hidden="true" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search students…"
              />
            </label>

            <label>
              <span className="admin-sr-only">Filter by brand</span>
              <select
                value={brandFilter}
                onChange={(event) => {
                  setBrandFilter(event.target.value as AdminBrandView);
                  setPage(1);
                }}
              >
                {availableBrands.length > 1 && (
                  <option value="all">All authorized brands</option>
                )}
                {availableBrands.map((item) => (
                  <option value={item.brandCode} key={item.brandId}>
                    {item.brandDisplayName}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="admin-sr-only">Filter by academic level</span>
              <select
                value={level}
                onChange={(event) => {
                  setLevel(event.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All academic levels</option>
                {levels.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>

            <label>
              <span className="admin-sr-only">Filter by account status</span>
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as "all" | AdminStudentStatus);
                  setPage(1);
                }}
              >
                <option value="all">All statuses</option>
                {Object.entries(studentStatusLabel).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="admin-students-button"
              onClick={resetFilters}
              disabled={!filtersActive}
            >
              <Filter aria-hidden="true" />
              Clear filters
            </button>
            <button
              type="button"
              className="admin-students-button"
              disabled
              title="Export is not connected"
            >
              <Download aria-hidden="true" />
              Export
            </button>
            <button
              type="button"
              className="admin-students-button is-primary"
              onClick={() => {
                setCreateOpen((value) => !value);
                setNotice("");
              }}
            >
              <Plus aria-hidden="true" />
              Add student
            </button>
          </div>

          <div className="admin-students-table-wrap">
            <table className="admin-students-table">
              <caption className="admin-sr-only">Students directory</caption>
              <thead>
                <tr>
                  <th>
                    <input
                      ref={allCheckbox}
                      type="checkbox"
                      aria-label="Select all students on this page"
                      checked={allSelected}
                      onChange={toggleVisibleRows}
                    />
                  </th>
                  <th>Student</th>
                  <th>Student code</th>
                  <th>Brand</th>
                  <th>Academic level</th>
                  <th>Semester</th>
                  <th>Status</th>
                  <th>Devices</th>
                  <th>Last activity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={10}>
                      <div className="admin-students-table-state">
                        <LoaderCircle aria-hidden="true" />
                        Loading student records…
                      </div>
                    </td>
                  </tr>
                )}
                {error && (
                  <tr>
                    <td colSpan={10}>
                      <div className="admin-students-table-state is-error">
                        <strong>Student records are unavailable.</strong>
                        <span>{error.message}</span>
                        <button type="button" onClick={() => void retry()}>
                          Retry
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && !error && rows.length === 0 && (
                  <tr>
                    <td colSpan={10}>
                      <div className="admin-students-table-state">
                        <UsersRound aria-hidden="true" />
                        <strong>No students yet</strong>
                        <span>
                          Student records will appear when they are available
                          for this brand.
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading &&
                  !error &&
                  rows.length > 0 &&
                  filtered.length === 0 && (
                    <tr>
                      <td colSpan={10}>
                        <div className="admin-students-table-state">
                          <Search aria-hidden="true" />
                          <strong>No matching students</strong>
                          <span>
                            Try changing or clearing the current filters.
                          </span>
                          <button type="button" onClick={resetFilters}>
                            Clear filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                {visible.map((student) => {
                  const term = splitTerm(student.academicTermOrYear);
                  const selected = student.id === selectedId && detailOpen;
                  const accessibleName =
                    student.displayName ?? "student profile";

                  return (
                    <tr
                      key={student.id}
                      className={selected ? "is-selected" : ""}
                      onClick={() => void chooseStudent(student)}
                    >
                      <td onClick={(event) => event.stopPropagation()}>
                        <input
                          type="checkbox"
                          aria-label={"Select " + accessibleName}
                          checked={selectedRows.has(student.id)}
                          onChange={() => toggleRow(student.id)}
                        />
                      </td>
                      <td>
                        <span className="admin-students-person">
                          <i>{initials(student.displayName)}</i>
                          <span>
                            <strong>
                              {student.displayName ?? "Student profile"}
                            </strong>
                            <small>
                              {student.emailMasked ?? "Email unavailable"}
                            </small>
                          </span>
                        </span>
                      </td>
                      <td>{student.studentIdMasked ?? "—"}</td>
                      <td>
                        <BrandBadge row={student} />
                      </td>
                      <td>{term.level}</td>
                      <td>{term.semester}</td>
                      <td>
                        <StatusBadge status={student.status} />
                      </td>
                      <td>
                        <span className="admin-students-device">
                          <Laptop aria-hidden="true" />
                          {student.activeDeviceCount ?? "—"}
                        </span>
                      </td>
                      <td>{relativeTime(student.lastSeenAt)}</td>
                      <td onClick={(event) => event.stopPropagation()}>
                        <span className="admin-students-actions">
                          <button
                            type="button"
                            onClick={() => void chooseStudent(student)}
                          >
                            View student
                          </button>
                          <button
                            type="button"
                            className="admin-students-icon-button"
                            aria-label={"More actions for " + accessibleName}
                            disabled
                          >
                            <MoreVertical aria-hidden="true" />
                          </button>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <footer className="admin-students-pagination">
            <span>
              {filtered.length
                ? "Showing " +
                  ((page - 1) * PAGE_SIZE + 1) +
                  "–" +
                  Math.min(page * PAGE_SIZE, filtered.length) +
                  " of " +
                  filtered.length +
                  " students"
                : "No students to show"}
            </span>
            <div>
              <button
                type="button"
                aria-label="Previous page"
                disabled={page === 1}
                onClick={() => setPage((current) => current - 1)}
              >
                <ChevronLeft aria-hidden="true" />
              </button>
              <strong>{page}</strong>
              <span>of {totalPages}</span>
              <button
                type="button"
                aria-label="Next page"
                disabled={page === totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                <ChevronRight aria-hidden="true" />
              </button>
            </div>
          </footer>
        </article>

        <AdminSideDrawer
          open={detailOpen && Boolean(selectedStudent)}
          eyebrow="Student account"
          title={selectedStudent?.displayName ?? "Student details"}
          onClose={() => setDetailOpen(false)}
        >
        <DetailPanel
          row={selectedStudent}
          detail={detail}
          detailLoading={detailLoading}
          tab={tab}
          preview={dataset?.mode === "preview"}
          mutating={mutating}
          onTab={setTab}
          onClose={() => setDetailOpen(false)}
          onStatusChange={changeStatus}
          onRevokeSession={revokeSession}
          onRevokeDevice={revokeDevice}
        />
        </AdminSideDrawer>
      </div>
      <AdminSideDrawer open={Boolean(pendingAction)} eyebrow="Account security"
        title="Confirm account action" dismissible={!mutating}
        onClose={() => setPendingAction(undefined)}>
        <form className="admin-workspace-form" onSubmit={(event) => {
          event.preventDefault();
          void executePendingAction();
        }}>
          <p>{pendingAction?.title}</p>
          <label>Reason for the audit record
            <textarea value={actionReason} maxLength={1000} disabled={mutating}
              onChange={(event) => setActionReason(event.target.value)} />
          </label>
          {actionError && <p role="alert">{actionError}</p>}
          <button type="submit" disabled={mutating || !actionReason.trim()}>
            {mutating ? "Saving…" : "Confirm action"}
          </button>
        </form>
      </AdminSideDrawer>
    </section>
  );
}
