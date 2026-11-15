import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RequireStudentAuth } from "./RequireStudentAuth";
import { useAuth, type AuthState } from "../providers/AuthProvider";
import { getAdminWorkspace } from "../../features/admin-v2/api/adminRolesApi";
import { useIsMobile } from "../../hooks/useIsMobile";

vi.mock("../../features/admin-v2/api/adminRolesApi", () => ({ getAdminWorkspace: vi.fn() }));
vi.mock("../providers/AuthProvider", () => ({ useAuth: vi.fn() }));
vi.mock("../../hooks/useIsMobile", () => ({ useIsMobile: vi.fn() }));
vi.mock("../../components/layout/RouteLoadingFallback", () => ({
  RouteLoadingFallback: ({ message }: { message?: string }) => <p role="status">{message}</p>,
}));

function authState(status: AuthState["status"]): AuthState {
  return { status, user: status === "authenticated" ? { id: "u1", name: "u1", role: "authenticated" } : null, configured: true, signOut: vi.fn() };
}

function SignInProbe() {
  const location = useLocation();
  return <p>sign-in from {(location.state as { from?: string } | null)?.from ?? "nowhere"}</p>;
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/auth/sign-in" element={<SignInProbe />} />
        <Route path="/admin/instructor" element={<p>instructor workspace</p>} />
        <Route path="/admin" element={<p>admin workspace</p>} />
        <Route path="/*" element={<RequireStudentAuth><p>private student data</p></RequireStudentAuth>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe.each([false, true])("RequireStudentAuth (mobile=%s)", (isMobile) => {
  beforeEach(() => { vi.mocked(useIsMobile).mockReturnValue(isMobile); vi.mocked(getAdminWorkspace).mockReset(); });

  it("shows a loading state, not private content, while the session resolves", () => {
    vi.mocked(useAuth).mockReturnValue(authState("loading"));
    renderAt("/my-courses");
    expect(screen.getByRole("status").textContent).toMatch(/checking your session/i);
    expect(screen.queryByText("private student data")).toBeNull();
  });

  it("redirects a direct visit to a private URL to sign-in and keeps the return path", () => {
    vi.mocked(useAuth).mockReturnValue(authState("unauthenticated"));
    renderAt("/assessments/abc?tab=1");
    expect(screen.getByText("sign-in from /assessments/abc?tab=1")).toBeTruthy();
    expect(screen.queryByText("private student data")).toBeNull();
  });

  it("opens the student area when the workspace API denies admin access", async () => {
    vi.mocked(useAuth).mockReturnValue(authState("authenticated"));
    vi.mocked(getAdminWorkspace).mockRejectedValue({ status: 403 });
    renderAt("/");
    expect(await screen.findByText("private student data")).toBeTruthy();
  });

  it.each([["instructor", "instructor workspace"], ["super_admin", "admin workspace"]] as const)("routes %s to the correct workspace", async (workspace, label) => {
    vi.mocked(useAuth).mockReturnValue(authState("authenticated"));
    vi.mocked(getAdminWorkspace).mockResolvedValue({ workspace } as Awaited<ReturnType<typeof getAdminWorkspace>>);
    renderAt("/");
    expect(await screen.findByText(label)).toBeTruthy();
    expect(screen.queryByText("private student data")).toBeNull();
  });

  it("does not show student data during a workspace service failure and can retry", async () => {
    vi.mocked(useAuth).mockReturnValue(authState("authenticated"));
    vi.mocked(getAdminWorkspace).mockRejectedValueOnce({ status: 503 }).mockResolvedValueOnce({ workspace: "instructor" } as Awaited<ReturnType<typeof getAdminWorkspace>>);
    renderAt("/");
    fireEvent.click(await screen.findByRole("button", { name: "Try again" }));
    expect(await screen.findByText("instructor workspace")).toBeTruthy();
  });
});
