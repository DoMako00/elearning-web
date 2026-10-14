import type { AdminV2Data, BrandCode, CourseRecord } from "../types/adminV2.types";

interface LegacyDevice { id: string; studentId: string; name: string; category: "Mobile" | "Additional device"; type: "Phone" | "PC / laptop" | "Tablet"; platform: string; browser: string; firstSeen: string; lastSeen: string; status: "Active" | "Revoked" | "Replacement Pending"; }
interface LegacySession { id: string; studentId: string; deviceId: string; device: string; platform: string; browser: string; created: string; lastActivity: string; status: "Active" | "Revoked"; }
interface LegacyStudent { id: string; name: string; code: string; email: string; phone: string; brand: BrandCode; institution: "BUC" | "Delta"; level: string; semester: string; program: string; status: "Active" | "Suspended" | "Inactive"; subscriptionId: string; courses: string[]; lastActivity: string; devices: Omit<LegacyDevice, "studentId">[]; sessions: Omit<LegacySession, "studentId">[]; }
interface LegacySubscription { id: string; studentId: string; student: string; email: string; brand: BrandCode; plan: string; seats: 1 | 3 | 5; status: "Active" | "Expiring Soon" | "Expired" | "Cancelled" | "Past Due"; start: string; expiry: string; renewal: "Auto-renew" | "Manual renewal" | "Not renewing"; amount: string; }

const assignments = (lead: string, co?: string): CourseRecord["instructors"] => [
  { name: lead, role: "Lead Instructor", allocation: 100 },
  ...(co ? [{ name: co, role: "Co-Instructor" as const, allocation: 50 }] : []),
];

const institutions = [
  { id: "inst-buc", name: "Badr University in Cairo", shortName: "BUC", status: "Active" as const },
  { id: "inst-delta", name: "Delta University for Science and Technology", shortName: "Delta University", status: "Active" as const },
];
const curricula = [
  { id: "cur-buc", institutionId: "inst-buc", title: "BUC Medicine Curriculum", status: "Approved" as const, updatedAt: "Oct 01, 2026" },
  { id: "cur-delta", institutionId: "inst-delta", title: "Delta Medicine Curriculum", status: "Approved" as const, updatedAt: "Oct 01, 2026" },
];
const academicYears = [
  ...[1, 2, 3].map((n) => ({ id: "year-buc-" + n, curriculumId: "cur-buc", title: "Year " + n, order: n, status: "Active" as const })),
  ...[1, 2].map((n) => ({ id: "year-delta-" + n, curriculumId: "cur-delta", title: "Year " + n, order: n, status: "Active" as const })),
];
const semesters = [
  { id: "sem-buc-y1-1", academicYearId: "year-buc-1", title: "Semester 1", order: 1, status: "Active" as const },
  { id: "sem-buc-y1-2", academicYearId: "year-buc-1", title: "Semester 2", order: 2, status: "Active" as const },
  { id: "sem-buc-y2-3", academicYearId: "year-buc-2", title: "Semester 3", order: 1, status: "Active" as const },
  { id: "sem-buc-y2-4", academicYearId: "year-buc-2", title: "Semester 4", order: 2, status: "Active" as const },
  { id: "sem-buc-y3-5", academicYearId: "year-buc-3", title: "Semester 5", order: 1, status: "Active" as const },
  { id: "sem-buc-y3-6", academicYearId: "year-buc-3", title: "Semester 6", order: 2, status: "Active" as const },
  { id: "sem-delta-y1-1", academicYearId: "year-delta-1", title: "Semester 1", order: 1, status: "Active" as const },
  { id: "sem-delta-y1-2", academicYearId: "year-delta-1", title: "Semester 2", order: 2, status: "Active" as const },
  { id: "sem-delta-y2-3", academicYearId: "year-delta-2", title: "Semester 3", order: 1, status: "Active" as const },
];
const curriculumUnits = [
  { id: "unit-buc-anatomy", institutionId: "inst-buc", academicYearId: "year-buc-1", semesterId: "sem-buc-y1-1", type: "Subject" as const, code: "M1.1", title: "Gross Anatomy", description: "Foundations of gross anatomy, terminology, and regional organization.", status: "Approved" as const, credits: 3, order: 1 },
  { id: "unit-buc-biochem", institutionId: "inst-buc", academicYearId: "year-buc-1", semesterId: "sem-buc-y1-1", type: "Subject" as const, code: "M1.2", title: "Biochemistry", description: "Chemical processes and molecular foundations of medicine.", status: "Approved" as const, credits: 3, order: 2 },
  { id: "unit-buc-physiology", institutionId: "inst-buc", academicYearId: "year-buc-1", semesterId: "sem-buc-y1-1", type: "Subject" as const, code: "M1.3", title: "Physiology", description: "Core physiological principles across human systems.", status: "Approved" as const, credits: 3, order: 3 },
  { id: "unit-buc-professionalism", institutionId: "inst-buc", academicYearId: "year-buc-1", semesterId: "sem-buc-y1-1", type: "Subject" as const, code: "M1.5", title: "Professionalism", description: "Ethics, communication, and professional practice.", status: "Approved" as const, credits: 2, order: 4 },
  { id: "unit-buc-pharm", institutionId: "inst-buc", academicYearId: "year-buc-2", semesterId: "sem-buc-y2-3", type: "Module" as const, code: "M2.1", title: "Pharmacology", description: "Principles of drug action, safety, and therapeutic use.", status: "Approved" as const, credits: 4, order: 1 },
  { id: "unit-buc-immunology", institutionId: "inst-buc", academicYearId: "year-buc-2", semesterId: "sem-buc-y2-4", type: "Module" as const, code: "M2.2", title: "Immunology", description: "Immune system organization and clinical application.", status: "Approved" as const, credits: 3, order: 1 },
  { id: "unit-buc-clinical-pharm", institutionId: "inst-buc", academicYearId: "year-buc-3", semesterId: "sem-buc-y3-6", type: "Module" as const, code: "M3.2", title: "Pharmacology", description: "Applied pharmacology in clinical care.", status: "Approved" as const, credits: 4, order: 1 },
  { id: "unit-delta-biology", institutionId: "inst-delta", academicYearId: "year-delta-1", semesterId: "sem-delta-y1-1", type: "Module" as const, code: "DS1.1", title: "Foundations of Biology", description: "Foundational biological sciences for health programmes.", status: "Approved" as const, credits: 4, order: 1 },
  { id: "unit-delta-health", institutionId: "inst-delta", academicYearId: "year-delta-1", semesterId: "sem-delta-y1-2", type: "Module" as const, code: "DS1.2", title: "Health Informatics", description: "Digital systems and information literacy in healthcare.", status: "Approved" as const, credits: 3, order: 1 },
  { id: "unit-delta-phys", institutionId: "inst-delta", academicYearId: "year-delta-2", semesterId: "sem-delta-y2-3", type: "Module" as const, code: "DS2.1", title: "Human Physiology", description: "Integrated physiology within the Delta programme sequence.", status: "Approved" as const, credits: 4, order: 1 },
];

const legacyCourses: (Omit<CourseRecord, "curriculumUnitId"> & { module: string; level: string; semester: string })[] = [
  { id: "c-101", title: "Gross Anatomy: Upper Limb", brand: "medway", scope: "Curriculum", module: "M1.1 Gross Anatomy", level: "Year 1", semester: "Semester 1", status: "Published", updated: "May 29, 2026", instructors: assignments("Dr. Ahmed Salem", "Dr. Leila Haddad") },
  { id: "c-102", title: "Cardiovascular Physiology", brand: "medway", scope: "Curriculum", module: "M1.3 Physiology", level: "Year 1", semester: "Semester 1", status: "Published", updated: "May 28, 2026", instructors: assignments("Dr. Sara Al-Yafee") },
  { id: "c-103", title: "Medical Ethics & Professionalism", brand: "medway", scope: "Curriculum", module: "M1.5 Professionalism", level: "Year 1", semester: "Semester 1", status: "Published", updated: "May 27, 2026", instructors: assignments("Dr. Hanan Qureshi") },
  { id: "c-104", title: "Biochemistry Fundamentals", brand: "elite", scope: "Curriculum", module: "M1.2 Biochemistry", level: "Year 1", semester: "Semester 1", status: "Published", updated: "May 26, 2026", instructors: assignments("Dr. Omar Farooq") },
  { id: "c-105", title: "Research Methodology", brand: "medway", scope: "Standalone", module: "—", level: "Year 2", semester: "Semester 3", status: "Published", updated: "May 25, 2026", instructors: assignments("Dr. Leila Haddad") },
  { id: "c-106", title: "Clinical Case Studies: Cardiology", brand: "elite", scope: "Standalone", module: "—", level: "Year 3", semester: "Semester 5", status: "Draft", updated: "May 24, 2026", instructors: assignments("Dr. Nabil Khoury") },
  { id: "c-107", title: "Pharmacology I", brand: "medway", scope: "Curriculum", module: "M2.1 Pharmacology", level: "Year 2", semester: "Semester 3", status: "Published", updated: "May 23, 2026", instructors: assignments("Dr. Rania Moussa") },
  { id: "c-108", title: "Immunology Essentials", brand: "nexus", scope: "Curriculum", module: "M2.2 Immunology", level: "Year 2", semester: "Semester 4", status: "Archived", updated: "May 22, 2026", instructors: assignments("Dr. James Patel") },
  { id: "c-109", title: "Communication Skills in Medicine", brand: "medway", scope: "Standalone", module: "—", level: "Year 1", semester: "Semester 2", status: "Published", updated: "May 21, 2026", instructors: assignments("Dr. Hanan Qureshi") },
  { id: "c-110", title: "Histology: Connective Tissue", brand: "medway", scope: "Curriculum", module: "M1.1 Gross Anatomy", level: "Year 1", semester: "Semester 1", status: "Published", updated: "May 20, 2026", instructors: assignments("Dr. Ahmed Salem") },
  { id: "c-111", title: "Applied Clinical Pharmacology", brand: "elite", scope: "Curriculum", module: "M3.2 Pharmacology", level: "Year 3", semester: "Semester 6", status: "Published", updated: "May 19, 2026", instructors: assignments("Dr. Rania Moussa") },
  { id: "c-112", title: "Independent Study Skills", brand: "nexus", scope: "Standalone", module: "—", level: "Year 1", semester: "Semester 2", status: "Draft", updated: "May 18, 2026", instructors: assignments("Dr. Leila Haddad") },
];

const courses: CourseRecord[] = legacyCourses.map(({ module, level, semester, ...course }) => {
  const [code, ...titleParts] = module.split(" ");
  const title = titleParts.join(" ");
  const unit = curriculumUnits.find((item) => item.code === code && item.title === title);
  return { ...course, curriculumUnitId: unit?.id ?? null };
});

const instructorIdForName = (name: string) => `ins-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
const extraInstructorNames = ["Dr. Emily R. Carter", "Dr. Michael L. Thompson", "Dr. Priya S. Patel", "Dr. Laura M. Bennett", "Dr. Rajiv K. Mehta"];
const instructorSpecialties: Record<string, string[]> = {
  "Dr. Ahmed Salem": ["Anatomy", "Clinical Education"],
  "Dr. Leila Haddad": ["Anatomy", "Histology"],
  "Dr. Sara Al-Yafee": ["Cardiovascular Physiology"],
  "Dr. Hanan Qureshi": ["Medical Ethics", "Communication"],
  "Dr. Omar Farooq": ["Biochemistry"],
  "Dr. Nabil Khoury": ["Cardiology"],
  "Dr. Rania Moussa": ["Pharmacology"],
  "Dr. James Patel": ["Immunology"],
  "Dr. Emily R. Carter": ["Pharmacology", "Clinical Trials"],
  "Dr. Michael L. Thompson": ["Immunology", "Pathology"],
  "Dr. Priya S. Patel": ["Pathology"],
  "Dr. Laura M. Bennett": ["Anatomy"],
  "Dr. Rajiv K. Mehta": ["Neurology"],
};
const instructorNames = [...new Set([...courses.flatMap((course) => course.instructors.map((item) => item.name)), ...extraInstructorNames])];
const instructors = instructorNames.map((fullName) => ({
  id: instructorIdForName(fullName), fullName, email: `${fullName.replace(/^Dr\.\s*/i, "").toLowerCase().replace(/[^a-z0-9]+/g, ".")}@greenlearn.local`,
  phone: "", specialties: instructorSpecialties[fullName] ?? ["Medical Education"], status: fullName === "Dr. Rajiv K. Mehta" ? "Inactive" as const : "Active" as const,
  createdAt: "2026-10-01", updatedAt: "2026-10-08",
}));
const coursesWithInstructorIds = courses.map((course) => ({
  ...course,
  instructors: course.instructors.map((assignment) => ({ ...assignment, instructorId: instructorIdForName(assignment.name) })),
}));
const instructorBrandAssignments = instructors.flatMap((instructor) => {
  const brands = [...new Set(coursesWithInstructorIds.filter((course) => course.instructors.some((assignment) => assignment.instructorId === instructor.id)).map((course) => course.brand))];
  return brands.map((brand) => ({ id: `iba-${instructor.id}-${brand}`, instructorId: instructor.id, brand, createdAt: "2026-10-01" }));
});

const students: LegacyStudent[] = [
  { id: "st-001", name: "Ahmed Hassan", code: "GL-2023-1001", email: "ahmed.hassan@example.edu", phone: "+20 100 123 4567", brand: "medway", institution: "BUC", level: "Year 4", semester: "Semester 8", program: "Medicine (MBBS)", status: "Active", subscriptionId: "sub-001", courses: ["c-101", "c-102", "c-107"], lastActivity: "2m ago", devices: [{ id: "d-001", name: "Ahmed's iPhone", category: "Mobile", type: "Phone", platform: "iOS 18", browser: "Safari", firstSeen: "Jan 12, 2026", lastSeen: "2m ago", status: "Active" }, { id: "d-002", name: "MacBook Air", category: "Additional device", type: "PC / laptop", platform: "macOS 15", browser: "Chrome", firstSeen: "Jan 13, 2026", lastSeen: "Yesterday", status: "Active" }], sessions: [{ id: "ss-001", deviceId: "d-001", device: "Ahmed's iPhone", platform: "iOS 18", browser: "Safari", created: "Today, 9:12 AM", lastActivity: "2m ago", status: "Active" }, { id: "ss-002", deviceId: "d-002", device: "MacBook Air", platform: "macOS 15", browser: "Chrome", created: "Yesterday, 6:42 PM", lastActivity: "Yesterday", status: "Active" }] },
  { id: "st-002", name: "Mariam Youssef", code: "GL-2023-1002", email: "mariam.youssef@example.edu", phone: "+20 101 455 2390", brand: "elite", institution: "BUC", level: "Year 4", semester: "Semester 7", program: "Medicine (MBBS)", status: "Active", subscriptionId: "sub-002", courses: ["c-104", "c-111"], lastActivity: "15m ago", devices: [{ id: "d-003", name: "Mariam's iPhone", category: "Mobile", type: "Phone", platform: "iOS 18", browser: "Safari", firstSeen: "Feb 02, 2026", lastSeen: "15m ago", status: "Active" }], sessions: [{ id: "ss-003", deviceId: "d-003", device: "Mariam's iPhone", platform: "iOS 18", browser: "Safari", created: "Today, 8:44 AM", lastActivity: "15m ago", status: "Active" }] },
  { id: "st-003", name: "Omar Khaled", code: "GL-2022-0875", email: "omar.khaled@example.edu", phone: "+20 109 228 6401", brand: "medway", institution: "BUC", level: "Year 3", semester: "Semester 6", program: "Medicine (MBBS)", status: "Active", subscriptionId: "sub-003", courses: ["c-102", "c-107"], lastActivity: "1h ago", devices: [{ id: "d-004", name: "Galaxy S24", category: "Mobile", type: "Phone", platform: "Android 15", browser: "Chrome", firstSeen: "Mar 11, 2026", lastSeen: "1h ago", status: "Active" }], sessions: [{ id: "ss-004", deviceId: "d-004", device: "Galaxy S24", platform: "Android 15", browser: "Chrome", created: "Today, 7:31 AM", lastActivity: "1h ago", status: "Active" }] },
  { id: "st-004", name: "Nourhan Ali", code: "GL-2022-0876", email: "nourhan.ali@example.edu", phone: "+20 111 709 8211", brand: "elite", institution: "BUC", level: "Year 3", semester: "Semester 6", program: "Medicine (MBBS)", status: "Suspended", subscriptionId: "sub-004", courses: ["c-104"], lastActivity: "2d ago", devices: [{ id: "d-005", name: "iPhone 14", category: "Mobile", type: "Phone", platform: "iOS 17", browser: "Safari", firstSeen: "Apr 03, 2026", lastSeen: "2d ago", status: "Revoked" }], sessions: [{ id: "ss-005", deviceId: "d-005", device: "iPhone 14", platform: "iOS 17", browser: "Safari", created: "Sep 18, 2026", lastActivity: "2d ago", status: "Revoked" }] },
  { id: "st-005", name: "Youssef Ahmed", code: "GL-2021-0742", email: "youssef.ahmed@example.edu", phone: "+20 102 532 1764", brand: "medway", institution: "BUC", level: "Year 2", semester: "Semester 4", program: "Medicine (MBBS)", status: "Active", subscriptionId: "sub-005", courses: ["c-101", "c-103"], lastActivity: "5m ago", devices: [{ id: "d-006", name: "Youssef's iPhone", category: "Mobile", type: "Phone", platform: "iOS 18", browser: "Safari", firstSeen: "May 17, 2026", lastSeen: "5m ago", status: "Active" }, { id: "d-007", name: "Windows Laptop", category: "Additional device", type: "PC / laptop", platform: "Windows 11", browser: "Edge", firstSeen: "May 17, 2026", lastSeen: "1d ago", status: "Active" }], sessions: [{ id: "ss-006", deviceId: "d-006", device: "Youssef's iPhone", platform: "iOS 18", browser: "Safari", created: "Today, 10:06 AM", lastActivity: "5m ago", status: "Active" }] },
  { id: "st-006", name: "Hana Mostafa", code: "GL-2021-0743", email: "hana.mostafa@example.edu", phone: "+20 106 839 6042", brand: "elite", institution: "BUC", level: "Year 2", semester: "Semester 3", program: "Medicine (MBBS)", status: "Active", subscriptionId: "sub-006", courses: ["c-104", "c-106"], lastActivity: "3h ago", devices: [{ id: "d-008", name: "Hana's iPhone", category: "Mobile", type: "Phone", platform: "iOS 17", browser: "Safari", firstSeen: "Jun 08, 2026", lastSeen: "3h ago", status: "Active" }], sessions: [{ id: "ss-007", deviceId: "d-008", device: "Hana's iPhone", platform: "iOS 17", browser: "Safari", created: "Today, 8:05 AM", lastActivity: "3h ago", status: "Active" }] },
  { id: "st-007", name: "Karim Tarek", code: "GL-2020-0611", email: "karim.tarek@example.edu", phone: "+20 115 823 1955", brand: "nexus", institution: "Delta", level: "Year 1", semester: "Semester 2", program: "Medicine (MBBS)", status: "Inactive", subscriptionId: "sub-007", courses: ["c-108", "c-112"], lastActivity: "7d ago", devices: [], sessions: [] },
  { id: "st-008", name: "Salma Hossam", code: "GL-2020-0612", email: "salma.hossam@example.edu", phone: "+20 109 673 2201", brand: "elite", institution: "BUC", level: "Year 1", semester: "Semester 1", program: "Medicine (MBBS)", status: "Active", subscriptionId: "sub-008", courses: ["c-104"], lastActivity: "1h ago", devices: [{ id: "d-009", name: "iPad Air", category: "Additional device", type: "Tablet", platform: "iPadOS 18", browser: "Safari", firstSeen: "Aug 25, 2026", lastSeen: "1h ago", status: "Active" }], sessions: [{ id: "ss-008", deviceId: "d-009", device: "iPad Air", platform: "iPadOS 18", browser: "Safari", created: "Today, 8:31 AM", lastActivity: "1h ago", status: "Active" }] },
];

const subscriptions: LegacySubscription[] = [
  { id: "sub-001", studentId: "st-001", student: "Ahmed Hassan", email: "ahmed.hassan@example.edu", brand: "medway", plan: "Individual", seats: 1, status: "Active", start: "May 1, 2026", expiry: "May 1, 2027", renewal: "Auto-renew", amount: "EGP 4,900 / year" },
  { id: "sub-002", studentId: "st-002", student: "Mariam Youssef", email: "mariam.youssef@example.edu", brand: "elite", plan: "Study Trio", seats: 3, status: "Active", start: "Apr 12, 2026", expiry: "Apr 12, 2027", renewal: "Auto-renew", amount: "EGP 11,700 / year" },
  { id: "sub-003", studentId: "st-003", student: "Omar Khaled", email: "omar.khaled@example.edu", brand: "medway", plan: "Study Group", seats: 5, status: "Active", start: "Mar 5, 2026", expiry: "Mar 5, 2027", renewal: "Auto-renew", amount: "EGP 18,500 / year" },
  { id: "sub-004", studentId: "st-004", student: "Nourhan Ali", email: "nourhan.ali@example.edu", brand: "elite", plan: "Individual", seats: 1, status: "Expiring Soon", start: "Oct 20, 2025", expiry: "Oct 20, 2026", renewal: "Manual renewal", amount: "EGP 4,900 / year" },
  { id: "sub-005", studentId: "st-005", student: "Youssef Ahmed", email: "youssef.ahmed@example.edu", brand: "medway", plan: "Study Trio", seats: 3, status: "Past Due", start: "Apr 1, 2026", expiry: "Apr 1, 2027", renewal: "Not renewing", amount: "EGP 11,700 / year" },
  { id: "sub-006", studentId: "st-006", student: "Hana Mostafa", email: "hana.mostafa@example.edu", brand: "elite", plan: "Individual", seats: 1, status: "Active", start: "Jun 7, 2026", expiry: "Jun 7, 2027", renewal: "Auto-renew", amount: "EGP 4,900 / year" },
  { id: "sub-007", studentId: "st-007", student: "Karim Tarek", email: "karim.tarek@example.edu", brand: "nexus", plan: "Study Group", seats: 5, status: "Expired", start: "Aug 1, 2025", expiry: "Aug 1, 2026", renewal: "Not renewing", amount: "EGP 18,500 / year" },
  { id: "sub-008", studentId: "st-008", student: "Salma Hossam", email: "salma.hossam@example.edu", brand: "elite", plan: "Individual", seats: 1, status: "Cancelled", start: "Jan 15, 2026", expiry: "Jan 15, 2027", renewal: "Not renewing", amount: "EGP 4,900 / year" },
];

const planSeed = [
  { id: "individual" as const, name: "Individual", capacity: 1 as const, amount: 4900, currency: "EGP" as const, termMonths: 12 as const },
  { id: "trio" as const, name: "Study Trio", capacity: 3 as const, amount: 11700, currency: "EGP" as const, termMonths: 12 as const },
  { id: "group" as const, name: "Study Group", capacity: 5 as const, amount: 18500, currency: "EGP" as const, termMonths: 12 as const },
];
const planId = (name: string) => name === "Study Trio" ? "trio" as const : name === "Study Group" ? "group" as const : "individual" as const;
const planAmount = (amount: string) => Number(amount.replace(/[^0-9.]/g, ""));
const now = "2026-10-08";
export const initialAdminV2Data: AdminV2Data = {
  courses: coursesWithInstructorIds,
  instructors,
  instructorBrandAssignments,
  institutions, curricula, academicYears, semesters, curriculumUnits,
  chapters: [], lessons: [], contentResources: [], auditEvents: [],
  plans: planSeed,
  students: students.map((student) => ({
    id: student.id, accountIdentifier: student.code, fullName: student.name, email: student.email, phone: student.phone, brand: student.brand,
    institution: student.institution, academicLevel: student.level, semester: student.semester, program: student.program,
    status: student.status === "Inactive" ? "Inactive" : student.status, createdAt: now, lastActivity: student.lastActivity,
  })),
  subscriptions: subscriptions.map((subscription) => ({
    id: subscription.id, planId: planId(subscription.plan), brand: subscription.brand, studentIds: [subscription.studentId],
    status: subscription.status, startDate: subscription.start, expiryDate: subscription.expiry, renewal: subscription.renewal,
    amount: planAmount(subscription.amount), currency: "EGP" as const, paymentId: null, createdAt: subscription.start,
  })),
  payments: [],
  enrollments: students.flatMap((student) => student.courses.map((courseId) => ({
    id: `enr-${student.id}-${courseId}`, studentId: student.id, courseId, source: "Subscription" as const,
    subscriptionId: student.subscriptionId || null, createdAt: "May 1, 2026", expiryDate: subscriptions.find((item) => item.id === student.subscriptionId)?.expiry ?? null, status: "Active" as const,
  }))),
  devices: students.flatMap((student) => student.devices.map((device) => ({ ...device, studentId: student.id }))),
  sessions: students.flatMap((student) => student.sessions.map((session) => ({ ...session, studentId: student.id }))),
};
export const brandName = (code: string) => ({ medway: "Medway", elite: "Elite", nexus: "Nexus" }[code] ?? code);
export const courseName = (id: string, data: AdminV2Data) => data.courses.find((course) => course.id === id)?.title ?? "Course unavailable";
