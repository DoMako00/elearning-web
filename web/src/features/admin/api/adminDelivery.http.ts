import { env } from "../../../app/config/env";
import { getSupabaseAccessToken } from "../../auth/api/supabaseAuth";

export type DeliveryStatus = "draft" | "published" | "archived";
export type ResourceKind = "video" | "document" | "quiz" | "file" | "link";

export interface DeliveryChapter {
  readonly id: string;
  readonly brandCourseId: string;
  readonly title: string;
  readonly sortOrder: number;
  readonly status: DeliveryStatus;
  readonly version: number;
}

export interface DeliveryLesson extends DeliveryChapter {
  readonly courseChapterId: string;
}

export interface DeliveryResource extends DeliveryChapter {
  readonly courseLessonId: string;
  readonly resourceKind: ResourceKind;
}

export interface DeliveryCourse {
  readonly id: string;
  readonly brandId: string;
  readonly code: string;
  readonly title: string;
  readonly academicInstitutionId: string | null;
  readonly academicInstitution: {
    readonly id: string;
    readonly code: string;
    readonly displayName: string;
  } | null;
  readonly academicModuleId: string | null;
  readonly academicModule: {
    readonly id: string;
    readonly code: string;
    readonly sourceDisplayLabel: string;
  } | null;
  readonly brand: {
    readonly id: string;
    readonly code: string;
    readonly name: string;
  };
  readonly status: DeliveryStatus;
  readonly classification: "academic_module_offering" | "standalone";
  readonly cataloguePresentation: "module_based" | "subject_based";
  readonly version: number;
  readonly updatedAt: string;
  readonly instructorAssignments: readonly {
    readonly instructorId: string;
    readonly displayName: string;
    readonly status: string;
  }[];
}

export interface CatalogueChapter {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly sortOrder: number;
  readonly status: "active" | "retired";
}

export interface DeliveryModule {
  readonly id: string;
  readonly code: string;
  readonly sourceDisplayLabel: string;
  readonly chapters?: readonly CatalogueChapter[];
}

export interface CatalogueModule extends DeliveryModule {
  readonly academicInstitutionId: string;
  readonly reviewStatus: string;
  readonly resourceCount: number;
  readonly chapters: readonly CatalogueChapter[];
}

export interface CatalogueSemester {
  readonly id: string;
  readonly semesterNumber: number;
  readonly displayTitle: string;
  readonly status: string;
  readonly modules: readonly CatalogueModule[];
}

export interface CatalogueLevel {
  readonly id: string;
  readonly levelNumber: number;
  readonly displayTitle: string;
  readonly status: string;
  readonly semesters: readonly CatalogueSemester[];
}

export interface CatalogueInstitution {
  readonly id: string;
  readonly code: string;
  readonly displayName: string;
  readonly status: string;
  readonly levels: readonly CatalogueLevel[];
}

export interface CatalogueBrand {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly status: string;
  readonly allowedAcademicInstitutions: readonly Pick<
    CatalogueInstitution,
    "id" | "code" | "displayName" | "status"
  >[];
}

export interface AdminDeliveryRequestOptions {
  readonly signal?: AbortSignal;
  readonly body?: Record<string, unknown>;
  readonly key?: string;
  readonly method?: "POST" | "PATCH";
}

interface ApiEnvelope<T> {
  readonly ok?: boolean;
  readonly data?: T;
  readonly error?: {
    readonly details?: { readonly code?: string };
  };
}

export class AdminDeliveryError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AdminDeliveryError";
  }
}

export const catalogueInstitutionsPath = "/v1/admin/curriculum/institutions";
export const catalogueBrandAccessPath = "/v1/admin/curriculum/brand-access";

export function deliveryCoursePath(brandId: string, courseId: string): string {
  return (
    "/v1/admin/brands/" +
    encodeURIComponent(brandId) +
    "/courses/" +
    encodeURIComponent(courseId)
  );
}

const catalogueValidationMessages: Readonly<Record<string, string>> = {
  brand_not_found: "Select an existing active commercial brand.",
  academic_institution_required: "Select an academic catalogue.",
  academic_institution_not_found: "This academic catalogue is unavailable.",
  brand_catalogue_not_allowed:
    "This brand is not allowed to use the selected academic catalogue.",
  academic_module_not_found: "The module was not found or is unavailable.",
  institution_module_mismatch:
    "The module does not belong to the selected academic catalogue.",
  academic_module_required: "Select an academic module.",
  brandId: "Select a commercial brand.",
  academicInstitutionId: "Select an academic catalogue.",
  academicModuleId: "Select a valid academic module.",
};

function messageForStatus(status: number): string {
  if (status === 400)
    return "The request was rejected. Check the form fields and try again.";
  if (status === 401) return "Your session has expired. Sign in again.";
  if (status === 403) return "You do not have permission to manage this brand.";
  if (status === 404)
    return "This course or its parent structure is no longer available.";
  if (status === 409)
    return "The structure changed. Reload it before trying again.";
  if (status === 426)
    return "A secure connection is required for this operation.";
  if (status === 503)
    return "The admin API is temporarily unavailable. Try again shortly.";
  return "The admin API could not complete this request.";
}

export async function adminDeliveryRequest<T>(
  path: string,
  options: AdminDeliveryRequestOptions = {},
): Promise<T> {
  if (env.adminDataSource !== "api") {
    throw new AdminDeliveryError(
      "Course delivery requires API mode. Demo content is not available in this builder.",
      0,
    );
  }
  if (!env.apiBaseUrl) {
    throw new AdminDeliveryError("The admin API is not configured.", 0);
  }

  const method = options.method ?? "GET";
  if ((method === "POST" || method === "PATCH") && !options.key) {
    throw new AdminDeliveryError(
      "An idempotency key is required before saving.",
      0,
    );
  }

  const accessToken = await getSupabaseAccessToken();
  if (!accessToken) {
    throw new AdminDeliveryError(
      "Sign in to manage course delivery. Your session is missing or expired.",
      401,
    );
  }

  const headers: Record<string, string> = {
    Authorization: "Bearer " + accessToken,
  };
  if (options.key) headers["Idempotency-Key"] = options.key;
  if (options.body) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(env.apiBaseUrl + path, {
      signal: options.signal,
      method,
      headers,
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError")
      throw cause;
    throw new AdminDeliveryError(
      "The admin API could not be reached. Check your connection.",
      0,
    );
  }

  if (response.status === 204) return undefined as T;

  const envelope = (await response
    .json()
    .catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok) {
    const validationCode = envelope?.error?.details?.code;
    const message =
      validationCode &&
      Object.hasOwn(catalogueValidationMessages, validationCode)
        ? catalogueValidationMessages[validationCode]
        : messageForStatus(response.status);
    throw new AdminDeliveryError(message, response.status);
  }

  if (envelope?.ok !== true || envelope.data === undefined) {
    throw new AdminDeliveryError(
      "The admin API returned an invalid response.",
      response.status,
    );
  }

  return envelope.data;
}
