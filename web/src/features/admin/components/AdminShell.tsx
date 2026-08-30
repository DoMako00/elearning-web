import { useState, type ReactNode } from "react";
import type { AdminBrandContext, AdminBrandView } from "../api";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";
import "../styles/admin.css";
import "../styles/admin-curriculum.css";

export function AdminShell({ children, brand, brandView, availableBrands, setBrandView }: { children: ReactNode; brand?: AdminBrandContext; brandView: AdminBrandView; availableBrands: readonly AdminBrandContext[]; setBrandView: (view: AdminBrandView) => void }) {
  const [collapsed, setCollapsed] = useState(false);
  return <div className={`admin-shell${collapsed ? " is-sidebar-collapsed" : ""}`}><AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} /><div className="admin-shell__workspace"><AdminTopbar brand={brand} brandView={brandView} availableBrands={availableBrands} setBrandView={setBrandView} /><main className="admin-shell__main" aria-label="Admin workspace">{children}</main></div></div>;
}
