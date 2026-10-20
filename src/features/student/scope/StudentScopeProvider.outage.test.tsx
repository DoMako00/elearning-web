import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StudentScopeProvider, useStudentScope } from "./StudentScopeProvider";
import { studentLearningApi, StudentLearningApiError } from "../api/studentLearningApi";
import { useStudentProfile } from "../api/useStudentLearning";
import { getStudentAuthMethods } from "../../auth/api/identityApi";

vi.mock("../../../app/providers/AuthProvider", () => ({ useAuth: () => ({ status: "authenticated" }) }));
vi.mock("../../auth/api/identityApi", () => ({ getStudentAuthMethods: vi.fn() }));
vi.mock("../../../components/layout/RouteLoadingFallback", () => ({
  RouteLoadingFallback: () => <p role="status">loading</p>,
}));

// Mirrors StudentLayout/TopAppBar: app content that also reads the profile.
function AppContent() {
  const scope = useStudentScope();
  const profile = useStudentProfile();
  return <p>app {scope.brand} {profile.data ? "with profile" : "without profile"}</p>;
}

describe("StudentScopeProvider during a /v1/student/me outage (real queries)", () => {
  it("keeps the app mounted and does not re-request the failing profile in a loop", async () => {
    const getProfile = vi.spyOn(studentLearningApi, "getProfile").mockRejectedValue(new StudentLearningApiError("Service unavailable", 503, "service_unavailable"));
    vi.mocked(getStudentAuthMethods).mockResolvedValue({ brandCode: "nexus" });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(<QueryClientProvider client={client}><StudentScopeProvider><AppContent /></StudentScopeProvider></QueryClientProvider>);

    await waitFor(() => expect(screen.getByText("app nexus without profile")).toBeTruthy());
    const callsWhenMounted = getProfile.mock.calls.length;

    // Give a remount loop time to show itself.
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(screen.getByText("app nexus without profile")).toBeTruthy();
    expect(screen.queryByRole("status")).toBeNull();
    expect(getProfile.mock.calls.length).toBe(callsWhenMounted);
    expect(callsWhenMounted).toBeLessThanOrEqual(2);
  });
});
