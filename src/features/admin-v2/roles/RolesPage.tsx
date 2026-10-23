import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  return <section className="admin-v2__page"><header className="admin-v2__page-header"><div><h1>Roles &amp; Permissions</h1><p>View persisted authority. Platform owners can replace an Admin’s active role with one audited role.</p></div></header>
    {query.isLoading && <p role="status" className="admin-v2__empty">Loading your Admin permissions…</p>}
    {query.isError && <p role="alert" className="admin-v2__inline-notice">{query.error instanceof Error ? query.error.message : "Admin permissions could not be loaded."} <button type="button" onClick={() => void query.refetch()}>Retry</button></p>}
    {query.data && <div className="admin-v2__roles-grid"><article className="admin-v2__inspector"><h2>Current Brand</h2><p>{query.data.brand.name} ({query.data.brand.code})</p><h2>Assigned Roles</h2>{query.data.roleCodes.length ? <ul>{query.data.roleCodes.map(code => <li key={code}>{code}</li>)}</ul> : <p>No role code was returned for this session.</p>}</article><article className="admin-v2__inspector"><h2>Effective Permissions</h2>{query.data.permissionCodes.length ? <ul>{query.data.permissionCodes.map(code => <li key={code}>{code}</li>)}</ul> : <p>No permissions were returned for this session.</p>}</article></div>}
    {canManage && <section className="admin-v2__workgrid has-inspector"><article className="admin-v2__inspector"><h2>Admin role assignments</h2><p>Role changes are restricted to platform owners and recorded with an audit reason.</p>{assignments.isLoading && <p role="status">Loading persisted Admin roles…</p>}{assignments.isError && <p role="alert">{assignments.error instanceof Error ? assignments.error.message : "Admin roles could not be loaded."} <button type="button" onClick={() => void assignments.refetch()}>Retry</button></p>}{assignments.data && <><label className="admin-v2__field">Admin<select value={targetId} onChange={event => { setTargetId(event.target.value); setAllowOwnerRoleChange(false); }}><option value="">Choose Admin</option>{assignments.data.items.map(item => <option key={item.adminProfileId} value={item.adminProfileId}>{item.displayName} · {item.roleCodes.join(", ") || "No active role"}</option>)}</select></label><label className="admin-v2__field">Role<select value={roleCode} onChange={event => setRoleCode(event.target.value)}><option value="">Choose role</option>{assignments.data.roles.map(role => <option key={role.id} value={role.code}>{role.name} ({role.code})</option>)}</select></label><label className="admin-v2__field">Audit reason<textarea rows={2} maxLength={500} value={reason} onChange={event => setReason(event.target.value)} disabled={save.isPending} /></label>{target?.roleCodes.includes("platform_owner") && roleCode !== "platform_owner" && <label className="admin-v2__field"><input type="checkbox" checked={allowOwnerRoleChange} onChange={event => setAllowOwnerRoleChange(event.target.checked)} disabled={save.isPending} /> Confirm explicit platform-owner role change</label>}{save.isError && <p role="alert">{save.error instanceof Error ? save.error.message : "The role assignment failed."}</p>}{save.isSuccess && <p role="status">Admin role saved and audited.</p>}<button type="button" className="admin-v2__button is-primary" disabled={!target || !selectedRole || !reason.trim() || save.isPending} onClick={() => save.mutate()}>{save.isPending ? "Saving…" : "Save role assignment"}</button></>}
      <hr />
      <h2>Link Instructor login</h2><p>Link an existing active Admin login with the Instructor teaching profile. The login must already have the Instructor role and share an active Brand with the teaching profile.</p>
      {assignments.data && <>
        <label className="admin-v2__field">Instructor login<select value={linkAdminProfileId} onChange={event => setLinkAdminProfileId(event.target.value)}><option value="">Choose Instructor login</option>{instructorAccounts.map(item => <option key={item.adminProfileId} value={item.adminProfileId}>{item.displayName}</option>)}</select></label>
        <label className="admin-v2__field">Teaching profile<select value={linkInstructorId} onChange={event => setLinkInstructorId(event.target.value)}><option value="">Choose Instructor profile</option>{data.instructors.filter(item => item.status === "Active").map(item => <option key={item.id} value={item.id}>{item.fullName} · {item.email}</option>)}</select></label>
        <label className="admin-v2__field">Audit reason<textarea rows={2} maxLength={500} value={linkReason} onChange={event => setLinkReason(event.target.value)} disabled={link.isPending} /></label>
        {link.isError && <p role="alert">{link.error instanceof Error ? link.error.message : "Instructor login could not be linked."}</p>}
        {link.isSuccess && <p role="status">Instructor login linked. The account must also have active course assignments to access course data.</p>}
        <button type="button" className="admin-v2__button is-primary" disabled={!linkAdminProfileId || !linkInstructorId || !linkReason.trim() || link.isPending} onClick={() => link.mutate()}>{link.isPending ? "Linking…" : "Link login"}</button>
      </>}
      </article><article className="admin-v2__inspector"><h2>Role directory</h2>{assignments.data?.roles.map(role => <p key={role.id}><strong>{role.name}</strong><br /><small>{role.code}</small></p>)}</article></section>}
    {query.data && !canManage && <p className="admin-v2__inline-notice">Your current role is read-only here. Role assignment is available only to the persisted platform owner.</p>}
  </section>;
}
export default RolesPage;
