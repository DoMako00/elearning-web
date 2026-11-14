import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InstructorCourseContentPage } from "./InstructorCourseContentPage";

const api = vi.hoisted(() => ({
  listStructure: vi.fn(), createStructureRecord: vi.fn(), listContentReviewRequests: vi.fn(),
  listLessonResources: vi.fn(), listLessonMedia: vi.fn(), createLessonResource: vi.fn(),
  createMediaAsset: vi.fn(), uploadAndVerifyMedia: vi.fn(), submitContentReview: vi.fn(),
  readVideoDuration: vi.fn(),
}));
vi.mock("../layout/AdminV2Layout", () => ({ useAdminV2: () => ({ workspace: {
  workspace: "instructor", brands: [{ id: "brand", code: "nexus", name: "Nexus" }],
  courses: [{ id: "course", brandId: "brand", code: "C", title: "Course", status: "published", academicInstitutionId: null, academicModuleId: null }],
} }) }));
vi.mock("../api/adminAcademicApi", () => ({ listStructure: api.listStructure, createStructureRecord: api.createStructureRecord }));
vi.mock("../api/adminContentApi", () => ({
  listContentReviewRequests: api.listContentReviewRequests, listLessonResources: api.listLessonResources,
  listLessonMedia: api.listLessonMedia, createLessonResource: api.createLessonResource,
  createMediaAsset: api.createMediaAsset, uploadAndVerifyMedia: api.uploadAndVerifyMedia,
  submitContentReview: api.submitContentReview,
}));
vi.mock("../api/uploadFileMetadata", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/uploadFileMetadata")>()), readVideoDuration: api.readVideoDuration,
}));

function renderBuilder() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={["/course/course"]}><Routes><Route path="/course/:courseId" element={<InstructorCourseContentPage />} /></Routes></MemoryRouter></QueryClientProvider>);
}

describe("Instructor lesson uploads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.listStructure.mockResolvedValue({ chapters: [{ id: "chapter", title: "Chapter", status: "draft", sortOrder: 1 }], lessons: [{ id: "lesson", title: "Lesson", status: "draft", sortOrder: 1, courseChapterId: "chapter" }] });
    api.listLessonResources.mockResolvedValue([]);
    api.listContentReviewRequests.mockResolvedValue({ items: [] });
    api.listLessonMedia.mockResolvedValue({ assets: [], uploadPolicy: { maxUploadBytes: 1000, multipartThresholdBytes: 500, namespace: "production" } });
    api.createLessonResource.mockResolvedValue("resource");
    api.createMediaAsset.mockResolvedValue({ id: "asset" });
    api.uploadAndVerifyMedia.mockResolvedValue(undefined);
    api.submitContentReview.mockResolvedValue(undefined);
    api.readVideoDuration.mockResolvedValue(42);
  });

  it("uses the filename as title, reads duration automatically, and submits the uploaded file for review", async () => {
    const { container } = renderBuilder();
    await screen.findByText("Upload video or PDF");
    const file = new File(["video"], "lesson.mp4", { type: "video/mp4" });
    fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [file] } });
    expect((screen.getByLabelText("Resource title") as HTMLInputElement).value).toBe("lesson");
    expect(screen.queryByText("Video duration (seconds)")).toBeNull();
    expect((screen.getByRole("button", { name: "Upload file" }) as HTMLButtonElement).disabled).toBe(false);
    fireEvent.submit(container.querySelector("form.instructor-course-builder__upload")!);
    await waitFor(() => expect(api.submitContentReview).toHaveBeenCalledTimes(1));
    expect(api.readVideoDuration).toHaveBeenCalledWith(file);
    expect(api.createMediaAsset).toHaveBeenCalledWith(expect.anything(), "resource", "lesson", file, 42);
    expect(api.uploadAndVerifyMedia).toHaveBeenCalledTimes(1);
    expect((await screen.findByRole("status")).textContent).toMatch(/waiting for administrator review/i);
  });

  it("does not create a resource when video metadata is unreadable", async () => {
    api.readVideoDuration.mockRejectedValue(new Error("Could not read this video's duration."));
    const { container } = renderBuilder();
    await screen.findByText("Upload video or PDF");
    fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [new File(["x"], "broken.mp4", { type: "video/mp4" })] } });
    fireEvent.submit(container.querySelector("form.instructor-course-builder__upload")!);
    expect((await screen.findByRole("alert")).textContent).toContain("Could not read this video's duration.");
    expect(api.createLessonResource).not.toHaveBeenCalled();
  });
});
