import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchScopedCourseDetail, studentCourseKeys, useStudentCourseList } from "./useStudentCourses";
import { getStudentCourse, listAllStudentCourses, type StudentCourseItem } from "./studentCoursesApi";
import { useStudentProfile } from "./useStudentLearning";
import { StudentScopeProvider } from "../scope/StudentScopeProvider";

vi.mock("./studentCoursesApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./studentCoursesApi")>()),
  listAllStudentCourses: vi.fn(),
  getStudentCourse: vi.fn(),
}));
vi.mock("./useStudentLearning", () => ({ useStudentProfile: vi.fn() }));
vi.mock("../../../app/providers/AuthProvider", () => ({ useAuth: () => ({ status: "authenticated" }) }));

const NEXUS = { brand: "nexus" as const, brandName: "Nexus", institutionCode: "delta", institutionName: "Delta University" };

function course(id: string, brand: string, institution: string): StudentCourseItem {
  return { courseId: id, title: id, brand: { code: brand, name: brand }, academicInstitution: { code: institution, name: institution } } as unknown as StudentCourseItem;
}

let currentProfile = { brand: { id: "b", code: "nexus", name: "Nexus" }, institution: { id: "i", code: "delta", name: "Delta University" } };
function setProfile(brand: string, institution: string) {
  currentProfile = { brand: { id: "b", code: brand, name: brand }, institution: { id: "i", code: institution, name: institution } };
}

function CourseList() {
  const query = useStudentCourseList("mine");
  if (query.isPending) return <p>loading</p>;
  if (query.isError) return <p>error</p>;
  return <ul>{query.data.map((item) => <li key={item.courseId}>{item.courseId}</li>)}</ul>;
}

function renderWithScope(children: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const ui = () => <QueryClientProvider client={client}><StudentScopeProvider>{children}</StudentScopeProvider></QueryClientProvider>;
  const result = render(ui());
  return { ...result, rerenderScope: () => result.rerender(ui()) };
}

beforeEach(() => {
  setProfile("nexus", "delta");
  vi.mocked(useStudentProfile).mockImplementation(() => ({ data: currentProfile, isPending: false, isError: false, error: null, refetch: vi.fn() }) as unknown as ReturnType<typeof useStudentProfile>);
  vi.mocked(listAllStudentCourses).mockReset();
  vi.mocked(getStudentCourse).mockReset();
});

describe("scoped course lists", () => {
  it("a Nexus student only sees Nexus/Delta courses, and the request carries the Nexus brand", async () => {
    vi.mocked(listAllStudentCourses).mockResolvedValue([
      course("nexus-delta-1", "nexus", "delta"),
      course("medway-buc-1", "medway", "buc"),
      course("elite-buc-1", "elite", "buc"),
      course("nexus-buc-mismatch", "nexus", "buc"),
    ]);
    renderWithScope(<CourseList />);
    await waitFor(() => expect(screen.getByText("nexus-delta-1")).toBeTruthy());
    expect(screen.queryByText("medway-buc-1")).toBeNull();
    expect(screen.queryByText("elite-buc-1")).toBeNull();
    expect(screen.queryByText("nexus-buc-mismatch")).toBeNull();
    expect(listAllStudentCourses).toHaveBeenCalledWith(expect.objectContaining({ view: "mine", brand: "nexus" }));
  });

  it("keys cached course data by brand so another scope can never reuse it", () => {
    expect(studentCourseKeys.list("mine", "nexus")).not.toEqual(studentCourseKeys.list("mine", "medway"));
    expect(studentCourseKeys.detail("c1", "nexus")).not.toEqual(studentCourseKeys.detail("c1", "elite"));
  });

  it("a late response for the previous scope cannot overwrite the new scope", async () => {
    let resolveNexus!: (items: StudentCourseItem[]) => void;
    vi.mocked(listAllStudentCourses).mockImplementation(({ brand }) => brand === "nexus"
      ? new Promise((resolve) => { resolveNexus = resolve; })
      : Promise.resolve([course("medway-buc-1", "medway", "buc")]));
    const view = renderWithScope(<CourseList />);
    expect(screen.getByText("loading")).toBeTruthy();

    setProfile("medway", "buc");
    view.rerenderScope();
    await waitFor(() => expect(screen.getByText("medway-buc-1")).toBeTruthy());

    await act(async () => { resolveNexus([course("nexus-delta-1", "nexus", "delta")]); });
    expect(screen.getByText("medway-buc-1")).toBeTruthy();
    expect(screen.queryByText("nexus-delta-1")).toBeNull();
  });
});

describe("scoped course detail", () => {
  it("refuses a course from another institution even if the server returned it", async () => {
    vi.mocked(getStudentCourse).mockResolvedValue({ ...course("medway-buc-1", "medway", "buc"), chapters: [] } as never);
    await expect(fetchScopedCourseDetail(NEXUS, "medway-buc-1")).rejects.toMatchObject({ status: 404, code: "scope_mismatch" });
    expect(getStudentCourse).toHaveBeenCalledWith(expect.objectContaining({ courseId: "medway-buc-1", brand: "nexus" }));
  });

  it("returns an in-scope course", async () => {
    vi.mocked(getStudentCourse).mockResolvedValue({ ...course("nexus-delta-1", "nexus", "delta"), chapters: [] } as never);
    await expect(fetchScopedCourseDetail(NEXUS, "nexus-delta-1")).resolves.toMatchObject({ courseId: "nexus-delta-1" });
  });
});
