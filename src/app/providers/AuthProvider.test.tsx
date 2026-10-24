import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./AuthProvider";
import { QueryProvider, queryClient, setQueryCacheScope } from "./QueryProvider";
import { assignLocation, reloadPage } from "../../shared/utils/hardNavigation";

vi.mock("../../shared/utils/hardNavigation", () => ({ assignLocation: vi.fn(), reloadPage: vi.fn() }));

const SESSION_KEY = "buc-elearning-auth-session";

function storeSession(userId: string, expiresInMs = 60 * 60 * 1000) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify({
    accessToken: `access-${userId}`,
    refreshToken: `refresh-${userId}`,
    expiresAt: Date.now() + expiresInMs,
    user: { id: userId, email: `${userId}@test.invalid` },
  }));
}

let signOutRef: ReturnType<typeof useAuth>["signOut"] | null = null;
function Probe() {
  const auth = useAuth();
  signOutRef = auth.signOut;
  return <p data-testid="auth">{auth.status}:{auth.user?.id ?? "none"}</p>;
}

function renderAuth() {
  return render(<QueryProvider><AuthProvider><Probe /></AuthProvider></QueryProvider>);
}

async function seedPrivateCache() {
  queryClient.setQueryData(["student", "profile"], { fullName: "Previous Student" });
  queryClient.setQueryData(["student", "messages", "conversations"], [{ id: "private" }]);
}

beforeEach(() => {
  queryClient.clear();
  vi.mocked(assignLocation).mockClear();
  vi.mocked(reloadPage).mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  signOutRef = null;
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.replaceState({}, "", "/");
});

describe("AuthProvider sign-out", () => {
  it("clears the session and every cached query, then hard-navigates to sign-in, even when the logout API fails", async () => {
    storeSession("student-a");
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("offline"));
    vi.stubGlobal("fetch", fetchMock);
    renderAuth();
    await waitFor(() => expect(screen.getByTestId("auth").textContent).toBe("authenticated:student-a"));
    await seedPrivateCache();

    await act(async () => { await signOutRef!({ revokeServerSession: true }); });

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/v1/sessions/logout"), expect.objectContaining({ method: "POST" }));
    expect(window.localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(assignLocation).toHaveBeenCalledWith("/auth/sign-in");
    expect(screen.getByTestId("auth").textContent).toBe("unauthenticated:none");
  });

  it("still signs out when the server answers the logout with an error status", async () => {
    storeSession("student-a");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: false }), { status: 401, headers: { "content-type": "application/json" } })));
    renderAuth();
    await waitFor(() => expect(screen.getByTestId("auth").textContent).toBe("authenticated:student-a"));
    await act(async () => { await signOutRef!({ revokeServerSession: true }); });
    expect(window.localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(assignLocation).toHaveBeenCalledWith("/auth/sign-in");
  });

  it("removes in-tab assessment drafts on sign-out", async () => {
    storeSession("student-a");
    window.sessionStorage.setItem("assessment-draft:student-a:attempt-1", JSON.stringify({ q: "x" }));
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    renderAuth();
    await waitFor(() => expect(screen.getByTestId("auth").textContent).toBe("authenticated:student-a"));
    await act(async () => { await signOutRef!(); });
    expect(window.sessionStorage.getItem("assessment-draft:student-a:attempt-1")).toBeNull();
  });
});

describe("AuthProvider instructor invitation confirmation", () => {
  it("binds the confirmed Supabase invite to the backend before signing in", async () => {
    const expiresAt = Math.floor(Date.now() / 1_000) + 3_600;
    window.history.replaceState({}, "", `/admin/instructor#access_token=invite-access&refresh_token=invite-refresh&expires_at=${expiresAt}&expires_in=3600&type=invite`);
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/auth/v1/user")) return new Response(JSON.stringify({
        id: "instructor-auth-id",
        email: "doctor@example.test",
        email_confirmed_at: new Date().toISOString(),
      }), { status: 200, headers: { "content-type": "application/json" } });
      if (url.endsWith("/v1/auth/instructor-invite/complete")) {
        expect(new Headers(init?.headers).get("authorization")).toBe("Bearer invite-access");
        expect(JSON.parse(String(init?.body))).toMatchObject({ platform: expect.any(String), deviceKey: expect.any(String) });
        return new Response(JSON.stringify({ ok: true, data: { id: "app-session" } }), { status: 200, headers: { "content-type": "application/json" } });
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("auth").textContent).toBe("authenticated:instructor-auth-id"));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(window.location.pathname).toBe("/admin/instructor");
    expect(window.location.hash).toBe("");
    expect(window.localStorage.getItem(SESSION_KEY)).toContain("invite-access");
    expect(reloadPage).not.toHaveBeenCalled();
  });

  it("does not persist an invite when the backend rejects its Instructor scope", async () => {
    const expiresAt = Math.floor(Date.now() / 1_000) + 3_600;
    window.history.replaceState({}, "", `/admin/instructor#access_token=invite-access&refresh_token=invite-refresh&expires_at=${expiresAt}&expires_in=3600&type=invite`);
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => String(input).endsWith("/auth/v1/user")
      ? new Response(JSON.stringify({ id: "unlinked-auth-id", email: "not-an-instructor@example.test", email_confirmed_at: new Date().toISOString() }), { status: 200, headers: { "content-type": "application/json" } })
      : new Response(JSON.stringify({ ok: false, error: { code: "forbidden", message: "Instructor access unavailable." } }), { status: 403, headers: { "content-type": "application/json" } })));

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("auth").textContent).toBe("unauthenticated:none"));
    expect(window.localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(reloadPage).not.toHaveBeenCalled();
  });
});

describe("AuthProvider identity changes from another tab", () => {
  it("drops the previous student's cache and reloads when a different user is stored", async () => {
    storeSession("student-a");
    renderAuth();
    await waitFor(() => expect(screen.getByTestId("auth").textContent).toBe("authenticated:student-a"));
    await seedPrivateCache();

    storeSession("student-b");
    act(() => { window.dispatchEvent(new StorageEvent("storage", { key: SESSION_KEY })); });

    await waitFor(() => expect(reloadPage).toHaveBeenCalledTimes(1));
    expect(queryClient.getQueryData(["student", "profile"])).toBeUndefined();
  });

  it("signs this tab out without reloading when the other tab signed out", async () => {
    storeSession("student-a");
    renderAuth();
    await waitFor(() => expect(screen.getByTestId("auth").textContent).toBe("authenticated:student-a"));
    await seedPrivateCache();

    window.localStorage.removeItem(SESSION_KEY);
    act(() => { window.dispatchEvent(new StorageEvent("storage", { key: SESSION_KEY })); });

    await waitFor(() => expect(screen.getByTestId("auth").textContent).toBe("unauthenticated:none"));
    expect(queryClient.getQueryData(["student", "profile"])).toBeUndefined();
    expect(reloadPage).not.toHaveBeenCalled();
  });

  it("ignores storage events that keep the same identity (no reload loop)", async () => {
    storeSession("student-a");
    renderAuth();
    await waitFor(() => expect(screen.getByTestId("auth").textContent).toBe("authenticated:student-a"));
    await seedPrivateCache();

    storeSession("student-a"); // e.g. a token refresh in another tab
    act(() => { window.dispatchEvent(new StorageEvent("storage", { key: SESSION_KEY })); });

    expect(reloadPage).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(["student", "profile"])).toEqual({ fullName: "Previous Student" });
  });
});

describe("query cache scoping", () => {
  it("hashes identical keys differently for different authenticated users", () => {
    const hash = queryClient.getDefaultOptions().queries!.queryKeyHashFn!;
    setQueryCacheScope("student-a");
    const forA = hash(["student", "courses", "mine", "nexus"]);
    setQueryCacheScope("student-b");
    const forB = hash(["student", "courses", "mine", "nexus"]);
    setQueryCacheScope(null);
    expect(forA).not.toBe(forB);
  });
});
