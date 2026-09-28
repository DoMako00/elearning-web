import { ChevronRight, CircleHelp, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NavLink } from "react-router-dom";
import bucLogo from "../../../Assets/admin/buc-admin-logo.png";
import { adminNavigation } from "../../../app/pages/admin/adminNavigation";

export function AdminSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return <aside className="admin-sidebar" aria-label="Admin navigation">
    <div className="admin-sidebar__brand"><img src={bucLogo} alt="BUC School of Medicine E-Learning Platform" /></div>
    <nav aria-label="Admin sections"><ul className="admin-sidebar__nav">{adminNavigation.map((item) => { const Icon = item.icon; return <li key={item.path}><NavLink to={item.path} end={item.path === "/admin"} className={({ isActive }) => `admin-sidebar__link${isActive ? " is-active" : ""}`} title={collapsed ? `${item.label} — ${item.description}` : item.description}>{({ isActive }) => <><Icon aria-hidden="true" /><span>{item.label}</span>{isActive && <span className="admin-sidebar__active-marker" aria-hidden="true" />}</>}</NavLink></li>; })}</ul></nav>
    <div className="admin-sidebar__footer">
      <button className="admin-help-card" type="button" aria-label="Open Admin Help Center preview"><span className="admin-help-card__icon"><CircleHelp aria-hidden="true" /></span><span><strong>Need help?</strong><small>Visit our Admin Help Center</small></span><ChevronRight aria-hidden="true" /></button>
      <div className="admin-sidebar__legal"><span>© 2026 BUC SOM</span><span>All rights reserved.</span></div>
      <button className="admin-sidebar__collapse" type="button" onClick={onToggle} aria-label={collapsed ? "Expand admin sidebar" : "Collapse admin sidebar"} aria-expanded={!collapsed}>{collapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}<span>{collapsed ? "Expand" : "Collapse sidebar"}</span></button>
    </div>
  </aside>;
}
