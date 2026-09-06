import { useState } from "react";
import { eliteBrand, medwayBrand } from "../api";
import type { AdminBrandContext, AdminBrandView, AdminPlatformContext } from "../api";

export function brandToPlatform(brand: AdminBrandContext): AdminPlatformContext { return { platformId: brand.platformId ?? brand.brandId, platformCode: brand.platformCode ?? brand.brandCode, platformDisplayName: brand.brandDisplayName }; }
const availableBrands: readonly AdminBrandContext[] = [medwayBrand, eliteBrand];
export function useAdminBrand() {
  const [brandView, setBrandView] = useState<AdminBrandView>("all");
  const brand = brandView === "all" ? undefined : availableBrands.find((item) => item.brandCode === brandView) ?? medwayBrand;
  return { brand, brandView, setBrandView, availableBrands, platform: brand ? brandToPlatform(brand) : undefined, brandCode: brand?.brandCode, setBrandCode: setBrandView, platformCode: brand?.brandCode, availablePlatforms: availableBrands.map(brandToPlatform), setPlatformCode: setBrandView };
}
