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
});
