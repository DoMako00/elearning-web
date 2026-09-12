import type { BrandScopedLookup, MediaAssetId, ResourceId } from "../persistence";
import type { RepositoryResult } from "../persistence";

export interface MediaAssetReference {
  readonly mediaAssetId: MediaAssetId;
  readonly resourceId: ResourceId;
  readonly brandId: string;
  readonly providerReference: string;
}

export interface MediaPolicyReference {
  readonly policyReference: string;
  readonly requiresShortLivedAuthorization: boolean;
}

export interface MediaAuthorizationDecision {
  readonly mediaAssetId: MediaAssetId;
  readonly allowed: boolean;
  readonly decisionReference: string;
  readonly expiresAt?: string;
}

export interface WatermarkPolicyReference {
  readonly policyReference: string;
  readonly enabled: boolean;
}

export interface ProtectedMediaAuthorizationRepository {
  findMediaAssetById(input: BrandScopedLookup<MediaAssetId>): Promise<RepositoryResult<MediaAssetReference>>;
  findMediaPolicyForResource(input: BrandScopedLookup<ResourceId>): Promise<RepositoryResult<MediaPolicyReference>>;
  recordMediaAuthorizationDecision(input: {
    readonly mediaAssetId: MediaAssetId;
    readonly brand: BrandScopedLookup<MediaAssetId>["brand"];
    readonly allowed: boolean;
    readonly decisionReference: string;
    readonly correlationId?: string;
  }): Promise<RepositoryResult<void>>;
  findWatermarkPolicyForResource(input: BrandScopedLookup<ResourceId>): Promise<RepositoryResult<WatermarkPolicyReference>>;
}

