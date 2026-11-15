import { afterEach, describe, expect, it, vi } from "vitest";
import { isChunkLoadError, recoverMissingChunk } from "./chunkRecovery";

describe("missing route chunk recovery", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("recognizes browser lazy import failures without treating other errors as missing chunks", () => {
    expect(isChunkLoadError(new TypeError("Failed to fetch dynamically imported module: https://example.test/assets/page.js"))).toBe(true);
    expect(isChunkLoadError(new Error("error loading dynamically imported module"))).toBe(true);
    expect(isChunkLoadError(new Error("permission denied"))).toBe(false);
  });

  it("reloads at most once during the cooldown", () => {
    let stored: string | null = null;
    const reload = vi.fn();
    vi.stubGlobal("sessionStorage", { getItem: () => stored, setItem: (_key: string, value: string) => { stored = value; } });
    vi.stubGlobal("location", { reload });
    expect(recoverMissingChunk(100_000)).toBe(true);
    expect(recoverMissingChunk(100_001)).toBe(false);
    expect(recoverMissingChunk(160_000)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it("does not risk a reload loop if session storage is unavailable", () => {
    const reload = vi.fn();
    vi.stubGlobal("sessionStorage", { getItem: () => { throw new Error("unavailable"); } });
    vi.stubGlobal("location", { reload });
    expect(recoverMissingChunk()).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});
