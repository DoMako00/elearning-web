const text = { type: "string" } as const;
const identifier = { type: "string", format: "uuid" } as const;
const count = { type: "integer", minimum: 0 } as const;
const presentation = { type: "string", enum: ["subject_based", "module_based"] } as const;
const unitLabel = { type: "string", enum: ["Subject", "Module"] } as const;
const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const object = (properties: Record<string, unknown>) => ({ type: "object", additionalProperties: false, required: Object.keys(properties), properties });
const course = {
  courseId: identifier, title: text, code: text,
  brand: object({ code: { type: "string", enum: ["medway", "elite", "nexus"] }, name: text }),
  academicInstitution: object({ code: text, name: text }),
  academicLevel: object({ levelNumber: { type: "integer", minimum: 1 }, title: text }),
  academicSemester: object({ semesterNumber: { type: "integer", minimum: 1 }, title: text }),
  cataloguePresentation: presentation, unitLabel, status: { const: "published" },
  chapterCount: count, lessonCount: count,
  mediaSummary: object({ totalLessons: count, lessonsWithMedia: { const: 0, description: "No playable media is delivered in this phase." }, pendingMediaLessons: count }),
  updatedAt: { type: "string", format: "date-time" },
};
const envelope = (data: unknown) => object({ ok: { const: true }, correlationId: text, data });

export const studentCourseSchemas = {
  StudentLessonItem: object({
    lessonId: identifier, chapterId: identifier, title: text, sortOrder: { type: "integer", minimum: 1 }, status: { const: "published" },
    mediaStatus: { type: "string", enum: ["no_media", "pending_media", "ready"], description: "no_media when there is no visible resource; pending_media for published metadata only. ready is reserved and is never emitted by this phase." },
    resourceId: { type: ["string", "null"], format: "uuid" }, playbackAvailable: { const: false },
  }),
  StudentCourseChapter: object({ chapterId: identifier, title: text, sortOrder: { type: "integer", minimum: 1 }, status: { const: "published" }, lessons: { type: "array", items: ref("StudentLessonItem") } }),
  StudentCourseItem: object(course),
  StudentCourseDetail: object({ ...course, academicUnit: object({ code: text, label: text }), chapters: { type: "array", items: ref("StudentCourseChapter") } }),
  StudentCourseListResponse: envelope(object({ items: { type: "array", items: ref("StudentCourseItem") }, pagination: object({ page: { type: "integer", minimum: 1 }, pageSize: { type: "integer", minimum: 1, maximum: 100 }, totalItems: count }) })),
  StudentCourseDetailResponse: envelope(ref("StudentCourseDetail")),
  StudentCourseLessonsResponse: envelope(object({ courseId: identifier, cataloguePresentation: presentation, unitLabel, lessons: { type: "array", items: ref("StudentLessonItem") } })),
};

const brand = { name: "brand", in: "query", required: false, schema: { type: "string", enum: ["medway", "elite", "nexus"] }, description: "Optional when the verified student has one eligible membership. Required when multiple memberships exist. Never grants scope. BUC/Delta are institutions, not brands." };
const courseId = { name: "courseId", in: "path", required: true, schema: identifier };
const operation = (operationId: string, summary: string, schema: string, parameters: readonly unknown[]) => ({
  tags: ["Student courses"], operationId, summary, security: [{ StudentBearerAuth: [] }], parameters,
  description: "Published course structure scoped to the verified student's active commercial-brand membership and academic institution/level/semester. No enrollment or paid entitlement is fabricated. An identity with a persisted admin profile is rejected; admin preview is not provided by these endpoints. No media delivery URLs are returned.",
  responses: {
    "200": { description: "Visible structure; an empty list is valid.", content: { "application/json": { schema: ref(schema) } } },
    "400": { description: "Invalid/repeated/unsupported parameter, or brand selection needed." },
    "401": { description: "Missing, malformed, expired or invalid bearer token." },
    "403": { description: "No active student membership and valid academic placement in this scope, or identity belongs to an admin profile." },
    "404": { description: "Course missing or outside the student's visible scope." },
    "405": { description: "Only GET is supported." },
    "503": { description: "Real authentication or database reads are unavailable. No mock fallback." },
  },
});

export const studentCoursePaths = {
  "/v1/student/courses": { get: operation("listStudentCourses", "List visible student course shells", "StudentCourseListResponse", [brand,
    { name: "page", in: "query", schema: { type: "integer", minimum: 1, maximum: 1000000, default: 1 } },
    { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 25 } },
  ]) },
  "/v1/student/courses/{courseId}": { get: operation("getStudentCourse", "Read a visible course and its ordered chapters/lessons", "StudentCourseDetailResponse", [courseId, brand]) },
  "/v1/student/courses/{courseId}/lessons": { get: operation("listStudentCourseLessons", "List lessons in chapter order with truthful media states", "StudentCourseLessonsResponse", [courseId, brand]) },
};
