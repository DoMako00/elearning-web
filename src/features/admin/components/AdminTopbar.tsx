import {
  Bell,
  Crown,
  Layers3,
  LogOut,
  Search,
  ShieldCheck,
} from "lucide-react";
import {
  useMemo,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  adminNavigation,
  getAdminRouteMetadata,
} from "../../../app/pages/admin/adminNavigation";
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
  const [quickSearch, setQuickSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const brandViews = getBrandViews(availableBrands);
  const searchResults = useMemo(() => {
    const query = quickSearch.trim().toLocaleLowerCase();
    if (!query) return [];
    return adminNavigation
      .filter((item) =>
        `${item.label} ${item.description}`.toLocaleLowerCase().includes(query),
      )
      .slice(0, 5);
  }, [quickSearch]);
  function openFirstSearchResult(): void {
    const first = searchResults[0];
    if (!first) return;
    navigate(first.path);
    setQuickSearch("");
    setSearchOpen(false);
  }
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
      <div className="admin-search-wrap">
        <label className="admin-search">
          <span className="admin-sr-only">Find an Admin section</span>
          <Search aria-hidden="true" />
          <input
            type="search"
            placeholder="Find an Admin section"
            value={quickSearch}
            aria-autocomplete="list"
            aria-expanded={searchOpen && searchResults.length > 0}
            aria-controls="admin-section-search-results"
            onFocus={() => setSearchOpen(true)}
            onChange={(event) => {
              setQuickSearch(event.target.value);
              setSearchOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                openFirstSearchResult();
              }
              if (event.key === "Escape") {
                setQuickSearch("");
                setSearchOpen(false);
              }
            }}
            onBlur={() => window.setTimeout(() => setSearchOpen(false), 120)}
          />
          <kbd aria-hidden="true">↵</kbd>
        </label>
        {searchOpen && searchResults.length > 0 && (
          <div
            className="admin-search-results"
            id="admin-section-search-results"
            role="listbox"
            aria-label="Admin sections"
          >
            {searchResults.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  type="button"
                  role="option"
                  aria-selected={false}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    navigate(item.path);
                    setQuickSearch("");
                    setSearchOpen(false);
                  }}
                >
                  <Icon aria-hidden="true" />
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.description}</small>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="admin-topbar__controls">
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
        <button
          className="admin-icon-button"
          type="button"
          aria-label="Notifications are not available yet"
          title="Notifications are not available yet"
          disabled
        >
          <Bell aria-hidden="true" />
        </button>
        <button
          className="admin-icon-button"
          type="button"
          aria-label="Sign out"
          onClick={() => {
            auth.signOut();
            navigate("/auth/sign-in?mode=admin", { replace: true });
          }}
        >
          <LogOut aria-hidden="true" />
        </button>
        <div className="admin-profile" aria-label="Authenticated administrator">
          <span className="admin-profile__avatar">
            {(auth.user?.name ?? "AU").slice(0, 2).toUpperCase()}
          </span>
          <span className="admin-profile__copy">
            <strong>{auth.user?.name ?? "Admin User"}</strong>
            <small>
              Authenticated session · {brand?.brandDisplayName ?? "All Brands"}
            </small>
          </span>
        </div>
      </div>
    </header>
  );
}
