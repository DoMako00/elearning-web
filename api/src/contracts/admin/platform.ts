import type { EntityId } from "./common";

/** @deprecated Compatibility alias. Medway/Elite are brands inside one platform. Use AdminBrand* for new admin contracts. */
export type AdminPlatformCode = "medway" | "elite";
/** @deprecated Compatibility alias. Medway/Elite are brands inside one platform. Use AdminBrandContext for new admin contracts. */
export interface AdminPlatformContext { platformId: EntityId; platformCode: AdminPlatformCode; platformDisplayName?: string; }
/** @deprecated Compatibility alias for brand-scoped records. */
export interface AdminPlatformScoped { platform: AdminPlatformContext; }
/** @deprecated Compatibility alias for brand-scoped entities. */
export interface AdminPlatformScopedEntity extends AdminPlatformScoped { id: EntityId; }