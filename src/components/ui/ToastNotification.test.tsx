import { act, render, renderHook, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastNotification } from "./ToastNotification";
import { MobileToast } from "../mobile/shared/MobileToast";
import { useToast } from "../../hooks/useToast";

afterEach(() => vi.useRealTimers());

describe.each([
  ["desktop", (message: string, tone?: "success" | "error" | "info") => <ToastNotification message={message} tone={tone} />],
  ["mobile", (message: string, tone?: "success" | "error" | "info") => <MobileToast message={message} tone={tone} />],
])("%s toast semantics", (_name, renderToast) => {
  it("announces errors assertively as alerts", () => {
    render(renderToast("Save failed", "error"));
    const toast = screen.getByRole("alert");
    expect(toast.getAttribute("aria-live")).toBe("assertive");
    expect(toast.className).toMatch(/rose/);
    expect(toast.className).not.toMatch(/emerald|#15803d/);
  });

  it("announces successes politely as status", () => {
    render(renderToast("Saved"));
    expect(screen.getByRole("status").getAttribute("aria-live")).toBe("polite");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("styles info distinctly from success and error", () => {
    render(renderToast("Not available yet", "info"));
    const toast = screen.getByRole("status");
    expect(toast.className).toMatch(/slate/);
  });
});

describe("useToast", () => {
  it("keeps error toasts visible for at least 6 seconds and successes for the default duration", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useToast(2500));
    act(() => result.current.showToast("Could not save", "error"));
    expect(result.current.toastTone).toBe("error");
    act(() => { vi.advanceTimersByTime(5_900); });
    expect(result.current.toastMessage).toBe("Could not save");
    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current.toastMessage).toBeNull();

    act(() => result.current.showToast("Saved"));
    act(() => { vi.advanceTimersByTime(2_600); });
    expect(result.current.toastMessage).toBeNull();
  });

  it("does not let an earlier timer hide a newer message", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useToast(3000));
    act(() => result.current.showToast("first"));
    act(() => { vi.advanceTimersByTime(2_000); });
    act(() => result.current.showToast("second"));
    act(() => { vi.advanceTimersByTime(1_500); });
    expect(result.current.toastMessage).toBe("second");
  });
});
