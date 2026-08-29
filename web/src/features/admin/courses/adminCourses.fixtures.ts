import type { AdminBrandCode } from "../api";
import { adminInstructorFixtures, type AdminInstructorFixture } from "../instructors/adminInstructors.fixtures";
import { academicModuleById } from "../curriculum/adminCurriculum.fixtures";
export { academicModuleFixtures, type AcademicModuleReference } from "../curriculum/adminCurriculum.fixtures";

export type CourseScope = "curriculum" | "standalone";
export type CoursePublicationStatus = "published" | "draft" | "archived";
export type CourseInstructorRole = "lead" | "co-instructor" | "contributor";

export interface CourseInstructorAssignment {
  id: string;
  courseId: string;
  instructorId: string;
  brandCode: AdminBrandCode;
  role: CourseInstructorRole;
  responsibilityPercentage: number | null;
  active: boolean;
}

export interface BrandCourse {
  id: string;
  reference: string;
  brandCode: AdminBrandCode;
  title: string;
  description: string;
  scope: CourseScope;
  academicModuleId: string | null;
  status: CoursePublicationStatus;
  updatedAt: string;
  instructorAssignments: readonly CourseInstructorAssignment[];
}

export interface CourseDirectoryFilters {
  scope: "all" | CourseScope;
  level: "all" | string;
  semester: "all" | string;
  instructorId: "all" | string;
  status: "all" | CoursePublicationStatus;
  mapping: "all" | "mapped" | "unmapped";
}

const a = (courseId: string, instructorId: string, brandCode: AdminBrandCode, role: CourseInstructorRole = "lead", responsibilityPercentage: number | null = 100): CourseInstructorAssignment => ({
  id: `${courseId}-${instructorId}`,
  courseId,
  instructorId,
  brandCode,
  role,
  responsibilityPercentage,
  active: true,
});

const course = (id: string, brandCode: AdminBrandCode, title: string, scope: CourseScope, academicModuleId: string | null, status: CoursePublicationStatus, updatedAt: string, assignments: readonly CourseInstructorAssignment[] = []): BrandCourse => ({
  id,
  reference: `${brandCode === "medway" ? "MED" : "ELT"}-CRS-${id.slice(-3).padStart(3, "0")}`,
  brandCode,
  title,
  description: `${title} is a deterministic frontend preview course for the ${brandCode === "medway" ? "Medway" : "Elite"} teaching brand.`,
  scope,
  academicModuleId,
  status,
  updatedAt,
  instructorAssignments: assignments,
});

export const adminCourseFixtures: readonly BrandCourse[] = [
  course("med-101", "medway", "Gross Anatomy: Upper Limb", "curriculum", "module-anat-101", "published", "2026-08-27", [a("med-101", "ins-10049", "medway"), a("med-101", "ins-10084", "medway", "co-instructor", 40)]),
  course("med-102", "medway", "Cardiovascular Physiology", "curriculum", "module-phys-103", "published", "2026-08-26", [a("med-102", "ins-10024", "medway")]),
  course("med-103", "medway", "Medical Ethics Workshop", "standalone", null, "draft", "2026-08-25"),
  course("med-104", "medway", "Biochemistry Fundamentals", "curriculum", "module-bioc-102", "published", "2026-08-24", [a("med-104", "ins-10073", "medway")]),
  course("med-105", "medway", "Research Methods for Clinicians", "standalone", null, "published", "2026-08-23", [a("med-105", "ins-10091", "medway")]),
  course("med-106", "medway", "Foundations of Medical Microbiology", "curriculum", "module-micr-201", "published", "2026-08-22", [a("med-106", "ins-10031", "medway")]),
  course("med-107", "medway", "Principles of Immunology", "curriculum", "module-immm-202", "published", "2026-08-21", [a("med-107", "ins-10042", "medway")]),
  course("med-108", "medway", "Clinical Pharmacology Lab", "curriculum", "module-phar-203", "draft", "2026-08-20"),
  course("med-109", "medway", "Neuroanatomy Applications", "curriculum", "module-neur-301", "published", "2026-08-19", [a("med-109", "ins-10049", "medway")]),
  course("med-110", "medway", "Integrated Clinical Reasoning", "curriculum", "module-cmed-302", "published", "2026-08-18", [a("med-110", "ins-10073", "medway")]),
  course("med-111", "medway", "Diagnostic Microbiology", "curriculum", "module-micr-201", "archived", "2026-08-17", [a("med-111", "ins-10079", "medway")]),
  course("med-112", "medway", "Health Communication Essentials", "standalone", null, "draft", "2026-08-16"),
  course("elt-201", "elite", "Applied Anatomy Studio", "curriculum", "module-anat-101", "published", "2026-08-27", [a("elt-201", "ins-10084", "elite")]),
  course("elt-202", "elite", "Advanced Cardiac Pathophysiology", "curriculum", "module-phys-103", "published", "2026-08-26", [a("elt-202", "ins-10024", "elite")]),
  course("elt-203", "elite", "Clinical Case Review", "standalone", null, "draft", "2026-08-25", [a("elt-203", "ins-10055", "elite")]),
  course("elt-204", "elite", "Applied Clinical Pharmacology", "curriculum", "module-phar-203", "published", "2026-08-24", [a("elt-204", "ins-10038", "elite")]),
  course("elt-205", "elite", "Advanced Clinical Integration", "curriculum", "module-cmed-302", "published", "2026-08-23", [a("elt-205", "ins-10073", "elite")]),
  course("elt-206", "elite", "Clinical Immunopathology", "curriculum", "module-immm-202", "published", "2026-08-22", [a("elt-206", "ins-10042", "elite")]),
  course("elt-207", "elite", "Therapeutic Decision Making", "curriculum", "module-phar-203", "published", "2026-08-21", [a("elt-207", "ins-10038", "elite")]),
  course("elt-208", "elite", "Acute Care Casework", "standalone", null, "draft", "2026-08-20", [a("elt-208", "ins-10055", "elite")]),
  course("elt-209", "elite", "Neurological Examination", "curriculum", "module-neur-301", "published", "2026-08-19"),
  course("elt-210", "elite", "Evidence-led Clinical Writing", "standalone", null, "archived", "2026-08-18"),
  course("elt-211", "elite", "Cardiology Case Conference", "curriculum", "module-cmed-302", "published", "2026-08-17", [a("elt-211", "ins-10024", "elite"), a("elt-211", "ins-10073", "elite", "contributor", 25)]),
  course("elt-212", "elite", "Independent Study Skills", "standalone", null, "draft", "2026-08-16"),
];

export const courseModuleById = (moduleId: string | null) => academicModuleById(moduleId);
export const courseInstructorById = (instructorId: string) => adminInstructorFixtures.find((instructor) => instructor.id === instructorId);
export const activeInstructorsForBrand = (brandCode: AdminBrandCode): readonly AdminInstructorFixture[] => adminInstructorFixtures.filter((instructor) => instructor.status === "active" && instructor.brandAssignments.some((assignment) => assignment.brandCode === brandCode && assignment.status === "active"));
export const brandLabel = (brandCode: AdminBrandCode) => brandCode === "medway" ? "Medway" : "Elite";
