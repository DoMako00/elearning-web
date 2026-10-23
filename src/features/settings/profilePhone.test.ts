import { describe, expect, it } from "vitest";
import { normalizeStudentPhone, splitStudentPhone } from "./profilePhone";

describe("student settings phone numbers", () => {
  it("defaults an empty profile to Egypt's calling code and keeps the field optional", () => {
    expect(splitStudentPhone(null)).toEqual({ countryCode: "+20", nationalNumber: "" });
    expect(normalizeStudentPhone("+20", "")).toBeNull();
  });

  it("splits a stored international number and normalizes a local Egyptian number", () => {
    expect(splitStudentPhone("+201012345678")).toEqual({ countryCode: "+20", nationalNumber: "1012345678" });
    expect(normalizeStudentPhone("+20", "010 1234 5678")).toBe("+201012345678");
  });

  it("preserves a fully qualified number pasted into the input", () => {
    expect(normalizeStudentPhone("+20", "+44 20 7946 0958")).toBe("+442079460958");
  });

  it("rejects an incomplete non-empty number instead of silently clearing it", () => {
    expect(() => normalizeStudentPhone("+20", "123")).toThrow(/valid phone number/i);
  });
});
