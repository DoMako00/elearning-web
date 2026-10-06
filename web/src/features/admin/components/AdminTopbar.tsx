import {
  Bell,
  BookOpen,
  ChevronDown,
  Crown,
  Layers3,
  LogOut,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getAdminRouteMetadata } from "../../../app/pages/admin/adminNavigation";
import { useAuth } from "../../../app/providers/AuthProvider";
import type { AdminBrandContext, AdminBrandView } from "../api";

interface AdminTopbarProps {
  readonly brand?: AdminBrandContext;
  readonly brandView: AdminBrandView;
  readonly availableBrands: readonly AdminBrandContext[];
  readonly setBrandView: (view: AdminBrandView) => void;
}

interface BrandViewOption {
  readonly code: AdminBrandView;
  readonly label: string;
  readonly shortLabel?: string;
}

function getBrandViews(
  brands: readonly AdminBrandContext[],
): readonly BrandViewOption[] {
  const allBrandsOption =
    brands.length > 1
      ? [{ code: "all" as const, label: "All Brands", shortLabel: "All" }]
      : [];

  return [
    ...allBrandsOption,
    ...brands.map((item) => ({
      code: item.brandCode,
      label: item.brandDisplayName,
    })),
  ];
}

function getBrandClass(code: AdminBrandView): string {
  if (code === "all") return "is-all";
  if (code === "elite") return "is-elite";
  if (code === "nexus") return "is-nexus";
  return "is-medway";
}

export function AdminTopbar({
  brand,
  brandView,
  availableBrands,
  setBrandView,
}: AdminTopbarProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const metadata = getAdminRouteMetadata(pathname);
  const isCurriculum = pathname === "/admin/curriculum";
  const [notice, setNotice] = useState<string>();
  const brandViews = getBrandViews(availableBrands);

  function moveBrandView(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ): void {
    const lastIndex = brandViews.length - 1;
    let nextIndex = currentIndex;

    if (event.key === "ArrowLeft") nextIndex = Math.max(0, currentIndex - 1);
    if (event.key === "ArrowRight")
      nextIndex = Math.min(lastIndex, currentIndex + 1);
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = lastIndex;

    if (nextIndex === currentIndex) return;

    event.preventDefault();
    setBrandView(brandViews[nextIndex].code);
    event.currentTarget.parentElement
      ?.querySelectorAll<HTMLButtonElement>("button")
      [nextIndex]?.focus();
  }

  return (
    <header
      className={
        "admin-topbar" +
        (pathname === "/admin/instructors" ? " is-instructors" : "")
      }
    >
      <div className="admin-topbar__route">
        <h1>{metadata.label}</h1>
        <p>{metadata.description}</p>
      </div>

      <label className="admin-search">
        <span className="admin-sr-only">Search the Admin Console</span>
        <Search aria-hidden="true" />
        <input
          type="search"
          placeholder="Global search unavailable"
          disabled
          aria-describedby="admin-search-unavailable"
        />
        <span className="admin-sr-only" id="admin-search-unavailable">
          Global search is not available yet.
        </span>
      </label>

      <div className="admin-topbar__controls">
        {isCurriculum ? (
          <div
            className="admin-curriculum-scope"
            aria-label="Academic catalogue scope"
          >
            <BookOpen aria-hidden="true" />
            <span>Academic Catalogues</span>
          </div>
        ) : (
          <div
            className="admin-brand-selector"
            aria-label="Admin brand viewing context"
          >
            {brandViews.map((item, index) => {
              const icon =
                item.code === "all" ? (
                  <Layers3 aria-hidden="true" />
                ) : item.code === "elite" ? (
                  <Crown aria-hidden="true" />
                ) : (
                  <ShieldCheck aria-hidden="true" />
                );

              return (
                <button
                  key={item.code}
                  type="button"
                  aria-label={
                    item.code === "all"
                      ? "View all authorized brands"
                      : "View " + item.label
                  }
                  aria-pressed={brandView === item.code}
                  className={getBrandClass(item.code)}
                  onKeyDown={(event) => moveBrandView(event, index)}
                  onClick={() => setBrandView(item.code)}
                >
                  {icon}
                  <span data-short={item.shortLabel}>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        <button
          className="admin-icon-button"
          type="button"
          aria-label="Open notifications preview"
          onClick={() =>
            setNotice("Notifications are preview-only in this milestone.")
          }
        >
          <Bell aria-hidden="true" />
        </button>
        <button
          className="admin-icon-button"
          type="button"
          aria-label="Sign out"
          onClick={() => {
            auth.signOut();
            navigate("/auth/sign-in", { replace: true });
          }}
        >
          <LogOut aria-hidden="true" />
        </button>
        <button
          className="admin-profile"
          type="button"
          aria-label="Authenticated administrator"
          onClick={() =>
            setNotice(
              "This dashboard is protected by your active Supabase session.",
            )
          }
        >
          <span className="admin-profile__avatar">
            {(auth.user?.name ?? "AU").slice(0, 2).toUpperCase()}
          </span>
          <span className="admin-profile__copy">
            <strong>{auth.user?.name ?? "Admin User"}</strong>
            <small>
              Authenticated session · {brand?.brandDisplayName ?? "All Brands"}
            </small>
          </span>
          <ChevronDown aria-hidden="true" />
        </button>
      </div>

      <span className="admin-sr-only" role="status" aria-live="polite">
        {notice}
      </span>
    </header>
  );
}
