import { describe, expect, it } from "vitest";
import {
  brandDisplayName,
  institutionCodeForBrand,
  isBrandCode,
  isValidBrandInstitution,
  toBrandCode,
} from "./brandInstitution";
import { institutionCodeForBrand as adminInstitutionCodeForBrand } from "../../features/admin-v2/data/adminV2.selectors";

describe("brand → institution mapping", () => {
  it("maps Medway to BUC", () => expect(institutionCodeForBrand("medway")).toBe("buc"));
  it("maps Elite to BUC", () => expect(institutionCodeForBrand("elite")).toBe("buc"));
  it("maps Nexus to Delta", () => expect(institutionCodeForBrand("nexus")).toBe("delta"));
  it("has no institution for the admin 'all' filter", () => expect(institutionCodeForBrand("all")).toBeUndefined());

  it("is the same rule the admin selectors use (single source of truth)", () => {
    expect(adminInstitutionCodeForBrand).toBe(institutionCodeForBrand);
  });

  it.each([
    ["medway", "buc"],
    ["elite", "buc"],
    ["nexus", "delta"],
    ["Nexus", " DELTA "],
  ])("accepts the permitted pair %s / %s", (brand, institution) => {
    expect(isValidBrandInstitution(brand, institution)).toBe(true);
  });

  it.each([
    ["nexus", "buc"],
    ["medway", "delta"],
    ["elite", "delta"],
    ["greenlearn", "buc"],
    ["default", "delta"],
    ["", ""],
    [null, "buc"],
    ["medway", undefined],
  ])("rejects the invalid pair %s / %s", (brand, institution) => {
    expect(isValidBrandInstitution(brand, institution)).toBe(false);
  });

  it("normalises and validates brand codes", () => {
    expect(toBrandCode(" NEXUS ")).toBe("nexus");
    expect(toBrandCode("default")).toBeNull();
    expect(isBrandCode("elite")).toBe(true);
    expect(isBrandCode(42)).toBe(false);
    expect(brandDisplayName("nexus")).toBe("Nexus");
  });
});
