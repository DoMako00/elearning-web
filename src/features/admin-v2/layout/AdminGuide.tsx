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
  { matches: path => path === "/admin/instructors", id: "instructors", steps: [
    { title: "The instructor directory", description: "Every teaching profile lives here, separate from course records. Add Instructor creates a new profile; you can assign brands and courses afterwards.", selector: "[data-admin-guide-target='instructors-add']" },
    { title: "Find an instructor", description: "Search by name, email or specialty, or filter by brand and status. Clear appears once a filter is active.", selector: "[data-admin-guide-target='instructors-filters']", options: "input, select" },
    { title: "Browse the directory", description: "Each row shows an instructor's brands, how many courses they teach and whether they are active. Select a row to open the profile, or use the pencil to edit it.", selector: "[data-admin-guide-target='instructors-table']", options: "tbody tr" },
    { title: "Review a profile", description: "The right panel holds the selected instructor's brand affiliations, course assignments and profile details.", selector: "[data-admin-guide-target='instructors-inspector']", hint: "Select an instructor in the directory to open the profile." },
    { title: "Switch views", description: "Overview shows assignments and details, Schedule lists the courses they teach, and Activity shows recorded changes to this profile.", selector: "[data-admin-guide-target='instructors-tabs']", options: "button", hint: "Select an instructor to see these views." },
    { title: "Give them a sign-in", description: "Create Instructor login emails the instructor an invitation. They sign in with an email code, and no password is created. The instructor must be active and assigned to a brand first.", selector: "[data-admin-guide-target='instructors-login']", hint: "Open the Overview view of an instructor to see this action." },
  ] },
  { matches: path => path === "/admin/roles", id: "roles", steps: [
    { title: "Prepare an Instructor", description: "An instructor needs three things before they can teach: a sign-in, a doctor profile in the directory, and a course. Use the links to set up the profile and the course.", selector: "[data-admin-guide-target='roles-setup']", options: "li, a" },
    { title: "Connect a sign-in to a doctor", description: "Choose the Instructor account, the matching doctor profile, and say why you are connecting them. This links existing accounts; it does not create a login.", selector: "[data-admin-guide-target='roles-connect']", options: "select, textarea, button", hint: "This section is available to Super Admins only." },
    { title: "Check your own access", description: "This shows the role you are signed in with. Technical access details lists the exact permissions your account holds.", selector: "[data-admin-guide-target='roles-account']", options: "a, button" },
    { title: "Who does what", description: "Super Admins manage the whole platform. Instructors work only inside the courses assigned to them.", selector: "[data-admin-guide-target='roles-roles']", options: "li" },
    { title: "Change a team role", description: "Open this only when an account needs a different main role. Every change is recorded with your reason, and removing a Super Admin's access needs an extra confirmation.", selector: "[data-admin-guide-target='roles-advanced']", hint: "This section is available to Super Admins only." },
  ] },
  { matches: path => path === "/admin/students", id: "students", steps: [
    { title: "Student counts", description: "Total, active and pending students for the brand you have selected.", selector: "[data-admin-guide-target='students-metrics']", options: ".admin-v2__student-stat" },
    { title: "Find and add students", description: "Search, filter by brand, level and status, open More filters for institution and semester, or add a student. A new student gets a one-time setup code.", selector: "[data-admin-guide-target='students-tools']", options: "input, select, button" },
    { title: "Browse the students", description: "Each row shows brand, academic placement, status and registered devices. Select a row, or View, to open the student's panel.", selector: "[data-admin-guide-target='students-table']", options: "tbody tr" },
    { title: "Review a student", description: "The panel on the right holds the student's profile, access, devices and sessions.", selector: "[data-admin-guide-target='students-inspector']", hint: "Select a student to open the panel." },
    { title: "Switch views", description: "Profile has identity and placement, Access shows subscriptions and grants, Devices lists registered hardware, and Sessions lists sign-ins.", selector: "[data-admin-guide-target='students-tabs']", options: "button", hint: "Select a student to see these views." },
    { title: "Suspend or reset", description: "Suspend or restore the account, or issue a new setup code when the student has not finished setup. Changes are recorded.", selector: "[data-admin-guide-target='students-actions']", options: "button", hint: "Open the Profile view of a student to see these actions." },
  ] },
  { matches: path => path === "/admin/payments", id: "payments", steps: [
    { title: "Payment totals", description: "How many orders are pending, approved or rejected, and the total amount still waiting for a decision.", selector: "[data-admin-guide-target='payments-metrics']", options: ".admin-v2__metric" },
    { title: "Filter the orders", description: "Show only pending, approved, rejected or cancelled orders, or search by order, offering or student.", selector: "[data-admin-guide-target='payments-tools']", options: "select, input" },
    { title: "Pick an order", description: "Each row is a manual payment order. Select one to review its details.", selector: "[data-admin-guide-target='payments-table']", options: "tbody tr" },
    { title: "Check the details", description: "Compare the offering, amount, payment method and reference with the payment you received before deciding.", selector: "[data-admin-guide-target='payments-inspector']", hint: "Select an order to open the review panel." },
    { title: "Approve or reject", description: "Approving opens the student's access once the server confirms it. Rejecting keeps the order as history. Both ask for a review note first.", selector: "[data-admin-guide-target='payments-actions']", options: "button", hint: "Select a pending order to see these actions." },
  ] },
  { matches: path => path === "/admin/subscriptions", id: "subscriptions", steps: [
    { title: "Subscription totals", description: "Total and active subscriptions, how many seats are assigned or still free, and how many access grants are active.", selector: "[data-admin-guide-target='subscriptions-metrics']", options: ".admin-v2__metric" },
    { title: "Start a purchase", description: "Choose Individual, Team or Group to start a manual purchase for students. Manage Semester Offerings sets up the offerings those purchases are tied to.", selector: "[data-admin-guide-target='subscriptions-purchase']", options: "button" },
    { title: "Find a subscription", description: "Filter by status or search by owner, subscription or course.", selector: "[data-admin-guide-target='subscriptions-tools']", options: "select, input" },
    { title: "Browse subscriptions", description: "Each row is one subscription with its offering, seats used, term and access grants. Select a row to open it.", selector: "[data-admin-guide-target='subscriptions-table']", options: "tbody tr" },
    { title: "Review the details", description: "The panel shows the offering, seat usage, term and the courses this subscription unlocks.", selector: "[data-admin-guide-target='subscriptions-inspector']", hint: "Select a subscription to open its details." },
    { title: "Manage seats or cancel", description: "Assign, release, replace or revoke seats, open the owner's student profile, or cancel the subscription. Cancelling revokes access but keeps the history.", selector: "[data-admin-guide-target='subscriptions-actions']", options: "button", hint: "Select a subscription to see these actions." },
  ] },
];

const STORAGE_PREFIX = "admin";
export const resetAdminGuideSession = (userId: string) => resetWorkspaceGuideSession(STORAGE_PREFIX, userId);
export function AdminGuide({ userId, pathname }: { userId: string; pathname: string }) {
  // Super Admins have no course count to relax the first-sessions rule, so pass a high count.
  return <WorkspaceGuide userId={userId} pathname={pathname} courseCount={Number.MAX_SAFE_INTEGER} guides={adminRouteGuides} storagePrefix={STORAGE_PREFIX} label="ADMIN FIELD GUIDE" />;
}
