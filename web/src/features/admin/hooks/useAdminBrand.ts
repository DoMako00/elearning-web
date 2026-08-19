import { useState } from "react";
import { eliteBrand, medwayBrand } from "../api";
import type { AdminBrandCode, AdminBrandContext, AdminPlatformContext } from "../api";

export function brandToPlatform(brand: AdminBrandContext): AdminPlatformContext { return { platformId: brand.platformId ?? brand.brandId, platformCode: brand.platformCode ?? brand.brandCode, platformDisplayName: brand.brandDisplayName }; }
const availableBrands: readonly AdminBrandContext[] = [medwayBrand, eliteBrand];
export function useAdminBrand() {
  const [brandCode, setBrandCode] = useState<AdminBrandCode>("medway");
  const brand = availableBrands.find((item) => item.brandCode === brandCode) ?? medwayBrand;
  return { brand, brandCode, setBrandCode, availableBrands, platform: brandToPlatform(brand), platformCode: brandCode, availablePlatforms: availableBrands.map(brandToPlatform), setPlatformCode: setBrandCode };
}