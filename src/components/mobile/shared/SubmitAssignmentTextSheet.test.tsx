import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SubmitAssignmentTextSheet } from "./SubmitAssignmentTextSheet";

function renderSheet(onSubmit: (text: string, ids: string[], submissionId: string) => Promise<void>, onUploadFile = vi.fn()) {
  const onClose = vi.fn();
  render(<SubmitAssignmentTextSheet isOpen onClose={onClose} assignmentTitle="Case study" courseName="Anatomy" onUploadFile={onUploadFile} onSubmit={onSubmit} />);
  return { onClose };
}

const confirm = () => fireEvent.click(screen.getByRole("checkbox"));
const submitButton = () => screen.getByRole("button", { name: /submit response/i });
const fileInput = () => document.querySelector<HTMLInputElement>('input[type="file"]')!;

describe("SubmitAssignmentTextSheet", () => {
  it("reuses the same submission id when retrying the same submission after a failure", async () => {
    const onSubmit = vi.fn()
      .mockRejectedValueOnce(new Error("The learning API could not be reached."))
      .mockResolvedValueOnce(undefined);
    const { onClose } = renderSheet(onSubmit);
    fireEvent.change(screen.getByLabelText(/your response/i), { target: { value: "My answer" } });
    confirm();

    fireEvent.click(submitButton());
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/could not be reached/));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(submitButton());
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onSubmit).toHaveBeenCalledTimes(2);
    expect(onSubmit.mock.calls[0]![2]).toBe(onSubmit.mock.calls[1]![2]);
  });

  it("allows an attachment-only submission (the backend accepts it)", async () => {
    const onUploadFile = vi.fn().mockResolvedValue({ id: "att-1", status: "verified" });
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderSheet(onSubmit, onUploadFile);
    fireEvent.change(fileInput(), { target: { files: [new File(["%PDF"], "answer.pdf", { type: "application/pdf" })] } });
    confirm();
    expect(screen.getByLabelText(/your response/i).hasAttribute("required")).toBe(false);
    fireEvent.click(submitButton());
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("", ["att-1"], expect.any(String)));
  });

  it("lets the student remove a selected attachment before submitting", () => {
    renderSheet(vi.fn());
    fireEvent.change(fileInput(), { target: { files: [new File(["%PDF"], "wrong.pdf", { type: "application/pdf" })] } });
    expect(screen.getByText(/wrong\.pdf/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Remove wrong.pdf" }));
    expect(screen.queryByText(/wrong\.pdf/)).toBeNull();
  });
});
