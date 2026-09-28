import { repositoryErr, repositoryOk, type RepositoryResult } from "../../../core/persistence";
import type { AdminReadModels } from "../in-memory-admin-read-models";
import type {
  AdminOverviewReadModel,
  AdminOverviewReadModelInput,
  AdminOverviewReadModelOutput,
} from "./admin-overview-read-model";

const canonicalBrandIds = {
  medway: "brand-medway",
  elite: "brand-elite",
} as const;

type SupportedBrandCode = keyof typeof canonicalBrandIds;

function isSupportedBrandCode(value: string): value is SupportedBrandCode {
  return value === "medway" || value === "elite";
}

/**
 * Mock-only adapter around the current overview store. A future persisted adapter
 * can implement AdminOverviewReadModel behind ADMIN_READ_MODEL_SOURCE=mock|postgres.
 */
export class InMemoryAdminOverviewReadModel implements AdminOverviewReadModel {
  constructor(private readonly readModels: AdminReadModels) {}

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

    const canonicalBrandId = canonicalBrandIds[input.brandCode];
    if (input.brandId && input.brandId !== canonicalBrandId) {
      return repositoryErr({
        code: "brand_mismatch",
        message: "The supplied brand identifier does not match the requested brand.",
        correlationId: input.correlationId,
      });
    }

    const overview = this.readModels.getOverview(canonicalBrandId);
    if (!overview) {
      return repositoryErr({
        code: "brand_not_found",
        message: "No admin overview is available for the requested brand.",
        correlationId: input.correlationId,
      });
    }

    if (overview.brand.brandId !== canonicalBrandId || overview.brand.brandCode !== input.brandCode) {
      return repositoryErr({
        code: "brand_mismatch",
        message: "The admin overview does not match the requested brand scope.",
        correlationId: input.correlationId,
      });
    }

    return repositoryOk(overview);
  }
}
