import { useEffect, useState } from "react";
import { env } from "../../../app/config/env";
import {
  adminDeliveryRequest,
  AdminDeliveryError,
  catalogueBrandAccessPath,
  type CatalogueBrand,
} from "../api/adminDelivery.http";
import { eliteBrand, medwayBrand, nexusBrand } from "../api";
import type {
  AdminBrandCode,
  AdminBrandContext,
  AdminBrandView,
  AdminPlatformContext,
} from "../api";

const previewBrands: readonly AdminBrandContext[] = [
  medwayBrand,
  eliteBrand,
  nexusBrand,
];

function isAdminBrandCode(code: string): code is AdminBrandCode {
  return code === "medway" || code === "elite" || code === "nexus";
}

function toBrandContext(brand: CatalogueBrand): AdminBrandContext {
  if (!isAdminBrandCode(brand.code)) {
    throw new Error("The API returned an unsupported commercial brand.");
  }

  return {
    brandId: brand.id,
    brandCode: brand.code,
    brandDisplayName: brand.name,
    platformId: brand.id,
    platformCode: brand.code,
  };
}

function toAdminBrandView(
  brands: readonly AdminBrandContext[],
): AdminBrandView {
  return brands.length === 1 ? brands[0].brandCode : "all";
}

export function brandToPlatform(
  brand: AdminBrandContext,
): AdminPlatformContext {
  return {
    platformId: brand.platformId ?? brand.brandId,
    platformCode: brand.platformCode ?? brand.brandCode,
    platformDisplayName: brand.brandDisplayName,
  };
}

export function useAdminBrand(enabled = true) {
  const [brandView, setBrandView] = useState<AdminBrandView>("all");
  const [availableBrands, setAvailableBrands] = useState<
    readonly AdminBrandContext[]
  >(env.adminDataSource === "api" ? [] : previewBrands);
  const [loading, setLoading] = useState(env.adminDataSource === "api");
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    if (env.adminDataSource !== "api") {
      setAvailableBrands(previewBrands);
      setBrandView("all");
      setLoading(false);
      setError("");
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError("");

    void (async () => {
      try {
        const brandRows = await adminDeliveryRequest<CatalogueBrand[]>(
          catalogueBrandAccessPath,
          { signal: controller.signal },
        );
        if (!Array.isArray(brandRows)) {
          throw new Error("The API returned an invalid brand list.");
        }

        const activeBrands = brandRows
          .filter((item) => item.status === "active")
          .map(toBrandContext);

        const scopeChecks = await Promise.all(
          activeBrands.map(async (brand) => {
            const query = new URLSearchParams({
              brand: brand.brandCode,
              page: "1",
              pageSize: "1",
            });

            try {
              await adminDeliveryRequest(
                "/v1/admin/students?" + query.toString(),
                { signal: controller.signal },
              );
              return brand;
            } catch (cause) {
              if (cause instanceof AdminDeliveryError && cause.status === 403) {
                return undefined;
              }
              throw cause;
            }
          }),
        );

        if (controller.signal.aborted) return;

        const authorizedBrands = scopeChecks.filter(
          (item): item is AdminBrandContext => item !== undefined,
        );
        if (authorizedBrands.length === 0) {
          throw new Error("No brand is available to this Admin account.");
        }

        setAvailableBrands(authorizedBrands);
        setBrandView((current) => {
          if (authorizedBrands.some((item) => item.brandCode === current))
            return current;
          return current === "all" && authorizedBrands.length > 1
            ? "all"
            : toAdminBrandView(authorizedBrands);
        });
      } catch (cause) {
        if (!controller.signal.aborted) {
          setAvailableBrands([]);
          setError(
            cause instanceof Error
              ? cause.message
              : "Authorized Admin brand context could not be loaded.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [enabled, revision]);

  const brand =
    brandView === "all"
      ? undefined
      : availableBrands.find((item) => item.brandCode === brandView);

  return {
    brand,
    brandView,
    setBrandView,
    availableBrands,
    platform: brand ? brandToPlatform(brand) : undefined,
    brandCode: brand?.brandCode,
    setBrandCode: setBrandView,
    platformCode: brand?.brandCode,
    availablePlatforms: availableBrands.map(brandToPlatform),
    setPlatformCode: setBrandView,
    loading,
    error,
    retry: () => setRevision((value) => value + 1),
  };
}
