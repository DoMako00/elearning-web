import type { ReactNode } from "react";
import type { AdminBrandCode, AdminBrandContext } from "../api";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";
import "../styles/admin.css";

export function AdminShell({ children, brand, brandCode, availableBrands, setBrandCode }: { children: ReactNode; brand: AdminBrandContext; brandCode: AdminBrandCode; availableBrands: readonly AdminBrandContext[]; setBrandCode: (code: AdminBrandCode) => void }) {
  return <div className="admin-shell"><AdminSidebar brand={brand} /><div className="admin-shell__workspace"><AdminTopbar brand={brand} brandCode={brandCode} availableBrands={availableBrands} setBrandCode={setBrandCode} /><main className="admin-shell__main" aria-label="Admin workspace">{children}</main></div></div>;
}