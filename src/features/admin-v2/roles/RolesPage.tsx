import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, BookOpen, ChevronDown, CircleAlert, GraduationCap, KeyRound, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { assignAdminRole, getAdminEffectiveRole, linkInstructorAccount, listAdminRoleAssignments } from "../api/adminRolesApi";
import { useAdminV2 } from "../layout/AdminV2Layout";
import "./roles.css";

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
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
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

  const signInStatus = assignments.isLoading ? "Checking…" : canManage ? `${instructorAccounts.length} connected` : "Super Admin only";
  const ownerRoleLoss = Boolean(target?.roleCodes.includes("platform_owner") && roleCode !== "platform_owner");

  return <section className="admin-v2__page roles-v2" aria-label="Roles and permissions">
    {query.isLoading && <p role="status" className="roles-v2__notice">Checking your account access…</p>}
    {query.isError && <p role="alert" className="roles-v2__notice is-error">{query.error instanceof Error ? query.error.message : "Your account access could not be loaded."} <button type="button" onClick={() => void query.refetch()}>Retry</button></p>}

    {query.data && <div className="roles-v2__grid">
      <div className="roles-v2__col">
        <section data-admin-guide-target="roles-setup" className="roles-v2__card roles-v2__setup" aria-labelledby="roles-setup-title">
          <header><span className="roles-v2__icon"><BookOpen size={18} /></span><div><h2 id="roles-setup-title">Prepare an Instructor to teach</h2><p>An Instructor needs a sign-in, a doctor profile and a course.</p></div></header>
          <ol>
            <li><span>1</span><div><strong>Instructor sign-in</strong><small>{!canManage ? "Managed by a Super Admin." : instructorAccounts.length ? `${instructorAccounts.length} account${instructorAccounts.length === 1 ? "" : "s"} available to connect.` : "Create a separate Instructor account first."}</small></div></li>
            <li><span>2</span><div><strong>Doctor profile</strong><small>{activeInstructorProfiles.length ? `${activeInstructorProfiles.length} active profile${activeInstructorProfiles.length === 1 ? "" : "s"} in the directory.` : "Add the doctor to the directory."}</small></div></li>
            <li><span>3</span><div><strong>Course assignment</strong><small>Assign the doctor to a brand and course.</small></div></li>
          </ol>
          <div className="roles-v2__actions"><Link to="/admin/instructors">Manage doctor profiles <ArrowRight size={14} /></Link><Link to="/admin/courses">Assign courses <ArrowRight size={14} /></Link></div>
        </section>

        {canManage && <section data-admin-guide-target="roles-connect" className="roles-v2__card roles-v2__connect" aria-labelledby="roles-connect-title">
          <header><span className="roles-v2__icon"><KeyRound size={18} /></span><div><h2 id="roles-connect-title">Connect an Instructor sign-in</h2><p>Link an Instructor account to its doctor profile.</p></div><em>{signInStatus}</em></header>
          {assignments.isLoading && <p role="status" className="roles-v2__muted">Loading team accounts…</p>}
          {assignments.isError && <p role="alert" className="roles-v2__notice is-error">{assignments.error instanceof Error ? assignments.error.message : "Team accounts could not be loaded."} <button type="button" onClick={() => void assignments.refetch()}>Retry</button></p>}
          {assignments.data && instructorAccounts.length === 0 && <div className="roles-v2__empty" role="status"><CircleAlert size={20} /><strong>No Instructor sign-in yet</strong><span>The teaching area needs its own Instructor account. Keep your Super Admin sign-in as it is. This screen links existing accounts; it does not create a login.</span><Link to="/admin/instructors">View doctor profiles <ArrowRight size={14} /></Link></div>}
          {assignments.data && instructorAccounts.length > 0 && <form className="roles-v2__form" onSubmit={event => { event.preventDefault(); if (linkAdminProfileId && linkInstructorId && linkReason.trim() && !link.isPending) link.mutate(); }}>
            <label className="roles-v2__field"><span>Instructor sign-in</span><select value={linkAdminProfileId} onChange={event => setLinkAdminProfileId(event.target.value)}><option value="">Choose Instructor account</option>{instructorAccounts.map(item => <option key={item.adminProfileId} value={item.adminProfileId}>{item.displayName}</option>)}</select></label>
            <label className="roles-v2__field"><span>Doctor profile</span><select value={linkInstructorId} onChange={event => setLinkInstructorId(event.target.value)} disabled={!activeInstructorProfiles.length}><option value="">{activeInstructorProfiles.length ? "Choose doctor profile" : "No active profiles found"}</option>{activeInstructorProfiles.map(item => <option key={item.id} value={item.id}>{item.fullName} · {item.email || "email not listed"}</option>)}</select></label>
            <label className="roles-v2__field is-wide"><span>Why are you connecting them?</span><textarea rows={2} maxLength={500} value={linkReason} onChange={event => setLinkReason(event.target.value)} disabled={link.isPending} placeholder="For example: assigned to Anatomy Foundations" /></label>
            {link.isError && <p role="alert" className="roles-v2__feedback is-error">{link.error instanceof Error ? link.error.message : "The Instructor sign-in could not be connected."}</p>}
            {link.isSuccess && <p role="status" className="roles-v2__feedback">Connected. Assign this doctor to an active brand and course to enable the teaching workspace.</p>}
            <button type="submit" className="roles-v2__primary" disabled={!linkAdminProfileId || !linkInstructorId || !linkReason.trim() || link.isPending}>{link.isPending ? "Connecting…" : "Connect Instructor account"}</button>
          </form>}
        </section>}
      </div>

      <div className="roles-v2__col">
        <section data-admin-guide-target="roles-account" className="roles-v2__card roles-v2__account" aria-labelledby="roles-account-title">
          <header><span className="roles-v2__icon"><ShieldCheck size={18} /></span><div><small>YOUR SIGNED-IN ACCOUNT</small><h2 id="roles-account-title">{currentRole}</h2></div><Link to="/admin/instructor" className="roles-v2__ghost">Teaching overview <ArrowRight size={14} /></Link></header>
          <p>{query.data.roleCodes.includes("platform_owner") ? "You can manage the platform, accounts, courses, payments and review queues." : "Your access is limited to the responsibilities assigned to your account."}</p>
          {!canManage && <p className="roles-v2__muted">You can view this page. Only a Super Admin can connect Instructor accounts or change team access.</p>}
          {query.data.permissionCodes.length > 0 && <>
            <button type="button" className="roles-v2__toggle" aria-expanded={permissionsOpen} onClick={() => setPermissionsOpen(open => !open)}>Technical access details <ChevronDown size={15} /></button>
            {permissionsOpen && <dl className="roles-v2__permissions"><dt>Active role</dt><dd>{query.data.roleCodes.map(code => roleTitle(code)).join(", ") || "None returned"}</dd><dt>Brand</dt><dd>{query.data.brand.name}</dd><dt>Permissions</dt><dd>{query.data.permissionCodes.map(code => <code key={code}>{code}</code>)}</dd></dl>}
          </>}
        </section>

        <section data-admin-guide-target="roles-roles" className="roles-v2__card roles-v2__roles" aria-labelledby="roles-roles-title">
          <header><div><h2 id="roles-roles-title">Who does what</h2><p>Each person signs in with their own account.</p></div></header>
          <ul>
            <li><span className="roles-v2__icon is-admin"><ShieldCheck size={17} /></span><div><strong>Super Admin <em>Platform-wide</em></strong><small>Manages access, courses, payments, platform settings and lesson approval.</small></div></li>
            <li><span className="roles-v2__icon"><GraduationCap size={17} /></span><div><strong>Instructor <em>Assigned courses only</em></strong><small>Builds lessons, publishes assignments and exams, and grades student work.</small></div></li>
          </ul>
        </section>

        {canManage && <section data-admin-guide-target="roles-advanced" className="roles-v2__card roles-v2__advanced">
          <button type="button" className="roles-v2__toggle is-title" aria-expanded={advancedOpen} onClick={() => setAdvancedOpen(open => !open)}><span>Advanced: change a team account's main role</span><ChevronDown size={16} /></button>
          {advancedOpen && <div className="roles-v2__advanced-body">
            <p>Role changes replace the account's current role and are recorded. Do not change your own Super Admin role to open the Instructor workspace.</p>
            {assignments.data && <form className="roles-v2__form" onSubmit={event => { event.preventDefault(); if (target && selectedRole && reason.trim() && !save.isPending && (!ownerRoleLoss || allowOwnerRoleChange)) save.mutate(); }}>
              <label className="roles-v2__field"><span>Team account</span><select value={targetId} onChange={event => { setTargetId(event.target.value); setAllowOwnerRoleChange(false); }}><option value="">Choose an account</option>{assignments.data.items.map(item => <option key={item.adminProfileId} value={item.adminProfileId}>{item.displayName} · {item.roleCodes.map(code => roleTitle(code, assignments.data?.roles.find(role => role.code === code)?.name)).join(", ") || "No role"}</option>)}</select></label>
              <label className="roles-v2__field"><span>Main responsibility</span><select value={roleCode} onChange={event => setRoleCode(event.target.value)}><option value="">Choose responsibility</option>{assignments.data.roles.map(role => <option key={role.id} value={role.code}>{roleTitle(role.code, role.name)}</option>)}</select></label>
              <label className="roles-v2__field is-wide"><span>Why are you changing access?</span><textarea rows={2} maxLength={500} value={reason} onChange={event => setReason(event.target.value)} disabled={save.isPending} placeholder="Explain the change for the access history" /></label>
              {ownerRoleLoss && <label className="roles-v2__confirm"><input type="checkbox" checked={allowOwnerRoleChange} onChange={event => setAllowOwnerRoleChange(event.target.checked)} disabled={save.isPending} /> I understand this removes Super Admin access from the selected account</label>}
              {save.isError && <p role="alert" className="roles-v2__feedback is-error">{save.error instanceof Error ? save.error.message : "The role change failed."}</p>}
              {save.isSuccess && <p role="status" className="roles-v2__feedback">Team responsibility updated and recorded.</p>}
              <button type="submit" className="roles-v2__primary" disabled={!target || !selectedRole || !reason.trim() || save.isPending || (ownerRoleLoss && !allowOwnerRoleChange)}>{save.isPending ? "Saving…" : "Save responsibility"}</button>
            </form>}
            {!assignments.data && <p className="roles-v2__muted">{assignments.isLoading ? "Loading team accounts…" : "Team accounts are unavailable right now."}</p>}
          </div>}
        </section>}
      </div>
    </div>}
  </section>;
}

export default RolesPage;
