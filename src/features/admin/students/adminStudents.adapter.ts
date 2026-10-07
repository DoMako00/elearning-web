import { useCallback, useEffect, useMemo, useState } from "react";
import { createAdminApiFromEnvironment, getAdminDataSource } from "../api";
import type {
  AdminApi,
  AdminBrandCode,
  AdminBrandContext,
  AdminError,
  AdminPlatformContext,
  AdminStudentDetail,
  AdminStudentListItem,
  AdminStudentStatus,
} from "../api";
import { brandToPlatform } from "../hooks/useAdminBrand";

export type AdminStudentBrand = AdminBrandCode;
export type AdminStudentRow = AdminStudentListItem;
export type AdminStudentDeviceSummary = Pick<
  AdminStudentDetail,
  "activeDeviceCount" | "activeSessionCount"
>;
export type AdminStudentActivitySummary = Pick<
  AdminStudentDetail,
  "lastSeenAt" | "learning"
>;
export interface AdminStudentStats {
  activeStudents: number;
  medwayStudents: number;
  eliteStudents: number;
  nexusStudents: number;
}
export interface AdminStudentsDataset {
  rows: readonly AdminStudentRow[];
  stats: AdminStudentStats;
  mode: "preview" | "api";
}

const correlation = (name: string) =>
  `admin-students-${name}-${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Date.now()}`;
const isFailure = <T>(
  value: { data: T } | { success: false; error: AdminError },
): value is { success: false; error: AdminError } =>
  "success" in value && value.success === false;
type StudentListResult = Awaited<ReturnType<AdminApi["searchStudents"]>>;
type StudentListFailure = Extract<StudentListResult, { success: false }>;
type StudentPageResult =
  { readonly data: readonly AdminStudentListItem[] } | StudentListFailure;
const isStudentListFailure = (
  value: StudentPageResult,
): value is StudentListFailure => "success" in value && value.success === false;

function statsFor(rows: readonly AdminStudentRow[]): AdminStudentStats {
  return {
    activeStudents: rows.filter((row) => row.status === "active").length,
    medwayStudents: rows.filter((row) => row.platform.platformCode === "medway")
      .length,
    eliteStudents: rows.filter((row) => row.platform.platformCode === "elite")
      .length,
    nexusStudents: rows.filter((row) => row.platform.platformCode === "nexus")
      .length,
  };
}

export function useAdminStudents(
  brand?: AdminBrandContext,
  availableBrands: readonly AdminBrandContext[] = [],
  filters: Readonly<{
    search: string;
    status: "all" | AdminStudentStatus;
    brandCode: "all" | AdminBrandCode;
  }> = { search: "", status: "all", brandCode: "all" },
) {
  const api = useMemo(() => createAdminApiFromEnvironment(), []);
  const source = useMemo(() => getAdminDataSource(), []);
  const targets = useMemo<readonly AdminPlatformContext[]>(() => {
    if (filters.brandCode !== "all") {
      return availableBrands
        .filter((item) => item.brandCode === filters.brandCode)
        .map(brandToPlatform);
    }
    return brand
      ? [brandToPlatform(brand)]
      : availableBrands.map(brandToPlatform);
  }, [availableBrands, brand, filters.brandCode]);
  const [dataset, setDataset] = useState<AdminStudentsDataset>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminError>();

  const load = useCallback(async () => {
    if (!targets.length) {
      setDataset({
        rows: [],
        stats: statsFor([]),
        mode: source === "mock" ? "preview" : "api",
      });
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(undefined);
    const responses: StudentPageResult[] = await Promise.all(
      targets.map(async (platform) => {
        const collected: AdminStudentListItem[] = [];
        let page = 1;
        let totalItems = Number.POSITIVE_INFINITY;
        while (collected.length < totalItems) {
          const response = await api.searchStudents({
            platform,
            correlationId: correlation(`${platform.platformCode}-${page}`),
            search: filters.search.trim() || undefined,
            status: filters.status === "all" ? undefined : filters.status,
            pagination: { page, pageSize: 100 },
          });
          if (isStudentListFailure(response)) return response;
          collected.push(...response.data);
          totalItems = response.pagination.totalItems;
          if (response.data.length === 0) break;
          page += 1;
        }
        return { data: collected };
      }),
    );
    const failed = responses.find(isStudentListFailure);
    if (failed) {
      setDataset(undefined);
      setError(failed.error);
      setLoading(false);
      return;
    }
    const rows = responses.flatMap((response) =>
      "data" in response ? response.data : [],
    );
    setDataset({
      rows,
      stats: statsFor(rows),
      mode: source === "mock" ? "preview" : "api",
    });
    setLoading(false);
  }, [api, filters.search, filters.status, source, targets]);

  useEffect(() => {
    void load().catch(() => {
      setError({
        code: "unknown_error",
        message: "Student records could not be loaded.",
        correlationId: correlation("load"),
      });
      setLoading(false);
    });
  }, [load]);
  return { dataset, loading, error, retry: load, api };
}

export async function loadAdminStudentDetail(
  api: ReturnType<typeof createAdminApiFromEnvironment>,
  row: AdminStudentRow,
): Promise<AdminStudentDetail | undefined> {
  const response = await api.getStudent({
    platform: row.platform,
    id: row.id,
    correlationId: correlation("detail"),
  });
  return isFailure(response) ? undefined : response.data;
}

export const studentStatusLabel: Record<AdminStudentStatus, string> = {
  active: "Active",
  pending: "Pending",
  disabled: "Disabled",
  suspended: "Suspended",
};
