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
];

const STORAGE_PREFIX = "admin";
export const resetAdminGuideSession = (userId: string) => resetWorkspaceGuideSession(STORAGE_PREFIX, userId);
export function AdminGuide({ userId, pathname }: { userId: string; pathname: string }) {
  // Super Admins have no course count to relax the first-sessions rule, so pass a high count.
  return <WorkspaceGuide userId={userId} pathname={pathname} courseCount={Number.MAX_SAFE_INTEGER} guides={adminRouteGuides} storagePrefix={STORAGE_PREFIX} label="ADMIN FIELD GUIDE" />;
}
