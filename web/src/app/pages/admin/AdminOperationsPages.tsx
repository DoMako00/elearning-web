import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Activity, BookOpen, CreditCard, FileText, FolderTree, KeyRound, Laptop, Search, ShieldCheck, UsersRound, Wallet, type LucideIcon } from "lucide-react";
import { createAdminApiFromEnvironment, getAdminDataSource, type AdminApi, type AdminBrandContext, type AdminContentTreeNode, type AdminPaymentListItem, type AdminSecurityEventItem, type AdminStudentListItem, type AdminPlatformContext, type AdminListResponse } from "../../../features/admin/api";
import { brandToPlatform } from "../../../features/admin/hooks/useAdminBrand";
import { WorkspaceBadge, WorkspaceCard, WorkspaceFields, WorkspaceInspector, WorkspaceMetric, WorkspaceState } from "../../../features/admin/components/AdminWorkspacePrimitives";
import { approveManualSubscriptionOrder, createAdminStudent, createManualSubscriptionOrder, listBrandCourses, listManualSubscriptionOrders, listManualSubscriptionPlans, rejectManualSubscriptionOrder, type BrandCourseOption, type ManualPlanCode, type ManualSubscriptionOrder, type ManualSubscriptionPlan } from "../../../features/admin/api/adminOperationsApi";

type ReadResult<T> = AdminListResponse<T> | { success: false };
type ListLoader<T> = (api: AdminApi, platform: AdminPlatformContext) => Promise<ReadResult<T>>;
const clientRequestId = () => typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `admin-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const request = (platform: AdminPlatformContext) => ({ platform, correlationId: clientRequestId(), pagination: { page: 1, pageSize: 50 } });
const readPayments: ListLoader<AdminPaymentListItem> = (api, platform) => api.listPayments(request(platform));
const readContent: ListLoader<AdminContentTreeNode> = (api, platform) => api.getContentTree(request(platform));
const readSecurity: ListLoader<AdminSecurityEventItem> = (api, platform) => api.listSecurityEvents(request(platform));
const date = (value?: string | null) => value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Unavailable";
const money = (amount: number, currency: string) => new Intl.NumberFormat("en", { style: "currency", currency }).format(amount);
const rowKey = (row: { id: string; platform: AdminPlatformContext }) => `${row.platform.platformCode}:${row.id}`;

function useWorkspaceRecords<T>(load: ListLoader<T>) {
  const { brand, availableBrands } = useOutletContext<{ brand?: AdminBrandContext; availableBrands: readonly AdminBrandContext[] }>();
  const api = useMemo(createAdminApiFromEnvironment, []);
  const [revision, setRevision] = useState(0);
  const scope = brand?.brandCode ?? "all";
  const [state, setState] = useState<{ scope: string; rows: readonly T[]; loading: boolean; error: boolean; total: number }>({ scope, rows: [], loading: true, error: false, total: 0 });
  useEffect(() => {
    let active = true;
    setState({ scope, rows: [], loading: true, error: false, total: 0 });
    const targets = brand ? [brand] : availableBrands;
    void Promise.all(targets.map((target) => load(api, brandToPlatform(target)))).then((responses) => {
      if (!active) return;
      // Never present partial brand results as a complete cross-brand total.
      if (!responses.length || responses.some((response) => !("data" in response))) {
        setState({ scope, rows: [], loading: false, error: true, total: 0 });
      } else {
        const lists = responses as AdminListResponse<T>[];
        setState({ scope, rows: lists.flatMap((response) => response.data), loading: false, error: false, total: lists.reduce((sum, response) => sum + response.pagination.totalItems, 0) });
      }
    }).catch(() => { if (active) setState({ scope, rows: [], loading: false, error: true, total: 0 }); });
    return () => { active = false; };
  }, [api, brand, availableBrands, scope, revision, load]);
  const current = state.scope === scope ? state : { scope, rows: [] as readonly T[], loading: true, error: false, total: 0 };
  return { ...current, preview: getAdminDataSource() === "mock", label: brand?.brandDisplayName ?? "All brands", retry: () => setRevision((value) => value + 1) };
}

function SourceLabel({ preview, label }: { preview: boolean; label: string }) {
  return <div className="admin-workspace-context"><span><ShieldCheck aria-hidden="true" />{label}</span><span className={preview ? "admin-workspace-preview" : "admin-workspace-readonly"}>{preview ? "Local preview data · not production" : "Read-only records"}</span></div>;
}
function Toolbar({ search, onSearch, statuses, status, onStatus, label }: { search: string; onSearch: (value: string) => void; statuses: readonly string[]; status: string; onStatus: (value: string) => void; label: string }) {
  return <div className="admin-workspace-toolbar"><label><Search aria-hidden="true" /><span className="admin-sr-only">Search {label}</span><input type="search" placeholder={`Search ${label}…`} value={search} onChange={(event) => onSearch(event.target.value)} /></label><select aria-label={`Filter ${label} by status`} value={status} onChange={(event) => onStatus(event.target.value)}><option value="all">All statuses</option>{statuses.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select><button type="button" disabled title="Export is not connected">Export</button></div>;
}
function Metrics({ values }: { values: readonly { title: string; value: string | number; icon: LucideIcon; note?: string }[] }) {
  return <div className="admin-workspace-metrics">{values.map((item) => <WorkspaceMetric key={item.title} {...item} note={item.note ?? "Within loaded records"} />)}</div>;
}

export function AdminPaymentsPage() {
  const data = useWorkspaceRecords(readPayments);
  const [search, setSearch] = useState(""); const [status, setStatus] = useState("all"); const [selectedId, setSelectedId] = useState("");
  const rows = data.rows.filter((row) => (status === "all" || row.status === status) && [row.method, row.platform.platformDisplayName, row.status].join(" ").toLowerCase().includes(search.toLowerCase()));
  const selected = rows.find((row) => rowKey(row) === selectedId);
  const count = (value: string) => data.loading || data.error ? "—" : data.rows.filter((row) => row.status === value).length;
  return <section className="admin-page admin-workspace-page" aria-label="Payments management"><SourceLabel {...data} /><Metrics values={[{ title: "Confirmed payments", value: count("confirmed"), icon: Wallet }, { title: "Pending review", value: count("pending_review"), icon: CreditCard }, { title: "Failed payments", value: count("failed"), icon: Activity }, { title: "Reversed payments", value: count("reversed"), icon: CreditCard }]} />
    <div className="admin-workspace-split"><WorkspaceCard title="Transactions" aside={<span className="admin-workspace-readonly">Payment records</span>}><Toolbar search={search} onSearch={setSearch} status={status} onStatus={setStatus} statuses={["confirmed", "pending_review", "initiated", "failed", "reversed"]} label="payments" />
      <div className="admin-workspace-table-wrap"><table className="admin-workspace-table"><caption className="admin-sr-only">Payment transactions</caption><thead><tr><th>Payment method</th><th>Brand</th><th>Amount</th><th>Status</th><th>Confirmed</th><th>Details</th></tr></thead><tbody>{rows.map((row) => <tr key={rowKey(row)} className={selected === row ? "is-selected" : ""}><td><span className="admin-workspace-cell"><CreditCard aria-hidden="true" />{row.method.replaceAll("_", " ")}</span></td><td>{row.platform.platformDisplayName}</td><td><strong>{money(row.amount, row.currency)}</strong></td><td><WorkspaceBadge value={row.status} /></td><td>{date(row.confirmedAt)}</td><td><button type="button" aria-label={`View ${row.platform.platformDisplayName} ${row.method} payment of ${money(row.amount, row.currency)}`} onClick={() => setSelectedId(rowKey(row))}>View</button></td></tr>)}</tbody></table></div>
      {!rows.length && <WorkspaceState {...data} title={search || status !== "all" ? "No matching payments" : "No payments yet"} onRetry={data.retry} />}<footer className="admin-workspace-table-footer">{data.error || data.loading ? "Totals unavailable" : `${rows.length} shown · ${data.total} records in this context`}</footer>
    </WorkspaceCard><WorkspaceInspector title="Payment details" selected={!!selected}>{selected && <><div className="admin-workspace-receipt"><CreditCard aria-hidden="true" /><small>Payment amount</small><strong>{money(selected.amount, selected.currency)}</strong><WorkspaceBadge value={selected.status} /></div><WorkspaceFields fields={[["Brand", selected.platform.platformDisplayName], ["Method", selected.method.replaceAll("_", " ")], ["Confirmed", date(selected.confirmedAt)], ["Receipt", "Unavailable"]]} /><div className="admin-workspace-actions"><button disabled type="button">Review payment</button><button disabled type="button">Download receipt</button><p>Payment review and receipt actions are not connected.</p></div></>}</WorkspaceInspector></div>
  </section>;
}

export function AdminSubscriptionsPage() {
  const { brand, availableBrands } = useOutletContext<{ brand?: AdminBrandContext; availableBrands: readonly AdminBrandContext[] }>();
  const api = useMemo(createAdminApiFromEnvironment, []);
  const activeBrand = brand ?? availableBrands.find((item) => item.brandCode === "elite") ?? availableBrands[0];
  const platform = activeBrand ? brandToPlatform(activeBrand) : undefined;
  const [plans, setPlans] = useState<readonly ManualSubscriptionPlan[]>([]);
  const [orders, setOrders] = useState<readonly ManualSubscriptionOrder[]>([]);
  const [students, setStudents] = useState<readonly AdminStudentListItem[]>([]);
  const [courses, setCourses] = useState<readonly BrandCourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [studentForm, setStudentForm] = useState({ fullName: "", email: "", password: "", studentCode: "", programLabel: "General subject programme" });
  const [orderForm, setOrderForm] = useState<{ studentProfileId: string; planCode: ManualPlanCode; courseIds: string[]; pricePerStudent: string; paymentMethod: "bank_transfer" | "cash" | "wallet" | "other"; paymentReference: string; paymentEvidenceNote: string }>({ studentProfileId: "", planCode: "oct10_four_subjects_individual", courseIds: [], pricePerStudent: "", paymentMethod: "bank_transfer", paymentReference: "", paymentEvidenceNote: "" });
  const selectedPlan = plans.find((plan) => plan.code === orderForm.planCode);

  useEffect(() => {
    let active = true;
    if (!platform || !activeBrand) return;
    setLoading(true);
    setError(null);
    void Promise.all([
      listManualSubscriptionPlans(),
      listManualSubscriptionOrders(),
      api.searchStudents({ ...request(platform), search: undefined }),
      listBrandCourses(activeBrand.brandId),
    ]).then(([planItems, orderItems, studentResponse, courseItems]) => {
      if (!active) return;
      setPlans(planItems);
      setOrders(orderItems);
      setStudents("data" in studentResponse ? studentResponse.data : []);
      setCourses(courseItems.filter((course) => course.status === "published"));
      setLoading(false);
    }).catch((cause) => {
      if (!active) return;
      setError(cause instanceof Error ? cause.message : "Admin subscription operations are unavailable.");
      setLoading(false);
    });
    return () => { active = false; };
  }, [api, platform, activeBrand, revision]);

  const refresh = () => setRevision((value) => value + 1);
  const pending = orders.filter((order) => order.status === "pending_review").length;
  const approved = orders.filter((order) => order.status === "approved").length;
  const revenue = orders.filter((order) => order.status === "approved").reduce((sum, order) => sum + order.pricePerStudent, 0);
  const toggleCourse = (courseId: string) => setOrderForm((current) => ({ ...current, courseIds: current.courseIds.includes(courseId) ? current.courseIds.filter((id) => id !== courseId) : [...current.courseIds, courseId] }));

  async function submitStudent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeBrand) return;
    setMessage(null); setError(null);
    try {
      const result = await createAdminStudent({ fullName: studentForm.fullName, email: studentForm.email, password: studentForm.password, brandCode: activeBrand.brandCode, academicInstitutionCode: activeBrand.brandCode === "nexus" ? "delta" : "buc", academicLevelNumber: 1, academicSemesterNumber: 1, ...(studentForm.studentCode.trim() ? { studentCode: studentForm.studentCode.trim() } : {}), ...(studentForm.programLabel.trim() ? { programLabel: studentForm.programLabel.trim() } : {}) });
      setMessage(`Student created: ${result.studentProfileId}`);
      setStudentForm({ fullName: "", email: "", password: "", studentCode: "", programLabel: "General subject programme" });
      refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Student creation failed."); }
  }

  async function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeBrand || !selectedPlan) return;
    setMessage(null); setError(null);
    try {
      const manualPrice = selectedPlan.requiresManualPrice ? Number(orderForm.pricePerStudent) : undefined;
      await createManualSubscriptionOrder({ studentProfileId: orderForm.studentProfileId, brandCode: activeBrand.brandCode, planCode: orderForm.planCode, courseIds: orderForm.courseIds, ...(manualPrice ? { pricePerStudent: manualPrice } : {}), paymentMethod: orderForm.paymentMethod, ...(orderForm.paymentReference.trim() ? { paymentReference: orderForm.paymentReference.trim() } : {}), ...(orderForm.paymentEvidenceNote.trim() ? { paymentEvidenceNote: orderForm.paymentEvidenceNote.trim() } : {}) });
      setMessage("Manual subscription order created. Approve it after matching the transfer evidence.");
      setOrderForm((current) => ({ ...current, courseIds: [], paymentReference: "", paymentEvidenceNote: "" }));
      refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Subscription order creation failed."); }
  }

  async function review(orderId: string, action: "approve" | "reject") {
    setMessage(null); setError(null);
    try {
      if (action === "approve") await approveManualSubscriptionOrder(orderId, "Manual payment evidence matched by Admin dashboard.");
      else await rejectManualSubscriptionOrder(orderId, "Manual payment evidence rejected by Admin dashboard.");
      setMessage(action === "approve" ? "Payment approved and selected courses enrolled." : "Payment request rejected.");
      refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Review action failed."); }
  }

  return <section className="admin-page admin-workspace-page" aria-label="Subscriptions management">
    <SourceLabel preview={false} label={activeBrand?.brandDisplayName ?? "Select a brand"} />
    <Metrics values={[{ title: "Pending approvals", value: loading ? "—" : pending, icon: Activity }, { title: "Approved orders", value: loading ? "—" : approved, icon: UsersRound }, { title: "Approved revenue", value: loading ? "—" : money(revenue, "EGP"), icon: Wallet }, { title: "Available subjects", value: loading ? "—" : courses.length, icon: BookOpen, note: "Published courses" }]} />
    {message && <div className="admin-workspace-inline-state"><ShieldCheck aria-hidden="true" /><div><h3>Done</h3><p>{message}</p></div></div>}
    {error && <div className="admin-workspace-inline-state"><Activity aria-hidden="true" /><div><h3>Action needed</h3><p>{error}</p><button type="button" onClick={refresh}>Retry</button></div></div>}
    <div className="admin-workspace-split"><div className="admin-workspace-stack">
      <WorkspaceCard title="Create student account" aside={<span className="admin-workspace-readonly">Server Auth + profile</span>}>
        <form className="admin-workspace-form" onSubmit={submitStudent}>
          <label>Full name<input required value={studentForm.fullName} onChange={(event) => setStudentForm((current) => ({ ...current, fullName: event.target.value }))} /></label>
          <label>Email<input required type="email" value={studentForm.email} onChange={(event) => setStudentForm((current) => ({ ...current, email: event.target.value }))} /></label>
          <label>Password<input required type="password" minLength={8} value={studentForm.password} onChange={(event) => setStudentForm((current) => ({ ...current, password: event.target.value }))} /></label>
          <label>Student code<input value={studentForm.studentCode} onChange={(event) => setStudentForm((current) => ({ ...current, studentCode: event.target.value }))} /></label>
          <label>Program label<input value={studentForm.programLabel} onChange={(event) => setStudentForm((current) => ({ ...current, programLabel: event.target.value }))} /></label>
          <p className="admin-workspace-note">Creates an Auth account plus {activeBrand?.brandDisplayName ?? "brand"} Level 1 / Semester 1 academic profile. Nexus uses Delta; Medway and Elite use BUC.</p>
          <button type="submit" disabled={!activeBrand || loading}>Create student</button>
        </form>
      </WorkspaceCard>

      <WorkspaceCard title="Create manual subscription order" aside={<span className="admin-workspace-readonly">External payment review</span>}>
        <form className="admin-workspace-form" onSubmit={submitOrder}>
          <label>Student<select required value={orderForm.studentProfileId} onChange={(event) => setOrderForm((current) => ({ ...current, studentProfileId: event.target.value }))}><option value="">Select student</option>{students.map((student) => <option key={student.id} value={student.id}>{student.displayName ?? student.emailMasked ?? student.id}</option>)}</select></label>
          <label>Plan<select value={orderForm.planCode} onChange={(event) => setOrderForm((current) => ({ ...current, planCode: event.target.value as ManualPlanCode, courseIds: [] }))}>{plans.map((plan) => <option key={plan.code} value={plan.code}>{plan.title}</option>)}</select></label>
          {selectedPlan?.requiresManualPrice && <label>Price per student<input required type="number" min={1} value={orderForm.pricePerStudent} onChange={(event) => setOrderForm((current) => ({ ...current, pricePerStudent: event.target.value }))} /></label>}
          <label>Payment method<select value={orderForm.paymentMethod} onChange={(event) => setOrderForm((current) => ({ ...current, paymentMethod: event.target.value as typeof current.paymentMethod }))}><option value="bank_transfer">Bank transfer</option><option value="wallet">Wallet</option><option value="cash">Cash</option><option value="other">Other</option></select></label>
          <label>Payment reference<input value={orderForm.paymentReference} onChange={(event) => setOrderForm((current) => ({ ...current, paymentReference: event.target.value }))} placeholder="Transfer/reference number" /></label>
          <label>Evidence note<textarea value={orderForm.paymentEvidenceNote} onChange={(event) => setOrderForm((current) => ({ ...current, paymentEvidenceNote: event.target.value }))} placeholder="WhatsApp/chat note. Do not paste secrets." /></label>
          <div className="admin-workspace-course-picker" aria-label="Select subscription subjects">{courses.map((course) => <label key={course.id}><input type="checkbox" checked={orderForm.courseIds.includes(course.id)} onChange={() => toggleCourse(course.id)} /> <span>{course.title}<small>{course.code}</small></span></label>)}</div>
          <p className="admin-workspace-note">Selected {orderForm.courseIds.length} / {selectedPlan?.subjectCount ?? 0} subject(s). Approval creates course enrollments; recommended subjects stay locked until approved.</p>
          <button type="submit" disabled={!orderForm.studentProfileId || !selectedPlan || orderForm.courseIds.length !== selectedPlan.subjectCount}>Create payment request</button>
        </form>
      </WorkspaceCard>
    </div>

    <WorkspaceCard title="Manual payment approvals" aside={<button type="button" onClick={refresh}>Refresh</button>}>
      <div className="admin-workspace-plans">{plans.map((plan) => <article key={plan.code}><span className="admin-workspace-metric__icon"><UsersRound aria-hidden="true" /></span><h3>{plan.title}</h3><strong>{plan.pricePerStudent ? money(plan.pricePerStudent, plan.currency) : "Manual price"}<small> per student</small></strong><p>{plan.description}</p><WorkspaceBadge value={`${plan.subjectCount} subject${plan.subjectCount === 1 ? "" : "s"}`} /></article>)}</div>
      <div className="admin-workspace-table-wrap"><table className="admin-workspace-table"><caption className="admin-sr-only">Manual subscription orders</caption><thead><tr><th>Student</th><th>Plan</th><th>Amount</th><th>Reference</th><th>Status</th><th>Actions</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><strong>{order.studentName}</strong><small>{order.studentEmail}</small></td><td>{order.planCode.replaceAll("_", " ")}</td><td>{money(order.pricePerStudent, "EGP")}</td><td>{order.paymentReference ?? "No reference"}</td><td><WorkspaceBadge value={order.status} /></td><td>{order.status === "pending_review" ? <span className="admin-workspace-actions-inline"><button type="button" onClick={() => void review(order.id, "approve")}>Approve</button><button type="button" onClick={() => void review(order.id, "reject")}>Reject</button></span> : date(order.reviewedAt)}</td></tr>)}</tbody></table></div>
      {!orders.length && <WorkspaceState loading={loading} error={Boolean(error)} title="No manual payment requests yet" onRetry={refresh} />}
    </WorkspaceCard></div>
  </section>;
}

function flattenContent(nodes: readonly AdminContentTreeNode[], depth = 0): { node: AdminContentTreeNode; depth: number }[] {
  return nodes.flatMap((node) => [{ node, depth }, ...flattenContent(node.children ?? [], depth + 1)]);
}
export function AdminContentPage() {
  const data = useWorkspaceRecords(readContent);
  const [search, setSearch] = useState(""); const [status, setStatus] = useState("all"); const [selectedId, setSelectedId] = useState("");
  const tree = useMemo(() => flattenContent(data.rows), [data.rows]);
  const rows = tree.filter(({ node }) => (status === "all" || node.status === status) && node.title.toLowerCase().includes(search.toLowerCase()));
  const selected = tree.find(({ node }) => rowKey(node) === selectedId)?.node;
  return <section className="admin-page admin-workspace-page" aria-label="Content management"><SourceLabel {...data} /><div className="admin-workspace-content">
    <WorkspaceCard title="Content library" className="admin-workspace-tree"><div className="admin-workspace-tree-label"><FolderTree aria-hidden="true" />Academic structure</div>{tree.length ? <nav aria-label="Content hierarchy">{tree.map(({ node, depth }) => <button type="button" key={rowKey(node)} className={selected === node ? "is-selected" : ""} style={{ paddingLeft: 12 + Math.min(depth, 5) * 12 }} onClick={() => setSelectedId(rowKey(node))}><BookOpen aria-hidden="true" /><span>{node.title}<small>{node.nodeType.replaceAll("_", " ")}</small></span></button>)}</nav> : <p className="admin-workspace-note">The content hierarchy will appear when records are available.</p>}</WorkspaceCard>
    <WorkspaceCard title="Learning content" aside={<span className="admin-workspace-readonly">Resources & lessons</span>}><Toolbar search={search} onSearch={setSearch} status={status} onStatus={setStatus} statuses={["draft", "published", "withdrawn", "archived"]} label="content" /><div className="admin-workspace-table-wrap"><table className="admin-workspace-table"><caption className="admin-sr-only">Learning content</caption><thead><tr><th>Title</th><th>Type</th><th>Brand</th><th>Status</th><th>Details</th></tr></thead><tbody>{rows.map(({ node }) => <tr key={rowKey(node)} className={selected === node ? "is-selected" : ""}><td><span className="admin-workspace-cell"><FileText aria-hidden="true" /><strong>{node.title}</strong></span></td><td>{node.nodeType.replaceAll("_", " ")}</td><td>{node.platform.platformDisplayName}</td><td><WorkspaceBadge value={node.status} /></td><td><button type="button" aria-label={`Inspect ${node.title}`} onClick={() => setSelectedId(rowKey(node))}>Inspect</button></td></tr>)}</tbody></table></div>{!rows.length && <WorkspaceState {...data} title={search || status !== "all" ? "No matching content" : "No learning content yet"} onRetry={data.retry} />}<div className="admin-workspace-upload"><FileText aria-hidden="true" /><strong>Add learning resources</strong><p>Upload is unavailable in this workspace.</p><button type="button" disabled>Upload resource</button></div></WorkspaceCard>
    <WorkspaceInspector title="Content inspector" selected={!!selected}>{selected && <><div className="admin-workspace-person"><FileText aria-hidden="true" /><h3>{selected.title}</h3><WorkspaceBadge value={selected.status} /></div><WorkspaceFields fields={[["Type", selected.nodeType.replaceAll("_", " ")], ["Brand", selected.platform.platformDisplayName], ["Code", selected.code], ["Sequence", selected.sequence], ["Child items", selected.children?.length ?? 0], ["Media", "Unavailable"]]} /><div className="admin-workspace-actions"><button type="button" disabled>Publish content</button><p>Publishing and file uploads are not connected.</p></div></>}</WorkspaceInspector>
    </div></section>;
}

export function AdminSecurityPage() {
  const data = useWorkspaceRecords(readSecurity);
  const [search, setSearch] = useState(""); const [status, setStatus] = useState("all"); const [selectedId, setSelectedId] = useState("");
  const rows = data.rows.filter((row) => (status === "all" || row.severity === status) && [row.eventType, row.platform.platformDisplayName].join(" ").toLowerCase().includes(search.toLowerCase()));
  const selected = rows.find((row) => rowKey(row) === selectedId);
  const count = (severity: string) => data.loading || data.error ? "—" : data.rows.filter((row) => row.severity === severity).length;
  return <section className="admin-page admin-workspace-page" aria-label="Security management"><SourceLabel {...data} /><Metrics values={[{ title: "Security events", value: data.loading || data.error ? "—" : data.rows.length, icon: ShieldCheck }, { title: "Warnings", value: count("warning"), icon: Activity }, { title: "Critical events", value: count("critical"), icon: KeyRound }, { title: "Active sessions", value: "—", icon: Laptop, note: "Session totals unavailable" }]} />
    <div className="admin-workspace-split"><div className="admin-workspace-stack"><WorkspaceCard title="Security activity" aside={<span className="admin-workspace-readonly">Event history</span>}><Toolbar search={search} onSearch={setSearch} status={status} onStatus={setStatus} statuses={["info", "warning", "critical"]} label="security events" /><div className="admin-workspace-table-wrap"><table className="admin-workspace-table"><caption className="admin-sr-only">Security events</caption><thead><tr><th>Event</th><th>Brand</th><th>Severity</th><th>Recorded</th><th>Details</th></tr></thead><tbody>{rows.map((row) => <tr key={rowKey(row)} className={selected === row ? "is-selected" : ""}><td><span className="admin-workspace-cell"><ShieldCheck aria-hidden="true" /><strong>{row.eventType.replaceAll("_", " ")}</strong></span></td><td>{row.platform.platformDisplayName}</td><td><WorkspaceBadge value={row.severity} /></td><td>{date(row.occurredAt)}</td><td><button type="button" aria-label={`View ${row.eventType} event for ${row.platform.platformDisplayName}`} onClick={() => setSelectedId(rowKey(row))}>View</button></td></tr>)}</tbody></table></div>{!rows.length && <WorkspaceState {...data} title={search || status !== "all" ? "No matching events" : "No security events yet"} onRetry={data.retry} />}</WorkspaceCard>
    <WorkspaceCard title="Devices & sessions"><div className="admin-workspace-table-wrap"><table className="admin-workspace-table"><caption className="admin-sr-only">Devices and sessions availability</caption><thead><tr><th>Device</th><th>Session</th><th>Last active</th><th>Status</th></tr></thead></table></div><div className="admin-workspace-inline-state"><Laptop aria-hidden="true" /><div><h3>Session inventory unavailable</h3><p>Review available account-level device and session information in Students.</p><a href="/admin/students">Open Students →</a></div></div></WorkspaceCard></div>
    <div className="admin-workspace-stack"><WorkspaceInspector title="Event details" selected={!!selected}>{selected && <WorkspaceFields fields={[["Event", selected.eventType.replaceAll("_", " ")], ["Brand", selected.platform.platformDisplayName], ["Severity", <WorkspaceBadge value={selected.severity} />], ["Recorded", date(selected.occurredAt)]]} />}</WorkspaceInspector><WorkspaceCard title="Security actions"><div className="admin-workspace-actions"><button type="button" disabled>Revoke sessions</button><button type="button" disabled>Reset account access</button><button type="button" disabled>Update security policy</button><p>These actions are unavailable here. No security changes can be made from this screen.</p></div></WorkspaceCard></div></div>
  </section>;
}

