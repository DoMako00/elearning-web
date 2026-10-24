import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProfileTabContent } from "./ProfileTabContent";

const baseProps = {
  profile: { fullName: "Student", studentId: "S-1", email: "", phoneCountryCode: "+20", phoneCountryFlag: "", phoneNumber: "", university: "Delta University", academicYear: "Level 1", major: "—", avatarUrl: "" },
  onUpdateProfile: vi.fn(),
  devices: [],
  subscription: { name: "", status: "Unavailable" as const, seats: 0, duration: "", renewDate: "", planType: "individual" as const },
  contactSubTab: "email" as const,
  setContactSubTab: vi.fn(),
  newContactValue: "",
  setNewContactValue: vi.fn(),
  onChangePhotoClick: vi.fn(),
  onManageDevicesClick: vi.fn(),
  onCloseAccountClick: vi.fn(),
  onSendVerificationCode: vi.fn(),
  onVerifyEmail: vi.fn(),
  emailCode: "",
  setEmailCode: vi.fn(),
  emailFlowStep: "idle" as const,
  onDownloadDataClick: vi.fn(),
  onSwitchAccountClick: vi.fn(),
  onViewPlansClick: vi.fn(),
  rightColumnOnly: true,
};

describe("ProfileTabContent commercial summary", () => {
  it("does not show zero seats or an empty term when the summary could not load", () => {
    const onRetrySubscription = vi.fn();
    render(<ProfileTabContent {...baseProps} subscriptionDataUnavailable onRetrySubscription={onRetrySubscription} />);

    expect(screen.getByText("Offering details unavailable")).toBeTruthy();
    expect(screen.getByText(/couldn't load your current Offering and seat details/i)).toBeTruthy();
    expect(screen.queryByText(/0 seats? •/i)).toBeNull();
    expect(screen.queryByText(/Term ends\s*$/i)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /retry details/i }));
    expect(onRetrySubscription).toHaveBeenCalledOnce();
  });

  it("shows a loading state before displaying any seat count", () => {
    render(<ProfileTabContent {...baseProps} subscriptionDataLoading />);

    expect(screen.getByText("Loading Offering details…")).toBeTruthy();
    expect(screen.getByText("Checking your current Offering and seat details.")).toBeTruthy();
    expect(screen.queryByText(/0 seats? •/i)).toBeNull();
  });
});
