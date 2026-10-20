/**
 * Canonical Brand → academic Institution rule.
 *
 * Medway and Elite are BUC brands and share its curriculum; Nexus belongs to
 * Delta University. Brands and institutions are different concepts and this
 * is the single place the permitted combinations are encoded.
 */
export type BrandCode = "medway" | "elite" | "nexus";
export type InstitutionCode = "buc" | "delta";

export const BRAND_CODES: readonly BrandCode[] = ["medway", "elite", "nexus"];

const BRAND_INSTITUTION: Readonly<Record<BrandCode, InstitutionCode>> = {
  medway: "buc",
  elite: "buc",
  nexus: "delta",
};

const BRAND_DISPLAY_NAMES: Readonly<Record<BrandCode, string>> = {
  medway: "Medway",
  elite: "Elite",
  nexus: "Nexus",
};

export function normalizeCode(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isBrandCode(value: unknown): value is BrandCode {
  return (BRAND_CODES as readonly string[]).includes(normalizeCode(value));
}

export function toBrandCode(value: unknown): BrandCode | null {
  const normalized = normalizeCode(value);
  return isBrandCode(normalized) ? normalized : null;
}

export function institutionCodeForBrand(brand: BrandCode | "all"): InstitutionCode | undefined {
  return brand === "all" ? undefined : BRAND_INSTITUTION[brand];
}

/** True only for the three permitted Brand/Institution combinations. */
export function isValidBrandInstitution(brand: unknown, institutionCode: unknown): boolean {
  const brandCode = toBrandCode(brand);
  if (!brandCode) return false;
  return BRAND_INSTITUTION[brandCode] === normalizeCode(institutionCode);
}

export function brandDisplayName(brand: BrandCode): string {
  return BRAND_DISPLAY_NAMES[brand];
}

// Display names as seeded in app.academic_institutions (backend imports 028/030).
const INSTITUTION_DISPLAY_NAMES: Readonly<Record<InstitutionCode, string>> = {
  buc: "BUC",
  delta: "Delta University",
};

export function institutionDisplayName(institution: InstitutionCode): string {
  return INSTITUTION_DISPLAY_NAMES[institution];
}
