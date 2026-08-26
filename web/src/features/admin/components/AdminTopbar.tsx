import { Bell, ChevronDown, Crown, Search, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { getAdminRouteMetadata } from "../../../app/pages/admin/adminNavigation";
import type { AdminBrandCode, AdminBrandContext } from "../api";

export function AdminTopbar({ brand, brandCode, availableBrands, setBrandCode }: { brand: AdminBrandContext; brandCode: AdminBrandCode; availableBrands: readonly AdminBrandContext[]; setBrandCode: (code: AdminBrandCode) => void }) {
  const { pathname } = useLocation();
  const metadata = getAdminRouteMetadata(pathname);
  const searchRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<string>();

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  return <header className="admin-topbar">
    <div className="admin-topbar__route"><h1>{metadata.label}</h1><p>{metadata.description}</p></div>
    <label className="admin-search"><span className="admin-sr-only">Search the Admin Console preview</span><Search aria-hidden="true" /><input ref={searchRef} type="search" placeholder="Search students, courses, instructors..." /><kbd>⌘ K</kbd></label>
    <div className="admin-topbar__controls">
      <div className="admin-brand-selector" aria-label="Active teaching brand">{availableBrands.map((item) => <button key={item.brandId} type="button" aria-pressed={brandCode === item.brandCode} className={item.brandCode === "elite" ? "is-elite" : "is-medway"} onClick={() => setBrandCode(item.brandCode)}>{item.brandCode === "elite" ? <Crown aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}<span>{item.brandDisplayName}</span></button>)}</div>
      <button className="admin-icon-button" type="button" aria-label="Open notifications preview" onClick={() => setNotice("Notifications are preview-only in this milestone.")}><Bell aria-hidden="true" /><span className="admin-notification-badge">12</span></button>
      <button className="admin-profile" type="button" aria-label="Open Admin profile preview" onClick={() => setNotice("Profile controls are preview-only in this milestone.")}><span className="admin-profile__avatar">AU</span><span className="admin-profile__copy"><strong>Admin User</strong><small>Frontend preview · {brand.brandDisplayName}</small></span><ChevronDown aria-hidden="true" /></button>
    </div>
    <span className="admin-sr-only" role="status" aria-live="polite">{notice}</span>
  </header>;
}
