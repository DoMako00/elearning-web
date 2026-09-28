import type { AdminBrandCode } from "../api";

export type InstructorGlobalStatus = "active" | "inactive";
export type InstructorAssignmentStatus = "active" | "inactive";
export type InstructorPresence = "online" | "away" | "offline";

export interface InstructorBrandAssignment {
  brandCode: AdminBrandCode;
  status: InstructorAssignmentStatus;
  teachingRole: string;
  assignedAt: string;
}

export interface InstructorCourseAssignment {
  id: string;
  brandCode: AdminBrandCode;
  courseCode: string;
  courseName: string;
  teachingRole: string;
  active: boolean;
}

export interface InstructorSchedulePreview {
  id: string;
  brandCode: AdminBrandCode;
  courseName: string;
  dayLabel: string;
  timeLabel: string;
  deliveryMode: string;
}

export interface InstructorPerformancePreview {
  brandCode: AdminBrandCode;
  activeStudents: number;
  courseCompletionRate: number;
  averageRating: number;
}

export interface InstructorActivityPreview {
  id: string;
  brandCode: AdminBrandCode;
  title: string;
  detail: string;
  relativeTime: string;
}

export interface AdminInstructorFixture {
  id: string;
  reference: string;
  displayName: string;
  initials: string;
  academicTitle: string;
  specialties: readonly string[];
  bio: string;
  email: string;
  presence: InstructorPresence;
  status: InstructorGlobalStatus;
  createdAt: string;
  updatedAt: string;
  brandAssignments: readonly InstructorBrandAssignment[];
  courseAssignments: readonly InstructorCourseAssignment[];
  schedule: readonly InstructorSchedulePreview[];
  performance: readonly InstructorPerformancePreview[];
  activity: readonly InstructorActivityPreview[];
}

const assignment = (brandCode: AdminBrandCode, teachingRole: string, status: InstructorAssignmentStatus = "active"): InstructorBrandAssignment => ({
  brandCode,
  status,
  teachingRole,
  assignedAt: brandCode === "medway" ? "2026-02-12" : "2026-04-08",
});

const course = (id: string, brandCode: AdminBrandCode, courseCode: string, courseName: string, teachingRole = "Lead instructor", active = true): InstructorCourseAssignment => ({
  id,
  brandCode,
  courseCode,
  courseName,
  teachingRole,
  active,
});

const schedule = (id: string, brandCode: AdminBrandCode, courseName: string, dayLabel: string, timeLabel: string, deliveryMode = "Live online"): InstructorSchedulePreview => ({
  id,
  brandCode,
  courseName,
  dayLabel,
  timeLabel,
  deliveryMode,
});

const performance = (brandCode: AdminBrandCode, activeStudents: number, courseCompletionRate: number, averageRating: number): InstructorPerformancePreview => ({
  brandCode,
  activeStudents,
  courseCompletionRate,
  averageRating,
});

const activity = (id: string, brandCode: AdminBrandCode, title: string, detail: string, relativeTime: string): InstructorActivityPreview => ({
  id,
  brandCode,
  title,
  detail,
  relativeTime,
});

export const adminInstructorFixtures: readonly AdminInstructorFixture[] = [
  {
    id: "ins-10024", reference: "INS-10024", displayName: "Dr. Lina Mercer", initials: "LM", academicTitle: "Professor of Cardiovascular Pathology",
    specialties: ["Cardiovascular Pathology", "Clinical Medicine"], bio: "Medical educator focused on clinically grounded cardiovascular teaching and case-led assessment.", email: "lina.mercer@example.edu", presence: "online", status: "active", createdAt: "2026-01-14", updatedAt: "2026-08-24",
    brandAssignments: [assignment("medway", "Primary instructor"), assignment("elite", "Senior instructor")],
    courseAssignments: [course("c-101", "medway", "MED-201", "Cardiovascular Pathology Fundamentals"), course("c-102", "elite", "ELT-305", "Advanced Cardiac Pathophysiology"), course("c-103", "medway", "MED-310", "Vascular Biology and Disease", "Course instructor"), course("c-104", "elite", "ELT-415", "Clinical Correlations in Cardiology", "Course instructor")],
    schedule: [schedule("s-101", "medway", "Cardiovascular Pathology Fundamentals", "Sunday", "10:00–11:30"), schedule("s-102", "elite", "Advanced Cardiac Pathophysiology", "Tuesday", "18:00–19:30")],
    performance: [performance("medway", 184, 86, 4.8), performance("elite", 92, 91, 4.9)],
    activity: [activity("a-101", "medway", "Course outline updated", "Cardiovascular Pathology Fundamentals", "2 hours ago"), activity("a-102", "elite", "Session preview scheduled", "Advanced Cardiac Pathophysiology", "Yesterday")],
  },
  {
    id: "ins-10031", reference: "INS-10031", displayName: "Dr. Kareem Nolan", initials: "KN", academicTitle: "Associate Professor of Microbiology",
    specialties: ["Microbiology"], bio: "Microbiology instructor specializing in applied laboratory reasoning and infection-control education.", email: "kareem.nolan@example.edu", presence: "away", status: "active", createdAt: "2026-02-05", updatedAt: "2026-08-18",
    brandAssignments: [assignment("medway", "Primary instructor")],
    courseAssignments: [course("c-201", "medway", "MED-112", "Foundations of Medical Microbiology"), course("c-202", "medway", "MED-214", "Clinical Bacteriology", "Course instructor")],
    schedule: [schedule("s-201", "medway", "Foundations of Medical Microbiology", "Monday", "09:00–10:30", "Campus lab")],
    performance: [performance("medway", 146, 82, 4.6)], activity: [activity("a-201", "medway", "Lab resources reviewed", "Clinical Bacteriology", "4 hours ago")],
  },
  {
    id: "ins-10038", reference: "INS-10038", displayName: "Dr. Nora Ellison", initials: "NE", academicTitle: "Lecturer in Clinical Pharmacology",
    specialties: ["Pharmacology", "Clinical Medicine"], bio: "Clinical pharmacology educator building practical medication-safety and therapeutic-decision learning experiences.", email: "nora.ellison@example.edu", presence: "online", status: "active", createdAt: "2026-02-22", updatedAt: "2026-08-21",
    brandAssignments: [assignment("elite", "Lead instructor")],
    courseAssignments: [course("c-301", "elite", "ELT-220", "Applied Clinical Pharmacology"), course("c-302", "elite", "ELT-321", "Therapeutic Decision Making", "Course instructor")],
    schedule: [schedule("s-301", "elite", "Applied Clinical Pharmacology", "Wednesday", "17:30–19:00")],
    performance: [performance("elite", 108, 89, 4.7)], activity: [activity("a-301", "elite", "Assessment preview reviewed", "Applied Clinical Pharmacology", "Yesterday")],
  },
  {
    id: "ins-10042", reference: "INS-10042", displayName: "Dr. Tarek Rowan", initials: "TR", academicTitle: "Professor of Immunology",
    specialties: ["Immunology", "Microbiology"], bio: "Immunology professor focused on mechanisms of disease, clinical interpretation, and evidence-led teaching.", email: "tarek.rowan@example.edu", presence: "offline", status: "active", createdAt: "2026-03-01", updatedAt: "2026-08-14",
    brandAssignments: [assignment("medway", "Senior instructor"), assignment("elite", "Course instructor")],
    courseAssignments: [course("c-401", "medway", "MED-230", "Principles of Immunology"), course("c-402", "elite", "ELT-330", "Clinical Immunopathology"), course("c-403", "medway", "MED-331", "Host Defence", "Course instructor")],
    schedule: [schedule("s-401", "medway", "Principles of Immunology", "Thursday", "11:00–12:30"), schedule("s-402", "elite", "Clinical Immunopathology", "Saturday", "16:00–17:30")],
    performance: [performance("medway", 162, 84, 4.7), performance("elite", 73, 88, 4.8)], activity: [activity("a-401", "elite", "Case discussion prepared", "Clinical Immunopathology", "3 days ago")],
  },
  {
    id: "ins-10049", reference: "INS-10049", displayName: "Dr. Maya Bell", initials: "MB", academicTitle: "Senior Lecturer in Anatomy",
    specialties: ["Anatomy", "Neurology"], bio: "Anatomy educator connecting structural science with neurological examination and imaging interpretation.", email: "maya.bell@example.edu", presence: "online", status: "active", createdAt: "2026-03-18", updatedAt: "2026-08-25",
    brandAssignments: [assignment("medway", "Primary instructor")],
    courseAssignments: [course("c-501", "medway", "MED-110", "Human Anatomy Foundations"), course("c-502", "medway", "MED-215", "Neuroanatomy", "Course instructor")],
    schedule: [schedule("s-501", "medway", "Human Anatomy Foundations", "Sunday", "12:00–13:30")], performance: [performance("medway", 204, 87, 4.9)], activity: [activity("a-501", "medway", "Learning material preview updated", "Human Anatomy Foundations", "45 minutes ago")],
  },
  {
    id: "ins-10055", reference: "INS-10055", displayName: "Dr. Samir Hart", initials: "SH", academicTitle: "Consultant Lecturer in Clinical Medicine",
    specialties: ["Clinical Medicine", "Cardiovascular Pathology"], bio: "Clinician-educator developing structured approaches to bedside reasoning and multidisciplinary case review.", email: "samir.hart@example.edu", presence: "away", status: "active", createdAt: "2026-04-02", updatedAt: "2026-08-20",
    brandAssignments: [assignment("elite", "Primary instructor")], courseAssignments: [course("c-601", "elite", "ELT-410", "Integrated Clinical Reasoning"), course("c-602", "elite", "ELT-412", "Acute Care Casework", "Course instructor")],
    schedule: [schedule("s-601", "elite", "Integrated Clinical Reasoning", "Monday", "18:30–20:00")], performance: [performance("elite", 96, 90, 4.8)], activity: [activity("a-601", "elite", "Clinical session preview opened", "Integrated Clinical Reasoning", "2 days ago")],
  },
  {
    id: "ins-10062", reference: "INS-10062", displayName: "Dr. Dalia Quinn", initials: "DQ", academicTitle: "Lecturer in Neurology",
    specialties: ["Neurology"], bio: "Neurology lecturer emphasizing localization, diagnostic reasoning, and structured patient communication.", email: "dalia.quinn@example.edu", presence: "offline", status: "inactive", createdAt: "2026-04-19", updatedAt: "2026-08-01",
    brandAssignments: [assignment("medway", "Course instructor", "inactive")], courseAssignments: [course("c-701", "medway", "MED-340", "Clinical Neurology", "Course instructor", false)],
    schedule: [], performance: [performance("medway", 0, 0, 0)], activity: [activity("a-701", "medway", "Affiliation marked inactive", "Historical Medway assignment retained", "3 weeks ago")],
  },
  {
    id: "ins-10068", reference: "INS-10068", displayName: "Dr. Julian Cross", initials: "JC", academicTitle: "Visiting Lecturer in Pharmacology",
    specialties: ["Pharmacology"], bio: "Visiting educator preparing a future pharmacology teaching profile for brand review.", email: "julian.cross@example.edu", presence: "offline", status: "active", createdAt: "2026-05-07", updatedAt: "2026-08-09",
    brandAssignments: [], courseAssignments: [], schedule: [], performance: [], activity: [],
  },
  {
    id: "ins-10073", reference: "INS-10073", displayName: "Dr. Farah Stone", initials: "FS", academicTitle: "Professor of Clinical Medicine",
    specialties: ["Clinical Medicine", "Immunology"], bio: "Clinical medicine professor working across foundational and advanced teaching environments with independent brand commitments.", email: "farah.stone@example.edu", presence: "online", status: "active", createdAt: "2026-05-16", updatedAt: "2026-08-26",
    brandAssignments: [assignment("medway", "Senior instructor"), assignment("elite", "Senior instructor")], courseAssignments: [course("c-801", "medway", "MED-420", "Clinical Integration"), course("c-802", "elite", "ELT-420", "Advanced Clinical Integration")],
    schedule: [schedule("s-801", "medway", "Clinical Integration", "Tuesday", "13:00–14:30"), schedule("s-802", "elite", "Advanced Clinical Integration", "Thursday", "18:00–19:30")], performance: [performance("medway", 155, 85, 4.7), performance("elite", 88, 92, 4.9)], activity: [activity("a-801", "medway", "Case review prepared", "Clinical Integration", "Today")],
  },
  {
    id: "ins-10079", reference: "INS-10079", displayName: "Dr. Omar Vale", initials: "OV", academicTitle: "Assistant Professor of Microbiology",
    specialties: ["Microbiology", "Immunology"], bio: "Microbiology faculty member focused on diagnostic laboratory practice and antimicrobial stewardship.", email: "omar.vale@example.edu", presence: "away", status: "active", createdAt: "2026-06-03", updatedAt: "2026-08-23",
    brandAssignments: [assignment("medway", "Course instructor")], courseAssignments: [course("c-901", "medway", "MED-225", "Diagnostic Microbiology")], schedule: [schedule("s-901", "medway", "Diagnostic Microbiology", "Wednesday", "10:30–12:00", "Campus lab")], performance: [performance("medway", 119, 81, 4.5)], activity: [],
  },
  {
    id: "ins-10084", reference: "INS-10084", displayName: "Dr. Selene Ward", initials: "SW", academicTitle: "Senior Lecturer in Anatomy",
    specialties: ["Anatomy"], bio: "Anatomy lecturer designing clinically relevant spatial-learning and imaging interpretation activities.", email: "selene.ward@example.edu", presence: "online", status: "active", createdAt: "2026-06-18", updatedAt: "2026-08-24",
    brandAssignments: [assignment("medway", "Course instructor"), assignment("elite", "Lead instructor")], courseAssignments: [course("c-1001", "elite", "ELT-115", "Applied Anatomy"), course("c-1002", "medway", "MED-118", "Regional Anatomy", "Course instructor")], schedule: [schedule("s-1001", "elite", "Applied Anatomy", "Saturday", "15:00–16:30"), schedule("s-1002", "medway", "Regional Anatomy", "Thursday", "12:00–13:30")], performance: [performance("medway", 128, 85, 4.7), performance("elite", 82, 93, 4.9)], activity: [activity("a-1001", "elite", "Studio session preview added", "Applied Anatomy", "Yesterday")],
  },
  {
    id: "ins-10091", reference: "INS-10091", displayName: "Dr. Nadia Frost", initials: "NF", academicTitle: "Lecturer in Cardiovascular Pathology",
    specialties: ["Cardiovascular Pathology"], bio: "Pathology lecturer preparing case-led teaching for future directory allocation.", email: "nadia.frost@example.edu", presence: "offline", status: "active", createdAt: "2026-07-02", updatedAt: "2026-08-12",
    brandAssignments: [assignment("medway", "Course instructor")], courseAssignments: [course("c-1101", "medway", "MED-206", "Cardiovascular Pathology Cases", "Course instructor")], schedule: [schedule("s-1101", "medway", "Cardiovascular Pathology Cases", "Tuesday", "11:00–12:30")], performance: [performance("medway", 104, 83, 4.6)], activity: [],
  },
];

export const instructorSpecialtyOptions = [...new Set(adminInstructorFixtures.flatMap((instructor) => instructor.specialties))].sort();

export const instructorCourseCatalog = [
  { id: "catalog-med-110", brandCode: "medway" as const, courseCode: "MED-110", courseName: "Human Anatomy Foundations" },
  { id: "catalog-med-230", brandCode: "medway" as const, courseCode: "MED-230", courseName: "Principles of Immunology" },
  { id: "catalog-med-420", brandCode: "medway" as const, courseCode: "MED-420", courseName: "Clinical Integration" },
  { id: "catalog-elt-220", brandCode: "elite" as const, courseCode: "ELT-220", courseName: "Applied Clinical Pharmacology" },
  { id: "catalog-elt-330", brandCode: "elite" as const, courseCode: "ELT-330", courseName: "Clinical Immunopathology" },
  { id: "catalog-elt-420", brandCode: "elite" as const, courseCode: "ELT-420", courseName: "Advanced Clinical Integration" },
] as const;
