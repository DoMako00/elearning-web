import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Search, ShieldCheck, type LucideIcon } from "lucide-react";
import {
  createAdminApiFromEnvironment,
  getAdminDataSource,
  type AdminApi,
  type AdminBrandContext,
  type AdminSecurityEventItem,
  type AdminPlatformContext,
  type AdminListResponse,
} from "../api";
import { brandToPlatform } from "../hooks/useAdminBrand";
import { WorkspaceMetric } from "./AdminWorkspacePrimitives";
type ReadResult<T> = AdminListResponse<T> | { success: false };
type ListLoader<T> = (
  api: AdminApi,
  platform: AdminPlatformContext,
) => Promise<ReadResult<T>>;

export const clientRequestId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `admin-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const request = (platform: AdminPlatformContext) => ({
  platform,
  correlationId: clientRequestId(),
  pagination: { page: 1, pageSize: 50 },
});

export const readSecurity: ListLoader<AdminSecurityEventItem> = (
  api,
  platform,
) => api.listSecurityEvents(request(platform));

export const date = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Unavailable";

export const money = (amount: number, currency: string) =>
  new Intl.NumberFormat("en", { style: "currency", currency }).format(amount);

export const rowKey = (row: { id: string; platform: AdminPlatformContext }) =>
  `${row.platform.platformCode}:${row.id}`;

export function useWorkspaceRecords<T>(load: ListLoader<T>) {
  const { brand, availableBrands } = useOutletContext<{
    brand?: AdminBrandContext;
    availableBrands: readonly AdminBrandContext[];
  }>();
  const api = useMemo(createAdminApiFromEnvironment, []);
  const [revision, setRevision] = useState(0);
  const scope = brand?.brandCode ?? "all";
  const [state, setState] = useState<{
    scope: string;
    rows: readonly T[];
    loading: boolean;
    error: boolean;
    total: number;
  }>({ scope, rows: [], loading: true, error: false, total: 0 });
  useEffect(() => {
    let active = true;
    setState({ scope, rows: [], loading: true, error: false, total: 0 });
    const targets = brand ? [brand] : availableBrands;
    void Promise.all(
      targets.map((target) => load(api, brandToPlatform(target))),
    )
      .then((responses) => {
        if (!active) return;
        // Never present partial brand results as a complete cross-brand total.
        if (
          !responses.length ||
          responses.some((response) => !("data" in response))
        ) {
          setState({ scope, rows: [], loading: false, error: true, total: 0 });
        } else {
          const lists = responses as AdminListResponse<T>[];
          setState({
            scope,
            rows: lists.flatMap((response) => response.data),
            loading: false,
            error: false,
            total: lists.reduce(
              (sum, response) => sum + response.pagination.totalItems,
              0,
            ),
          });
        }
      })
      .catch(() => {
        if (active)
          setState({ scope, rows: [], loading: false, error: true, total: 0 });
      });
    return () => {
      active = false;
    };
  }, [api, brand, availableBrands, scope, revision, load]);
  const current =
    state.scope === scope
      ? state
      : {
          scope,
          rows: [] as readonly T[],
          loading: true,
          error: false,
          total: 0,
        };
  return {
    ...current,
    preview: getAdminDataSource() === "mock",
    label: brand?.brandDisplayName ?? "All brands",
    retry: () => setRevision((value) => value + 1),
  };
}

export function SourceLabel({
  preview,
  label,
}: {
  preview: boolean;
  label: string;
}) {
  return (
    <div className="admin-workspace-context">
      <span>
        <ShieldCheck aria-hidden="true" />
        {label}
      </span>
      <span
        className={
          preview ? "admin-workspace-preview" : "admin-workspace-readonly"
        }
      >
        {preview ? "Local preview data · not production" : "Live API data"}
      </span>
    </div>
  );
}

export function Toolbar({
  search,
  onSearch,
  statuses,
  status,
  onStatus,
  label,
}: {
  search: string;
  onSearch: (value: string) => void;
  statuses: readonly string[];
  status: string;
  onStatus: (value: string) => void;
  label: string;
}) {
  return (
    <div className="admin-workspace-toolbar">
      <label>
        <Search aria-hidden="true" />
        <span className="admin-sr-only">Search {label}</span>
        <input
          type="search"
          placeholder={`Search ${label}…`}
          value={search}
          onChange={(event) => onSearch(event.target.value)}
        />
      </label>
      <select
        aria-label={`Filter ${label} by status`}
        value={status}
        onChange={(event) => onStatus(event.target.value)}
      >
        <option value="all">All statuses</option>
        {statuses.map((item) => (
          <option key={item} value={item}>
            {item.replaceAll("_", " ")}
          </option>
        ))}
      </select>
      <button type="button" disabled title="Export is not connected">
        Export
      </button>
    </div>
  );
}

export function Metrics({
  values,
}: {
  values: readonly {
    title: string;
    value: string | number;
    icon: LucideIcon;
    note?: string;
  }[];
}) {
  return (
    <div className="admin-workspace-metrics">
      {values.map((item) => (
        <WorkspaceMetric
          key={item.title}
          {...item}
          note={item.note ?? "Within loaded records"}
        />
      ))}
    </div>
  );
}
