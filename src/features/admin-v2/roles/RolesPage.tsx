import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CircleAlert, ShieldCheck, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { assignAdminRole, getAdminEffectiveRole, linkInstructorAccount, listAdminRoleAssignments } from "../api/adminRolesApi";
import { useAdminV2 } from "../layout/AdminV2Layout";

export function RolesPage() {
  const { data } = useAdminV2();
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "effective-role"], queryFn: ({ signal }) => getAdminEffectiveRole(signal) });
  const canManage = query.data?.permissionCodes.includes("admin.roles.manage") === true;
  const assignments = useQuery({ queryKey: ["admin", "role-assignments"], queryFn: ({ signal }) => listAdminRoleAssignments(signal), enabled: canManage });
  const [targetId, setTargetId] = useState("");
  const [roleCode, setRoleCode] = useState("");
  const [reason, setReason] = useState("");
  const [allowOwnerRoleChange, setAllowOwnerRoleChange] = useState(false);
  const [linkAdminProfileId, setLinkAdminProfileId] = useState("");
  const [linkInstructorId, setLinkInstructorId] = useState("");
  const [linkReason, setLinkReason] = useState("");
  const target = useMemo(() => assignments.data?.items.find(item => item.adminProfileId === targetId) ?? null, [assignments.data, targetId]);
  const selectedRole = assignments.data?.roles.find(role => role.code === roleCode) ?? null;
  const save = useMutation({ mutationFn: () => {
    if (!target || !selectedRole || !reason.trim()) throw new Error("Choose an Admin and role, and enter an audit reason.");
    return assignAdminRole(target.adminProfileId, { roleCode: selectedRole.code, expectedVersion: target.version, reason: reason.trim(), allowOwnerRoleChange });
  }, onSuccess: async () => { setReason(""); setAllowOwnerRoleChange(false); await Promise.all([client.invalidateQueries({ queryKey: ["admin", "role-assignments"] }), client.invalidateQueries({ queryKey: ["admin", "effective-role"] })]); } });
  const instructorAccounts = assignments.data?.items.filter(item => item.roleCodes.includes("instructor")) ?? [];
  const link = useMutation({ mutationFn: () => {
    if (!linkAdminProfileId || !linkInstructorId || !linkReason.trim()) throw new Error("Choose an Instructor login, teaching profile, and audit reason.");
    return linkInstructorAccount(linkInstructorId, linkAdminProfileId, linkReason.trim());
  }, onSuccess: () => { setLinkReason(""); setLinkAdminProfileId(""); setLinkInstructorId(""); } });
  return <section className="admin-v2__page admin-v2__roles-page"><header className="admin-v2__page-header"><div><h1>Roles &amp; Permissions</h1><p>View persisted authority. Platform owners can replace an Admin’s active role with one audited role.</p></div></header>
    {query.isLoading && <p role="status" className="admin-v2__empty">Loading your Admin permissions…</p>}
    {query.isError && <p role="alert" className="admin-v2__inline-notice">{query.error instanceof Error ? query.error.message : "Admin permissions could not be loaded."} <button type="button" onClick={() => void query.refetch()}>Retry</button></p>}
    {canManage && assignments.data && instructorAccounts.length === 0 && <aside className="admin-v2__roles-setup-notice" role="status"><span><CircleAlert size={18} /></span><div><strong>No Instructor login is assigned yet</strong><p>The Instructor workspace requires a separate active Admin login. Provision that login, assign the Instructor role, then link it to the matching teaching profile and active Brand. Your Super Admin login stays in the platform workspace.</p></div><Link to="/admin/instructors">Review teaching profiles <ArrowRight size={14} /></Link></aside>}
    {query.data && <div className="admin-v2__roles-grid"><article className="admin-v2__roles-card"><header><span><ShieldCheck size={17} /></span><div><h2>Current authority</h2><p>Permissions returned for this signed-in session.</p></div></header><div className="admin-v2__roles-summary"><div><small>Current Brand</small><strong>{query.data.brand.name} <span>({query.data.brand.code})</span></strong></div><div><small>Assigned role</small><strong>{query.data.roleCodes.length ? query.data.roleCodes.join(", ") : "No role code returned"}</strong></div></div><h3>Effective permissions</h3>{query.data.permissionCodes.length ? <ul className="admin-v2__permission-list">{query.data.permissionCodes.map(code => <li key={code}>{code}</li>)}</ul> : <p className="admin-v2__empty-inline">No permissions were returned for this session.</p>}</article></div>}
    {canManage && <section className="admin-v2__roles-admin-grid"><article className="admin-v2__roles-card"><header><span><ShieldCheck size={17} /></span><div><h2>Admin role assignments</h2><p>Role changes are restricted to platform owners and recorded with an audit reason.</p></div></header>{assignments.isLoading && <p role="status" className="admin-v2__roles-feedback">Loading persisted Admin roles…</p>}{assignments.isError && <p role="alert" className="admin-v2__inline-notice">{assignments.error instanceof Error ? assignments.error.message : "Admin roles could not be loaded."} <button type="button" onClick={() => void assignments.refetch()}>Retry</button></p>}{assignments.data && <div className="admin-v2__roles-form-grid"><label className="admin-v2__field">Admin<select value={targetId} onChange={event => { setTargetId(event.target.value); setAllowOwnerRoleChange(false); }}><option value="">Choose Admin</option>{assignments.data.items.map(item => <option key={item.adminProfileId} value={item.adminProfileId}>{item.displayName} · {item.roleCodes.join(", ") || "No active role"}</option>)}</select></label><label className="admin-v2__field">Role<select value={roleCode} onChange={event => setRoleCode(event.target.value)}><option value="">Choose role</option>{assignments.data.roles.map(role => <option key={role.id} value={role.code}>{role.name} ({role.code})</option>)}</select></label><label className="admin-v2__field is-wide">Audit reason<textarea rows={2} maxLength={500} value={reason} onChange={event => setReason(event.target.value)} disabled={save.isPending} /></label>{target?.roleCodes.includes("platform_owner") && roleCode !== "platform_owner" && <label className="admin-v2__field is-wide admin-v2__roles-confirm"><input type="checkbox" checked={allowOwnerRoleChange} onChange={event => setAllowOwnerRoleChange(event.target.checked)} disabled={save.isPending} /> Confirm explicit platform-owner role change</label>}{save.isError && <p role="alert" className="admin-v2__inline-notice">{save.error instanceof Error ? save.error.message : "The role assignment failed."}</p>}{save.isSuccess && <p role="status" className="admin-v2__roles-feedback">Admin role saved and audited.</p>}<button type="button" className="admin-v2__button is-primary is-wide" disabled={!target || !selectedRole || !reason.trim() || save.isPending} onClick={() => save.mutate()}>{save.isPending ? "Saving…" : "Save role assignment"}</button></div>}
      <hr />
      <section className="admin-v2__roles-link-section"><header><span><UserRound size={17} /></span><div><h2>Link Instructor login</h2><p>Choose an existing Instructor login and its teaching profile. Both must share an active Brand.</p></div></header>{assignments.data && <div className="admin-v2__roles-form-grid">
        <label className="admin-v2__field">Instructor login<select value={linkAdminProfileId} onChange={event => setLinkAdminProfileId(event.target.value)}><option value="">Choose Instructor login</option>{instructorAccounts.map(item => <option key={item.adminProfileId} value={item.adminProfileId}>{item.displayName}</option>)}</select></label>
        <label className="admin-v2__field">Teaching profile<select value={linkInstructorId} onChange={event => setLinkInstructorId(event.target.value)}><option value="">Choose Instructor profile</option>{data.instructors.filter(item => item.status === "Active").map(item => <option key={item.id} value={item.id}>{item.fullName} · {item.email}</option>)}</select></label>
        <label className="admin-v2__field is-wide">Audit reason<textarea rows={2} maxLength={500} value={linkReason} onChange={event => setLinkReason(event.target.value)} disabled={link.isPending} /></label>
        {link.isError && <p role="alert">{link.error instanceof Error ? link.error.message : "Instructor login could not be linked."}</p>}
        {link.isSuccess && <p role="status">Instructor login linked. The account must also have active course assignments to access course data.</p>}
        <button type="button" className="admin-v2__button is-primary is-wide" disabled={!linkAdminProfileId || !linkInstructorId || !linkReason.trim() || link.isPending} onClick={() => link.mutate()}>{link.isPending ? "Linking…" : "Link login"}</button>
      </div>}</section>
      </article><aside className="admin-v2__roles-card admin-v2__roles-directory"><header><span><ShieldCheck size={17} /></span><div><h2>Role directory</h2><p>Available persisted Admin roles.</p></div></header>{assignments.data?.roles.map(role => <div className="admin-v2__role-row" key={role.id}><strong>{role.name}</strong><code>{role.code}</code></div>)}</aside></section>}
    {query.data && !canManage && <p className="admin-v2__inline-notice">Your current role is read-only here. Role assignment is available only to the persisted platform owner.</p>}
  </section>;
}
export default RolesPage;
