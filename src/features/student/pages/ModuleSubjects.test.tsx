import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { StudentCourseDetail } from "../api/studentCoursesApi";
import { ModuleSubjects } from "./ModuleSubjects";

const base = { courseId: "basics", title: "Basics 1", brand: { code: "nexus", name: "Nexus" }, cataloguePresentation: "module_based", unitLabel: "Module", code: "BASICS1", access: { isEnrolled: true, canOpen: false, canViewDetails: true, enrollmentStatus: "active" }, lessonCount: 0, academicSemester: { title: "Semester 1" }, academicInstitution: { name: "Delta University" }, academicLevel: { title: "Level 1" }, chapters: [] } as unknown as StudentCourseDetail;
function Probe() { const location = useLocation(); return <p>{location.pathname}{location.search}</p>; }
function show(course: StudentCourseDetail) { return render(<MemoryRouter initialEntries={["/my-courses/basics"]}><Routes><Route path="/my-courses/basics" element={<ModuleSubjects course={course} />} /><Route path="/my-courses" element={<Probe />} /><Route path="*" element={<Probe />} /></Routes><Probe /></MemoryRouter>); }

describe("module subject selection", () => {
  it("lists only returned subjects and opens the selected one", () => {
    const course = { ...base, chapters: [{ chapterId: "anatomy", title: "Anatomy — Theory", lessons: [] }, { chapterId: "histology", title: "Histology — Theory", lessons: [] }] } as unknown as StudentCourseDetail;
    show(course);
    fireEvent.click(screen.getByRole("button", { name: /Open Histology/ }));
    expect(screen.getByText("/my-courses/basics?subject=histology")).toBeTruthy();
  });
  it("shows returned subject names even when the lessons are not released", () => {
    show({ ...base, subjectSections: [{ id: "ana", title: "Anatomy — Theory", sortOrder: 1 }] });
    expect(screen.getByRole("button", { name: /Open Anatomy/ })).toBeTruthy();
    expect(screen.queryByText(/Histology/)).toBeNull();
  });
  it("explains when no subjects were returned instead of inventing them", () => {
    show(base);
    expect(screen.getByText("No subjects have been added to this module yet.")).toBeTruthy();
    expect(screen.queryByText(/Anatomy/)).toBeNull();
  });
});
