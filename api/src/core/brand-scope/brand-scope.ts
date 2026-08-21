import type { RepositoryResult } from "../persistence/repository-result";

export type BrandCode = "medway" | "elite";
export type BrandId = string & { readonly __brandId: unique symbol };

export interface BrandScope {
  readonly brandId: BrandId;
  readonly brandCode: BrandCode;
  readonly brandDisplayName: string;
  readonly isActive: boolean;
}

export interface BrandResolutionInput {
  readonly requestedBrandCode?: string;
  readonly requestedBrandId?: string;
  readonly trustedSelector?: string;
  readonly correlationId?: string;
}

export interface BrandScopeViolation {
  readonly code: "brand_not_found" | "brand_mismatch";
  readonly message: string;
  readonly activeBrand: BrandScope;
  readonly targetBrand: BrandScope | null;
}

export type BrandResolutionResult = RepositoryResult<BrandScope>;

export interface BrandResolver {
  resolveBrand(input: BrandResolutionInput): Promise<BrandResolutionResult>;
  assertTargetBrand(context: BrandScope, targetBrand: BrandScope): RepositoryResult<void>;
}

