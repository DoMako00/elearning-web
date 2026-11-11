import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { emptyAdminV2Data } from "../data/adminV2.defaults";
import { InstructorsPage } from "./InstructorsPage";
import { useAdminV2 } from "../layout/AdminV2Layout";

const api = vi.hoisted(() => ({
  assignInstructorToBrand: vi.fn(),
  createDirectoryInstructor: vi.fn(),
  createInstructorLogin: vi.fn(),
  getInstructor: vi.fn(),
  listBrandAccess: vi.fn(),
  setInstructorStatus: vi.fn(),
  writeInstructor: vi.fn(),
}));

vi.mock("../layout/AdminV2Layout", () => ({ useAdminV2: vi.fn(), AdminV2DomainStatus: () => null }));
vi.mock("../api/adminAcademicApi", () => api);

const instructorId = "10000000-0000-4000-8000-000000000001";
const brandId = "20000000-0000-4000-8000-000000000001";

function fixture(directBrand: boolean) {
  return {
    data: {
      ...emptyAdminV2Data,
      instructors: [{ id: instructorId, fullName: "Dr Sample", email: "doctor@example.edu", specialties: [], status: "Active" as const, createdAt: "2026-01-01", updatedAt: "2026-01-01" }],
      courses: [{ id: "course-1", title: "Course only assignment", brand: "nexus" as const, scope: "Curriculum" as const, curriculumUnitId: null, status: "Published" as const, updated: "2026-01-01", instructors: [{ instructorId, name: "Dr Sample", role: "Lead Instructor" as const }] }],
      instructorBrandAssignments: directBrand ? [{ id: "assignment-1", instructorId, brand: "nexus" as const, createdAt: "2026-01-01" }] : [],
    },
    setData: vi.fn(), brand: "nexus" as const, globalSearch: "", setBrand: vi.fn(), setGlobalSearch: vi.fn(),
    refreshServerDomains: vi.fn(), reportDomainError: vi.fn(),
  };
}

describe("Instructor sign-in eligibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.listBrandAccess.mockResolvedValue([{ id: brandId, code: "nexus", name: "Nexus", status: "active" }]);
  });

  it("does not treat a course Brand as a direct sign-in assignment", () => {
    vi.mocked(useAdminV2).mockReturnValue(fixture(false) as never);
    render(<InstructorsPage />);
    const button = screen.getByRole("button", { name: /Create Instructor login/i }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.title).toMatch(/active Brand first/i);
    expect(screen.getByText("No direct Brand assignment yet; course assignments alone do not enable sign-in.")).toBeTruthy();
  });

  it.each([
    ["created", "Sign-in invitation sent to doctor@example.edu."],
    ["resent", "The pending sign-in invitation was resent to doctor@example.edu."],
    ["already_active", "This Instructor login is already active."],
  ] as const)("reports the %s login state without creating another account", async (loginStatus, message) => {
    vi.mocked(useAdminV2).mockReturnValue(fixture(true) as never);
    api.createInstructorLogin.mockResolvedValue({ loginMethod: "email_otp", loginStatus, invitationSent: loginStatus !== "already_active" });
    render(<InstructorsPage />);
    const button = screen.getByRole("button", { name: /Create Instructor login/i }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    fireEvent.click(button);
    fireEvent.change(screen.getByLabelText("Reason for access"), { target: { value: "Assigned to Nexus anatomy" } });
    fireEvent.click(screen.getByRole("button", { name: "Send sign-in invitation" }));
    await waitFor(() => expect(api.createInstructorLogin).toHaveBeenCalledWith(brandId, instructorId, { email: "doctor@example.edu", reason: "Assigned to Nexus anatomy" }));
    expect((await screen.findByRole("status")).textContent).toContain(message);
  });
});
