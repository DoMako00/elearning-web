import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { SessionContentCard } from "./SessionContentCard";
import { getStudentProtectedMedia, type StudentCourseItem, type StudentLessonItem } from "../../api/studentCoursesApi";
vi.mock("../../api/studentCoursesApi", () => ({getStudentProtectedMedia:vi.fn()}));
const course = {courseId:"module",access:{canOpen:true}} as StudentCourseItem;
const lesson: StudentLessonItem = {lessonId:"session-2",chapterId:"chapter",title:"Session 2",sortOrder:2,status:"published",mediaStatus:"pending_media",resourceType:null,resourceTitle:null,resourceId:null,playbackAvailable:false,progressStatus:"not_started",learningItems:[
  {id:"pdf",title:"Session PDF",kind:"pdf",assetId:null,available:false,state:"pending_media"},
  {id:"assignment",title:"Session assignment",kind:"assignment",assetId:null,available:true,state:"open"},
  {id:"exam",title:"Session exam",kind:"exam",assetId:null,available:true,state:"available"},
]};
const content = (value: StudentLessonItem) => <MemoryRouter><Routes><Route path="/" element={<SessionContentCard course={course} lesson={value} number={2} loading={false} error={false} />} /><Route path="/assignments/assignment" element={<p>Actual assignment route</p>} /></Routes></MemoryRouter>;
describe("active session contents", () => {
  it("replaces previous session items when the selected lesson changes", () => {
    const view=render(content(lesson));
    expect(screen.getByText("Session exam")).toBeTruthy();
    view.rerender(content({...lesson,lessonId:"session-1",learningItems:[]}));
    expect(screen.queryByText("Session exam")).toBeNull();
    expect(screen.getByRole("status").textContent).toMatch(/No materials, assignments or exams/);
  });
  it("opens the linked assignment instead of a generic calendar or course", () => {
    render(content(lesson));
    fireEvent.click(screen.getByText("Session assignment"));
    fireEvent.click(screen.getByRole("button",{name:"View Assignment"}));
    expect(screen.getByText("Actual assignment route")).toBeTruthy();
  });
  it("does not request protected delivery for an unreleased PDF", () => {
    render(content(lesson));
    fireEvent.click(screen.getByText("Session PDF"));
    fireEvent.click(screen.getByRole("button",{name:"Open PDF"}));
    expect(screen.getByRole("alert").textContent).toMatch(/not been released/);
    expect(getStudentProtectedMedia).not.toHaveBeenCalled();
  });
});
