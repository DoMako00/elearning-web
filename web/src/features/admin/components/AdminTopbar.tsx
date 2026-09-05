import { Bell, BookOpen, ChevronDown, Crown, Layers3, LogOut, Search, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getAdminRouteMetadata } from "../../../app/pages/admin/adminNavigation";
import type { AdminBrandContext, AdminBrandView } from "../api";
import { useAuth } from "../../../app/providers/AuthProvider";

export function AdminTopbar({ brand, brandView, availableBrands, setBrandView }: { brand?: AdminBrandContext; brandView: AdminBrandView; availableBrands: readonly AdminBrandContext[]; setBrandView: (view: AdminBrandView) => void }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const metadata = getAdminRouteMetadata(pathname);
  const isCurriculum = pathname === "/admin/curriculum";
  const searchRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<string>();

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  const views: readonly { code: AdminBrandView; label: string; shortLabel?: string }[] = [{ code: "all", label: "All Brands", shortLabel: "All" }, ...availableBrands.map((item) => ({ code: item.brandCode, label: item.brandDisplayName }))];
  const moveView = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => { const last = views.length - 1; const next = event.key === "ArrowLeft" ? Math.max(0, index - 1) : event.key === "ArrowRight" ? Math.min(last, index + 1) : event.key === "Home" ? 0 : event.key === "End" ? last : index; if (next !== index) { event.preventDefault(); setBrandView(views[next].code); (event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("button")[next])?.focus(); } };
  return <header className={`admin-topbar${pathname === "/admin/instructors" ? " is-instructors" : ""}`}>
    <div className="admin-topbar__route"><h1>{metadata.label}</h1><p>{metadata.description}</p></div>
    <label className="admin-search"><span className="admin-sr-only">Search the Admin Console preview</span><Search aria-hidden="true" /><input ref={searchRef} type="search" placeholder="Search students, courses, instructors..." /><kbd>⌘ K</kbd></label>
    <div className="admin-topbar__controls">
      {isCurriculum ? <div className="admin-curriculum-scope" aria-label="BUC Shared Curriculum scope"><BookOpen aria-hidden="true" /><span>BUC Shared Curriculum</span></div> : <div className="admin-brand-selector" aria-label="Admin brand viewing context">{views.map((item, index) => <button key={item.code} type="button" aria-label={item.code === "all" ? "View all brands" : `View ${item.label}`} aria-pressed={brandView === item.code} className={item.code === "all" ? "is-all" : item.code === "elite" ? "is-elite" : "is-medway"} onKeyDown={(event) => moveView(event, index)} onClick={() => setBrandView(item.code)}>{item.code === "all" ? <Layers3 aria-hidden="true" /> : item.code === "elite" ? <Crown aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}<span data-short={item.shortLabel}>{item.label}</span></button>)}</div>}
      <button className="admin-icon-button" type="button" aria-label="Open notifications preview" onClick={() => setNotice("Notifications are preview-only in this milestone.")}><Bell aria-hidden="true" /><span className="admin-notification-badge">12</span></button>
      <button className="admin-icon-button" type="button" aria-label="Sign out" onClick={() => { auth.signOut(); navigate("/auth/sign-in", { replace: true }); }}><LogOut aria-hidden="true" /></button>
      <button className="admin-profile" type="button" aria-label="Authenticated administrator" onClick={() => setNotice("This dashboard is protected by your active Supabase session.")}><span className="admin-profile__avatar">{(auth.user?.name ?? "AU").slice(0, 2).toUpperCase()}</span><span className="admin-profile__copy"><strong>{auth.user?.name ?? "Admin User"}</strong><small>Authenticated session · {brand?.brandDisplayName ?? "All Brands"}</small></span><ChevronDown aria-hidden="true" /></button>
    </div>
    <span className="admin-sr-only" role="status" aria-live="polite">{notice}</span>
  </header>;
}
