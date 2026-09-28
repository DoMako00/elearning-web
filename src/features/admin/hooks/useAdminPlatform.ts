import { useAdminBrand } from "./useAdminBrand";
/** @deprecated Compatibility wrapper. Medway and Elite are brands inside one platform. Use useAdminBrand. */
export function useAdminPlatform() {
  const { platform, platformCode, setPlatformCode, availablePlatforms } = useAdminBrand();
  return { platform, platformCode, setPlatformCode, availablePlatforms };
}