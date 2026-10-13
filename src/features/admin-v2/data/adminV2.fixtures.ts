import type { AdminV2Data } from "../types/adminV2.types";

/**
 * Admin V2 has no client-side domain-data fallback. These empty collections
 * keep the accepted presentation mountable while its API adapters load real
 * server state.
 */
export const initialAdminV2Data: AdminV2Data = {
  courses: [],
  students: [],
  plans: [],
  subscriptions: [],
  payments: [],
  enrollments: [],
  devices: [],
  sessions: [],
  institutions: [],
  curricula: [],
  academicYears: [],
  semesters: [],
  curriculumUnits: [],
  chapters: [],
  lessons: [],
  contentResources: [],
  auditEvents: [],
  instructors: [],
  instructorBrandAssignments: [],
};

export const brandName = (code: string) =>
  ({ medway: "Medway", elite: "Elite", nexus: "Nexus" }[code] ?? code);

export const courseName = (id: string, data: AdminV2Data) =>
  data.courses.find((course) => course.id === id)?.title ?? "Course unavailable";
