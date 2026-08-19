import type { EntityId } from "./common";

/** Canonical business identity inside the single e-learning platform. */
export type AdminBrandCode = "medway" | "elite";
export interface AdminBrandContext { brandId: EntityId; brandCode: AdminBrandCode; brandDisplayName: string; }
export interface AdminBrandScoped { brandId: EntityId; brandCode: AdminBrandCode; }
export interface AdminBrandScopedEntity extends AdminBrandScoped { id: EntityId; }
export interface AdminBrandIdentity extends AdminBrandContext { logoReference?: string; themeReference?: string; primaryColor?: string; accentColor?: string; }