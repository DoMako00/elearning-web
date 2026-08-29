import { Outlet } from "react-router-dom";
import { useAdminBrand } from "../../../features/admin/hooks/useAdminBrand";
import { AdminShell } from "../../../features/admin/components/AdminShell";

export function AdminLayout() {
  const { brand, brandView, availableBrands, setBrandView } = useAdminBrand();
  return <AdminShell brand={brand} brandView={brandView} availableBrands={availableBrands} setBrandView={setBrandView}><Outlet context={{ brand, brandView }} /></AdminShell>;
}
