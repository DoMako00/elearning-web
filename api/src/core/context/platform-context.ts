import type { AdminBrandCode } from "../../contracts/admin";

export type BrandResolutionSource = "trusted_host" | "trusted_header" | "route_scope" | "test_fixture";
/** Canonical resolved Medway/Elite brand scope inside the single application platform. */
export interface AdminResolvedBrandContext { readonly brandId: string; readonly brandCode: AdminBrandCode; readonly brandDisplayName: string; readonly resolvedFrom: BrandResolutionSource; readonly isActive: boolean; }
/** @deprecated Compatibility alias. This represents a brand scope, not a separate technical platform. */
export interface AdminResolvedPlatformContext extends AdminResolvedBrandContext { readonly platformId: string; readonly platformCode: AdminBrandCode; readonly platformDisplayName: string; }