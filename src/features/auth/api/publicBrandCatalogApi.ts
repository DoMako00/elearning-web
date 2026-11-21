import { env } from "../../../app/config/env";
import { BRAND_CODES, brandDisplayName } from "../../../shared/domain/brandInstitution";

export interface PublicBrand {
  code: string;
  name: string;
  description: string;
  logoUrl?: string;
  status: string;
}

const fallbackBrands: PublicBrand[] = BRAND_CODES.map((code) => ({
  code,
  name: brandDisplayName(code),
  description: `${brandDisplayName(code)} learning workspace`,
  status: "active",
}));

/** Public catalog contract: { ok, correlationId, data: { brands: [...] } }. */
export const PUBLIC_BRAND_CATALOG_ENDPOINT = "/v1/public/brands";

function brandRows(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;
  if (Array.isArray(record.items)) return record.items;
  if (Array.isArray(record.brands)) return record.brands;
  if (record.data && typeof record.data === "object") return brandRows(record.data);
  return [];
}

function normalizeBrand(value: unknown): PublicBrand | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const code = [item.code, item.brandCode, item.slug].find((candidate) => typeof candidate === "string" && candidate.trim());
  const name = [item.name, item.displayName, item.brandName, item.brandDisplayName].find((candidate) => typeof candidate === "string" && candidate.trim());
  const status = typeof item.status === "string" ? item.status : "active";
  if (typeof code !== "string" || typeof name !== "string" || status.toLowerCase() !== "active") return null;
  return {
    code: code.trim(),
    name: name.trim(),
    description: typeof item.description === "string" ? item.description : `${name.trim()} learning workspace`,
    ...(typeof item.logoUrl === "string" && item.logoUrl.startsWith("https://") ? { logoUrl: item.logoUrl } : {}),
    status,
  };
}

export async function listPublicBrands(signal?: AbortSignal): Promise<{ brands: PublicBrand[]; source: "api" | "fallback" }> {
  if (!PUBLIC_BRAND_CATALOG_ENDPOINT) return { brands: fallbackBrands, source: "fallback" };
  if (!env.apiBaseUrl) throw new Error("The brand catalog API is not configured for this deployment.");
  const response = await fetch(`${env.apiBaseUrl.replace(/\/$/, "")}${PUBLIC_BRAND_CATALOG_ENDPOINT}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal,
  });
  const payload = await response.json().catch(() => null) as unknown;
  if (!response.ok) throw new Error("Available learning brands could not be loaded.");
  const brands = brandRows(payload).map(normalizeBrand).filter((brand): brand is PublicBrand => brand !== null);
  if (!brands.length) throw new Error("The brand catalog did not return any active brands.");
  return { brands, source: "api" };
}

export function getFallbackPublicBrands() {
  return fallbackBrands;
}
