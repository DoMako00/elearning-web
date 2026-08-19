import { Leaf } from "lucide-react";
import { NavLink } from "react-router-dom";
import type { AdminBrandContext } from "../api";
import { adminNavigation } from "../../../app/pages/admin/adminNavigation";

export function AdminSidebar({ brand }: { brand: AdminBrandContext }) {
  return <aside className="admin-sidebar" aria-label="Admin navigation"><div className="admin-sidebar__brand"><span className="admin-sidebar__mark"><Leaf aria-hidden="true" /></span><div><strong>Admin Console</strong><span>Operations workspace</span></div></div><div className="admin-sidebar__platform"><span>Brand scope</span><strong>{brand.brandDisplayName}</strong><small>{brand.brandCode}</small></div><nav aria-label="Admin sections"><ul className="admin-sidebar__nav">{adminNavigation.map((item) => { const Icon = item.icon; return <li key={item.path}><NavLink to={item.path} end={item.path === "/admin"} className={({ isActive }) => `admin-sidebar__link${isActive ? " is-active" : ""}`} title={item.description}>{({ isActive }) => <><Icon aria-hidden="true" /><span>{item.label}</span>{isActive && <span className="admin-sidebar__active-marker" aria-hidden="true" />}</>}</NavLink></li>; })}</ul></nav><p className="admin-sidebar__note">Read-only mock data. Backend authorization and brand-scope validation are authoritative.</p></aside>;
}