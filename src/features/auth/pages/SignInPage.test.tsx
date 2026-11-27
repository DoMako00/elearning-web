import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignInPage } from "./SignInPage";
import { useAuth, type AuthState } from "../../../app/providers/AuthProvider";
import { completeStudentEmailLink, initiateOtpLogin, initiateProvisionedStudentEmailLink, verifyOtp } from "../api/identityApi";
import { getAdminOverview } from "../../admin-v2/api/adminOperationsApi";
import { getAdminWorkspace } from "../../admin-v2/api/adminRolesApi";
import { assignLocation, reloadPage } from "../../../shared/utils/hardNavigation";

vi.mock("../../../app/providers/AuthProvider", () => ({ useAuth: vi.fn() }));
vi.mock("../api/identityApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/identityApi")>()),
  initiateProvisionedStudentEmailLink: vi.fn(),
  completeStudentEmailLink: vi.fn(),
  initiateOtpLogin: vi.fn(),
  verifyOtp: vi.fn(),
}));
vi.mock("../../admin-v2/api/adminOperationsApi", () => ({ getAdminOverview: vi.fn() }));
vi.mock("../../admin-v2/api/adminRolesApi", () => ({ getAdminWorkspace: vi.fn() }));
vi.mock("../../../shared/utils/hardNavigation", () => ({ assignLocation: vi.fn(), reloadPage: vi.fn() }));

const reloadSpy = vi.fn();
function auth(status: AuthState["status"]): AuthState {
  return { status, configured: true, user: status === "authenticated" ? { id: "u1", name: "student@test.invalid", role: "authenticated" } : null, signOut: vi.fn() };
}

function renderPage(state?: unknown, props?: { brandCode?: string; brandName?: string; role?: "student" | "instructor" | "admin" }) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/auth/sign-in", state }]}>
      <SignInPage {...props} />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue(auth("unauthenticated"));
  vi.mocked(assignLocation).mockClear();
  vi.mocked(reloadPage).mockClear();
  reloadSpy.mockClear();
  // Default: not an admin workspace (student user).
  vi.mocked(getAdminWorkspace).mockRejectedValue(Object.assign(new Error("forbidden"), { status: 403 }));
});

describe("SignInPage navigation after sign-in", () => {
  it("displays the Nexus brand context when the Nexus account brand is selected", () => {
    renderPage(undefined, { brandCode: "nexus", brandName: "Nexus", role: "student" });
    expect(screen.getByText(/Nexus/)).toBeTruthy();
    expect(screen.getByRole("link", { name: /Nexus.*Change role/i })).toBeTruthy();
  });

  it("a student OTP sign-in does one full navigation to the destination (no SPA navigate + reload race)", async () => {
    vi.mocked(initiateOtpLogin).mockResolvedValue({ challengeId: "challenge-1" });
    vi.mocked(verifyOtp).mockResolvedValue({ accessToken: "a", refreshToken: "r", authUserId: "u1", expiresAt: new Date().toISOString() });
    vi.mocked(getAdminOverview).mockRejectedValue(Object.assign(new Error("forbidden"), { status: 403 }));
    const { container } = renderPage();

    fireEvent.click(screen.getByRole("tab", { name: "Sign in" }));
    fireEvent.change(container.querySelector("#signin-email")!, { target: { value: "student@test.invalid" } });
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => expect(container.querySelector("#signin-otp")).toBeTruthy());

    fireEvent.change(container.querySelector("#signin-otp")!, { target: { value: "12345678" } });
    fireEvent.submit(container.querySelector("form")!);

    await waitFor(() => expect(assignLocation).toHaveBeenCalledTimes(1));
    expect(assignLocation).toHaveBeenCalledWith("/");
    expect(verifyOtp).toHaveBeenCalledTimes(1);
    expect(reloadPage).not.toHaveBeenCalled();
  });

  it("returns a student to the protected page they came from", async () => {
    vi.mocked(initiateOtpLogin).mockResolvedValue({ challengeId: "challenge-1" });
    vi.mocked(verifyOtp).mockResolvedValue({ accessToken: "a", refreshToken: "r", authUserId: "u1", expiresAt: new Date().toISOString() });
    vi.mocked(getAdminOverview).mockRejectedValue(Object.assign(new Error("forbidden"), { status: 403 }));
    const { container } = renderPage({ from: "/assessments/abc" });
    fireEvent.click(screen.getByRole("tab", { name: "Sign in" }));
    fireEvent.change(container.querySelector("#signin-email")!, { target: { value: "student@test.invalid" } });
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => expect(container.querySelector("#signin-otp")).toBeTruthy());
    fireEvent.change(container.querySelector("#signin-otp")!, { target: { value: "12345678" } });
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => expect(assignLocation).toHaveBeenCalledWith("/assessments/abc"));
  });

  it("verifies the student's email before finishing account activation", async () => {
    vi.mocked(initiateProvisionedStudentEmailLink).mockResolvedValue({ linkTicket: "ticket-1", expiresAt: new Date(Date.now() + 600_000).toISOString() });
    vi.mocked(completeStudentEmailLink).mockResolvedValue({} as never);
    const { container } = renderPage();
    fireEvent.change(container.querySelector("#signin-account-id")!, { target: { value: "ACC-1" } });
    fireEvent.change(container.querySelector("#signin-setup-code")!, { target: { value: "SETUP-1" } });
    fireEvent.change(container.querySelector("#activation-email")!, { target: { value: "student@gmail.com" } });
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => expect(screen.getByLabelText("Email verification code")).toBeTruthy());
    expect(assignLocation).not.toHaveBeenCalled();
    expect(initiateProvisionedStudentEmailLink).toHaveBeenCalledWith({ brand: "elite", accountIdentifier: "ACC-1", setupCode: "SETUP-1", email: "student@gmail.com" });
  });

  it("creates the student session only after email OTP verification", async () => {
    vi.mocked(initiateProvisionedStudentEmailLink).mockResolvedValue({ linkTicket: "ticket-1", expiresAt: new Date(Date.now() + 600_000).toISOString() });
    vi.mocked(completeStudentEmailLink).mockResolvedValue({} as never);
    const { container } = renderPage();
    fireEvent.change(container.querySelector("#signin-account-id")!, { target: { value: "ACC-1" } });
    fireEvent.change(container.querySelector("#signin-setup-code")!, { target: { value: "SETUP-1" } });
    fireEvent.change(container.querySelector("#activation-email")!, { target: { value: "student@gmail.com" } });
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => expect(container.querySelector("#activation-otp")).toBeTruthy());
    fireEvent.change(container.querySelector("#activation-otp")!, { target: { value: "12345678" } });
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => expect(assignLocation).toHaveBeenCalledWith("/"));
    expect(completeStudentEmailLink).toHaveBeenCalledWith({ linkTicket: "ticket-1", code: "12345678", remember: true });
    expect(reloadPage).not.toHaveBeenCalled();
  });

  it("offers a way forward to a visitor who is already signed in", () => {
    vi.mocked(useAuth).mockReturnValue(auth("authenticated"));
    renderPage();
    expect(screen.getByText(/already signed in/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(assignLocation).toHaveBeenCalledWith("/");
  });
});
