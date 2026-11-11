import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountDeletionDialog, PendingAccountDeletions } from "./AccountDeletion";

const api = vi.hoisted(() => ({
  deleteAccountIdentity: vi.fn(),
  getAccountDeletionPreview: vi.fn(),
  listPendingAccountDeletions: vi.fn(),
  retryAccountDeletion: vi.fn(),
}));

vi.mock("../api/adminAccountDeletionApi", () => api);

describe("account deletion UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getAccountDeletionPreview.mockResolvedValue({
      targetKind: "student", targetProfileId: "student-profile", displayName: "Sample Student",
      email: "student@example.edu", brandCodes: ["medway", "nexus"], affectedProfileCount: 2,
    });
    api.deleteAccountIdentity.mockResolvedValue({ requestId: "request-1", status: "pending" });
    api.listPendingAccountDeletions.mockResolvedValue([]);
    api.retryAccountDeletion.mockResolvedValue({ requestId: "request-1", status: "pending" });
  });

  it("requires the account email and a reason, then reports pending cleanup", async () => {
    const onFinished = vi.fn();
    render(<AccountDeletionDialog kind="student" profileId="student-profile" onCancel={vi.fn()} onFinished={onFinished} />);
    expect(await screen.findByText(/learning, payment, subscription and audit history stays under internal IDs/i)).toBeTruthy();
    expect(screen.getByText("MEDWAY, NEXUS")).toBeTruthy();

    const email = screen.getByLabelText("Type the account email to confirm") as HTMLInputElement;
    const reason = screen.getByLabelText("Reason for deletion") as HTMLTextAreaElement;
    const deleteButton = screen.getByRole("button", { name: "Delete identity" }) as HTMLButtonElement;
    fireEvent.change(reason, { target: { value: "Account closure requested" } });
    expect(deleteButton.disabled).toBe(true);
    fireEvent.change(email, { target: { value: "wrong@example.edu" } });
    expect(deleteButton.disabled).toBe(true);
    fireEvent.change(email, { target: { value: "student@example.edu" } });
    expect(deleteButton.disabled).toBe(false);
    fireEvent.click(deleteButton);

    await waitFor(() => expect(api.deleteAccountIdentity).toHaveBeenCalledWith("student", "student-profile", { confirmationEmail: "student@example.edu", reason: "Account closure requested" }));
    expect(onFinished).toHaveBeenCalledWith("student", "pending");
  });

  it("keeps a failed cleanup visible and lets a Super Admin retry it", async () => {
    api.listPendingAccountDeletions.mockResolvedValue([{
      id: "request-1", targetKind: "student", targetProfileId: "student-profile", email: "student@example.edu",
      displayName: "Sample Student", brandCodes: ["medway", "nexus"], attemptCount: 1, lastErrorCode: "auth_delete_failed", createdAt: "2026-11-11T10:00:00Z",
    }]);
    render(<PendingAccountDeletions />);
    expect(await screen.findByText("Sample Student")).toBeTruthy();
    expect(screen.getByText(/Access is blocked while the server finishes identity deletion/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry cleanup" }));
    await waitFor(() => expect(api.retryAccountDeletion).toHaveBeenCalledWith("request-1"));
    expect(await screen.findByText(/cleanup is still pending/i)).toBeTruthy();
    expect(api.listPendingAccountDeletions).toHaveBeenCalledTimes(2);
  });
});
