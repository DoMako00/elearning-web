import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAdminBrand } from "../../../features/admin/hooks/useAdminBrand";
import { AdminShell } from "../../../features/admin/components/AdminShell";
import { useAuth } from "../../providers/AuthProvider";

export function AdminLayout() {
  const auth = useAuth();
  const location = useLocation();
  const { brand, brandView, availableBrands, setBrandView } = useAdminBrand();
  if (auth.status === "loading") return <main aria-live="polite">Checking your admin session…</main>;
  if (auth.status !== "authenticated") return <Navigate to="/auth/sign-in" replace state={{ from: `${location.pathname}${location.search}` }} />;
  return <AdminShell brand={brand} brandView={brandView} availableBrands={availableBrands} setBrandView={setBrandView}><Outlet context={{ brand, brandView }} /></AdminShell>;
}
