import { useCallback, useEffect, useMemo, useState } from "react";
import { createAdminError } from "../api/adminApi.errors";
import { createAdminApiFromEnvironment, getAdminDataSource } from "../api";
import type { AdminError, AdminOverview, AdminPlatformContext } from "../api";
import { aggregateLiveAdminOverviews } from "../api/adminOverview.live";

function nextCorrelationId(platformCode: string) { return `admin-${platformCode}-${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Date.now()}`; }
const targetKey = (targets: readonly AdminPlatformContext[]) => targets.map((target) => target.platformCode).join("|");

export function useAdminOverview(platformTargets: readonly AdminPlatformContext[]) {
  const api = useMemo(() => createAdminApiFromEnvironment(), []);
  const dataSource = useMemo(() => getAdminDataSource(), []);
  const [targets, setTargets] = useState<readonly AdminPlatformContext[]>(platformTargets);
  const [data, setData] = useState<AdminOverview>();
  const [error, setError] = useState<AdminError>();
  const [loading, setLoading] = useState(false);
  const [correlationId, setCorrelationId] = useState("");

  const load = useCallback(async (requestedTargets: readonly AdminPlatformContext[]) => {
    const firstTarget = requestedTargets[0];
    if (!firstTarget) return;
    const requestCorrelationId = nextCorrelationId(requestedTargets.length > 1 ? "all" : firstTarget.platformCode);
    setTargets(requestedTargets); setCorrelationId(requestCorrelationId); setLoading(true); setError(undefined);
    const responses = await Promise.all(requestedTargets.map((target) => api.getOverview(target, nextCorrelationId(target.platformCode))));
    const successful = responses.flatMap((response) => "data" in response ? [response.data] : []);
    if (successful.length === 1 && requestedTargets.length === 1) setData(successful[0]);
    else if (successful.length > 0) setData(aggregateLiveAdminOverviews(successful));
    else {
      const failed = responses.find((response) => !("data" in response));
      setData(undefined);
      setError("error" in (failed ?? {}) ? (failed as { error: AdminError }).error : createAdminError("unknown_error", "The admin overview could not be loaded.", requestCorrelationId));
    }
    setLoading(false);
  }, [api]);

  useEffect(() => {
    if (!platformTargets.length) return;
    void load(platformTargets).catch(() => {
      const id = correlationId || nextCorrelationId(platformTargets.length > 1 ? "all" : platformTargets[0]?.platformCode ?? "admin");
      setError(createAdminError("unknown_error", "The admin overview could not be loaded.", id)); setData(undefined); setLoading(false);
    });
  }, [load, targetKey(platformTargets)]);

  const retry = useCallback(() => { if (targets.length) void load(targets); }, [load, targets]);
  return { data, error, loading, retry, correlationId, dataSource };
}
