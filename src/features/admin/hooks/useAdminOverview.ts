import { useCallback, useEffect, useMemo, useState } from "react";
import { createAdminError } from "../api/adminApi.errors";
import {
  createAdminApiFromEnvironment,
  getAdminDataSource,
} from "../api";
import type {
  AdminError,
  AdminOverview,
  AdminPlatformContext,
} from "../api";
import { aggregateLiveAdminOverviews } from "../api/adminOverview.live";

function nextCorrelationId(platformCode: string): string {
  const suffix =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now();
  return `admin-${platformCode}-${suffix}`;
}

function targetKey(targets: readonly AdminPlatformContext[]): string {
  return targets.map((target) => target.platformCode).join("|");
}

export function useAdminOverview(
  platformTargets: readonly AdminPlatformContext[],
) {
  const api = useMemo(() => createAdminApiFromEnvironment(), []);
  const dataSource = useMemo(() => getAdminDataSource(), []);
  const [targets, setTargets] = useState(platformTargets);
  const [data, setData] = useState<AdminOverview>();
  const [error, setError] = useState<AdminError>();
  const [loading, setLoading] = useState(false);
  const [correlationId, setCorrelationId] = useState("");

  const load = useCallback(
    async (requestedTargets: readonly AdminPlatformContext[]) => {
      const firstTarget = requestedTargets[0];
      if (!firstTarget) return;

      const isAggregate = requestedTargets.length > 1;
      const requestCorrelationId = nextCorrelationId(
        isAggregate ? "all" : firstTarget.platformCode,
      );
      setTargets(requestedTargets);
      setCorrelationId(requestCorrelationId);
      setLoading(true);
      setError(undefined);

      const responses = await Promise.all(
        requestedTargets.map((target) =>
          api.getOverview(target, nextCorrelationId(target.platformCode)),
        ),
      );
      const failed = responses.find((response) => !("data" in response));

      if (failed) {
        setData(undefined);
        setError(
          "error" in failed
            ? failed.error
            : createAdminError(
                "unknown_error",
                "The admin overview could not be loaded.",
                requestCorrelationId,
              ),
        );
      } else {
        const successful = responses.flatMap((response) =>
          "data" in response ? [response.data] : [],
        );
        setData(
          successful.length === 1
            ? successful[0]
            : aggregateLiveAdminOverviews(successful),
        );
      }

      setLoading(false);
    },
    [api],
  );

  useEffect(() => {
    if (!platformTargets.length) return;

    void load(platformTargets).catch(() => {
      const id =
        correlationId ||
        nextCorrelationId(
          platformTargets.length > 1
            ? "all"
            : (platformTargets[0]?.platformCode ?? "admin"),
        );
      setError(
        createAdminError(
          "unknown_error",
          "The admin overview could not be loaded.",
          id,
        ),
      );
      setData(undefined);
      setLoading(false);
    });
  }, [load, targetKey(platformTargets)]);

  const retry = useCallback(() => {
    if (targets.length) void load(targets);
  }, [load, targets]);

  return { data, error, loading, retry, correlationId, dataSource };
}
