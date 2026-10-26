/**
 * Single source of truth for workspace and portal copy.
 *
 * Super Admin strings are preserved verbatim from the original implementation.
 * Instructor strings provide plain, accessible terminology suitable for medical doctors
 * and non-technical educators.
 */

export interface WorkspaceCopy {
  sidebar: {
    brandConsoleSmall: string;
    brandHomeAriaLabel: string;
    brandHomeRoute: string;
    workspaceLabel: string;
    navHomeLabel: string;
    footerCopyright: string;
    cacheButtonTitle: string;
  };
  topbar: {
    kicker: string;
    fallbackUserName: string;
    searchAriaLabel: string;
    searchPlaceholder: string;
  };
  courses: {
    openCourseAction: string;
    placementConfirmed: string;
    placementUnavailable: string;
  };
  content: {
    materialsInReview: string;
    waitingForAdminApproval: string;
    reviewNotePrefix: string;
    uploadButtonLabel: string;
    uploadHelperText: string;
  };
  assignments: {
    adminCloseNote: string;
    missingPlacementNotice: string;
  };
  assessments: {
    adminMonitorNote: string;
    attemptSummariesOnlyNotice: string;
  };
}

/** Set to a real URL string (e.g. "https://support.greenlearn.org") if external instructor support is enabled. */
export const INSTRUCTOR_SUPPORT_LINK: string | null = null;

export const ADMIN_COPY: WorkspaceCopy = {
  sidebar: {
    brandConsoleSmall: "ADMIN CONSOLE",
    brandHomeAriaLabel: "GreenLearn Admin home",
    brandHomeRoute: "/admin/courses",
    workspaceLabel: "WORKSPACE",
    navHomeLabel: "Overview",
    footerCopyright: "GreenLearn · Admin workspace",
    cacheButtonTitle: "Reset local Admin cache",
  },
  topbar: {
    kicker: "SUPER ADMIN WORKSPACE",
    fallbackUserName: "Authenticated Admin",
    searchAriaLabel: "Global Admin search",
    searchPlaceholder: "Search students, courses, instructors...",
  },
  courses: {
    openCourseAction: "Build course content",
    placementConfirmed: "Academic placement confirmed",
    placementUnavailable: "Placement unavailable",
  },
  content: {
    materialsInReview: "Materials in review",
    waitingForAdminApproval: "Waiting for Super Admin approval",
    reviewNotePrefix: "Review note: ",
    uploadButtonLabel: "Upload and submit for review",
    uploadHelperText: "Instructor uploads remain private while the backend verifies them. Submit the resource for review; only approval publishes it to students.",
  },
  assignments: {
    adminCloseNote: "Students see published assignments in this course. Drafts remain instructor-only; Super Admin may close a published Assignment when needed.",
    missingPlacementNotice: "Your assigned courses need a verified academic placement before you can create an Assignment.",
  },
  assessments: {
    adminMonitorNote: "Question authoring and assessment settings belong to the assigned Instructor. Super Admin can monitor attempts and close an assessment when required.",
    attemptSummariesOnlyNotice: "The current assessment API provides attempt summaries only; student answers and manual grading are not available here.",
  },
};

export const INSTRUCTOR_COPY: WorkspaceCopy = {
  sidebar: {
    brandConsoleSmall: "Instructor portal",
    brandHomeAriaLabel: "GreenLearn instructor home",
    brandHomeRoute: "/admin/instructor",
    workspaceLabel: "WORKSPACE",
    navHomeLabel: "Home",
    footerCopyright: "GreenLearn · Instructor portal",
    cacheButtonTitle: "Reset local cache",
  },
  topbar: {
    kicker: "Instructor portal",
    fallbackUserName: "Instructor",
    searchAriaLabel: "Search courses",
    searchPlaceholder: "Search your courses...",
  },
  courses: {
    openCourseAction: "Open course",
    placementConfirmed: "Semester linked",
    placementUnavailable: "No semester linked",
  },
  content: {
    materialsInReview: "Files awaiting approval",
    waitingForAdminApproval: "Waiting for administrator approval",
    reviewNotePrefix: "Note from the administrator: ",
    uploadButtonLabel: "Upload file",
    uploadHelperText: "An administrator reviews files before students can see them.",
  },
  assignments: {
    adminCloseNote: "Students see published assignments in this course. Drafts remain instructor-only. An administrator can close a published assignment if needed.",
    missingPlacementNotice: "Your assigned courses need to be linked to a semester before you can create an assignment.",
  },
  assessments: {
    adminMonitorNote: "Question authoring and assessment settings belong to the assigned instructor. An administrator can monitor attempts and close a quiz or exam if needed.",
    attemptSummariesOnlyNotice: "Detailed answers per question aren't available yet.",
  },
};

export function getWorkspaceCopy(role?: "instructor" | "super_admin" | string | null): WorkspaceCopy {
  return role === "instructor" ? INSTRUCTOR_COPY : ADMIN_COPY;
}
