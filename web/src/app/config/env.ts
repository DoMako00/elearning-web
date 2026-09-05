export interface EnvConfig {
  apiBaseUrl: string;
  supabaseUrl: string;
  supabasePublishableKey: string;
  adminDataSource: AdminDataSource;
  dashboardEnrollmentState?: DashboardEnrollmentState;
}

export type AdminDataSource = "mock" | "api";

export type DashboardEnrollmentState =
  | "loading"
  | "empty"
  | "enrolled"
  | "error";

const dashboardEnrollmentStates = new Set<DashboardEnrollmentState>([
  "loading",
  "empty",
  "enrolled",
  "error",
]);

function normalizeUrl(value: string | undefined) {
  return value?.trim().replace(/\/$/, "") ?? "";
}

function normalizeAdminDataSource(value: string | undefined): AdminDataSource {
  return value?.trim().toLowerCase() === "api" ? "api" : "mock";
}

function normalizeDashboardEnrollmentState(value: string | undefined) {
  const normalized = value?.trim().toLowerCase();

  return normalized && dashboardEnrollmentStates.has(normalized as DashboardEnrollmentState)
    ? (normalized as DashboardEnrollmentState)
    : undefined;
}

export const env: Readonly<EnvConfig> = Object.freeze({
  apiBaseUrl: normalizeUrl(import.meta.env.VITE_API_BASE_URL),
  supabaseUrl: normalizeUrl(import.meta.env.VITE_SUPABASE_URL),
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "",
  adminDataSource: normalizeAdminDataSource(import.meta.env.VITE_ADMIN_DATA_SOURCE),
  dashboardEnrollmentState: normalizeDashboardEnrollmentState(
    import.meta.env.VITE_DASHBOARD_ENROLLMENT_STATE,
  ),
});
