/** Administrative metadata/participation contracts. No response grants access. */
export type M2bEntity = 'chapters' | 'lessons' | 'resources' | 'releases' | 'enrollments' | 'progress';
export type M2bStructureEntity = 'chapters' | 'lessons' | 'resources' | 'releases';
export type M2bContentStatus = 'draft' | 'published' | 'archived';
export type M2bEnrollmentStatus = 'active' | 'completed' | 'ended' | 'archived';
export type M2bProgressStatus = 'not_started' | 'in_progress' | 'completed';
export type M2bResourceKind = 'video' | 'document' | 'quiz' | 'link' | 'file';
export interface M2bChapterFields { title: string; sortOrder: number; status: M2bContentStatus; }
export interface M2bLessonFields extends M2bChapterFields { courseChapterId: string; }
export interface M2bResourceFields extends M2bChapterFields { courseLessonId: string; resourceKind: M2bResourceKind; }
export interface M2bReleaseFields { status: M2bContentStatus; availableFrom: string; availableUntil: string | null; }
export interface M2bEnrollmentFields { studentProfileId: string; status: M2bEnrollmentStatus; enrolledAt: string; completedAt: string | null; endedAt: string | null; }
export interface M2bProgressFields { courseEnrollmentId: string; courseLessonId: string; status: M2bProgressStatus; startedAt: string | null; completedAt: string | null; }
export interface M2bFields { chapters: M2bChapterFields; lessons: M2bLessonFields; resources: M2bResourceFields; releases: M2bReleaseFields; enrollments: M2bEnrollmentFields; progress: M2bProgressFields; }
export type M2bRecord<E extends M2bEntity = M2bEntity> = M2bFields[E] & { id: string; brandCourseId: string; brandId: string; version: number; createdAt: string; updatedAt: string; };
export interface M2bCommand<E extends M2bEntity = M2bEntity> { entity: E; brandId: string; brandCourseId: string; id?: string; fields: M2bFields[E]; reason: string; idempotencyKey: string; expectedVersion?: number; }
export interface M2bScope { brandId: string; brandCourseId: string; }
export interface M2bSensitiveCommandMetadata { readonly correlationId: string; readonly reason: string; readonly idempotencyKey: string; readonly expectedVersion?: number; readonly platform: { readonly platformId: string; readonly platformCode: string; readonly platformName: string }; }
export interface CreateM2bStructureCommand<E extends M2bStructureEntity = M2bStructureEntity> { readonly metadata: M2bSensitiveCommandMetadata; readonly entity: E; readonly brandId: string; readonly brandCourseId: string; readonly fields: M2bFields[E]; }
export interface UpdateM2bStructureCommand<E extends M2bStructureEntity = M2bStructureEntity> { readonly metadata: M2bSensitiveCommandMetadata; readonly entity: E; readonly brandId: string; readonly brandCourseId: string; readonly recordId: string; readonly fields: Partial<M2bFields[E]>; }
export interface M2bStructureCommandResult { readonly brandId: string; readonly courseId: string; readonly entity: M2bStructureEntity; readonly recordId: string; }

/** Exact permissions: read lists, create records, update records in one brand.
 * Release/resource publication remains metadata and cannot authorize delivery.
 * Permission application must map these to an existing platform_owner only.
 */
export const M2B_PERMISSIONS = ['admin.delivery.read','admin.delivery.create','admin.delivery.update'] as const;
export type M2bPermission = typeof M2B_PERMISSIONS[number];
