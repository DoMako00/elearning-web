import { Bell, BookOpen, ChevronDown, Crown, GraduationCap, LayoutDashboard, LibraryBig, Search, ShieldCheck, CreditCard, Files, UserRound, CalendarDays, Layers3, RotateCcw, LogOut, MessageSquare, ClipboardCheck } from "lucide-react";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type Dispatch, type PropsWithChildren, type SetStateAction } from "react";
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { getAdminWorkspace, type AdminWorkspaceDto } from "../api/adminRolesApi";
import { adminNavigation } from "../../../app/pages/admin/adminNavigation";
import { brandName } from "../data/adminV2.defaults";
import { resetAdminV2, updateAdminV2, useAdminV2Store } from "../data/adminV2.store";
import { ConfirmDialog } from "../shared/AdminV2Primitives";
import type { AdminV2Data, BrandFilter } from "../types/adminV2.types";
import { emptyAdminV2ServerDomainData } from "../api/adminV2Mappers";
import { adminV2ServerDomainsChanged, loadAdminV2ServerData, persistAdminV2ServerChanges, type ServerDomainData } from "../api/adminV2ServerData";
import { loadAdminContentData, loadAdminOverviewData, loadAdminSecurityData, loadAdminSecurityEvents, type AdminOverviewView } from "../api/adminV2OperationalData";
import "../styles/admin-v2.css";
import "../styles/admin-v2-phase2.css";

interface AdminV2ContextValue {
  data: AdminV2Data;
  setData: Dispatch<SetStateAction<AdminV2Data>>;
  brand: BrandFilter;
  setBrand: (brand: BrandFilter) => void;
  globalSearch: string;
  setGlobalSearch: (value: string) => void;
  domainLoading: boolean;
  domainError: string;
  refreshServerDomains: () => Promise<AdminV2RefreshResult>;
  reportDomainError: (message: string) => void;
  overview: AdminOverviewView | null;
  workspace: AdminWorkspaceDto;
}

type AdminV2RefreshResult = { ok: true; data: ServerDomainData } | { ok: false; message: string };

const AdminV2Context = createContext<AdminV2ContextValue | null>(null);
const brandChoices: BrandFilter[] = ["all", "medway", "elite", "nexus"];
const BRAND_FILTER_STORAGE_KEY = "greenlearn.admin-v2.brand-filter";
const routeIcons = [LayoutDashboard, BookOpen, LibraryBig, UserRound, GraduationCap, CreditCard, CalendarDays, Files, ShieldCheck, MessageSquare, ClipboardCheck];
const instructorNavigation = [
  { label: "Overview", path: "/admin/instructor", icon: LayoutDashboard, description: "Teaching activity across your assigned courses." },
  { label: "My courses", path: "/admin/instructor/courses", icon: LibraryBig, description: "Your assigned teaching courses." },
  { label: "Content", path: "/admin/instructor/content", icon: Files, description: "Prepare course lessons and resources for review." },
  { label: "Assignments", path: "/admin/instructor/assignments", icon: ClipboardCheck, description: "Create assignments and grade student submissions." },
  { label: "Assessments", path: "/admin/instructor/assessments", icon: CalendarDays, description: "Create and publish course quizzes and exams." },
];

export function useAdminV2() {
  const context = useContext(AdminV2Context);
  if (!context) throw new Error("useAdminV2 must be used inside AdminV2Layout.");
  return context;
}

export function AdminV2DomainStatus() {
  const { domainLoading, domainError } = useAdminV2();
  if (!domainLoading && !domainError) return null;
  return <div className="admin-v2__inline-notice" role={domainError ? "alert" : "status"}>{domainError || "Loading current Admin data…"}</div>;
}

export function AdminV2Layout({ children }: PropsWithChildren) {
  const auth = useAuth();
  const navigate = useNavigate();
  const localData = useAdminV2Store();
  const { pathname } = useLocation();
  const [adminAccess, setAdminAccess] = useState<"checking" | "allowed" | "denied" | "error">("checking");
  const [workspace, setWorkspace] = useState<AdminWorkspaceDto | null>(null);
  const builderCourseId = pathname.match(/^\/admin\/courses\/([^/]+)\/builder$/)?.[1];
  const [serverDomains, setServerDomains] = useState<ServerDomainData>(() => emptyAdminV2ServerDomainData());
  const [overview, setOverview] = useState<AdminOverviewView | null>(null);
  const [domainLoading, setDomainLoading] = useState(true);
  const [domainError, setDomainError] = useState("");
  const [refreshSequence, setRefreshSequence] = useState(0);
  const refreshWaiters = useRef<Array<(result: AdminV2RefreshResult) => void>>([]);
  const refreshServerDomains = () => new Promise<AdminV2RefreshResult>((resolve) => {
    refreshWaiters.current.push(resolve);
    setRefreshSequence((value) => value + 1);
  });
  const data: AdminV2Data = { ...localData, ...serverDomains };
  const mutationQueue = useRef<Promise<void>>(Promise.resolve());
  const setData: Dispatch<SetStateAction<AdminV2Data>> = (next) => {
    const previous = data;
    const proposed = typeof next === "function" ? next(previous) : next;
    const changedServerDomain = adminV2ServerDomainsChanged(previous, proposed);
    const clean = { ...proposed, ...(changedServerDomain ? { auditEvents: localData.auditEvents } : {}), ...emptyAdminV2ServerDomainData() };
    updateAdminV2(() => clean);
    if (!changedServerDomain) return;
    mutationQueue.current = mutationQueue.current.then(async () => {
      const errors = await persistAdminV2ServerChanges(previous, proposed);
      setDomainError(errors.join(" "));
      refreshServerDomains();
    }).catch((error: unknown) => setDomainError(error instanceof Error ? error.message : "The Admin update could not be saved."));
  };
  const [brand, setBrand] = useState<BrandFilter>(() => {
    if (typeof window === "undefined") return "all";
    const saved = window.localStorage.getItem(BRAND_FILTER_STORAGE_KEY) as BrandFilter | null;
    return saved && brandChoices.includes(saved) ? saved : "all";
  });
  const routeBrand = workspace?.workspace === "instructor" ? workspace.brands[0]?.code ?? "all" : pathname === "/admin/content" && brand === "all" ? "elite" : brand;
  const routeBrandChoices = workspace?.workspace === "super_admin" ? (pathname === "/admin/content" ? brandChoices.filter((choice) => choice !== "all") : brandChoices) : [];
  const [globalSearch, setGlobalSearch] = useState("");
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const navigation = workspace?.workspace === "instructor" ? instructorNavigation : adminNavigation;
  const routeLabel = useMemo(() => workspace?.workspace === "super_admin" && (pathname === "/admin" || pathname === "/admin/overview") ? "Super Admin Overview" : workspace?.workspace === "instructor" && pathname === "/admin/instructor" ? "Teaching overview" : pathname.match(/^\/admin\/courses\/[^/]+\/builder$/) ? "Course Builder" : navigation.find((route) => route.path === pathname)?.label ?? (workspace?.displayRole ?? "Admin"), [navigation, pathname, workspace?.displayRole, workspace?.workspace]);
  const routeSubtitle = routeLabel === "Super Admin Overview" ? "Platform-wide operations, people, and access across your brands." : routeLabel === "Overview" ? "Welcome back, Admin. Here is what is happening across your platform." : routeLabel === "Teaching overview" && workspace?.workspace === "instructor" ? "Your assigned courses, student work, and content review status." : routeLabel === "Teaching overview" ? "Review course plans, teaching materials, exams, and student work." : routeLabel === "Roles & Permissions" ? "Choose who can teach and manage the learning platform." : routeLabel === "Security" ? "Monitor persisted devices, sessions, and security events." : routeLabel === "Courses" ? "Manage course offerings, curriculum mapping, and instructor assignments." : routeLabel === "Instructors" ? "Manage your global instructor directory, brand assignments, and course allocations." : routeLabel === "Students" ? "Manage student identity, access, devices, and sessions." : routeLabel === "Payments" ? "Review manual payment submissions and approve or reject pending reviews." : routeLabel === "Curriculum" ? "Manage approved academic structures by institution." : routeLabel === "Course Builder" ? "Build chapters and lessons independently from curriculum mapping." : routeLabel === "Content" ? "Manage video and PDF resources attached to course lessons." : routeLabel === "Assignment Review" ? "Review Student submissions, scores, and return-for-revision decisions." : routeLabel === "Support Inbox" ? "Read and reply to persisted Student support conversations." : "Manage subscription plans, seats, and student lifecycle.";
  const reportDomainError = (message: string) => setDomainError(message);
  const context = useMemo(() => workspace ? ({ data, setData, brand: routeBrand, setBrand, globalSearch, setGlobalSearch, domainLoading, domainError, refreshServerDomains, reportDomainError, overview, workspace }) : null, [data, routeBrand, globalSearch, domainLoading, domainError, overview, workspace]);
  useEffect(() => {
    if (auth.status === "loading") return;
    if (auth.status === "unauthenticated") { setAdminAccess("denied"); return; }
    let active = true;
    setAdminAccess("checking");
    void getAdminWorkspace().then((resolved) => {
      if (!active) return;
      setWorkspace(resolved);
      setAdminAccess("allowed");
    }).catch((error: unknown) => {
      if (!active) return;
      const status = (error as { status?: number }).status;
      setAdminAccess(status === 401 || status === 403 ? "denied" : "error");
    });
    return () => { active = false; };
  }, [auth.status, auth.user?.id]);
  useEffect(() => {
    if (adminAccess !== "allowed") return;
    const controller = new AbortController();
    setDomainLoading(true);
    setOverview(null);
    (async () => {
      let refreshResult: AdminV2RefreshResult;
      try {
        const loaded = workspace?.workspace === "instructor" ? emptyAdminV2ServerDomainData() : await loadAdminV2ServerData(builderCourseId);
        let operational: Partial<AdminV2Data> = {};
        let overviewResult: AdminOverviewView | null = null;
        if (workspace?.workspace === "super_admin" && pathname === "/admin/content") operational = await loadAdminContentData(loaded.courses);
        if (workspace?.workspace === "super_admin" && pathname === "/admin/security") operational = await loadAdminSecurityData(brand);
        if (workspace?.workspace === "super_admin" && pathname === "/admin/instructors") operational = { auditEvents: await loadAdminSecurityEvents(brand) };
        if (workspace?.workspace === "super_admin" && (pathname === "/admin" || pathname === "/admin/overview")) { const result = await loadAdminOverviewData(brand, loaded.courses); operational = result.data; overviewResult = result.overview; }
        if (!controller.signal.aborted) {
          const refreshed = { ...loaded, ...operational } as ServerDomainData;
          refreshResult = { ok: true, data: refreshed };
          setServerDomains(refreshed); setOverview(overviewResult); setDomainError("");
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Admin data could not be loaded.";
        if (!controller.signal.aborted) { refreshResult = { ok: false, message }; setServerDomains(emptyAdminV2ServerDomainData()); setOverview(null); setDomainError(message); }
      } finally {
        if (!controller.signal.aborted) {
          setDomainLoading(false);
          const result = refreshResult!;
          for (const resolve of refreshWaiters.current.splice(0)) resolve(result);
        }
      }
    })();
    return () => controller.abort();
  }, [adminAccess, builderCourseId, pathname, brand, refreshSequence, workspace]);
  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); searchRef.current?.focus(); } };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);
  useEffect(() => {
    try { window.localStorage.setItem(BRAND_FILTER_STORAGE_KEY, brand); } catch { /* The in-memory selection still works in restricted storage contexts. */ }
  }, [brand]);

  if (auth.status === "loading" || (auth.status === "authenticated" && adminAccess === "checking")) return <main aria-live="polite">Checking your Admin session…</main>;
  if (auth.status !== "authenticated" || adminAccess === "denied") return <Navigate to="/auth/sign-in" replace state={{ from: pathname }} />;
  if (adminAccess === "error") return <main role="alert">The Admin session could not be checked. Please reload and try again.</main>;
  if (!workspace || !context) return <main aria-live="polite">Loading your workspace…</main>;
  if (workspace.workspace === "instructor" && pathname === "/admin") return <Navigate to="/admin/instructor" replace />;
  if (workspace.workspace === "super_admin" && pathname.startsWith("/admin/instructor/") ) return <Navigate to="/admin/instructor" replace />;
  if (workspace.workspace === "instructor" && pathname.startsWith("/admin/") && !pathname.startsWith("/admin/instructor/") && pathname !== "/admin") return <Navigate to="/admin/instructor/courses" replace />;
  return <AdminV2Context.Provider value={context}>
    <div className="admin-v2">
      <aside className="admin-v2__sidebar">
        <NavLink to="/admin/courses" className="admin-v2__brand" aria-label="GreenLearn Admin home"><span className="admin-v2__brand-mark"><BookOpen aria-hidden="true" /></span><span><strong>GreenLearn</strong><small>ADMIN CONSOLE</small></span></NavLink>
        <div className="admin-v2__nav-label">WORKSPACE</div>
        <nav aria-label={`${workspace.displayRole} sections`}><ul>{navigation.map((item, index) => { const Icon = "icon" in item ? item.icon : routeIcons[index] ?? Layers3; return <li key={item.path}><NavLink to={item.path} end={item.path === "/admin" || item.path === "/admin/instructor"} className={({ isActive }) => `admin-v2__nav-link${isActive ? " is-active" : ""}`}><Icon aria-hidden="true" /><span>{item.label}</span></NavLink></li>; })}</ul></nav>
        <div className="admin-v2__sidebar-footer"><div className="admin-v2__help"><span>?</span><div><strong>Need help?</strong><small>Admin support center</small></div><ChevronDown aria-hidden="true" /></div><div className="admin-v2__copyright"><span>GreenLearn · Admin workspace</span><button type="button" title="Reset local Admin cache" aria-label="Reset local Admin cache" onClick={() => setResetOpen(true)}><RotateCcw size={12} /></button></div></div>
      </aside>
      <div className="admin-v2__workspace">
        <header className="admin-v2__topbar">
          <div className="admin-v2__route-title"><span className="admin-v2__workspace-kicker">{workspace.workspace === "super_admin" ? "SUPER ADMIN WORKSPACE" : "INSTRUCTOR WORKSPACE"}</span><h1>{routeLabel}</h1><p>{routeSubtitle}</p></div>
          <label className="admin-v2__global-search"><Search aria-hidden="true" /><input ref={searchRef} value={globalSearch} onChange={(event) => setGlobalSearch(event.target.value)} placeholder="Search students, courses, instructors..." aria-label="Global Admin search" /><kbd>Ctrl K</kbd></label>
          <div className="admin-v2__top-actions">
            {routeBrandChoices.length > 0 && <div className="admin-v2__brand-switch" role="group" aria-label="Brand filter">{routeBrandChoices.map((choice) => <button key={choice} type="button" aria-pressed={routeBrand === choice} title={choice === "all" ? "Show all brands across Admin" : `Filter Admin by ${brandName(choice)}`} className={choice === "all" ? "is-all" : `is-${choice}`} onClick={() => setBrand(choice)}>{choice === "all" ? <Layers3 aria-hidden="true" /> : choice === "elite" ? <Crown aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}<span>{choice === "all" ? "All brands" : brandName(choice)}</span></button>)}</div>}
            <div className="admin-v2__notice-wrap"><button className="admin-v2__icon-btn" aria-label="Notifications" aria-expanded={noticeOpen} onClick={() => setNoticeOpen((value) => !value)}><Bell aria-hidden="true" /></button>{noticeOpen && <div className="admin-v2__notice-popover"><strong>Notifications</strong><span>Notifications are not available from the current Admin API.</span></div>}</div>
            <div className="admin-v2__profile" aria-label={`Signed-in ${workspace.displayRole}`}><span className="admin-v2__avatar">{(auth.user?.name ?? "A").slice(0, 2).toUpperCase()}</span><span><strong>{auth.user?.name ?? "Authenticated Admin"}</strong><small>{workspace.displayRole}</small></span></div>
            <button type="button" className="admin-v2__logout" onClick={() => { auth.signOut(); navigate("/auth/sign-in", { replace: true }); }}><LogOut aria-hidden="true" /><span>Log out</span></button>
          </div>
        </header>
        <main className="admin-v2__main"><div className="admin-v2__content">{children ?? <Outlet context={{ brandView: routeBrand === "all" ? "all" : routeBrand }} />}</div></main>
      </div>
    </div>
    {resetOpen && <ConfirmDialog title="Reset local Admin cache?" detail="This clears this browser's saved Admin cache. Server records are not changed." confirmLabel="Reset cache" onCancel={() => setResetOpen(false)} onConfirm={() => { resetAdminV2(); setResetOpen(false); }} />}
  </AdminV2Context.Provider>;
}
