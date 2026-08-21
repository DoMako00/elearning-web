import { repositoryErr, repositoryOk, type RepositoryResult } from "../../../core/persistence";
import type { M1EducationalBrandReadRepository } from "../../../core/repositories";
import type { AdminOverviewSnapshot } from "../in-memory-admin-read-models";
import type {
  AdminOverviewReadModel,
  AdminOverviewReadModelInput,
  AdminOverviewReadModelOutput,
} from "./admin-overview-read-model";

const emptyCounts: AdminOverviewSnapshot["counts"] = {
  pendingPaymentReviews: 0,
  pendingRefunds: 0,
  suspiciousSecurityEvents: 0,
  activeSubscriptions: 0,
  expiredSubscriptions: 0,
  activeGrants: 0,
  revokedGrants: 0,
  contentAwaitingRelease: 0,
  assessmentsAwaitingReview: 0,
};

function isSupportedBrandCode(value: string): value is "medway" | "elite" {
  return value === "medway" || value === "elite";
}

/**
 * M1-backed overview adapter. M1 resolves the active brand only; all current
 * overview cards require later commerce, access, content, and audit domains.
 */
export class PostgresAdminOverviewReadModel implements AdminOverviewReadModel {
  constructor(private readonly educationalBrands: M1EducationalBrandReadRepository) {}

  async getOverview(
    input: AdminOverviewReadModelInput,
  ): Promise<RepositoryResult<AdminOverviewReadModelOutput>> {
    if (!isSupportedBrandCode(input.brandCode)) {
      return repositoryErr({
        code: "brand_not_found",
        message: "A supported active brand is required for the admin overview.",
        correlationId: input.correlationId,
      });
    }

    const brandResult = await this.educationalBrands.findEducationalBrandByCode({
      code: input.brandCode,
      correlationId: input.correlationId,
    });
    if (!brandResult.ok) {
      return repositoryErr({
        code: brandResult.error.code === "not_found" ? "brand_not_found" : brandResult.error.code,
        message: brandResult.error.code === "not_found"
          ? "No active brand is available for the admin overview."
          : "Admin overview data is unavailable.",
        correlationId: input.correlationId,
      });
    }
    if (brandResult.value.status !== "active") {
      return repositoryErr({
        code: "brand_not_found",
        message: "No active brand is available for the admin overview.",
        correlationId: input.correlationId,
      });
    }

    const brand = {
      brandId: brandResult.value.id,
      brandCode: brandResult.value.code,
      brandDisplayName: brandResult.value.name,
    };
    return repositoryOk({
      brand,
      platform: {
        platformId: brand.brandId,
        platformCode: brand.brandCode,
        platformDisplayName: brand.brandDisplayName,
      },
      counts: emptyCounts,
      recent: { auditLogs: [], adminActions: [], securityEvents: [] },
    });
  }
}
