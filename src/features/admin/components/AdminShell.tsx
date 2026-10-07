import { useState, type ReactNode } from "react";
import type { AdminBrandContext, AdminBrandView } from "../api";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";
import "../styles/admin.css";
import "../styles/admin-curriculum.css";
import "../styles/admin-polish.css";
import "../styles/admin-fit.css";
import "../styles/admin-reference.css";

interface AdminShellProps {
  readonly children: ReactNode;
  readonly brand?: AdminBrandContext;
  readonly brandView: AdminBrandView;
  readonly availableBrands: readonly AdminBrandContext[];
  readonly setBrandView: (view: AdminBrandView) => void;
}

export function AdminShell({
  children,
  brand,
  brandView,
  availableBrands,
  setBrandView,
}: AdminShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className={`admin-shell${collapsed ? " is-sidebar-collapsed" : ""}`}>
      <AdminSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((value) => !value)}
      />
      <div className="admin-shell__workspace">
        <AdminTopbar
          brand={brand}
          brandView={brandView}
          availableBrands={availableBrands}
          setBrandView={setBrandView}
        />
        <main className="admin-shell__main" aria-label="Admin workspace">
          {children}
        </main>
      </div>
    </div>
  );
}
