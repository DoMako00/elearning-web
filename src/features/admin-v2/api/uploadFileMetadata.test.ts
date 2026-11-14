import { afterEach, describe, expect, it, vi } from "vitest";
import { lessonFileType, readVideoDuration } from "./uploadFileMetadata";

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("lesson upload file metadata", () => {
  it("accepts PDF and MP4 when the browser omits the MIME type", () => {
    expect(lessonFileType(new File(["pdf"], "notes.PDF"))).toBe("document");
    expect(lessonFileType(new File(["video"], "lesson.MP4"))).toBe("video");
    expect(lessonFileType(new File(["x"], "notes.pdf", { type: "image/png" }))).toBeNull();
    expect(lessonFileType(new File(["x"], "notes.txt"))).toBeNull();
  });

  it("extracts and rounds up video duration, then releases the local URL", async () => {
    vi.useFakeTimers();
    const video = document.createElement("video");
    vi.spyOn(video, "pause").mockImplementation(() => {});
    vi.spyOn(video, "load").mockImplementation(() => {});
    Object.defineProperty(video, "duration", { value: 42.2 });
    vi.spyOn(document, "createElement").mockReturnValue(video);
    vi.stubGlobal("URL", { createObjectURL: vi.fn(), revokeObjectURL: vi.fn() });
    const create = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const promise = readVideoDuration(new File(["x"], "lesson.mp4", { type: "video/mp4" }));
    video.dispatchEvent(new Event("loadedmetadata"));
    await expect(promise).resolves.toBe(43);
    expect(create).toHaveBeenCalledTimes(1);
    expect(revoke).not.toHaveBeenCalled();
    video.dispatchEvent(new Event("emptied"));
    expect(revoke).toHaveBeenCalledWith("blob:test");
  });

  it("reports unreadable metadata and releases the local URL", async () => {
    vi.useFakeTimers();
    const video = document.createElement("video");
    vi.spyOn(video, "pause").mockImplementation(() => {});
    vi.spyOn(video, "load").mockImplementation(() => {});
    vi.spyOn(document, "createElement").mockReturnValue(video);
    vi.stubGlobal("URL", { createObjectURL: vi.fn(), revokeObjectURL: vi.fn() });
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:bad");
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const promise = readVideoDuration(new File(["x"], "broken.mp4", { type: "video/mp4" }));
    video.dispatchEvent(new Event("error"));
    await expect(promise).rejects.toThrow("Could not read this video's duration");
    vi.advanceTimersByTime(5000);
    expect(revoke).toHaveBeenCalledWith("blob:bad");
  });
});
