import { useCallback, useEffect, useMemo, useState } from "react";
import { createAdminError } from "../api/adminApi.errors";
import { createAdminApiFromEnvironment, getAdminDataSource } from "../api";
import type { AdminError, AdminOverview, AdminPlatformContext } from "../api";

function nextCorrelationId(platformCode: string) { return `admin-${platformCode}-${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Date.now()}`; }
export function useAdminOverview(platformOverride?: AdminPlatformContext) {
  // API mode is skeleton-only; selected frontend brand remains presentation context, never authorization.
  const api = useMemo(() => createAdminApiFromEnvironment(), []);
  const dataSource = useMemo(() => getAdminDataSource(), []);
  const [platform, setPlatform] = useState<AdminPlatformContext | undefined>(platformOverride);
  const [data, setData] = useState<AdminOverview>();
  const [error, setError] = useState<AdminError>();
  const [loading, setLoading] = useState(false);
  const [correlationId, setCorrelationId] = useState("");
  const load = useCallback(async (requestedPlatform: AdminPlatformContext) => {
    const requestCorrelationId = nextCorrelationId(requestedPlatform.platformCode);
    setPlatform(requestedPlatform); setCorrelationId(requestCorrelationId); setLoading(true); setError(undefined);
    const response = await api.getOverview(requestedPlatform, requestCorrelationId);
    if ("data" in response) setData(response.data); else { setData(undefined); setError(response.error); }
    setLoading(false);
  }, [api]);
  useEffect(() => {
    if (!platformOverride) return;
    void load(platformOverride).catch(() => { const id = correlationId || nextCorrelationId(platformOverride.platformCode); setError(createAdminError("unknown_error", "The admin overview could not be loaded.", id)); setData(undefined); setLoading(false); });
  }, [load, platformOverride]);
  const retry = useCallback(() => { if (platform) void load(platform); }, [load, platform]);
  return { data, error, loading, retry, correlationId, dataSource };
}