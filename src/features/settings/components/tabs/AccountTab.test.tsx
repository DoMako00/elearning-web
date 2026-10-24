import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AccountTab } from "./AccountTab";

describe("AccountTab actions", () => {
  it("keeps account actions responsive and routes each request to its truthful handler", () => {
    const onUpgradePlanClick = vi.fn();
    const onAddPaymentMethodClick = vi.fn();
    const onDownloadDataClick = vi.fn();
    const onCloseAccountClick = vi.fn();

    render(<AccountTab
      subscription={{ name: "Semester 1", status: "Active", seats: 1, duration: "", renewDate: "", planType: "individual" }}
      onUpgradePlanClick={onUpgradePlanClick}
      onAddPaymentMethodClick={onAddPaymentMethodClick}
      onDownloadDataClick={onDownloadDataClick}
      onCloseAccountClick={onCloseAccountClick}
    />);

    fireEvent.click(screen.getByRole("button", { name: /admin-managed purchases/i }));
    fireEvent.click(screen.getByRole("button", { name: /payment methods/i }));
    fireEvent.click(screen.getByRole("button", { name: /download my data/i }));
    fireEvent.click(screen.getByRole("button", { name: /close account/i }));

    expect(onUpgradePlanClick).toHaveBeenCalledOnce();
    expect(onAddPaymentMethodClick).toHaveBeenCalledOnce();
    expect(onDownloadDataClick).toHaveBeenCalledOnce();
    expect(onCloseAccountClick).toHaveBeenCalledOnce();
  });

  it("keeps account actions available when the commercial summary is unavailable", () => {
    const onRetrySubscription = vi.fn();
    const onDownloadDataClick = vi.fn();

    render(<AccountTab
      subscription={{ name: "", status: "Unavailable", seats: 0, duration: "", renewDate: "", planType: "individual" }}
      subscriptionDataUnavailable
      onRetrySubscription={onRetrySubscription}
      onUpgradePlanClick={vi.fn()}
      onDownloadDataClick={onDownloadDataClick}
      onCloseAccountClick={vi.fn()}
    />);

    expect(screen.getByText("Details unavailable")).toBeTruthy();
    expect(screen.getByText(/couldn't load your current Offering and seat details/i)).toBeTruthy();
    expect(screen.queryByText(/No current Semester Offering subscription is recorded/i)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /retry details/i }));
    fireEvent.click(screen.getByRole("button", { name: /download my data/i }));

    expect(onRetrySubscription).toHaveBeenCalledOnce();
    expect(onDownloadDataClick).toHaveBeenCalledOnce();
  });
});
