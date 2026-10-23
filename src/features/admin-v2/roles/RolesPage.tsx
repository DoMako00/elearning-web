import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, BookOpen, CircleAlert, GraduationCap, ShieldCheck, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import { assignAdminRole, getAdminEffectiveRole, linkInstructorAccount, listAdminRoleAssignments } from "../api/adminRolesApi";
import { useAdminV2 } from "../layout/AdminV2Layout";

const roleTitle = (code: string, name?: string) => code === "platform_owner" ? "Super Admin" : code === "instructor" ? "Instructor" : name ?? code.replaceAll("_", " ");

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
    if (!target || !selectedRole || !reason.trim()) throw new Error("Choose a staff account and role, then explain the change.");
    return assignAdminRole(target.adminProfileId, { roleCode: selectedRole.code, expectedVersion: target.version, reason: reason.trim(), allowOwnerRoleChange });
  }, onSuccess: async () => { setReason(""); setAllowOwnerRoleChange(false); await Promise.all([client.invalidateQueries({ queryKey: ["admin", "role-assignments"] }), client.invalidateQueries({ queryKey: ["admin", "effective-role"] })]); } });
  const instructorAccounts = assignments.data?.items.filter(item => item.roleCodes.includes("instructor")) ?? [];
  const activeInstructorProfiles = data.instructors.filter(item => item.status === "Active");
  const currentRole = query.data?.roleCodes.includes("platform_owner") ? "Super Admin" : query.data?.roleCodes.includes("instructor") ? "Instructor" : query.data?.roleCodes.map(code => roleTitle(code)).join(", ") || "Role unavailable";
  const link = useMutation({ mutationFn: () => {
    if (!linkAdminProfileId || !linkInstructorId || !linkReason.trim()) throw new Error("Choose the Instructor login and matching doctor profile, then explain the link.");
    return linkInstructorAccount(linkInstructorId, linkAdminProfileId, linkReason.trim());
  }, onSuccess: async () => { setLinkReason(""); setLinkAdminProfileId(""); setLinkInstructorId(""); await client.invalidateQueries({ queryKey: ["admin", "role-assignments"] }); } });

  return <section className="admin-v2__page admin-v2__roles-page">
    <header className="admin-v2__page-header"><div><h1>Team access</h1><p>See what each team member does and connect a doctor to the courses they teach.</p></div></header>

    {query.isLoading && <p role="status" className="admin-v2__empty">Checking your account access…</p>}
    {query.isError && <p role="alert" className="admin-v2__inline-notice">{query.error instanceof Error ? query.error.message : "Your account access could not be loaded."} <button type="button" onClick={() => void query.refetch()}>Retry</button></p>}

    {query.data && <>
      <section className="admin-v2__roles-welcome">
        <div className="admin-v2__roles-welcome-icon"><ShieldCheck size={20} /></div>
        <div><span>YOUR SIGNED-IN ACCOUNT</span><h2>{currentRole}</h2><p>{query.data.roleCodes.includes("platform_owner") ? "You can manage the platform, accounts, courses, payments, and review queues." : "Your access is limited to the responsibilities assigned to your account."}</p></div>
        <Link to="/admin/instructor" className="admin-v2__button">Teaching overview <ArrowRight size={14} /></Link>
      </section>

      <section className="admin-v2__roles-card admin-v2__roles-purpose">
        <header><span><UsersRound size={18} /></span><div><h2>Who does what?</h2><p>Each person signs in with their own account.</p></div></header>
        <div className="admin-v2__roles-purpose-grid">
          <article><span className="admin-v2__roles-purpose-icon is-admin"><ShieldCheck size={18} /></span><div><h3>Super Admin</h3><p>Manages student and instructor access, courses, payments, platform settings, and lesson approval.</p><small>Platform-wide access</small></div></article>
          <article><span className="admin-v2__roles-purpose-icon is-instructor"><GraduationCap size={18} /></span><div><h3>Instructor</h3><p>Builds lessons for assigned courses, creates and publishes assignments and exams, and grades student work.</p><small>Assigned courses only</small></div></article>
        </div>
      </section>

      {canManage && assignments.data && instructorAccounts.length === 0 && <aside className="admin-v2__roles-setup-notice" role="status"><span><CircleAlert size={18} /></span><div><strong>No Instructor sign-in is connected yet</strong><p>The teaching area needs its own Instructor account. Keep your Super Admin sign-in as it is; once an Instructor account exists, connect it to the matching doctor profile and course here. This screen links existing accounts but does not create a login.</p></div><Link to="/admin/instructors">View doctor profiles <ArrowRight size={14} /></Link></aside>}

      <section className="admin-v2__roles-card admin-v2__roles-setup">
        <header><span><BookOpen size={18} /></span><div><h2>Prepare an Instructor to teach</h2><p>Course access needs an Instructor sign-in, a doctor profile, and an assigned course.</p></div><span className="admin-v2__roles-status">{assignments.isLoading ? "Checking…" : `${instructorAccounts.length} Instructor sign-ins`}</span></header>
        <ol className="admin-v2__roles-steps">
          <li><span>1</span><div><strong>Instructor sign-in</strong><small>{instructorAccounts.length ? "An Instructor account is available to connect." : "A separate Instructor account must be created first."}</small></div></li>
          <li><span>2</span><div><strong>Doctor profile</strong><small>{activeInstructorProfiles.length ? `${activeInstructorProfiles.length} active doctor profile${activeInstructorProfiles.length === 1 ? "" : "s"} in the directory.` : "Add the doctor to the Instructor directory."}</small></div></li>
          <li><span>3</span><div><strong>Course assignment</strong><small>Assign the doctor to a Brand and course so the teaching area shows the right work.</small></div></li>
        </ol>
        <div className="admin-v2__roles-setup-links"><Link to="/admin/instructors" className="admin-v2__button">Manage doctor profiles <ArrowRight size={14} /></Link><Link to="/admin/courses" className="admin-v2__button">Assign courses <ArrowRight size={14} /></Link></div>
      </section>

      {query.data.permissionCodes.length > 0 && <details className="admin-v2__roles-technical"><summary>Technical access details</summary><div><p>These system permissions control what the pages and API allow. They do not change the responsibilities shown above.</p><dl><dt>Active role</dt><dd>{query.data.roleCodes.map(code => roleTitle(code)).join(", ") || "None returned"}</dd><dt>Brand</dt><dd>{query.data.brand.name}</dd><dt>Permission names</dt><dd>{query.data.permissionCodes.join(", ")}</dd></dl></div></details>}
    </>}

    {canManage && (!assignments.data || assignments.isError || instructorAccounts.length > 0) && <section className="admin-v2__roles-admin-grid">
      <article className="admin-v2__roles-card admin-v2__roles-management">
        <header><span><ShieldCheck size={18} /></span><div><h2>Connect an Instructor sign-in</h2><p>Choose an existing Instructor account and the matching active doctor profile.</p></div></header>
        {assignments.isLoading && <p role="status" className="admin-v2__roles-feedback">Loading team accounts…</p>}
        {assignments.isError && <p role="alert" className="admin-v2__inline-notice">{assignments.error instanceof Error ? assignments.error.message : "Team accounts could not be loaded."} <button type="button" onClick={() => void assignments.refetch()}>Retry</button></p>}
        {assignments.data && <div className="admin-v2__roles-form-grid">
          <label className="admin-v2__field">Instructor sign-in<select value={linkAdminProfileId} onChange={event => setLinkAdminProfileId(event.target.value)} disabled={!instructorAccounts.length}><option value="">{instructorAccounts.length ? "Choose Instructor account" : "No Instructor accounts found"}</option>{instructorAccounts.map(item => <option key={item.adminProfileId} value={item.adminProfileId}>{item.displayName}</option>)}</select></label>
          <label className="admin-v2__field">Doctor profile<select value={linkInstructorId} onChange={event => setLinkInstructorId(event.target.value)} disabled={!activeInstructorProfiles.length}><option value="">{activeInstructorProfiles.length ? "Choose doctor profile" : "No active profiles found"}</option>{activeInstructorProfiles.map(item => <option key={item.id} value={item.id}>{item.fullName} · {item.email || "email not listed"}</option>)}</select></label>
          <label className="admin-v2__field is-wide">Why are you connecting them?<textarea rows={2} maxLength={500} value={linkReason} onChange={event => setLinkReason(event.target.value)} disabled={link.isPending} placeholder="For example: assigned to Anatomy Foundations" /></label>
          {link.isError && <p role="alert">{link.error instanceof Error ? link.error.message : "The Instructor sign-in could not be connected."}</p>}
          {link.isSuccess && <p role="status">Connected. Assign this doctor to an active Brand and course to enable the teaching workspace.</p>}
          <button type="button" className="admin-v2__button is-primary is-wide" disabled={!linkAdminProfileId || !linkInstructorId || !linkReason.trim() || link.isPending} onClick={() => link.mutate()}>{link.isPending ? "Connecting…" : "Connect Instructor account"}</button>
        </div>}
      </article>

      <details className="admin-v2__roles-advanced">
        <summary>Advanced: change a team account's main role</summary>
        <div className="admin-v2__roles-card">
          <p>Role changes replace the account's current role and are recorded. Do not change your own Super Admin role to open the Instructor workspace.</p>
          {assignments.data && <div className="admin-v2__roles-form-grid">
            <label className="admin-v2__field">Team account<select value={targetId} onChange={event => { setTargetId(event.target.value); setAllowOwnerRoleChange(false); }}><option value="">Choose an account</option>{assignments.data.items.map(item => <option key={item.adminProfileId} value={item.adminProfileId}>{item.displayName} · {item.roleCodes.map(code => roleTitle(code, assignments.data?.roles.find(role => role.code === code)?.name)).join(", ") || "No role"}</option>)}</select></label>
            <label className="admin-v2__field">Main responsibility<select value={roleCode} onChange={event => setRoleCode(event.target.value)}><option value="">Choose responsibility</option>{assignments.data.roles.map(role => <option key={role.id} value={role.code}>{roleTitle(role.code, role.name)}</option>)}</select></label>
            <label className="admin-v2__field is-wide">Why are you changing access?<textarea rows={2} maxLength={500} value={reason} onChange={event => setReason(event.target.value)} disabled={save.isPending} placeholder="Explain the change for the access history" /></label>
            {target?.roleCodes.includes("platform_owner") && roleCode !== "platform_owner" && <label className="admin-v2__field is-wide admin-v2__roles-confirm"><input type="checkbox" checked={allowOwnerRoleChange} onChange={event => setAllowOwnerRoleChange(event.target.checked)} disabled={save.isPending} /> I understand this removes Super Admin access from the selected account</label>}
            {save.isError && <p role="alert" className="admin-v2__inline-notice">{save.error instanceof Error ? save.error.message : "The role change failed."}</p>}
            {save.isSuccess && <p role="status" className="admin-v2__roles-feedback">Team responsibility updated and recorded.</p>}
            <button type="button" className="admin-v2__button is-primary is-wide" disabled={!target || !selectedRole || !reason.trim() || save.isPending || (target.roleCodes.includes("platform_owner") && roleCode !== "platform_owner" && !allowOwnerRoleChange)} onClick={() => save.mutate()}>{save.isPending ? "Saving…" : "Save responsibility"}</button>
          </div>}
        </div>
      </details>
    </section>}

    {query.data && !canManage && <p className="admin-v2__inline-notice">Your account can view this page. Only a Super Admin can connect Instructor accounts or change team access.</p>}
  </section>;
}

export default RolesPage;
