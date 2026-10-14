import { extractApiErrorMessage, requireApiClient } from "../../../app/api/client";
import type { BrandAccess, BrandCourse, StructureItem } from "./adminAcademicApi";

type Envelope<T> = { ok: true; correlationId: string; data: T };
export interface LessonResourceDto extends StructureItem {
  brandId: string;
  brandCourseId: string;
  courseLessonId: string;
  resourceKind: "video" | "document" | "quiz" | "link" | "file";
}
export interface MediaAssetDto {
  id: string; brandId: string; courseId: string; lessonId: string; resourceId: string | null;
  assetType: "video" | "document" | "image"; title: string; contentType: string;
  expectedSize: number; objectSize: number | null; status: "pending_upload" | "uploaded" | "verified" | "published" | "withdrawn" | "failed";
  documentDeliveryMode: string | null; watermarkRequired: boolean;
}
export interface LessonMediaInventory { assets: MediaAssetDto[]; uploadPolicy: { multipartThresholdBytes: number; maxUploadBytes: number | null; namespace: "production" | "acceptance" }; }
export interface ContentScope { brand: BrandAccess; course: BrandCourse; chapter: StructureItem; lesson: StructureItem; }
export interface LessonMediaScope { brand: Pick<BrandAccess, "id">; course: Pick<BrandCourse, "id">; lesson: Pick<StructureItem, "id">; }

const newKey = () => crypto.randomUUID();
function unwrap<T>(result: { data?: unknown; error?: unknown; response?: Response }): T {
  if (result.error) {
    const raw = result.error as { error?: { code?: unknown; correlationId?: unknown } };
    const error = new Error(extractApiErrorMessage(result.error, "The content request failed.")) as Error & { status?: number; code?: string; correlationId?: string };
    error.status = result.response?.status;
    if (typeof raw.error?.code === "string") error.code = raw.error.code;
    if (typeof raw.error?.correlationId === "string") error.correlationId = raw.error.correlationId;
    throw error;
  }
  const envelope = result.data as Envelope<T> | undefined;
  if (!envelope || !("data" in envelope)) throw new Error("The server returned an incomplete content response.");
  return envelope.data;
}
async function request<T>(make: (api: Awaited<ReturnType<typeof requireApiClient>>) => Promise<any>): Promise<T> { return unwrap<T>(await make(await requireApiClient())); }
const resourcePath = (brandId: string, courseId: string) => ({ params: { path: { brandId, courseId } } });
const mediaPath = (scope: LessonMediaScope) => ({ params: { path: { brandId: scope.brand.id, courseId: scope.course.id, lessonId: scope.lesson.id } } });
const writeHeaders = () => ({ headers: { "Idempotency-Key": newKey() } });

export async function listLessonResources(brandId: string, courseId: string): Promise<LessonResourceDto[]> {
  return request((api) => api.GET("/v1/admin/brands/{brandId}/courses/{courseId}/resources" as never, resourcePath(brandId, courseId)));
}

// The current backend exposes resource detail through the authorized Course resource list,
// not a separate GET-by-resource route. Resolve detail from that mounted contract.
export async function getLessonResource(brandId: string, courseId: string, resourceId: string): Promise<LessonResourceDto> {
  const resource = (await listLessonResources(brandId, courseId)).find((item) => item.id === resourceId);
  if (!resource) throw new Error("The Lesson Resource was not found in this Course.");
  return resource;
}

export async function listLessonMedia(scope: LessonMediaScope): Promise<LessonMediaInventory> {
  return request((api) => api.GET("/v1/admin/brands/{brandId}/courses/{courseId}/lessons/{lessonId}/media" as never, mediaPath(scope)));
}

export async function createLessonResource(scope: ContentScope, title: string, sortOrder: number, resourceKind: "video" | "document") {
  const api = await requireApiClient();
  const result = await api.POST("/v1/admin/brands/{brandId}/courses/{courseId}/resources" as never, {
    ...resourcePath(scope.brand.id, scope.course.id), ...writeHeaders(),
    body: { title, sortOrder, status: "draft", courseLessonId: scope.lesson.id, resourceKind, reason: "Lesson resource created through Admin content workflow" },
  });
  const data = unwrap<{ recordId?: string; data?: { recordId?: string } }>(result);
  const id = data.recordId ?? data.data?.recordId;
  if (!id) throw new Error("The server did not return the created Lesson Resource ID.");
  return id;
}

export async function updateLessonResource(scope: ContentScope, resource: LessonResourceDto, fields: Partial<Pick<LessonResourceDto, "title" | "sortOrder" | "status">>) {
  return request((api) => api.PATCH("/v1/admin/brands/{brandId}/courses/{courseId}/resources/{resourceId}" as never, {
    params: { path: { brandId: scope.brand.id, courseId: scope.course.id, resourceId: resource.id } }, ...writeHeaders(),
    body: { ...fields, expectedVersion: resource.version, reason: "Lesson resource lifecycle update" },
  }));
}

export async function createMediaAsset(scope: ContentScope, resourceId: string, title: string, file: File) {
  const assetType = file.type === "application/pdf" ? "document" : "video";
  const contentType = assetType === "document" ? "application/pdf" : "video/mp4";
  if ((assetType === "video" && file.type !== "video/mp4") || (assetType === "document" && file.type !== "application/pdf")) throw new Error("The media API accepts MP4 video and PDF files only.");
  const result = await request<{ asset: MediaAssetDto }>((api) => api.POST("/v1/admin/brands/{brandId}/courses/{courseId}/lessons/{lessonId}/media" as never, {
    ...mediaPath(scope), ...writeHeaders(),
    body: { assetType, title, contentType, expectedSize: file.size, resourceId },
  }));
  return result.asset;
}

async function postMedia(scope: LessonMediaScope, assetId: string, operation: string, body?: unknown) {
  return request<Record<string, any>>((api) => api.POST(`/v1/admin/brands/{brandId}/courses/{courseId}/lessons/{lessonId}/media/{assetId}/${operation}` as never, {
    ...mediaPath(scope), params: { path: { ...mediaPath(scope).params.path, assetId } }, ...writeHeaders(), ...(body === undefined ? {} : { body }),
  }));
}

export async function uploadAndVerifyMedia(scope: ContentScope, asset: MediaAssetDto, file: File, policy: LessonMediaInventory["uploadPolicy"]) {
  if (file.size < policy.multipartThresholdBytes) {
    const { upload, requiredHeaders } = await postMedia(scope, asset.id, "upload");
    const signed = upload as { url?: string; expiresAt?: string };
    if (!signed.url) throw new Error("The backend did not provide a temporary upload URL.");
    const response = await fetch(signed.url, { method: "PUT", headers: requiredHeaders as Record<string, string>, body: file });
    if (!response.ok) throw new Error("The temporary upload failed. Retry the upload from the resource record.");
  } else {
    const started = await postMedia(scope, asset.id, "multipart");
    const multipart = started.upload as { id?: string } | undefined;
    if (!multipart?.id) throw new Error("The backend did not start the multipart upload.");
    const chunkSize = Math.max(5 * 1024 * 1024, Math.ceil(file.size / 10_000));
    const parts: Array<{ partNumber: number; etag: string }> = [];
    for (let offset = 0, partNumber = 1; offset < file.size; offset += chunkSize, partNumber++) {
      const part = await postMedia(scope, asset.id, `multipart/${multipart.id}/part/${partNumber}`);
      const signed = part.signed as { url?: string } | undefined;
      if (!signed?.url) throw new Error("The backend did not provide a temporary multipart URL.");
      const response = await fetch(signed.url, { method: "PUT", body: file.slice(offset, Math.min(file.size, offset + chunkSize)) });
      const etag = response.headers.get("etag");
      if (!response.ok || !etag) throw new Error("A multipart upload part failed verification.");
      parts.push({ partNumber, etag });
    }
    await postMedia(scope, asset.id, `multipart/${multipart.id}/complete`, { parts });
  }
  await postMedia(scope, asset.id, "verify");
}

export async function publishMedia(scope: ContentScope, resource: LessonResourceDto, assetId: string) {
  const published = await postMedia(scope, assetId, "publish");
  await updateLessonResource(scope, resource, { status: "published" });
  return published;
}
export async function withdrawMedia(scope: ContentScope, resource: LessonResourceDto, assetId: string) {
  await postMedia(scope, assetId, "withdraw");
  return updateLessonResource(scope, resource, { status: "archived" });
}
export async function archiveLessonResource(scope: ContentScope, resource: LessonResourceDto) {
  return updateLessonResource(scope, resource, { status: "archived" });
}

