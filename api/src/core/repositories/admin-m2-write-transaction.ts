import type { AdminCoreError } from "../errors";
import type { Result } from "../../shared";
import type { M2BrandCourseClassification, M2BrandCourseStatus, M2InstructorStatus, M2AssignmentStatus } from "./m2-read-repositories";

export interface AdminM2ExecutionIdentity { readonly scopeKind:"global"|"brand"; readonly brandId:string|null; readonly adminProfileId:string; }
export interface AdminM2IdempotencyIdentity extends AdminM2ExecutionIdentity { readonly commandName:string; readonly idempotencyKey:string; }
export interface AdminM2Receipt { readonly receiptId:string; readonly auditEventId:string; readonly requestFingerprint:string; readonly resultSummary:Readonly<Record<string,unknown>>; }
export interface AdminM2InstructorState { readonly id:string; readonly code:string; readonly displayName:string; readonly status:M2InstructorStatus; readonly version:number; readonly updatedAt:string; }
export interface AdminM2InstructorBrandAssignmentState { readonly id:string; readonly brandId:string; readonly instructorId:string; readonly status:M2AssignmentStatus; readonly version:number; readonly updatedAt:string; }
export interface AdminM2BrandCourseState { readonly id:string; readonly brandId:string; readonly academicModuleId:string|null; readonly code:string; readonly title:string; readonly classification:M2BrandCourseClassification; readonly status:M2BrandCourseStatus; readonly version:number; readonly updatedAt:string; }
export interface AdminM2CourseInstructorAssignmentState { readonly id:string; readonly brandId:string; readonly courseId:string; readonly instructorBrandAssignmentId:string; readonly instructorId:string; readonly status:M2AssignmentStatus; readonly version:number; readonly updatedAt:string; }
export type AdminM2BrandInstructorState=AdminM2InstructorBrandAssignmentState;
export type AdminM2CourseInstructorState=AdminM2CourseInstructorAssignmentState;

export interface AdminM2ActionEvidence { readonly identity:AdminM2IdempotencyIdentity; readonly requestFingerprint:string; readonly targetType:"instructor"|"instructor_brand_assignment"|"brand_course"|"course_instructor_assignment"; readonly targetId:string; readonly reason:string; readonly correlationId:string; readonly resultSummary:Readonly<Record<string,unknown>>; readonly beforeSummary:Readonly<Record<string,unknown>>|null; readonly afterSummary:Readonly<Record<string,unknown>>; readonly metadata:Readonly<Record<string,unknown>>; }
export interface AdminM2WriteTransaction {
  lockExecutionIdentity(identity:AdminM2ExecutionIdentity):Promise<boolean>;
  findReceipt(identity:AdminM2IdempotencyIdentity):Promise<AdminM2Receipt|null>;
  lockInstructor(id:string):Promise<AdminM2InstructorState|null>;
  lockAcademicModule(id:string):Promise<boolean>;
  lockBrandInstructor(brandId:string,instructorId:string):Promise<AdminM2InstructorBrandAssignmentState|null>;
  lockBrandCourse(brandId:string,courseId:string):Promise<AdminM2BrandCourseState|null>;
  lockBrandCourseByCode(brandId:string,code:string):Promise<AdminM2BrandCourseState|null>;
  lockCourseInstructor(brandId:string,courseId:string,instructorId:string):Promise<AdminM2CourseInstructorAssignmentState|null>;
  insertInstructor(input:{readonly code:string;readonly displayName:string}):Promise<AdminM2InstructorState>;
  updateInstructor(input:{readonly id:string;readonly code:string;readonly displayName:string;readonly status:M2InstructorStatus}):Promise<AdminM2InstructorState>;
  insertBrandInstructor(input:{readonly brandId:string;readonly instructorId:string}):Promise<AdminM2InstructorBrandAssignmentState>;
  updateBrandInstructorStatus(input:{readonly id:string;readonly status:M2AssignmentStatus}):Promise<AdminM2InstructorBrandAssignmentState>;
  insertBrandCourse(input:{readonly brandId:string;readonly academicModuleId:string|null;readonly code:string;readonly title:string;readonly classification:M2BrandCourseClassification}):Promise<AdminM2BrandCourseState>;
  updateBrandCourse(input:{readonly id:string;readonly academicModuleId:string|null;readonly title:string;readonly classification:M2BrandCourseClassification;readonly status:M2BrandCourseStatus}):Promise<AdminM2BrandCourseState>;
  insertCourseInstructor(input:{readonly brandId:string;readonly courseId:string;readonly instructorId:string}):Promise<AdminM2CourseInstructorAssignmentState>;
  updateCourseInstructorStatus(input:{readonly id:string;readonly status:M2AssignmentStatus}):Promise<AdminM2CourseInstructorAssignmentState>;
  writeEvidence(input:AdminM2ActionEvidence):Promise<{readonly receiptId:string;readonly auditEventId:string}>;
}
export interface AdminM2WriteTransactionRunner { run<T>(correlationId:string,work:(transaction:AdminM2WriteTransaction)=>Promise<Result<T,AdminCoreError>>):Promise<Result<T,AdminCoreError>>; findCommittedReceipt(identity:AdminM2IdempotencyIdentity,correlationId:string):Promise<Result<AdminM2Receipt|null,AdminCoreError>>; close():Promise<void>; }
