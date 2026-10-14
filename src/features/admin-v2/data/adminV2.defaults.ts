import type { AdminV2Data } from "../types/adminV2.types";

export const emptyAdminV2Data: AdminV2Data = {
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

export const brandName = (code: string) => ({ medway: "Medway", elite: "Elite", nexus: "Nexus" }[code] ?? code);
