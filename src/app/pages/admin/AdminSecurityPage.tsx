import { useEffect, useRef, useState } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import { Activity, Laptop, ShieldCheck, UsersRound } from "lucide-react";
import type {
  AdminBrandContext,
  AdminBrandView,
  AdminStudentDetail,
} from "../../../features/admin/api";
import {
  changeAdminStudentStatus,
  revokeAdminStudentDevice,
  revokeAdminStudentSession,
} from "../../../features/admin/api/adminOperationsApi";
import {
  useAdminStudents,
  loadAdminStudentDetail,
} from "../../../features/admin/students/adminStudents.adapter";
import { AdminSideDrawer } from "../../../features/admin/components/AdminSideDrawer";
import {
  WorkspaceBadge,
  WorkspaceCard,
  WorkspaceFields,
  WorkspaceInspector,
  WorkspaceState,
} from "../../../features/admin/components/AdminWorkspacePrimitives";
import {
  clientRequestId,
  date,
  readSecurity,
  useWorkspaceRecords,
  SourceLabel,
  Metrics,
} from "../../../features/admin/components/AdminWorkspace";
type SecurityTarget = { kind: "device" | "session"; id: string };
type SecurityAction = {
  title: string;
  target: string;
  signature: string;
  execute: (reason: string, key: string) => Promise<void>;
};

export function AdminSecurityPage() {
  const { brand, brandView, availableBrands } = useOutletContext<{
    brand?: AdminBrandContext;
    brandView: AdminBrandView;
    availableBrands: readonly AdminBrandContext[];
  }>();
  const [query, setQuery] = useSearchParams();
  const [search, setSearch] = useState("");
  const [studentId, setStudentId] = useState(query.get("studentId") ?? "");
  const [tab, setTab] = useState<"devices" | "sessions">("devices");
  const [target, setTarget] = useState<SecurityTarget>();
  const [detail, setDetail] = useState<AdminStudentDetail>();
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [action, setAction] = useState<SecurityAction>();
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [revision, setRevision] = useState(0);
  const busy = useRef(false);
  const pendingKeys = useRef(new Map<string, string>());
  const events = useWorkspaceRecords(readSecurity);
  const students = useAdminStudents(brand, availableBrands, {
    search,
    status: "all",
    brandCode: brandView,
  });
  const selectedStudent = students.dataset?.rows.find(
    (row) => row.id === studentId,
  );
  const preview = students.dataset?.mode === "preview";
  useEffect(() => {
    let current = true;
    setDetail(undefined);
    setDetailError("");
    setTarget(undefined);
    setAction(undefined);
    if (!selectedStudent) {
      setDetailLoading(false);
      return;
    }
    setDetailLoading(true);
    void loadAdminStudentDetail(students.api, selectedStudent)
      .then((value) => {
        if (!current) return;
        setDetail(value);
        if (!value)
          setDetailError(
            "Security records could not be loaded for this Student.",
          );
      })
      .catch((cause: unknown) => {
        if (current)
          setDetailError(
            cause instanceof Error
              ? cause.message
              : "Security records unavailable.",
          );
      })
      .finally(() => {
        if (current) setDetailLoading(false);
      });
    return () => {
      current = false;
    };
  }, [selectedStudent, students.api, revision]);
  function prepare(next: SecurityAction) {
    if (busy.current || preview) return;
    setReason("");
    setActionError("");
    setAction(next);
  }
  function revoke(kind: "device" | "session", id: string, appUserId: string) {
    if (!selectedStudent) return;
    const brandId = selectedStudent.platform.platformId;
    prepare({
      title: `Revoke ${kind}`,
      target: `${selectedStudent.displayName ?? "Student"} · ${kind} ${id}`,
      signature: `${kind}:${brandId}:${id}`,
      execute: (reason, key) =>
        kind === "device"
          ? revokeAdminStudentDevice(
              { brandId, appUserId, deviceId: id, reason },
              key,
            )
          : revokeAdminStudentSession(
              { brandId, appUserId, sessionId: id, reason },
              key,
            ),
    });
  }
  function changeStatus(status: "active" | "suspended") {
    if (!selectedStudent) return;
    const id = selectedStudent.id;
    prepare({
      title: status === "active" ? "Restore Student" : "Suspend Student",
      target: selectedStudent.displayName ?? "Selected Student",
      signature: `student-status:${id}:${status}`,
      execute: (reason, key) =>
        changeAdminStudentStatus(id, status, reason, key),
    });
  }
  async function confirmAction() {
    if (!action || !reason.trim() || busy.current || preview) return;
    const signature = `${action.signature}:${reason.trim()}`;
    const key = pendingKeys.current.get(signature) ?? clientRequestId();
    pendingKeys.current.set(signature, key);
    busy.current = true;
    setSaving(true);
    setActionError("");
    setNotice("");
    try {
      await action.execute(reason.trim(), key);
      pendingKeys.current.delete(signature);
      setAction(undefined);
      setNotice("The backend confirmed the security action.");
      setRevision((value) => value + 1);
      events.retry();
      await students.retry();
    } catch (cause) {
      setActionError(
        cause instanceof Error
          ? cause.message
          : "The security action could not be completed.",
      );
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  const device =
    target?.kind === "device"
      ? detail?.devices.find((item) => item.id === target.id)
      : undefined;
  const session =
    target?.kind === "session"
      ? detail?.sessions.find((item) => item.id === target.id)
      : undefined;
  const rows = tab === "devices" ? detail?.devices : detail?.sessions;
  const activeSessions =
    detail?.sessions.filter((item) => item.status === "active") ?? [];
  return (
    <section
      className="admin-page admin-workspace-page admin-security-console"
      aria-label="Security management"
    >
      <SourceLabel
        preview={preview}
        label={brand?.brandDisplayName ?? "All authorized brands"}
      />
      <Metrics
        values={[
          {
            title: "Active sessions",
            value: detail ? activeSessions.length : "—",
            icon: Laptop,
            note: "Selected Student only",
          },
          {
            title: "Flagged events",
            value:
              events.loading || events.error
                ? "—"
                : events.rows.filter((item) => item.severity !== "info").length,
            icon: ShieldCheck,
          },
          {
            title: "Device replacements",
            value: "—",
            icon: Activity,
            note: "Replacement history unavailable",
          },
          {
            title: "Suspended accounts",
            value:
              students.loading || students.error
                ? "—"
                : (students.dataset?.rows.filter(
                    (row) => row.status === "suspended",
                  ).length ?? "—"),
            icon: UsersRound,
            note: "Within the loaded Student results",
          },
        ]}
      />
      {notice && (
        <p role="status" className="admin-workspace-note">
          {notice}
        </p>
      )}
      <div className="admin-security-grid">
        <div className="admin-security-events">
          <WorkspaceCard title="Security events">
            <div className="admin-security-event-list">
              {events.rows.map((event) => (
                <article key={`${event.platform.platformCode}:${event.id}`}>
                  <ShieldCheck aria-hidden="true" />
                  <div>
                    <strong>{event.eventType.replaceAll("_", " ")}</strong>
                    <small>
                      {event.platform.platformDisplayName} ·{" "}
                      {date(event.occurredAt)}
                    </small>
                    <WorkspaceBadge value={event.severity} />
                  </div>
                </article>
              ))}
              {!events.rows.length && (
                <WorkspaceState
                  loading={events.loading}
                  error={events.error}
                  onRetry={events.retry}
                  title="No security events"
                />
              )}
            </div>
          </WorkspaceCard>
          <WorkspaceCard title="Audit activity">
            <p className="admin-workspace-note">
              Actor, action, and target audit details are not exposed by this
              screen’s current read model. Security events above are shown
              separately.
            </p>
          </WorkspaceCard>
        </div>
        <WorkspaceCard
          title="Registered devices & sessions"
          className="admin-security-inventory"
        >
          <div className="admin-workspace-form admin-security-selector">
            <label>
              Find Student
              <input
                type="search"
                placeholder="Name, email, or student code"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <label>
              Student
              <select
                value={studentId}
                onChange={(event) => {
                  setStudentId(event.target.value);
                  setQuery(
                    { studentId: event.target.value },
                    { replace: true },
                  );
                }}
              >
                <option value="">Select a Student</option>
                {students.dataset?.rows.map((row) => (
                  <option
                    key={`${row.platform.platformCode}:${row.id}`}
                    value={row.id}
                  >
                    {row.displayName ?? row.emailMasked ?? "Student"} ·{" "}
                    {row.platform.platformDisplayName}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {students.error && (
            <WorkspaceState error onRetry={() => void students.retry()} />
          )}
          <div className="admin-students-tabs" aria-label="Security inventory">
            {(["devices", "sessions"] as const).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={tab === item}
                onClick={() => {
                  setTab(item);
                  setTarget(undefined);
                }}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="admin-workspace-table-wrap">
            <table className="admin-workspace-table">
              <caption className="admin-sr-only">
                Selected Student {tab}
              </caption>
              <thead>
                <tr>
                  <th>{tab === "devices" ? "Device" : "Session"}</th>
                  <th>First seen</th>
                  <th>Last active</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {tab === "devices"
                  ? detail?.devices.map((item) => (
                      <tr
                        key={item.id}
                        className={target?.id === item.id ? "is-selected" : ""}
                      >
                        <td>
                          {item.deviceLabel ??
                            item.deviceType ??
                            "Registered device"}
                        </td>
                        <td>{date(item.firstSeenAt)}</td>
                        <td>{date(item.lastSeenAt)}</td>
                        <td>
                          <WorkspaceBadge value={item.trustStatus} />
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() =>
                              setTarget({ kind: "device", id: item.id })
                            }
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))
                  : detail?.sessions.map((item) => (
                      <tr
                        key={item.id}
                        className={target?.id === item.id ? "is-selected" : ""}
                      >
                        <td>Backend session</td>
                        <td>{date(item.issuedAt)}</td>
                        <td>{date(item.lastActivityAt)}</td>
                        <td>
                          <WorkspaceBadge value={item.status} />
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() =>
                              setTarget({ kind: "session", id: item.id })
                            }
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
            {!rows?.length && (
              <WorkspaceState
                loading={detailLoading || students.loading}
                error={!!detailError}
                onRetry={() => setRevision((value) => value + 1)}
                title={
                  selectedStudent
                    ? `No ${tab} recorded`
                    : "Select a Student to inspect security"
                }
              />
            )}
          </div>
        </WorkspaceCard>
        <WorkspaceInspector
          title="Security actions"
          selected={!!selectedStudent}
        >
          {selectedStudent && (
            <>
              <section className="admin-inspector-section">
                <h3>{selectedStudent.displayName ?? "Student"}</h3>
                <WorkspaceBadge value={selectedStudent.status} />
                <p>{selectedStudent.platform.platformDisplayName}</p>
              </section>
              <WorkspaceFields
                fields={[
                  [
                    "Selected",
                    device?.deviceLabel ??
                      (session
                        ? "Backend session"
                        : "Choose a device or session"),
                  ],
                  ["Platform / browser", device?.deviceType ?? "Not provided"],
                  [
                    "First seen",
                    date(device?.firstSeenAt ?? session?.issuedAt),
                  ],
                  [
                    "Last activity",
                    date(device?.lastSeenAt ?? session?.lastActivityAt),
                  ],
                  [
                    "Expires",
                    session ? date(session.expiresAt) : "Not provided",
                  ],
                ]}
              />
              <div className="admin-workspace-actions">
                {device && (
                  <button
                    type="button"
                    disabled={
                      saving || preview || device.trustStatus === "revoked"
                    }
                    onClick={() => revoke("device", device.id, device.userId)}
                  >
                    Revoke device
                  </button>
                )}
                {session && (
                  <button
                    type="button"
                    disabled={saving || preview || session.status !== "active"}
                    onClick={() =>
                      revoke("session", session.id, session.userId)
                    }
                  >
                    Revoke session
                  </button>
                )}
                <button
                  type="button"
                  disabled
                  title="A bulk-session operation is not available in the current contract"
                >
                  Revoke all sessions · unavailable
                </button>
                {selectedStudent.status === "active" && (
                  <button
                    type="button"
                    disabled={saving || preview}
                    onClick={() => changeStatus("suspended")}
                  >
                    Suspend Student
                  </button>
                )}
                {selectedStudent.status === "suspended" && (
                  <button
                    type="button"
                    disabled={saving || preview}
                    onClick={() => changeStatus("active")}
                  >
                    Restore Student
                  </button>
                )}
              </div>
              <section className="admin-inspector-section">
                <h3>Device replacement / transfer</h3>
                <p>
                  Requests, approval, rejection, and replacement history are not
                  available in the current frontend contract. Registering
                  another device is not an automatic replacement.
                </p>
                <div className="admin-workspace-actions">
                  <button type="button" disabled>
                    Approve transfer
                  </button>
                  <button type="button" disabled>
                    Reject transfer
                  </button>
                  <button type="button" disabled>
                    Allow replacement
                  </button>
                </div>
              </section>
              <Link className="admin-inspector-link" to="/admin/students">
                Open Student profile →
              </Link>
            </>
          )}
        </WorkspaceInspector>
      </div>
      <AdminSideDrawer
        open={!!action}
        title={action?.title ?? "Confirm security action"}
        eyebrow="Security"
        dismissible={!saving}
        onClose={() => setAction(undefined)}
      >
        <form
          className="admin-workspace-form"
          onSubmit={(event) => {
            event.preventDefault();
            void confirmAction();
          }}
        >
          <p>
            <strong>Target:</strong> {action?.target}
          </p>
          <p>
            The action is enforced and recorded by the backend. Revocation
            blocks new authorizations; previously issued media URLs may remain
            valid until expiry.
          </p>
          <label>
            Reason
            <textarea
              required
              maxLength={500}
              value={reason}
              disabled={saving}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
          {actionError && <p role="alert">{actionError}</p>}
          <div className="admin-workspace-actions">
            <button
              type="button"
              disabled={saving}
              onClick={() => setAction(undefined)}
            >
              Cancel
            </button>
            <button type="submit" disabled={saving || !reason.trim()}>
              {saving ? "Saving…" : "Confirm action"}
            </button>
          </div>
        </form>
      </AdminSideDrawer>
    </section>
  );
}
