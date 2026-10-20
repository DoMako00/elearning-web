import { describe, expect, it } from "vitest";
import { safeInternalPath } from "./safeInternalPath";

describe("safeInternalPath (notification deep links)", () => {
  it("allows in-app paths", () => {
    expect(safeInternalPath("/assignments/abc?x=1#y")).toBe("/assignments/abc?x=1#y");
  });

  it.each([
    "https://evil.example/phish",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    "assignments",
    "",
    null,
    undefined,
  ])("rejects %s", (value) => {
    expect(safeInternalPath(value as string | null | undefined)).toBeNull();
  });
});
