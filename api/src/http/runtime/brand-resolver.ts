import type { AdminBrandCode } from "../../contracts/admin";
import { fail, ok, type Result } from "../../shared";
export interface BrandResolutionError { readonly code: "brand_required" | "brand_invalid"; readonly message: string; readonly correlationId: string; }
/** Query resolution is temporary skeleton behavior; production must use trusted server-side brand resolution. */
export function resolveBrandFromRequestUrl(url: string, correlationId: string): Result<AdminBrandCode, BrandResolutionError> { const value = new URL(url, "http://localhost").searchParams.get("brand"); if (!value) return fail({ code: "brand_required", message: "A brand query parameter is required.", correlationId }); if (value !== "medway" && value !== "elite") return fail({ code: "brand_invalid", message: "The requested brand is not supported.", correlationId }); return ok(value); }
