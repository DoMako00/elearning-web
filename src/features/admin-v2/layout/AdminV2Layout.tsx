import { Bell, BookOpen, ChevronDown, Crown, GraduationCap, LayoutDashboard, LibraryBig, Search, ShieldCheck, CreditCard, Files, UserRound, CalendarDays, Layers3, RotateCcw, LogOut, MessageSquare, ClipboardCheck, ReceiptText } from "lucide-react";
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
import { loadAdminOverviewData, loadAdminSecurityData, loadAdminSecurityEvents, type AdminOverviewView } from "../api/adminV2OperationalData";
import { AdminV2UiProvider } from "../shared/adminV2Theme";
import { RouteLoadingFallback } from "../../../components/layout/RouteLoadingFallback";
import "../styles/admin-v2.css";
import "../styles/admin-v2-phase2.css";

import { getWorkspaceCopy, INSTRUCTOR_SUPPORT_LINK } from "../copy/workspace-copy";
import { InstructorGuide, resetInstructorGuideSession } from "./InstructorGuide";
import { PageBreadcrumb } from "../../../components/ui/PageBreadcrumb";

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
  { label: "Home", path: "/admin/instructor", icon: LayoutDashboard, description: "Your next teaching tasks and course activity." },
  { label: "My courses", path: "/admin/instructor/courses", icon: LibraryBig, description: "Build lessons and learning materials for assigned courses." },
  { label: "Students", path: "/admin/instructor/students", icon: UserRound, description: "Create accounts for your courses and manage students you created." },
  { label: "Subscriptions", path: "/admin/instructor/subscriptions", icon: ReceiptText, description: "Prepare student purchase requests and track Super Admin payment review." },
  { label: "Assignments & grading", path: "/admin/instructor/assignments", icon: ClipboardCheck, description: "Publish coursework and grade student submissions." },
  { label: "Exams & quizzes", path: "/admin/instructor/assessments", icon: GraduationCap, description: "Create, publish, and review course assessments." },
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
  const routeBrand = workspace?.workspace === "instructor" ? workspace.brands[0]?.code ?? "all" : brand;
  const routeBrandChoices = workspace?.workspace === "super_admin" ? brandChoices : [];
  const [globalSearch, setGlobalSearch] = useState("");
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const navigation = workspace?.workspace === "instructor" ? instructorNavigation : adminNavigation;
  const routeLabel = useMemo(() => {
    if (workspace?.workspace === "super_admin" && (pathname === "/admin" || pathname === "/admin/overview")) return "Super Admin overview";
    if (workspace?.workspace === "instructor" && pathname === "/admin/instructor") return "Home";
    if (workspace?.workspace === "instructor" && /^\/admin\/instructor\/courses\/[^/]+$/.test(pathname)) return "Course builder";
    return navigation.find((route) => route.path === pathname)?.label ?? workspace?.displayRole ?? "Admin";
  }, [navigation, pathname, workspace?.displayRole, workspace?.workspace]);
  const routeSubtitle = navigation.find((route) => route.path === pathname)?.description ?? (routeLabel === "Super Admin overview" ? "Run platform operations, configure courses, and review instructor submissions." : routeLabel === "Instructor dashboard" || routeLabel === "Home" ? "Follow your teaching workflow from course setup to grading." : routeLabel === "Course builder" || routeLabel === "Course content" ? "Build chapters and lessons, then send videos or PDFs for approval." : routeLabel === "Dashboard" ? "Your next teaching tasks and course activity." : routeLabel === "My courses" ? "Build lessons and learning materials for assigned courses." : routeLabel === "Assignments & grading" ? "Publish coursework and review submitted student work." : routeLabel === "Exams & quizzes" ? "Create questions, set availability, and publish assessments." : routeLabel === "Course setup" ? "Create course offerings, map curriculum, and assign instructors." : routeLabel === "Instructors" ? "Manage teaching profiles, account access, and course assignments." : routeLabel === "Content approvals" ? "Review videos and documents sent by instructors before student release." : routeLabel === "Roles & Permissions" ? "Choose who can teach and manage the learning platform." : routeLabel === "Security" ? "Monitor persisted devices, sessions, and security events." : routeLabel === "Students" ? "Manage student identity, access, devices, and sessions." : routeLabel === "Payments" ? "Review manual payment submissions and approve or reject pending reviews." : routeLabel === "Curriculum" ? "Manage approved academic structures by institution." : routeLabel === "Support Inbox" ? "Read and reply to persisted student support conversations." : "Manage subscription plans, seats, and student lifecycle.");
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
        const loaded = workspace?.workspace === "instructor" ? emptyAdminV2ServerDomainData() : await loadAdminV2ServerData();
        let operational: Partial<AdminV2Data> = {};
        let overviewResult: AdminOverviewView | null = null;
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
  }, [adminAccess, pathname, brand, refreshSequence, workspace]);
  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); searchRef.current?.focus(); } };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);
  useEffect(() => {
    try { window.localStorage.setItem(BRAND_FILTER_STORAGE_KEY, brand); } catch { /* The in-memory selection still works in restricted storage contexts. */ }
  }, [brand]);

  if (auth.status === "loading" || (auth.status === "authenticated" && adminAccess === "checking")) {
    return <RouteLoadingFallback withShell={true} isMobile={false} message="Checking your Admin session…" />;
  }
  if (auth.status !== "authenticated" || adminAccess === "denied") return <Navigate to="/auth/sign-in" replace state={{ from: pathname }} />;
  if (adminAccess === "error") return <main role="alert">The Admin session could not be checked. Please reload and try again.</main>;
  if (!workspace || !context) {
    return <RouteLoadingFallback withShell={true} isMobile={false} message="Loading your workspace…" />;
  }
  if (workspace.workspace === "instructor" && pathname === "/admin") return <Navigate to="/admin/instructor" replace />;
  if (workspace.workspace === "super_admin" && (pathname === "/admin/instructor" || pathname.startsWith("/admin/instructor/") || pathname.startsWith("/admin/assignments") || pathname.startsWith("/admin/assessments") || /^\/admin\/courses\/[^/]+\/builder$/.test(pathname))) return <Navigate to="/admin" replace />;
  const isInstructorRoute = pathname === "/admin/instructor" || pathname.startsWith("/admin/instructor/");
  if (workspace.workspace === "instructor" && pathname.startsWith("/admin/") && !isInstructorRoute && pathname !== "/admin") return <Navigate to="/admin/instructor" replace />;
  const isInstructor = workspace.workspace === "instructor";
  const copy = getWorkspaceCopy(workspace.workspace);

  return <AdminV2Context.Provider value={context}><AdminV2UiProvider>
    <div className={`admin-v2${isInstructor ? " admin-v2--instructor" : ""}`}>
      <aside className="admin-v2__sidebar">
        <NavLink to={copy.sidebar.brandHomeRoute} className="admin-v2__brand" aria-label={copy.sidebar.brandHomeAriaLabel}><span className="admin-v2__brand-mark"><BookOpen aria-hidden="true" /></span><span><strong>GreenLearn</strong><small>{copy.sidebar.brandConsoleSmall}</small></span></NavLink>
        <div className="admin-v2__nav-label">{copy.sidebar.workspaceLabel}</div>
        <nav aria-label={`${workspace.displayRole} sections`}><ul>{navigation.map((item, index) => { const Icon = "icon" in item ? item.icon : routeIcons[index] ?? Layers3; return <li key={item.path}><NavLink to={item.path} end={item.path === "/admin" || item.path === "/admin/instructor"} className={({ isActive }) => `admin-v2__nav-link${isActive ? " is-active" : ""}`}><Icon aria-hidden="true" /><span>{item.label}</span></NavLink></li>; })}</ul></nav>
        <div className="admin-v2__sidebar-footer">
          {(!isInstructor || INSTRUCTOR_SUPPORT_LINK) && (
            INSTRUCTOR_SUPPORT_LINK ? (
              <a href={INSTRUCTOR_SUPPORT_LINK} target="_blank" rel="noreferrer" className="admin-v2__help" style={{ textDecoration: "none" }}><span>?</span><div><strong>Need help?</strong><small>Instructor support center</small></div><ChevronDown aria-hidden="true" /></a>
            ) : (
              <div className="admin-v2__help"><span>?</span><div><strong>Need help?</strong><small>Admin support center</small></div><ChevronDown aria-hidden="true" /></div>
            )
          )}
          <div className="admin-v2__copyright">
            <span>{copy.sidebar.footerCopyright}</span>
            {!isInstructor && (
              <button type="button" title={copy.sidebar.cacheButtonTitle} aria-label={copy.sidebar.cacheButtonTitle} onClick={() => setResetOpen(true)}><RotateCcw size={12} /></button>
            )}
          </div>
        </div>
      </aside>
      <div className="admin-v2__workspace">
        <header className="admin-v2__topbar">
          {isInstructor ? <div className="admin-v2__instructor-breadcrumb"><PageBreadcrumb trail={pathname === "/admin/instructor" ? [{ label: "WORKSPACE", to: "/admin/instructor" }] : pathname.startsWith("/admin/instructor/courses/") ? [{ label: "WORKSPACE", to: "/admin/instructor" }, { label: "MY COURSES", to: "/admin/instructor/courses" }, { label: workspace.courses.find(course => pathname === `/admin/instructor/courses/${course.id}`)?.title ?? "COURSE", to: pathname }] : [{ label: "WORKSPACE", to: "/admin/instructor" }]} title={routeLabel} /></div> : <div className="admin-v2__route-title"><span className="admin-v2__workspace-kicker">{copy.topbar.kicker}</span><h1>{routeLabel}</h1><p>{routeSubtitle}</p></div>}
          {!isInstructor ? (
            <label className="admin-v2__global-search"><Search aria-hidden="true" /><input ref={searchRef} value={globalSearch} onChange={(event) => setGlobalSearch(event.target.value)} placeholder={copy.topbar.searchPlaceholder} aria-label={copy.topbar.searchAriaLabel} /><kbd>Ctrl K</kbd></label>
          ) : null}
          <div className="admin-v2__top-actions">
            {routeBrandChoices.length > 0 && <div className="admin-v2__brand-switch" role="group" aria-label="Brand filter">{routeBrandChoices.map((choice) => <button key={choice} type="button" aria-pressed={routeBrand === choice} title={choice === "all" ? "Show all brands across Admin" : `Filter Admin by ${brandName(choice)}`} className={choice === "all" ? "is-all" : `is-${choice}`} onClick={() => setBrand(choice)}>{choice === "all" ? <Layers3 aria-hidden="true" /> : choice === "elite" ? <Crown aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}<span>{choice === "all" ? "All brands" : brandName(choice)}</span></button>)}</div>}
            {!isInstructor && (
              <div className="admin-v2__notice-wrap"><button className="admin-v2__icon-btn" aria-label="Notifications" aria-expanded={noticeOpen} onClick={() => setNoticeOpen((value) => !value)}><Bell aria-hidden="true" /></button>{noticeOpen && <div className="admin-v2__notice-popover"><strong>Notifications</strong><span>Notifications are not available from the current Admin API.</span></div>}</div>
            )}
            <div className="admin-v2__profile" aria-label={`Signed-in ${workspace.displayRole}`}><span className="admin-v2__avatar">{(auth.user?.name ?? "A").slice(0, 2).toUpperCase()}</span><span><strong>{auth.user?.name ?? copy.topbar.fallbackUserName}</strong><small>{workspace.displayRole}</small></span></div>
            <button type="button" className="admin-v2__logout" onClick={() => { if (isInstructor && auth.user?.id) resetInstructorGuideSession(auth.user.id); auth.signOut(); navigate("/auth/sign-in", { replace: true }); }}><LogOut aria-hidden="true" /><span>Log out</span></button>
          </div>
        </header>
        <main className="admin-v2__main"><div className="admin-v2__content">{children ?? <Outlet context={{ brandView: routeBrand === "all" ? "all" : routeBrand }} />}</div></main>
      </div>
    </div>
    {isInstructor && <InstructorGuide userId={auth.user?.id ?? "instructor"} pathname={pathname} courseCount={workspace.courses.length} />}
    {resetOpen && <ConfirmDialog title="Reset local Admin cache?" detail="This clears this browser's saved Admin cache. Server records are not changed." confirmLabel="Reset cache" onCancel={() => setResetOpen(false)} onConfirm={() => { resetAdminV2(); setResetOpen(false); }} />}
  </AdminV2UiProvider></AdminV2Context.Provider>;
}
