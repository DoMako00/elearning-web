import { adminDeliveryRequest, type DeliveryCourse } from "./adminDelivery.http";

export interface AdminMediaAsset {
  readonly id: string;
  readonly resourceId: string | null;
  readonly status: "pending_upload" | "uploaded" | "verified" | "published" | "withdrawn" | "failed";
  readonly title: string;
  readonly contentType: string;
  readonly expectedSize: number;
  readonly objectSize: number | null;
  readonly watermarkRequired: boolean;
  readonly documentDeliveryMode: string | null;
}

export interface AdminLessonMedia {
  readonly assets: readonly AdminMediaAsset[];
  readonly uploadPolicy: {
    readonly multipartThresholdBytes: number;
    readonly maxUploadBytes: number | null;
    readonly namespace: "production" | "acceptance";
  };
}

export function adminLessonMediaPath(course: DeliveryCourse, lessonId: string): string {
  return "/v1/admin/brands/" + encodeURIComponent(course.brandId) +
    "/courses/" + encodeURIComponent(course.id) +
    "/lessons/" + encodeURIComponent(lessonId) + "/media";
}

export function inspectAdminLessonMedia(course: DeliveryCourse, lessonId: string, signal?: AbortSignal) {
  return adminDeliveryRequest<AdminLessonMedia>(adminLessonMediaPath(course, lessonId), { signal });
}
