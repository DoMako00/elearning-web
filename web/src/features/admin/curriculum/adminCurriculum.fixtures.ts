export type AcademicCatalogStatus = "draft" | "published" | "retired";
export type AcademicModuleType = "core" | "elective" | "clinical";

export interface AcademicOutlineSection { id: string; title: string; topics: readonly string[]; order: number; }
export interface AcademicModuleReference { id: string; code: string; title: string; levelNumber: number; semesterNumber: number; credits: number; }
export interface AcademicModule extends AcademicModuleReference {
  description: string;
  status: AcademicCatalogStatus;
  moduleType: AcademicModuleType;
  order: number;
  outline: readonly AcademicOutlineSection[];
  objectives: readonly string[];
  prerequisiteIds: readonly string[];
}
export interface AcademicSemester { id: string; levelNumber: number; number: number; title: string; status: AcademicCatalogStatus; order: number; }
export interface AcademicLevel { id: string; number: number; title: string; status: AcademicCatalogStatus; order: number; }

const outline = (id: string, title: string, topics: readonly string[]): readonly AcademicOutlineSection[] => [{ id: `${id}-outline-1`, title, topics, order: 1 }];
const module = (id: string, code: string, title: string, levelNumber: number, semesterNumber: number, credits: number, moduleType: AcademicModuleType, description: string, order: number, prerequisiteIds: readonly string[] = []): AcademicModule => ({ id, code, title, levelNumber, semesterNumber, credits, moduleType, description, status: "published", order, prerequisiteIds, outline: outline(id, "Academic reference outline", ["Core concepts", "Applied academic context"]), objectives: ["Describe the core academic concepts.", "Apply the reference concepts in a structured setting."] });

export const academicLevelFixtures: readonly AcademicLevel[] = [
  { id: "level-1", number: 1, title: "Level 1", status: "published", order: 1 },
  { id: "level-2", number: 2, title: "Level 2", status: "published", order: 2 },
  { id: "level-3", number: 3, title: "Level 3", status: "published", order: 3 },
  { id: "level-4", number: 4, title: "Level 4", status: "draft", order: 4 },
  { id: "level-5", number: 5, title: "Level 5", status: "draft", order: 5 },
];

export const academicSemesterFixtures: readonly AcademicSemester[] = academicLevelFixtures.flatMap((level) => [
  { id: `semester-${level.number}-1`, levelNumber: level.number, number: 1, title: "Semester 1", status: level.status, order: 1 },
  { id: `semester-${level.number}-2`, levelNumber: level.number, number: 2, title: "Semester 2", status: level.status, order: 2 },
]);

export const academicModuleFixtures: readonly AcademicModule[] = [
  module("module-anat-101", "M1.1", "Human Anatomy I", 1, 1, 5, "core", "A shared BUC academic reference for foundational human anatomy.", 1),
  module("module-bioc-102", "M1.2", "Biochemistry", 1, 1, 4, "core", "A shared BUC academic reference for biochemical foundations.", 2),
  module("module-phys-103", "M1.3", "Physiology", 1, 1, 5, "core", "A shared BUC academic reference for physiological systems.", 3, ["module-anat-101"]),
  module("module-micr-201", "M2.1", "Medical Microbiology", 2, 1, 4, "core", "A shared BUC academic reference for medical microbiology.", 1, ["module-bioc-102"]),
  module("module-immm-202", "M2.2", "Immunology", 2, 1, 4, "core", "A shared BUC academic reference for immune systems.", 2, ["module-micr-201"]),
  module("module-phar-203", "M2.3", "Pharmacology", 2, 2, 5, "clinical", "A shared BUC academic reference for pharmacological principles.", 1, ["module-phys-103"]),
  module("module-neur-301", "M3.1", "Clinical Neurology", 3, 1, 4, "clinical", "A shared BUC academic reference for clinical neurology.", 1, ["module-anat-101"]),
  module("module-cmed-302", "M3.2", "Clinical Medicine", 3, 2, 5, "clinical", "A shared BUC academic reference for clinical medicine.", 1, ["module-phys-103", "module-phar-203"]),
];

export const normalizeAcademicCode = (value: string) => value.trim().toLocaleUpperCase();
export const academicModuleById = (id: string | null | undefined, modules = academicModuleFixtures) => modules.find((item) => item.id === id);
export const semestersForLevel = (levelNumber: number, semesters = academicSemesterFixtures) => semesters.filter((item) => item.levelNumber === levelNumber).sort((a, b) => a.order - b.order);
export const modulesForSemester = (levelNumber: number, semesterNumber: number, modules = academicModuleFixtures) => modules.filter((item) => item.levelNumber === levelNumber && item.semesterNumber === semesterNumber).sort((a, b) => a.order - b.order);
export function wouldCreatePrerequisiteCycle(moduleId: string, prerequisiteId: string, modules: readonly AcademicModule[]) {
  const byId = new Map(modules.map((item) => [item.id, item]));
  const seen = new Set<string>();
  const reachesModule = (id: string): boolean => { if (id === moduleId) return true; if (seen.has(id)) return false; seen.add(id); return (byId.get(id)?.prerequisiteIds ?? []).some(reachesModule); };
  return prerequisiteId === moduleId || reachesModule(prerequisiteId);
}
export function validateAcademicCatalog(levels: readonly AcademicLevel[], semesters: readonly AcademicSemester[], modules: readonly AcademicModule[]) {
  const codes = modules.map((item) => normalizeAcademicCode(item.code));
  return new Set(levels.map((item) => item.number)).size === levels.length && new Set(codes).size === codes.length && modules.every((item) => item.credits > 0 && item.credits <= 30 && semesters.some((semester) => semester.levelNumber === item.levelNumber && semester.number === item.semesterNumber) && !item.prerequisiteIds.includes(item.id) && !item.prerequisiteIds.some((id, index) => item.prerequisiteIds.indexOf(id) !== index) && !item.prerequisiteIds.some((id) => wouldCreatePrerequisiteCycle(item.id, id, modules)));
}
