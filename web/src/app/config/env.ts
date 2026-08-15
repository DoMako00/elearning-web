export interface EnvConfig {
  apiBaseUrl: string;
  dashboardEnrollmentState?: DashboardEnrollmentState;
}

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

function normalizeDashboardEnrollmentState(value: string | undefined) {
  const normalized = value?.trim().toLowerCase();

  return normalized && dashboardEnrollmentStates.has(normalized as DashboardEnrollmentState)
    ? (normalized as DashboardEnrollmentState)
    : undefined;
}

export const env: Readonly<EnvConfig> = Object.freeze({
  apiBaseUrl: normalizeUrl(import.meta.env.VITE_API_BASE_URL),
  dashboardEnrollmentState: normalizeDashboardEnrollmentState(
    import.meta.env.VITE_DASHBOARD_ENROLLMENT_STATE,
  ),
});
