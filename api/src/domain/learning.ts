import type { AuditedEntity, EntityId, Instant, LifecycleStatus, PlatformScopedEntity, VersionedPolicyReference } from "./shared";

export interface Program extends AuditedEntity, PlatformScopedEntity {
  readonly code: string;
  readonly title: string;
  readonly status: LifecycleStatus;
}

export interface AcademicYear extends AuditedEntity, PlatformScopedEntity {
  readonly programId: EntityId;
  readonly label: string;
  readonly startsAt: Instant;
  readonly endsAt: Instant;
  readonly status: LifecycleStatus;
}

export interface Semester extends AuditedEntity, PlatformScopedEntity {
  readonly academicYearId: EntityId;
  readonly label: string;
  readonly sequence: number;
  readonly startsAt: Instant;
  readonly endsAt: Instant;
  readonly status: LifecycleStatus;
}

export interface Subject extends AuditedEntity, PlatformScopedEntity {
  readonly programId: EntityId;
  readonly academicYearId: EntityId;
  readonly semesterId: EntityId | null;
  readonly code: string;
  readonly title: string;
  readonly status: LifecycleStatus;
}

export interface Module extends AuditedEntity, PlatformScopedEntity {
  readonly subjectId: EntityId;
  readonly title: string;
  readonly sequence: number;
  readonly status: LifecycleStatus;
}

export interface Chapter extends AuditedEntity, PlatformScopedEntity {
  readonly moduleId: EntityId;
  readonly title: string;
  readonly sequence: number;
  readonly status: LifecycleStatus;
}

export interface Lesson extends AuditedEntity, PlatformScopedEntity {
  readonly chapterId: EntityId;
  readonly title: string;
  readonly sequence: number;
  readonly completionPolicyReference: VersionedPolicyReference | null;
  readonly releasePolicyReference: VersionedPolicyReference | null;
  readonly status: LifecycleStatus;
}

export interface LessonResource extends AuditedEntity, PlatformScopedEntity {
  readonly lessonId: EntityId;
  readonly resourceType: "video" | "document" | "link" | "download";
  readonly title: string;
  readonly sequence: number;
  readonly status: LifecycleStatus;
}

export interface VideoAsset extends AuditedEntity, PlatformScopedEntity {
  readonly lessonResourceId: EntityId;
  readonly storageReference: string;
  readonly contentHash: string;
  readonly deliveryPolicyReference: VersionedPolicyReference;
  readonly status: LifecycleStatus;
}

export interface DocumentAsset extends AuditedEntity, PlatformScopedEntity {
  readonly lessonResourceId: EntityId;
  readonly storageReference: string;
  readonly contentHash: string;
  readonly deliveryPolicyReference: VersionedPolicyReference;
  readonly status: LifecycleStatus;
}

export interface Quiz extends AuditedEntity, PlatformScopedEntity {
  readonly lessonId: EntityId | null;
  readonly title: string;
  readonly assessmentId: EntityId;
  readonly status: LifecycleStatus;
}

export interface Assessment extends AuditedEntity, PlatformScopedEntity {
  readonly title: string;
  readonly policyReference: VersionedPolicyReference;
  readonly status: LifecycleStatus;
}

export interface Question extends AuditedEntity, PlatformScopedEntity {
  readonly assessmentId: EntityId;
  readonly questionType: "single_choice" | "multiple_choice" | "true_false" | "free_text";
  readonly prompt: string;
  readonly sequence: number;
  readonly scoringReference: string;
  readonly status: LifecycleStatus;
}

export interface Attempt extends AuditedEntity, PlatformScopedEntity {
  readonly assessmentId: EntityId;
  readonly studentUserId: EntityId;
  readonly enrollmentId: EntityId;
  readonly status: "in_progress" | "submitted" | "graded" | "invalidated";
  readonly startedAt: Instant;
  readonly submittedAt: Instant | null;
  readonly score: number | null;
  readonly assessmentSnapshot: Readonly<Record<string, unknown>>;
}

/** Enrollment records participation; it never grants commercial entitlement. */
export interface Enrollment extends AuditedEntity, PlatformScopedEntity {
  readonly studentUserId: EntityId;
  readonly programId: EntityId | null;
  readonly subjectId: EntityId | null;
  readonly status: "active" | "completed" | "withdrawn" | "archived";
  readonly enrolledAt: Instant;
  readonly completedAt: Instant | null;
}

/** Progress is intentionally independent from playback and authorization records. */
export interface Progress extends AuditedEntity, PlatformScopedEntity {
  readonly enrollmentId: EntityId;
  readonly lessonId: EntityId;
  readonly status: "not_started" | "in_progress" | "completed";
  readonly completionEvidenceReference: string | null;
  readonly startedAt: Instant | null;
  readonly completedAt: Instant | null;
  readonly lastActivityAt: Instant;
}
