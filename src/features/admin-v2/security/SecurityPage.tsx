import { useMemo, useState, type ComponentType } from "react";
import { Activity, CircleAlert, Download, Laptop, LockKeyhole, Monitor, RotateCcw, Search, ShieldAlert, Smartphone, Tablet, UserRound, Users, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AdminV2DomainStatus, useAdminV2 } from "../layout/AdminV2Layout";
import { BrandBadge, ConfirmDialog, Drawer, StatusBadge } from "../shared/AdminV2Primitives";
import { Pagination } from "../shared/AdminV2Table";
import { relativeTime } from "../data/adminV2.audit";
import type { AuditEvent, DeviceType } from "../types/adminV2.types";
import { authorizeAdminStudentDeviceReplacement, revokeAdminStudentDevice, revokeAdminStudentSessions, setAdminStudentStatus } from "../api/adminStudentsApi";
import "./security.css";

const AUDIT_PAGE_SIZE = 10;
type Tab = "devices" | "audit" | "flagged";

/* Device timestamps arrive as "2026-10-21 11:57:03.31195+00"; make them readable. */
const formatSeen = (value: string) => {
  const parsed = Date.parse(value.replace(" ", "T").replace(/(\.\d{3})\d+/, "$1").replace(/([+-]\d{2})$/, "$1:00"));
  return Number.isFinite(parsed) ? new Date(parsed).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : value;
};

export function SecurityPage() {
  const { data, brand, refreshServerDomains, domainError } = useAdminV2();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("devices");
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [confirm, setConfirm] = useState<{ title: string; detail: string; confirmLabel: string; run: () => void } | null>(null);
  const [notice, setNotice] = useState("");
  const [securityActionPending, setSecurityActionPending] = useState(false);
  const [auditQuery, setAuditQuery] = useState("");
  const [auditStatus, setAuditStatus] = useState<"all" | AuditEvent["status"]>("all");
  const [auditPage, setAuditPage] = useState(1);
  const [auditDetail, setAuditDetail] = useState<AuditEvent | null>(null);
  const scopedStudents = useMemo(() => data.students.filter((student) => brand === "all" || student.brand === brand), [brand, data.students]);
  const studentIds = useMemo(() => new Set(scopedStudents.map((student) => student.id)), [scopedStudents]);
  const devices = useMemo(() => data.devices.filter((device) => studentIds.has(device.studentId)), [data.devices, studentIds]);
  const sessions = useMemo(() => data.sessions.filter((session) => studentIds.has(session.studentId)), [data.sessions, studentIds]);
  const selectedDevice = devices.find((device) => device.id === selectedDeviceId) ?? devices[0];
  const selectedStudent = scopedStudents.find((student) => student.id === (studentId || selectedDevice?.studentId));
  const allEvents = data.auditEvents;
  const flaggedEvents = allEvents.filter((event) => event.status === "Warning" || event.status === "Critical");
  const filteredEvents = allEvents.filter((event) => {
    const query = auditQuery.trim().toLowerCase();
    return (auditStatus === "all" || event.status === auditStatus) && (!query || `${event.action} ${event.targetLabel} ${event.actor}`.toLowerCase().includes(query));
  });
  const auditPageCount = Math.max(1, Math.ceil(filteredEvents.length / AUDIT_PAGE_SIZE));
  const visibleEvents = filteredEvents.slice((auditPage - 1) * AUDIT_PAGE_SIZE, auditPage * AUDIT_PAGE_SIZE);
  const activeSessions = sessions.filter((session) => session.status === "Active").length;
  const deviceActions = new Set([...allEvents.filter((event) => event.targetType === "Device" && /device (replaced|revoked)/i.test(event.action)).map((event) => event.targetId), ...devices.filter((device) => device.status === "Revoked").map((device) => device.id)]).size;
  const lockedAccounts = scopedStudents.filter((student) => student.status === "Suspended").length;
  const deviceActive = selectedDevice?.status === "Active";

  const restoreStudent = (targetId: string) => { const student = scopedStudents.find((item) => item.id === targetId); if (!student || student.status !== "Suspended") return; setConfirm({ title: "Restore this account?", detail: `${student.fullName} will be restored through the Admin Student API.`, confirmLabel: "Restore account", run: () => { void setAdminStudentStatus(targetId, "active", "Restored from Security page").then(() => { setConfirm(null); setNotice("Student account restored."); refreshServerDomains(); }).catch((error: unknown) => { setConfirm(null); setNotice(error instanceof Error ? error.message : "The account could not be restored."); }); } }); };
  const confirmSecurityAction = (action: "sessions" | "device" | "replacement") => {
    if (!selectedStudent || securityActionPending) return;
    if (action !== "sessions" && !selectedDevice) return;
    const titles = { sessions: "Revoke all Student sessions?", device: "Revoke this Student device?", replacement: "Authorize one device replacement?" };
    const details = { sessions: `All active sessions for ${selectedStudent.fullName} will be ended.`, device: `${selectedDevice?.name ?? "This device"} and its active sessions will be revoked.`, replacement: `A one-use replacement exception will be authorized for ${selectedStudent.fullName}'s selected device and will expire in 15 minutes.` };
    const labels = { sessions: "Revoke sessions", device: "Revoke device", replacement: "Authorize replacement" };
    setConfirm({ title: titles[action], detail: details[action], confirmLabel: labels[action], run: () => { if (securityActionPending) return; setSecurityActionPending(true); void (async () => { try {
      if (action === "sessions") await revokeAdminStudentSessions(selectedStudent.brand, selectedStudent.id, "All active Student sessions revoked by an authorized Admin from Security.");
      else if (action === "device") await revokeAdminStudentDevice(selectedStudent.brand, selectedStudent.id, selectedDevice!.id, "Student device revoked by an authorized Admin from Security.");
      else { const expiresAt = new Date(Date.now() + 15 * 60_000).toISOString(); await authorizeAdminStudentDeviceReplacement(selectedStudent.brand, selectedStudent.id, selectedDevice!.id, "One-use device replacement authorized by an Admin from Security.", expiresAt); }
      setConfirm(null); setNotice(action === "sessions" ? "Student sessions revoked." : action === "device" ? "Student device and its active sessions revoked." : "One-use replacement authorization created."); refreshServerDomains();
    } catch (error) { setConfirm(null); setNotice(error instanceof Error ? error.message : "The security action could not be completed."); } finally { setSecurityActionPending(false); } })(); } });
  };
  const exportAudit = () => { const header = "Actor,Action,Target,Status,Timestamp\n"; const body = allEvents.map((event) => [event.actor, event.action, event.targetLabel, event.status, event.timestamp].map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\n"); const blob = new Blob([header + body], { type: "text/csv" }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "greenlearn-security-audit.csv"; link.click(); URL.revokeObjectURL(link.href); setNotice("Audit log exported."); };

  const actions: Array<{ key: string; icon: ComponentType<{ size?: number }>; title: string; detail: string; danger?: boolean; disabled: boolean; reason?: string; run: () => void }> = [
    { key: "sessions", icon: RotateCcw, title: "Revoke sessions", detail: "End every active sign-in for this student", disabled: !selectedStudent || securityActionPending, reason: "Select a device first", run: () => confirmSecurityAction("sessions") },
    { key: "device", icon: ShieldAlert, title: "Revoke device", detail: "Block this device and end its sessions", danger: true, disabled: !selectedStudent || !deviceActive || securityActionPending, reason: deviceActive ? "Select a device first" : "This device is not active", run: () => confirmSecurityAction("device") },
    { key: "replacement", icon: Monitor, title: "Allow replacement", detail: "One-use exception, expires in 15 minutes", disabled: !selectedStudent || !deviceActive || securityActionPending, reason: deviceActive ? "Select a device first" : "This device is not active", run: () => confirmSecurityAction("replacement") },
    { key: "restore", icon: UserRound, title: "Restore account", detail: "Re-enable a suspended student", disabled: !selectedStudent || selectedStudent.status !== "Suspended", reason: selectedStudent ? "This account is not suspended" : "Select a device first", run: () => selectedStudent && restoreStudent(selectedStudent.id) },
  ];

  return <section className="admin-v2__page sec-v2" aria-label="Security">
    {domainError && <AdminV2DomainStatus />}
    <div className="sec-v2__kpis" data-admin-guide-target="security-kpis">
      <Kpi icon={Users} label="Active sessions" value={activeSessions} note="Signed in right now" />
      <Kpi icon={ShieldAlert} label="Flagged events" value={flaggedEvents.length} note="Warnings and critical events" />
      <Kpi icon={RotateCcw} label="Device resets" value={deviceActions} note="Revoked or replaced devices" />
      <Kpi icon={LockKeyhole} label="Suspended accounts" value={lockedAccounts} note="Currently suspended" />
    </div>

    <div className="sec-v2__grid">
      <section className="sec-v2__card sec-v2__main" data-admin-guide-target="security-main">
        <header>
          <div className="sec-v2__tabs" role="tablist" data-admin-guide-target="security-tabs">
            <button type="button" role="tab" aria-selected={tab === "devices"} className={tab === "devices" ? "is-active" : ""} onClick={() => setTab("devices")}>Devices <em>{devices.length}</em></button>
            <button type="button" role="tab" aria-selected={tab === "audit"} className={tab === "audit" ? "is-active" : ""} onClick={() => setTab("audit")}>Audit log <em>{allEvents.length}</em></button>
            <button type="button" role="tab" aria-selected={tab === "flagged"} className={tab === "flagged" ? "is-active" : ""} onClick={() => setTab("flagged")}>Flagged <em className={flaggedEvents.length ? "is-alert" : ""}>{flaggedEvents.length}</em></button>
          </div>
          {tab === "audit" && <div className="sec-v2__tools">
            <label className="sec-v2__search"><Search size={15} /><input value={auditQuery} onChange={(event) => { setAuditQuery(event.target.value); setAuditPage(1); }} placeholder="Search audit log" aria-label="Search audit log" /></label>
            <select value={auditStatus} onChange={(event) => { setAuditStatus(event.target.value as typeof auditStatus); setAuditPage(1); }} aria-label="Audit status"><option value="all">All statuses</option><option value="Info">Info</option><option value="Success">Success</option><option value="Warning">Warning</option><option value="Critical">Critical</option></select>
            <button type="button" className="sec-v2__button" onClick={exportAudit} disabled={!allEvents.length}><Download size={15} /> Export</button>
          </div>}
          {tab === "devices" && <p className="sec-v2__hint">Select a device to act on it.</p>}
        </header>

        {tab === "devices" && <div className="sec-v2__scroll">
          <table className="sec-v2__table">
            <thead><tr><th>Device</th><th>Student</th><th>Platform</th><th>Last seen</th><th>Status</th><th /></tr></thead>
            <tbody>{devices.map((device) => { const student = scopedStudents.find((item) => item.id === device.studentId); return <tr key={device.id} className={selectedDevice?.id === device.id ? "is-selected" : ""} onClick={() => { setSelectedDeviceId(device.id); setStudentId(device.studentId); }}>
              <td><span className="sec-v2__device"><DeviceIcon type={device.type} /><b>{device.category}<small title={device.id}>{device.name} · {device.id.slice(-6)}</small></b></span></td>
              <td><strong>{student?.fullName ?? "Unknown student"}</strong><small>{student?.email || "No email"}</small></td>
              <td><strong>{device.platform}</strong><small>{device.browser}</small></td>
              <td>{formatSeen(device.lastSeen)}</td>
              <td><StatusBadge status={device.status} /></td>
              <td><button type="button" className="sec-v2__row-action" onClick={(event) => { event.stopPropagation(); if (student) navigate(`/admin/students?student=${student.id}`); }}>Open student</button></td>
            </tr>; })}</tbody>
          </table>
          {!devices.length && <Empty icon={Laptop} title="No devices registered" detail="No student device records were returned." />}
        </div>}

        {tab === "audit" && <>
          <div className="sec-v2__scroll">
            <table className="sec-v2__table">
              <thead><tr><th>Actor</th><th>Action</th><th>Target</th><th>Time</th><th>Status</th><th /></tr></thead>
              <tbody>{visibleEvents.map((event) => <tr key={event.id} onClick={() => setAuditDetail(event)}>
                <td><span className="sec-v2__actor"><i>{event.actor.slice(0, 2).toUpperCase()}</i>{event.actor}</span></td>
                <td><strong>{event.action}</strong></td><td>{event.targetLabel}</td><td>{relativeTime(event.timestamp)}</td>
                <td><AuditStatus status={event.status} /></td>
                <td><button type="button" className="sec-v2__row-action" onClick={(clickEvent) => { clickEvent.stopPropagation(); setAuditDetail(event); }}>Details</button></td>
              </tr>)}</tbody>
            </table>
            {!filteredEvents.length && <Empty icon={Activity} title="No audit events match" detail="Try a different search or status." />}
          </div>
          <Pagination page={auditPage} pageCount={auditPageCount} total={filteredEvents.length} pageSize={AUDIT_PAGE_SIZE} onPageChange={setAuditPage} />
        </>}

        {tab === "flagged" && <div className="sec-v2__scroll">
          {flaggedEvents.length ? <ul className="sec-v2__flagged">{flaggedEvents.map((event) => <li key={event.id}><button type="button" onClick={() => setAuditDetail(event)}><span className={`is-${event.status.toLowerCase()}`}><CircleAlert size={16} /></span><div><strong>{event.action}</strong><small>{event.targetLabel} · {event.actor}</small></div><time>{relativeTime(event.timestamp)}</time></button></li>)}</ul>
            : <Empty icon={ShieldAlert} title="No flagged activity" detail="No warnings or critical events were returned." />}
        </div>}
      </section>

      <aside className="sec-v2__card sec-v2__actions" data-admin-guide-target="security-actions" aria-labelledby="sec-actions-title">
        <header><h2 id="sec-actions-title">Actions</h2></header>
        <div className="sec-v2__target">
          {selectedStudent ? <><span className="sec-v2__avatar">{selectedStudent.fullName.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
            <div><strong>{selectedStudent.fullName}</strong><small>{selectedDevice ? `${selectedDevice.category} · ${selectedDevice.platform} · ${selectedDevice.status}` : "No device selected"}</small></div><BrandBadge brand={selectedStudent.brand} /></>
            : <p>Select a device to choose a student.</p>}
        </div>
        <ul>{actions.map(({ key, icon: Icon, title, detail, danger, disabled, reason, run }) => <li key={key}><button type="button" className={danger ? "is-danger" : ""} disabled={disabled} title={disabled ? reason : undefined} onClick={run}><Icon size={17} /><b>{title}<small>{disabled && reason ? reason : detail}</small></b></button></li>)}</ul>
        <p className="sec-v2__policy">Each student can register one mobile and one other device. Revoking a device also ends its sessions, and every action is recorded in the audit log.</p>
      </aside>
    </div>

    {notice && <div className="sec-v2__notice" role="status"><span>{notice}</span><button type="button" aria-label="Dismiss notice" onClick={() => setNotice("")}><X size={14} /></button></div>}
    {confirm && <ConfirmDialog title={confirm.title} detail={confirm.detail} confirmLabel={confirm.confirmLabel} onCancel={() => setConfirm(null)} onConfirm={confirm.run} pending={securityActionPending} />}
    {auditDetail && <Drawer title="Audit event" subtitle={relativeTime(auditDetail.timestamp)} onClose={() => setAuditDetail(null)}>
      <dl className="sec-v2__detail">
        <dt>Action</dt><dd>{auditDetail.action}</dd>
        <dt>Actor</dt><dd>{auditDetail.actor}</dd>
        <dt>Target</dt><dd>{auditDetail.targetLabel}</dd>
        <dt>Target type</dt><dd>{auditDetail.targetType}</dd>
        <dt>Status</dt><dd><AuditStatus status={auditDetail.status} /></dd>
        <dt>Time</dt><dd>{new Date(auditDetail.timestamp).toLocaleString()}</dd>
        {auditDetail.metadata && <><dt>Details</dt><dd>{auditDetail.metadata}</dd></>}
        <dt>Event ID</dt><dd><code>{auditDetail.id}</code></dd>
      </dl>
    </Drawer>}
  </section>;
}

function Kpi({ icon: Icon, label, value, note }: { icon: ComponentType<{ size?: number }>; label: string; value: number; note: string }) { return <article className="sec-v2__kpi"><span><Icon size={20} /></span><div><small>{label}</small><strong>{value.toLocaleString()}</strong><em>{note}</em></div></article>; }
function Empty({ icon: Icon, title, detail }: { icon: ComponentType<{ size?: number }>; title: string; detail: string }) { return <div className="sec-v2__empty"><Icon size={22} /><strong>{title}</strong><span>{detail}</span></div>; }
function DeviceIcon({ type }: { type: DeviceType }) { return type === "Phone" ? <Smartphone size={17} /> : type === "Tablet" ? <Tablet size={17} /> : <Laptop size={17} />; }
function AuditStatus({ status }: { status: AuditEvent["status"] }) { return <span className={`sec-v2__status is-${status.toLowerCase()}`}><i />{status}</span>; }
