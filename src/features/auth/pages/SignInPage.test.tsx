import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignInPage } from "./SignInPage";
import { useAuth, type AuthState } from "../../../app/providers/AuthProvider";
import { activateProvisionedStudent, initiateOtpLogin, verifyOtp } from "../api/identityApi";
import { getAdminOverview } from "../../admin-v2/api/adminOperationsApi";
import { assignLocation, reloadPage } from "../../../shared/utils/hardNavigation";

vi.mock("../../../app/providers/AuthProvider", () => ({ useAuth: vi.fn() }));
vi.mock("../api/identityApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/identityApi")>()),
  activateProvisionedStudent: vi.fn(),
  initiateOtpLogin: vi.fn(),
  verifyOtp: vi.fn(),
}));
vi.mock("../../admin-v2/api/adminOperationsApi", () => ({ getAdminOverview: vi.fn() }));
vi.mock("../../../shared/utils/hardNavigation", () => ({ assignLocation: vi.fn(), reloadPage: vi.fn() }));

const reloadSpy = vi.fn();
function auth(status: AuthState["status"]): AuthState {
  return { status, configured: true, user: status === "authenticated" ? { id: "u1", name: "student@test.invalid", role: "authenticated" } : null, signOut: vi.fn() };
}

function renderPage(state?: unknown) {
  return render(<MemoryRouter initialEntries={[{ pathname: "/auth/sign-in", state }]}><SignInPage /></MemoryRouter>);
}

beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue(auth("unauthenticated"));
  vi.mocked(assignLocation).mockClear();
  vi.mocked(reloadPage).mockClear();
  reloadSpy.mockClear();
});

describe("SignInPage navigation after sign-in", () => {
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

  it("account activation also finishes with one full navigation", async () => {
    vi.mocked(activateProvisionedStudent).mockResolvedValue(undefined);
    const { container } = renderPage();
    fireEvent.change(container.querySelector("#signin-account-id")!, { target: { value: "ACC-1" } });
    fireEvent.change(container.querySelector("#signin-setup-code")!, { target: { value: "SETUP-1" } });
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => expect(assignLocation).toHaveBeenCalledWith("/"));
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
