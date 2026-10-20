import { afterEach, describe, expect, it, vi } from "vitest";
import { readStoredAuthUserId, restoreSupabaseSession } from "./supabaseAuth";

const SESSION_KEY = "buc-elearning-auth-session";

function storeExpiredSession() {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify({
    accessToken: "expired-access",
    refreshToken: "refresh-token",
    expiresAt: Date.now() - 1_000,
    user: { id: "student-a", email: null },
  }));
}

afterEach(() => vi.unstubAllGlobals());

describe("restoreSupabaseSession refresh failures", () => {
  it("keeps the stored session when the auth service is unreachable (transient outage)", async () => {
    storeExpiredSession();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(restoreSupabaseSession()).resolves.toBeNull();
    expect(readStoredAuthUserId()).toBe("student-a");
  });

  it("keeps the stored session on a 5xx from the auth service", async () => {
    storeExpiredSession();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 503 })));
    await expect(restoreSupabaseSession()).resolves.toBeNull();
    expect(readStoredAuthUserId()).toBe("student-a");
  });

  it("clears the stored session when the refresh token is rejected", async () => {
    storeExpiredSession();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 400 })));
    await expect(restoreSupabaseSession()).resolves.toBeNull();
    expect(readStoredAuthUserId()).toBeNull();
  });
});
