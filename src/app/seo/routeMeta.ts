/* Maps a URL path to its page title and indexing rule. Only the sign-in page is public; everything else is private. */
export interface RouteMeta {
  /** Page name, without the site name. */
  title: string;
  /** Short description for the page; falls back to the site description. */
  description?: string;
  /** Which part of the product the page belongs to, shown after the site name in the title. */
  area: "public" | "student" | "admin";
  noindex: boolean;
}

const studentTitles: Array<[RegExp, string]> = [
  [/^\/$/, "Home"],
  [/^\/profile$/, "Profile"],
  [/^\/instructors?(-profile)?$/, "Instructors"],
  [/^\/instructors\/[^/]+$/, "Instructor profile"],
  [/^\/my-courses$/, "My courses"],
  [/^\/my-courses\/[^/]+$/, "Course"],
  [/^\/my-courses\/[^/]+\/lessons\/[^/]+$/, "Lesson"],
  [/^\/explore(\/paths\/[^/]+)?$/, "Explore"],
  [/^\/calendar$/, "Calendar"],
  [/^\/assignments$/, "Assignments"],
  [/^\/assignments\/[^/]+$/, "Assignment"],
  [/^\/assessments$/, "Exams & quizzes"],
  [/^\/assessments\/[^/]+$/, "Assessment"],
  [/^\/messages$/, "Messages"],
  [/^\/community$/, "Community"],
  [/^\/help$/, "Help center"],
  [/^\/settings$/, "Settings"],
  [/^\/notifications$/, "Notifications"],
];

const adminTitles: Array<[RegExp, string]> = [
  [/^\/admin\/?$|^\/admin\/overview$/, "Overview"],
  [/^\/admin\/curriculum$/, "Curriculum"],
  [/^\/admin\/courses$/, "Course setup"],
  [/^\/admin\/courses\/[^/]+\/builder$/, "Course builder"],
  [/^\/admin\/instructors$/, "Instructors"],
  [/^\/admin\/roles$/, "Roles & permissions"],
  [/^\/admin\/students$/, "Students"],
  [/^\/admin\/payments$/, "Payments"],
  [/^\/admin\/subscriptions$/, "Subscriptions"],
  [/^\/admin\/content$/, "Content approvals"],
  [/^\/admin\/security$/, "Security"],
  [/^\/admin\/support$/, "Support inbox"],
  [/^\/admin\/assessments$/, "Assessments"],
  [/^\/admin\/assignments$/, "Assignments"],
  [/^\/admin\/instructor\/?$/, "Home"],
  [/^\/admin\/instructor\/courses$/, "My courses"],
  [/^\/admin\/instructor\/courses\/[^/]+$/, "Course builder"],
  [/^\/admin\/instructor\/students$/, "Students"],
  [/^\/admin\/instructor\/subscriptions$/, "Subscriptions"],
  [/^\/admin\/instructor\/assignments$/, "Assignments & grading"],
  [/^\/admin\/instructor\/assessments$/, "Exams & quizzes"],
];

const lookup = (table: Array<[RegExp, string]>, path: string) => table.find(([pattern]) => pattern.test(path))?.[1];

export function resolveRouteMeta(pathname: string): RouteMeta {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (path === "/auth/sign-in") {
    return { title: "Sign in", description: "Sign in to GreenLearn with your account to continue learning or teaching.", area: "public", noindex: false };
  }
  if (path === "/admin" || path.startsWith("/admin/")) {
    return { title: lookup(adminTitles, path) ?? "Admin", area: "admin", noindex: true };
  }
  const student = lookup(studentTitles, path);
  if (student) return { title: student, area: "student", noindex: true };
  return { title: "Page not found", area: "public", noindex: true };
}

export function formatTitle(meta: RouteMeta, siteName: string): string {
  const suffix = meta.area === "admin" ? `${siteName} Admin` : siteName;
  return `${meta.title} | ${suffix}`;
}
