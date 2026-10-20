import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProfileTab } from "./ProfileTab";
import type { StudentProfileData } from "../../../../types/settings";

const profile: StudentProfileData = {
  fullName: "Test Student",
  studentId: "S-1",
  email: "student@test.invalid",
  phoneCountryCode: "+20",
  phoneCountryFlag: "",
  phoneNumber: "100000000",
  university: "Delta University",
  academicYear: "Year 1",
  major: "—",
  avatarUrl: "",
};

function renderTab(onSave: () => Promise<void>) {
  render(<ProfileTab profile={profile} onUpdateProfile={vi.fn()} onChangePhotoClick={vi.fn()} onSave={onSave} />);
  fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
}

describe("ProfileTab save feedback", () => {
  it("shows the server error and never claims success when the save fails", async () => {
    renderTab(vi.fn().mockRejectedValue(new Error("The profile changed; refresh before saving.")));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("The profile changed; refresh before saving."));
    expect(screen.queryByText(/changes saved successfully/i)).toBeNull();
  });

  it("shows success only after the save resolves", async () => {
    let resolve!: () => void;
    renderTab(vi.fn().mockReturnValue(new Promise<void>((done) => { resolve = done; })));
    expect(screen.queryByText(/changes saved successfully/i)).toBeNull();
    expect(screen.getByRole("button", { name: /saving/i })).toHaveProperty("disabled", true);
    resolve();
    await waitFor(() => expect(screen.getByText(/changes saved successfully/i)).toBeTruthy());
  });
});
