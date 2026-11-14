import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { uploadAndVerifyMedia, type ContentScope, type MediaAssetDto } from "./adminContentApi";

const transport = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock("../../../app/api/client", () => ({
  requireApiClient: async () => ({ POST: transport.post }),
  extractApiErrorMessage: () => "Request failed",
}));

const scope = { brand: { id: "brand" }, course: { id: "course" }, lesson: { id: "lesson" }, chapter: { id: "chapter" } } as ContentScope;
const asset = { id: "asset" } as MediaAssetDto;
const policy = { multipartThresholdBytes: 50 * 1024 * 1024, maxUploadBytes: null, namespace: "production" as const };
const bytes = 100 * 1024 * 1024;
const file = { size: bytes, slice: (start: number, end: number) => ({ size: end - start }) } as File;

beforeEach(() => {
  transport.post.mockReset();
  transport.post.mockImplementation(async (path: string) => {
    const part = path.match(/\/part\/(\d+)$/);
    const data = part ? { signed: { url: `https://storage.test/${part[1]}` } }
      : path.endsWith("/multipart") ? { upload: { id: "upload" } } : {};
    return { data: { ok: true, data } };
  });
});
afterEach(() => vi.unstubAllGlobals());

describe("multipart media uploads", () => {
  it("uses larger parts with bounded parallel uploads and completes in part order", async () => {
    let inFlight = 0, peak = 0;
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      inFlight++; peak = Math.max(peak, inFlight);
      await new Promise(resolve => setTimeout(resolve, url.endsWith("/1") ? 20 : 5));
      inFlight--;
      return { ok: true, headers: { get: () => `etag-${url.split("/").at(-1)}` } };
    }));
    const progress = vi.fn();
    await uploadAndVerifyMedia(scope, asset, file, policy, progress);
    expect(peak).toBe(3);
    expect(transport.post.mock.calls.filter(([path]) => /\/part\/\d+$/.test(path))).toHaveLength(4);
    const complete = transport.post.mock.calls.find(([path]) => path.endsWith("/complete"));
    expect(complete?.[1].body.parts.map((part: { partNumber: number }) => part.partNumber)).toEqual([1, 2, 3, 4]);
    expect(progress).toHaveBeenLastCalledWith(bytes, bytes);
    expect(transport.post.mock.calls.some(([path]) => path.endsWith("/verify"))).toBe(true);
  });

  it("waits for active parts and aborts an incomplete multipart upload on failure", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => ({ ok: !url.endsWith("/1"), headers: { get: () => "etag" } })));
    await expect(uploadAndVerifyMedia(scope, asset, file, policy)).rejects.toThrow("multipart upload part failed");
    const paths = transport.post.mock.calls.map(([path]) => path as string);
    expect(paths.some(path => path.endsWith("/abort"))).toBe(true);
    expect(paths.some(path => path.endsWith("/complete") || path.endsWith("/verify"))).toBe(false);
  });
});
