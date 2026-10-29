import { WorkspaceGuide, resetWorkspaceGuideSession, type RouteGuide } from "./WorkspaceGuide";

/* Super Admin guide. One entry per route, added screen by screen as each page is polished. */
const adminRouteGuides: RouteGuide[] = [
  { matches: path => path === "/admin" || path === "/admin/overview", id: "overview", steps: [
    { title: "Your platform at a glance", description: "These tiles count student accounts, published courses, lesson files waiting for review and payments waiting for a decision. Select a tile to open that screen.", selector: "[data-admin-guide-target='overview-metrics']", options: ".admin-overview-v2__metric" },
    { title: "Follow the setup path", description: "Work through these four steps in order: curriculum, courses, lesson-file review, then people and access. Each row opens its screen.", selector: "[data-admin-guide-target='overview-flow']", options: "li > a" },
    { title: "Clear what is waiting", description: "Anything that needs a decision from you appears here, such as lesson files to approve or payments to review. When it says nothing is waiting, you are caught up.", selector: "[data-admin-guide-target='overview-attention']", options: "li > a" },
    { title: "Jump to platform operations", description: "Shortcuts to instructor accounts, student access, payments and security, the screens you will visit most.", selector: "[data-admin-guide-target='overview-shortcuts']", options: "li > a" },
    { title: "Move between sections", description: "The sidebar lists every Super Admin screen. Use it any time you want to leave the overview.", selector: ".admin-v2__sidebar nav", options: ".admin-v2__nav-link, a" },
    { title: "Switch brands", description: "Choose All brands, or one brand, to focus every screen on that brand's courses, students and payments.", selector: ".admin-v2__brand-switch", options: "button" },
    { title: "Search the platform", description: "Search students, courses and instructors from anywhere. Press Ctrl K to jump to it.", selector: ".admin-v2__global-search" },
  ] },
  { matches: path => path === "/admin/curriculum", id: "curriculum", steps: [
    { title: "Choose the institution", description: "The curriculum belongs to one university. Pick it here, or add a new institution if it is not listed yet.", selector: "[data-admin-guide-target='curriculum-toolbar']", options: "select, button" },
    { title: "Pick an academic year", description: "Years come first. Select one to see its semesters, or use Add academic year. The pencil renames a year.", selector: "[data-admin-guide-target='curriculum-years']", options: ".v2-year-item" },
    { title: "Open a semester", description: "Each semester lists its units. Expand or collapse a semester, add a new unit with Add academic unit, or rename the semester with the pencil.", selector: "[data-admin-guide-target='curriculum-structure']", options: ".v2-semester > header" },
    { title: "Select a unit", description: "Select a unit to see its details. Courses are mapped to these approved subjects later, so keep titles and codes accurate.", selector: "[data-admin-guide-target='curriculum-structure']", options: ".v2-unit-row", hint: "Add a unit to a semester first, then select it." },
    { title: "Review the unit", description: "The right panel shows the unit's code, type, semester, credits and status. A Draft unit is not final until it is approved.", selector: "[data-admin-guide-target='curriculum-inspector']" },
    { title: "Reorder, edit or archive", description: "Move a unit up or down inside its semester, edit its details, or archive it. Archiving keeps the record and any course mappings.", selector: "[data-admin-guide-target='curriculum-actions']", options: "button", hint: "Select a unit to see its actions." },
  ] },
  { matches: path => path === "/admin/courses", id: "courses", steps: [
    { title: "Narrow the list", description: "Filter courses by brand, scope, academic level, semester or instructor. Clear filters appears once any filter is active.", selector: "[data-admin-guide-target='courses-filters']", options: "select" },
    { title: "Search, filter and create", description: "Search by title, subject or instructor, show only published courses, or start a new course with New Course.", selector: "[data-admin-guide-target='courses-tools']", options: "input, button" },
    { title: "Browse your courses", description: "Each row is a brand course with its linked subject, instructor and status. Select a row to see its details, or use the pencil to edit it.", selector: "[data-admin-guide-target='courses-table']", options: "tbody tr" },
    { title: "Review a course", description: "The right panel shows the selected course: where it sits in the curriculum, who teaches it and when it last changed. Manage instructors opens the editor.", selector: "[data-admin-guide-target='courses-inspector']", hint: "Select a course in the table to open its details." },
    { title: "Duplicate or archive", description: "Duplicate creates a draft copy with the same teaching assignments. Archive hides the course but keeps student access and all records.", selector: "[data-admin-guide-target='courses-actions']", options: "button", hint: "Select a course in the table to see its actions." },
  ] },
];

const STORAGE_PREFIX = "admin";
export const resetAdminGuideSession = (userId: string) => resetWorkspaceGuideSession(STORAGE_PREFIX, userId);
export function AdminGuide({ userId, pathname }: { userId: string; pathname: string }) {
  // Super Admins have no course count to relax the first-sessions rule, so pass a high count.
  return <WorkspaceGuide userId={userId} pathname={pathname} courseCount={Number.MAX_SAFE_INTEGER} guides={adminRouteGuides} storagePrefix={STORAGE_PREFIX} label="ADMIN FIELD GUIDE" />;
}
