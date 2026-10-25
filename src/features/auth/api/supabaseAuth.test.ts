import { afterEach, describe, expect, it, vi } from "vitest";
import { acceptSupabaseInviteFromUrl, readStoredAuthUserId, restoreSupabaseSession } from "./supabaseAuth";

vi.mock("../../../app/config/env", () => ({
  env: {
    apiBaseUrl: "https://api.example.invalid",
    supabaseUrl: "https://project.example.supabase.co",
    supabasePublishableKey: "test-publishable-key",
    adminDataSource: "api",
  },
}));

const SESSION_KEY = "buc-elearning-auth-session";

function storeExpiredSession() {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify({
    accessToken: "expired-access",
    refreshToken: "refresh-token",
    expiresAt: Date.now() - 1_000,
    user: { id: "student-a", email: null },
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.replaceState({}, "", "/");
});

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

describe("acceptSupabaseInviteFromUrl", () => {
  it("verifies a confirmed invite without persisting it before backend binding, and removes URL tokens", async () => {
    const expiresAt = Math.floor(Date.now() / 1_000) + 3_600;
    window.history.replaceState({}, "", `/admin/instructor?source=invite#access_token=invite-access&refresh_token=invite-refresh&expires_at=${expiresAt}&expires_in=3600&type=invite`);
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      id: "instructor-auth-id",
      email: "doctor@example.test",
      email_confirmed_at: new Date().toISOString(),
    }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    const session = await acceptSupabaseInviteFromUrl();

    expect(session).toMatchObject({
      accessToken: "invite-access",
      refreshToken: "invite-refresh",
      authUserId: "instructor-auth-id",
      email: "doctor@example.test",
    });
    expect(readStoredAuthUserId()).toBeNull();
    expect(window.localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(window.location.pathname).toBe("/admin/instructor");
    expect(window.location.search).toBe("?source=invite");
    expect(window.location.hash).toBe("");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://project.example.supabase.co/auth/v1/user",
      expect.objectContaining({
        headers: expect.objectContaining({
          apikey: "test-publishable-key",
          Authorization: "Bearer invite-access",
        }),
      }),
    );
  });

  it("ignores unrelated URL fragments", async () => {
    window.history.replaceState({}, "", "/admin/instructor#section=overview");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(acceptSupabaseInviteFromUrl()).resolves.toBeNull();

    expect(window.location.hash).toBe("#section=overview");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an expired invite without creating a local session", async () => {
    window.history.replaceState({}, "", "/admin/instructor#access_token=expired-access&refresh_token=expired-refresh&expires_in=0&type=invite");

    await expect(acceptSupabaseInviteFromUrl()).rejects.toThrow(/invitation link is incomplete/i);

    expect(window.localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(readStoredAuthUserId()).toBeNull();
  });
});
