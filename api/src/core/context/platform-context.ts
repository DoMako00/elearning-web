import type { AdminPlatformCode } from "../../contracts/admin";

export type PlatformResolutionSource = "trusted_host" | "trusted_header" | "route_scope" | "test_fixture";
export interface AdminResolvedPlatformContext { readonly platformId: string; readonly platformCode: AdminPlatformCode; readonly platformDisplayName: string; readonly resolvedFrom: PlatformResolutionSource; readonly isActive: boolean; }