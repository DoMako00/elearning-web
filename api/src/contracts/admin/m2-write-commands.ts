import type { EntityId } from "./common";
import type { AdminSensitiveCommandMetadata } from "./commands";

export type M2InstructorStatus = "active" | "inactive" | "archived";
export type M2BrandCourseScope = "academic_module_offering" | "standalone";
export type M2BrandCourseStatus = "draft" | "published" | "archived";

export interface CreateInstructorCommand { readonly metadata: AdminSensitiveCommandMetadata; readonly code: string; readonly displayName: string; }
export interface UpdateInstructorCommand { readonly metadata: AdminSensitiveCommandMetadata; readonly instructorId: EntityId; readonly code?: string; readonly displayName?: string; }
export interface SetInstructorStatusCommand { readonly metadata: AdminSensitiveCommandMetadata; readonly instructorId: EntityId; readonly status: M2InstructorStatus; }

export interface AssignInstructorToBrandCommand { readonly metadata: AdminSensitiveCommandMetadata; readonly brandId: EntityId; readonly instructorId: EntityId; }
export interface SetBrandInstructorStatusCommand { readonly metadata: AdminSensitiveCommandMetadata; readonly brandId: EntityId; readonly instructorId: EntityId; readonly status: "active" | "inactive"; }

/** New courses are always draft; publishing is a separate lifecycle command. */
export interface CreateBrandCourseCommand { readonly metadata: AdminSensitiveCommandMetadata; readonly brandId: EntityId; readonly courseCode: string; readonly title: string; readonly courseScope: M2BrandCourseScope; readonly academicModuleId: EntityId | null; readonly status: "draft"; }
export interface UpdateBrandCourseCommand { readonly metadata: AdminSensitiveCommandMetadata; readonly brandId: EntityId; readonly courseId: EntityId; readonly title?: string; readonly courseScope?: M2BrandCourseScope; readonly academicModuleId?: EntityId | null; }
export interface SetBrandCourseStatusCommand { readonly metadata: AdminSensitiveCommandMetadata; readonly brandId: EntityId; readonly courseId: EntityId; readonly status: M2BrandCourseStatus; }

export interface AssignInstructorToCourseCommand { readonly metadata: AdminSensitiveCommandMetadata; readonly brandId: EntityId; readonly courseId: EntityId; readonly instructorId: EntityId; }
export interface SetCourseInstructorStatusCommand { readonly metadata: AdminSensitiveCommandMetadata; readonly brandId: EntityId; readonly courseId: EntityId; readonly instructorId: EntityId; readonly status: "active" | "inactive"; }

export interface CreateInstructorCommandResult { readonly instructorId: EntityId; }
export interface BrandInstructorCommandResult { readonly brandId: EntityId; readonly instructorId: EntityId; }
export interface CreateBrandCourseCommandResult { readonly brandId: EntityId; readonly courseId: EntityId; }
export interface CourseInstructorCommandResult { readonly brandId: EntityId; readonly courseId: EntityId; readonly instructorId: EntityId; }
