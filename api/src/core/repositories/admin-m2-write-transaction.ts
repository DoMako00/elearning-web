import type { AdminCoreError } from "../errors";
import type { Result } from "../../shared";
import type { M2BrandCourseScope, M2BrandCourseStatus, M2InstructorStatus } from "../../contracts/admin";

export interface AdminM2ExecutionIdentity { readonly brandId: string; readonly adminProfileId: string; }
export interface AdminM2IdempotencyIdentity extends AdminM2ExecutionIdentity { readonly commandName: string; readonly idempotencyKey: string; }
export interface AdminM2Receipt { readonly adminActionId: string; readonly auditLogId: string; readonly commandFingerprint: string; readonly resultSummary: Readonly<Record<string, unknown>>; }
export interface AdminM2InstructorState { readonly id: string; readonly displayName: string; readonly professionalTitle: string | null; readonly status: M2InstructorStatus; readonly updatedAt: string; }
export interface AdminM2BrandInstructorState { readonly id: string; readonly brandId: string; readonly instructorId: string; readonly status: M2InstructorStatus; readonly updatedAt: string; }
export interface AdminM2BrandCourseState { readonly id: string; readonly brandId: string; readonly academicModuleId: string | null; readonly courseCode: string; readonly title: string; readonly courseScope: M2BrandCourseScope; readonly status: M2BrandCourseStatus; readonly updatedAt: string; }
export interface AdminM2CourseInstructorState { readonly id: string; readonly brandId: string; readonly courseId: string; readonly instructorId: string; readonly status: M2InstructorStatus; readonly updatedAt: string; }

export interface AdminM2ActionEvidence {
  readonly identity: AdminM2IdempotencyIdentity;
  readonly commandFingerprint: string;
  readonly targetType: "instructor" | "brand_instructor" | "brand_course" | "course_instructor";
  readonly targetId: string;
  readonly reason: string;
  readonly correlationId: string;
  readonly requestId?: string;
  readonly policySetId?: string;
  readonly expectedVersion?: string;
  readonly resultSummary: Readonly<Record<string, unknown>>;
  readonly beforeSummary: Readonly<Record<string, unknown>> | null;
  readonly afterSummary: Readonly<Record<string, unknown>>;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface AdminM2WriteTransaction {
  lockExecutionIdentity(identity: AdminM2ExecutionIdentity): Promise<boolean>;
  findReceipt(identity: AdminM2IdempotencyIdentity): Promise<AdminM2Receipt | null>;
  lockInstructor(id: string): Promise<AdminM2InstructorState | null>;
  lockAcademicModule(id: string): Promise<boolean>;
  lockBrandInstructor(brandId: string, instructorId: string): Promise<AdminM2BrandInstructorState | null>;
  lockBrandCourse(brandId: string, courseId: string): Promise<AdminM2BrandCourseState | null>;
  lockBrandCourseByCode(brandId: string, courseCode: string): Promise<AdminM2BrandCourseState | null>;
  lockCourseInstructor(brandId: string, courseId: string, instructorId: string): Promise<AdminM2CourseInstructorState | null>;
  insertInstructor(input: { readonly displayName: string; readonly professionalTitle: string | null }): Promise<AdminM2InstructorState>;
  updateInstructor(input: { readonly id: string; readonly displayName: string; readonly professionalTitle: string | null; readonly status: M2InstructorStatus }): Promise<AdminM2InstructorState>;
  insertBrandInstructor(input: { readonly brandId: string; readonly instructorId: string }): Promise<AdminM2BrandInstructorState>;
  updateBrandInstructorStatus(input: { readonly id: string; readonly status: M2InstructorStatus }): Promise<AdminM2BrandInstructorState>;
  insertBrandCourse(input: { readonly brandId: string; readonly academicModuleId: string | null; readonly courseCode: string; readonly title: string; readonly courseScope: M2BrandCourseScope }): Promise<AdminM2BrandCourseState>;
  updateBrandCourse(input: { readonly id: string; readonly academicModuleId: string | null; readonly title: string; readonly courseScope: M2BrandCourseScope; readonly status: M2BrandCourseStatus }): Promise<AdminM2BrandCourseState>;
  insertCourseInstructor(input: { readonly brandId: string; readonly courseId: string; readonly instructorId: string }): Promise<AdminM2CourseInstructorState>;
  updateCourseInstructorStatus(input: { readonly id: string; readonly status: M2InstructorStatus }): Promise<AdminM2CourseInstructorState>;
  writeEvidence(input: AdminM2ActionEvidence): Promise<{ readonly adminActionId: string; readonly auditLogId: string }>;
}

export interface AdminM2WriteTransactionRunner {
  run<T>(correlationId: string, work: (transaction: AdminM2WriteTransaction) => Promise<Result<T, AdminCoreError>>): Promise<Result<T, AdminCoreError>>;
  findCommittedReceipt(identity: AdminM2IdempotencyIdentity, correlationId: string): Promise<Result<AdminM2Receipt | null, AdminCoreError>>;
  close(): Promise<void>;
}
