import type { AcademicInstitution, BrandAccess, BrandCourse, Instructor, StructureItem } from "./adminAcademicApi";
import type { AdminV2Data, AcademicYearRecord, CourseChapter, CourseLesson, CourseRecord, CurriculumRecord, CurriculumUnitRecord, InstitutionRecord, InstructorBrandAssignment, InstructorRecord, SemesterRecord } from "../types/adminV2.types";

const dateLabel = (value?: string) => value ? new Date(value).toLocaleDateString() : "—";
const titleCase = (value: string) => value ? value[0].toUpperCase() + value.slice(1) : value;

export function mapInstitutionsToCurriculum(institutions: AcademicInstitution[]) {
  const result = { institutions: [] as InstitutionRecord[], curricula: [] as CurriculumRecord[], academicYears: [] as AcademicYearRecord[], semesters: [] as SemesterRecord[], curriculumUnits: [] as CurriculumUnitRecord[] };
  for (const institution of institutions) {
    const status = institution.status === "active" ? "Active" as const : "Archived" as const;
    result.institutions.push({ id: institution.id, name: institution.displayName, shortName: institution.code, status });
    // The accepted page groups the academic tree under a curriculum node; the persisted institution ID is its stable grouping key.
    result.curricula.push({ id: institution.id, institutionId: institution.id, title: `${institution.displayName} Curriculum`, status: "Approved", updatedAt: "—" });
    for (const level of institution.levels ?? []) {
      result.academicYears.push({ id: level.id, curriculumId: institution.id, title: level.displayTitle, order: level.sortOrder ?? level.levelNumber, status: level.status === "active" ? "Active" : "Archived" });
      for (const semester of level.semesters ?? []) {
        result.semesters.push({ id: semester.id, academicYearId: level.id, title: semester.displayTitle, order: semester.sortOrder ?? semester.semesterNumber, status: semester.status === "active" ? "Active" : "Archived" });
        for (const unit of semester.modules ?? []) result.curriculumUnits.push({ id: unit.id, institutionId: institution.id, academicYearId: level.id, semesterId: semester.id, type: "Module", code: unit.code, title: unit.sourceDisplayLabel, description: "", status: unit.reviewStatus === "approved" ? "Approved" : unit.reviewStatus === "retired" ? "Archived" : "Draft", order: unit.sortOrder ?? 0, version: unit.version });
      }
    }
  }
  return result;
}

export function mapCourseDtoToAdminCourse(course: BrandCourse, brand: BrandAccess, instructors: InstructorRecord[] = []): CourseRecord {
  return { id: course.id, title: course.title, brand: brand.code, scope: course.classification === "standalone" ? "Standalone" : "Curriculum", curriculumUnitId: course.academicModuleId, status: titleCase(course.status) as CourseRecord["status"], updated: dateLabel(course.updatedAt), version: course.version, code: course.code, brandId: course.brandId, academicInstitutionId: course.academicInstitutionId, cataloguePresentation: course.cataloguePresentation, instructors: (course.instructorAssignments ?? []).filter((item) => item.status === "active").map((item) => ({ instructorId: item.instructorId, name: item.displayName || instructors.find((instructor) => instructor.id === item.instructorId)?.fullName || "Instructor", role: "Unspecified" })) };
}

export function mapInstructorDto(instructor: Instructor): InstructorRecord {
  return { id: instructor.id, fullName: instructor.displayName, email: "", specialties: ["Not provided"], status: instructor.status === "active" ? "Active" : "Inactive", createdAt: dateLabel(instructor.createdAt), updatedAt: dateLabel(instructor.updatedAt), version: instructor.version, code: instructor.code };
}

export function mapBrandAssignments(assignments: Array<{ id: string; instructorId: string; brandId: string; status: string; createdAt?: string }>, brands: BrandAccess[]): InstructorBrandAssignment[] {
  const byId = new Map(brands.map((brand) => [brand.id, brand.code]));
  return assignments.flatMap((assignment) => { const brand = byId.get(assignment.brandId); return brand && assignment.status === "active" ? [{ id: assignment.id, instructorId: assignment.instructorId, brand, createdAt: dateLabel(assignment.createdAt) }] : []; });
}

export function mapChapterDto(item: StructureItem, courseId: string): CourseChapter { return { id: item.id, courseId, title: item.title, order: item.sortOrder, status: item.status === "archived" ? "Archived" : "Active", updatedAt: dateLabel(item.updatedAt), version:item.version, backendStatus:item.status }; }
export function mapLessonDto(item: StructureItem, courseId: string): CourseLesson { return { id: item.id, courseId, chapterId: item.courseChapterId ?? "", title: item.title, description: "", order: item.sortOrder, status: titleCase(item.status) as CourseLesson["status"], releaseMode: "Immediate", releaseAt: null, visibility: "Visible", updatedAt: dateLabel(item.updatedAt), version:item.version, deliverySettingsAvailable:false }; }

export function emptyAdminV2ServerDomainData(): Pick<AdminV2Data, "courses" | "institutions" | "curricula" | "academicYears" | "semesters" | "curriculumUnits" | "chapters" | "lessons" | "instructors" | "instructorBrandAssignments" | "contentResources" | "auditEvents" | "students" | "devices" | "sessions"> {
  return { courses: [], institutions: [], curricula: [], academicYears: [], semesters: [], curriculumUnits: [], chapters: [], lessons: [], instructors: [], instructorBrandAssignments: [], contentResources: [], auditEvents: [], students: [], devices: [], sessions: [] };
}
