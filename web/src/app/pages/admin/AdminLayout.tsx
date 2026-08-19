import { Outlet } from "react-router-dom";
import { useAdminBrand } from "../../../features/admin/hooks/useAdminBrand";
import { AdminShell } from "../../../features/admin/components/AdminShell";

export function AdminLayout() {
  const { brand, brandCode, availableBrands, setBrandCode } = useAdminBrand();
  return <AdminShell brand={brand} brandCode={brandCode} availableBrands={availableBrands} setBrandCode={setBrandCode}><Outlet context={{ brand }} /></AdminShell>;
}