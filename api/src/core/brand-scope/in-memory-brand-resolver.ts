import { repositoryErr, repositoryOk, type RepositoryResult } from "../persistence";
import type {
  BrandCode,
  BrandId,
  BrandResolutionInput,
  BrandResolver,
  BrandScope,
} from "./brand-scope";

const brandFixtures: readonly BrandScope[] = [
  { brandId: "brand-medway" as BrandId, brandCode: "medway", brandDisplayName: "Medway", isActive: true },
  { brandId: "brand-elite" as BrandId, brandCode: "elite", brandDisplayName: "Elite", isActive: true },
];

function normalizeCode(value: string | undefined): BrandCode | undefined {
  if (value === "medway" || value === "elite") return value;
  return undefined;
}

function normalizeId(value: string | undefined): BrandCode | undefined {
  if (value === "brand-medway" || value === "platform-medway") return "medway";
  if (value === "brand-elite" || value === "platform-elite") return "elite";
  return undefined;
}

export class InMemoryBrandResolver implements BrandResolver {
  constructor(private readonly brands: readonly BrandScope[] = brandFixtures) {}

  async resolveBrand(input: BrandResolutionInput): Promise<RepositoryResult<BrandScope>> {
    const code = normalizeCode(input.requestedBrandCode) ?? normalizeId(input.requestedBrandId);
    if (!code) {
      return repositoryErr({
        code: "brand_not_found",
        message: "A supported active brand is required.",
        correlationId: input.correlationId,
      });
    }
    const brand = this.brands.find((candidate) => candidate.brandCode === code && candidate.isActive);
    return brand
      ? repositoryOk(brand)
      : repositoryErr({ code: "brand_not_found", message: "Brand is not active or does not exist.", correlationId: input.correlationId });
  }

  assertTargetBrand(context: BrandScope, targetBrand: BrandScope): RepositoryResult<void> {
    return context.brandCode === targetBrand.brandCode && context.brandId === targetBrand.brandId
      ? repositoryOk(undefined)
      : repositoryErr({
          code: "target_brand_mismatch",
          message: "Target brand does not match the active brand.",
          brandCode: context.brandCode,
          brandId: context.brandId,
        });
  }
}

export const createInMemoryBrandResolver = (): InMemoryBrandResolver => new InMemoryBrandResolver();
