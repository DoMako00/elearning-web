import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StudentConfirmDialog, StudentConnectionNotice, StudentPanelSkeleton } from "./StudentFeedback";

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("student feedback", () => {
  it("does not submit on opening; allows review and submits only on explicit confirmation", () => {
    const confirm = vi.fn(); const cancel = vi.fn();
    render(<StudentConfirmDialog open title="Submit your answers?" confirmLabel="Submit answers" onConfirm={confirm} onCancel={cancel}>Responses cannot be edited afterwards.</StudentConfirmDialog>);
    expect(screen.getByRole("dialog").getAttribute("aria-describedby")).toBeTruthy();
    expect(confirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Keep reviewing"));
    expect(cancel).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByText("Submit answers"));
    expect(confirm).toHaveBeenCalledOnce();
  });
  it("blocks duplicate confirmation and dismissal while submitting and displays failures", () => {
    const confirm = vi.fn(); const cancel = vi.fn();
    const { rerender } = render(<StudentConfirmDialog open pending title="Submit?" confirmLabel="Submit" onConfirm={confirm} onCancel={cancel}>Review</StudentConfirmDialog>);
    fireEvent.click(screen.getByText("Submitting…"));
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { bubbles: false, cancelable: true }));
    expect(confirm).not.toHaveBeenCalled(); expect(cancel).not.toHaveBeenCalled();
    rerender(<StudentConfirmDialog open title="Submit?" confirmLabel="Submit" error="Please try again" onConfirm={confirm} onCancel={cancel}>Review</StudentConfirmDialog>);
    expect(screen.getByRole("alert").textContent).toContain("Please try again");
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { bubbles: false, cancelable: true }));
    expect(cancel).toHaveBeenCalledOnce();
  });
  it("announces loading once and hides decorative skeleton blocks", () => {
    render(<StudentPanelSkeleton label="Loading messages" rows={3} />);
    expect(screen.getByRole("status").getAttribute("aria-busy")).toBe("true");
    expect(screen.getAllByRole("status")).toHaveLength(1);
  });
  it("only shows the offline alert when the browser reports no connection", () => {
    const online = vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    render(<StudentConnectionNotice />);
    expect(screen.getByRole("alert").textContent).toContain("You’re offline");
    online.mockReturnValue(true);
    fireEvent(window, new Event("online"));
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
