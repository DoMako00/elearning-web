import type { AdminV2Data, BrandCode, CourseRecord, CurriculumUnitRecord, StudentRecord } from "../types/adminV2.types";

export function institutionCodeForBrand(brand: BrandCode | "all"): "buc" | "delta" | undefined {
  if (brand === "nexus") return "delta";
  if (brand === "medway" || brand === "elite") return "buc";
  return undefined;
}

export function institutionForBrand(data: AdminV2Data, brand: BrandCode | "all") {
  const code = institutionCodeForBrand(brand);
  if (!code) return undefined;
  return data.institutions.find(
    (institution) => institution.status === "Active" && institution.shortName.trim().toLowerCase() === code,
  );
}

export function unitForCourse(data: AdminV2Data, course: CourseRecord): CurriculumUnitRecord | undefined {
  return data.curriculumUnits.find((unit) => unit.id === course.curriculumUnitId);
}

export function yearForUnit(data: AdminV2Data, unit?: CurriculumUnitRecord) {
  return unit ? data.academicYears.find((year) => year.id === unit.academicYearId) : undefined;
}

export function semesterForUnit(data: AdminV2Data, unit?: CurriculumUnitRecord) {
  return unit ? data.semesters.find((semester) => semester.id === unit.semesterId) : undefined;
}

export function institutionForUnit(data: AdminV2Data, unit?: CurriculumUnitRecord) {
  return unit ? data.institutions.find((institution) => institution.id === unit.institutionId) : undefined;
}

export function courseMatchesStudentPlacement(data: AdminV2Data, course: CourseRecord, student: StudentRecord) {
  const moduleInstitution = institutionForUnit(data, unitForCourse(data, course));
  const courseInstitution = data.institutions.find((institution) => institution.id === course.academicInstitutionId);
  if (moduleInstitution && courseInstitution && moduleInstitution.id !== courseInstitution.id) return false;
  const institution = moduleInstitution ?? courseInstitution;
  if (!institution) return false;

  if (student.academicInstitutionId) return institution.id === student.academicInstitutionId;
  const normalize = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const studentInstitution = normalize(student.institution);
  if (!studentInstitution) return false;
  return [institution.shortName, institution.name].some((value) => {
    const normalizedInstitution = normalize(value);
    return normalizedInstitution === studentInstitution || normalizedInstitution.includes(studentInstitution);
  });
}

export function courseUnitLabel(data: AdminV2Data, course: CourseRecord) {
  const unit = unitForCourse(data, course);
  return unit ? `${unit.code} ${unit.title}` : "Not mapped";
}

export function courseLevel(data: AdminV2Data, course: CourseRecord) {
  return yearForUnit(data, unitForCourse(data, course))?.title ?? "—";
}

export function courseSemester(data: AdminV2Data, course: CourseRecord) {
  return semesterForUnit(data, unitForCourse(data, course))?.title ?? "—";
}

export function expectedUnitType(brand: BrandCode, yearTitle: string): "Subject" | "Module" {
  const yearNumber = Number(yearTitle.match(/\d+/)?.[0] ?? 0);
  return brand === "nexus" || yearNumber > 1 ? "Module" : "Subject";
}
