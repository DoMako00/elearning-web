import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { RecommendedCourses } from "./RecommendedCourses";
import type { StudentCourseItem } from "../../../features/student/api/studentCoursesApi";

vi.mock("../../../features/student/api/useStudentLearning", () => ({
  useStudentSavedCourses: () => ({ data: [], isLoading: false, isError: false }),
  useToggleStudentSavedCourse: () => ({ mutate: vi.fn(), isPending: false }),
}));

function course(id: string, access: { isEnrolled: boolean; canOpen: boolean }): StudentCourseItem {
  return {
    courseId: id, title: id, code: id,
    brand: { code: "nexus", name: "Nexus" },
    academicInstitution: { code: "delta", name: "Delta University" },
    academicLevel: { levelNumber: 1, title: "Year 1" },
    academicSemester: { semesterNumber: 1, title: "Semester 1" },
    access: { ...access, enrollmentStatus: access.isEnrolled ? "active" : null },
  } as unknown as StudentCourseItem;
}

function renderRecommendations(courses: StudentCourseItem[]) {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<RecommendedCourses courses={courses} />} />
        <Route path="/my-courses/:id" element={<p>opened course</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RecommendedCourses access decisions", () => {
  it("does not open a course the server says cannot be opened", () => {
    renderRecommendations([course("locked-course", { isEnrolled: false, canOpen: false })]);
    fireEvent.click(screen.getByRole("link", { name: /locked-course \(not enrolled\)/i }));
    expect(screen.queryByText("opened course")).toBeNull();
    expect(screen.getByRole("status").textContent).toMatch(/enrolled before opening/i);
  });

  it("opens a course only when access.canOpen is true", () => {
    renderRecommendations([course("preview-course", { isEnrolled: false, canOpen: true })]);
    fireEvent.click(screen.getByRole("link", { name: /open preview-course/i }));
    expect(screen.getByText("opened course")).toBeTruthy();
  });

  it("does not recommend courses the student is already enrolled in", () => {
    renderRecommendations([course("enrolled-course", { isEnrolled: true, canOpen: true })]);
    expect(screen.queryByText("enrolled-course")).toBeNull();
  });
});
