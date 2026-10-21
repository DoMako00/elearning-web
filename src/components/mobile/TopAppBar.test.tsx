import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TopAppBar } from "./TopAppBar";
import { useStudentNotifications } from "../../features/student/api/useStudentNotifications";
import { BrandOverrideProvider } from "../../app/providers/BrandProvider";
import { NEXUS_LOGO_URL } from "../../shared/brandAssets";

vi.mock("../../features/student/api/useStudentNotifications", () => ({ useStudentNotifications: vi.fn() }));
vi.mock("../../features/student/api/useStudentLearning", () => ({ useStudentProfile: () => ({ data: { fullName: "Nour Hassan" } }) }));

function renderBar() {
  render(
    <MemoryRouter>
      <BrandOverrideProvider brand={{ id: "nexus", name: "Nexus", shortName: "NE", logoUrl: NEXUS_LOGO_URL }}>
        <TopAppBar variant="main" />
      </BrandOverrideProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => vi.mocked(useStudentNotifications).mockReset());

describe("mobile TopAppBar", () => {
  it("shows the real brand and initials, and no fabricated XP or stock avatar", () => {
    vi.mocked(useStudentNotifications).mockReturnValue({ data: [] } as unknown as ReturnType<typeof useStudentNotifications>);
    renderBar();
    expect(screen.getByText("Nexus")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Nexus logo" }).querySelector("img")?.getAttribute("src")).toBe(NEXUS_LOGO_URL);
    expect(screen.queryByText(/GreenLearn/)).toBeNull();
    expect(screen.queryByText(/XP/)).toBeNull();
    expect(screen.getByText("NH")).toBeTruthy();
    expect(document.querySelector('img[src*="pravatar"]')).toBeNull();
    expect(screen.getByRole("button", { name: "Notifications" })).toBeTruthy();
  });

  it("derives the unread indicator from real notifications", () => {
    vi.mocked(useStudentNotifications).mockReturnValue({ data: [
      { id: "1", readAt: null }, { id: "2", readAt: "2026-10-01T00:00:00Z" }, { id: "3", readAt: null },
    ] } as unknown as ReturnType<typeof useStudentNotifications>);
    renderBar();
    expect(screen.getByRole("button", { name: "Notifications, 2 unread" })).toBeTruthy();
  });
});
