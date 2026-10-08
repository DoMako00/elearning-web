import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AdminShell } from "../../../features/admin/components/AdminShell";
import { useAdminBrand } from "../../../features/admin/hooks/useAdminBrand";
import { useAuth } from "../../providers/AuthProvider";

export function AdminLayout() {
  const auth = useAuth();
  const location = useLocation();
  const brandContext = useAdminBrand(auth.status === "authenticated");

  if (auth.status === "loading") {
    return <main aria-live="polite">Checking your admin session…</main>;
  }

  if (auth.status !== "authenticated") {
    return (
      <Navigate
        to="/auth/sign-in?mode=admin"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  if (brandContext.loading) {
    return (
      <main aria-live="polite">Loading your authorized brand context…</main>
    );
  }

  if (brandContext.error) {
    return (
      <main className="admin-page" role="alert">
        <h1>Brand access unavailable</h1>
        <p>{brandContext.error}</p>
        <button type="button" onClick={brandContext.retry}>
          Retry
        </button>
      </main>
    );
  }

  return (
    <AdminShell
      brand={brandContext.brand}
      brandView={brandContext.brandView}
      availableBrands={brandContext.availableBrands}
      setBrandView={brandContext.setBrandView}
    >
      <Outlet
        context={{
          brand: brandContext.brand,
          brandView: brandContext.brandView,
          availableBrands: brandContext.availableBrands,
        }}
      />
    </AdminShell>
  );
}
