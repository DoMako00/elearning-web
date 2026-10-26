import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MantineProvider } from "@mantine/core";
import { InstructorOverviewPage } from "./InstructorOverviewPage";
import { useAdminV2 } from "../layout/AdminV2Layout";

vi.mock("../layout/AdminV2Layout", () => ({
  useAdminV2: vi.fn(),
}));

vi.mock("../api/adminAssignmentsApi", () => ({
  adminAssignmentsApi: {
    list: vi.fn().mockResolvedValue({
      items: [
        { id: "a1", brandCourseId: "c1", title: "Assignment 1", needsReviewCount: 2, submissionCount: 5, status: "published" },
      ],
    }),
  },
}));

vi.mock("../api/adminAssessmentApi", () => ({
  adminAssessmentApi: {
    list: vi.fn().mockResolvedValue({
      items: [
        { id: "e1", title: "Final Exam", status: "published", kind: "exam" },
      ],
    }),
  },
}));

vi.mock("../api/adminContentApi", () => ({
  listContentReviewRequests: vi.fn().mockResolvedValue({
    items: [],
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

describe("InstructorOverviewPage", () => {
  it("renders teaching workflow, metrics, and assigned courses", async () => {
    vi.mocked(useAdminV2).mockReturnValue({
      workspace: {
        workspace: "instructor",
        displayRole: "Instructor",
        isGlobal: false,
        activeBrandId: "b1",
        brands: [{ id: "b1", code: "nexus", name: "Nexus" }],
        courses: [
          {
            id: "c1",
            brandId: "b1",
            brandCode: "nexus",
            brandName: "Nexus",
            code: "CRS-101",
            title: "Basic of Health and Life 2",
            academicModuleId: null,
            academicInstitutionId: null,
            academicLevelId: "lvl1",
            academicSemesterId: "sem1",
            status: "published",
          },
        ],
        instructor: { id: "ins1", displayName: "Dr. Instructor", courseIds: ["c1"] },
        roleCodes: ["instructor"],
        permissionCodes: [],
      },
      data: {} as any,
      setData: vi.fn(),
      brand: "nexus",
      setBrand: vi.fn(),
      globalSearch: "",
      setGlobalSearch: vi.fn(),
      domainLoading: false,
      domainError: "",
      refreshServerDomains: vi.fn(),
      reportDomainError: vi.fn(),
      overview: null,
    });

    render(
      <MantineProvider>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <InstructorOverviewPage />
          </MemoryRouter>
        </QueryClientProvider>
      </MantineProvider>
    );

    // Welcome banner
    expect(screen.getByText("Your teaching, one step at a time")).toBeTruthy();

    // Metric cards
    expect(screen.getByText("My courses")).toBeTruthy();
    expect(screen.getByText("Assignments to grade")).toBeTruthy();
    expect(screen.getByText("Published exams")).toBeTruthy();

    // Assigned courses section
    expect(screen.getByText("Your assigned courses")).toBeTruthy();
    expect(screen.getByText("Basic of Health and Life 2")).toBeTruthy();
    expect(screen.getByText(/Nexus · CRS-101/)).toBeTruthy();
  });
});
