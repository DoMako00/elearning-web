import { WorkspaceGuide, resetWorkspaceGuideSession, type RouteGuide } from "./WorkspaceGuide";

const ASSIGNMENTS_TAB = "[data-instructor-guide-target='assignment-list-tab']";
const GRADING_TAB = "[data-instructor-guide-target='assignment-grading-tab']";
const FIRST_STUDENT = ".instructor-assignments__student-row";
const GRADING_HINT = "Pick an assignment, then a student who has submitted work, and this part of the grading panel appears.";
const FIRST_LESSON = ".instructor-course-builder__lesson";
const LESSON_HINT = "Add a chapter and a lesson first, then select the lesson to reveal its upload area.";
const FIRST_ASSESSMENT = ".admin-v2__workgrid .admin-v2__table tbody tr";
const ASSESSMENT_HINT = "Create a draft assessment or select one from the library to reveal this part.";

const routeGuides: RouteGuide[] = [
  { matches: path => path === "/admin/instructor", id: "home", steps: [
    { title: "Your teaching snapshot", description: "Start here to check your assigned courses, upcoming grading, published exams, and lesson files waiting for approval.", selector: "[data-instructor-guide-target='home-metrics']" },
    { title: "Choose your next action", description: "These shortcuts take you straight to a course, lesson materials, or an assessment task.", selector: "[data-instructor-guide-target='home-workflow']" },
    { title: "Follow the teaching flow", description: "Use the checklist to move from opening a course through building lessons, creating assessments, publishing assignments, and grading work.", selector: "[data-instructor-guide-target='home-teaching-flow']" },
    { title: "Open your course list", description: "Use All courses to see every course assigned to your instructor account.", selector: "[data-instructor-guide-target='home-all-courses']" },
    { title: "Choose a course", description: "Open a course card to start creating its chapters, lessons, and learning materials. If no course is assigned, contact your administrator.", selector: "[data-instructor-guide-target='home-course-card']" },
  ] },
  { matches: path => path === "/admin/instructor/courses", id: "courses", steps: [
    { title: "Your assigned courses", description: "This panel lists the teaching spaces your administrator assigned. Search the list, then select a course to see its teaching tools.", selector: "[data-instructor-guide-target='course-list-header']" },
    { title: "Check course access", description: "Assigned courses appear here with their brand and academic details. If the list is empty, ask your administrator to assign a course.", selector: "[data-instructor-guide-target='course-card']" },
    { title: "Open the course workspace", description: "Select Open course to manage chapters, lessons, and files for this course.", selector: "[data-instructor-guide-target='course-open']" },
  ] },
  { matches: path => /^\/admin\/instructor\/courses\/[^/]+$/.test(path), id: "course-content", steps: [
    { title: "Start with a chapter", description: "Select + Chapter, enter a short name and select Add chapter. Chapters keep related lessons organized.", selector: "[data-instructor-guide-target='chapter-form']" },
    { title: "Add a lesson", description: "Once a chapter exists, select + Lesson, name the lesson and add an optional summary. Lessons are saved as drafts.", selector: "[data-instructor-guide-target='lesson-form']" },
    { title: "Select a lesson", description: "Choose a lesson from the course structure to see its files and add learning materials.", selector: "[data-instructor-guide-target='lesson-list']" },
    { title: "Enter a resource title", description: "Give the file a clear title students will recognize in the lesson.", selector: "[data-instructor-guide-target='resource-title-input']", reveal: FIRST_LESSON, hint: LESSON_HINT },
    { title: "Choose a PDF or video", description: "Upload a PDF document or an MP4 video. For an MP4, enter its duration when prompted.", selector: "[data-instructor-guide-target='resource-file']", reveal: FIRST_LESSON, hint: LESSON_HINT },
    { title: "Submit for review", description: "Upload and verify the file. It stays private to students until an administrator approves it.", selector: "[data-instructor-guide-target='resource-submit']", reveal: FIRST_LESSON, hint: LESSON_HINT },
  ] },
  { matches: path => path === "/admin/instructor/students", id: "students", steps: [
    { title: "Create a student account", description: "Pick one of your assigned courses, enter the student's name and optional phone, then select Create student. The account stays pending until payment is approved.", selector: "[data-instructor-guide-target='students-create']" },
    { title: "Review your students", description: "Students connected to your courses, or created by you, are listed here with their placement, course access and status.", selector: "[data-instructor-guide-target='students-roster']" },
    { title: "Find a student quickly", description: "Search by name to narrow the roster.", selector: "[data-instructor-guide-target='students-search']" },
    { title: "Continue to purchase requests", description: "Once an account exists, open purchase requests to buy the student's subscription.", selector: "[data-instructor-guide-target='students-purchases']" },
  ] },
  { matches: path => path === "/admin/instructor/subscriptions", id: "subscriptions", steps: [
    { title: "Know how approval works", description: "You prepare the purchase and record payment details. Access only activates after the Super Admin approves the request.", selector: "[data-instructor-guide-target='subscriptions-notice']" },
    { title: "Start a purchase request", description: "Select Create purchase request to jump to the plans, then follow the steps to choose students and record payment.", selector: "[data-instructor-guide-target='subscriptions-create']" },
    { title: "Choose a plan", description: "Pick the plan and students for this purchase, then submit it for review.", selector: "[data-instructor-guide-target='subscriptions-plans']" },
    { title: "Track your requests", description: "Every request you submit appears here with its payment decision: awaiting review, approved or rejected.", selector: "[data-instructor-guide-target='subscriptions-requests']" },
  ] },
  { matches: path => path === "/admin/instructor/assignments", id: "assignments", steps: [
    { title: "Create or review work", description: "This workspace has two views. Click Assignments to create and publish work; then use Submissions & grading when students turn it in. Click the tab, then select Next to continue.", selector: "[data-instructor-guide-target='assignment-list-tab']" },
    { title: "Choose a course", description: "Select one of your mapped courses. The assignment will only be available to students enrolled in this course.", selector: "[data-instructor-guide-target='assignment-create-course']", reveal: ASSIGNMENTS_TAB },
    { title: "Name the assignment", description: "Choose a short, recognizable title. Add a maximum score when you plan to grade the submission with points.", selector: "[data-instructor-guide-target='assignment-create-title']", reveal: ASSIGNMENTS_TAB },
    { title: "Set the due date", description: "Choose the deadline students should see. Leave this blank when the assignment has no due date.", selector: "[data-instructor-guide-target='assignment-create-due']", reveal: ASSIGNMENTS_TAB },
    { title: "Explain what students should submit", description: "Write clear instructions, including the task, expected format, and any requirements students should follow.", selector: "[data-instructor-guide-target='assignment-create-instructions']", reveal: ASSIGNMENTS_TAB },
    { title: "Save the assignment draft", description: "Create draft stores the assignment privately. Check the details first, then publish it when students can begin working.", selector: "[data-instructor-guide-target='assignment-create-button']", reveal: ASSIGNMENTS_TAB },
    { title: "Publish or close an assignment", description: "Select an assignment in this list. Drafts can be published; published work can be closed when you no longer want to accept submissions.", selector: "[data-instructor-guide-target='assignment-list']", reveal: ASSIGNMENTS_TAB },
    { title: "Open submissions & grading", description: "Click this tab to find students, inspect their work, and enter grades and feedback. Then select Next to continue the guide.", selector: GRADING_TAB },
    { title: "Choose the course and assignment", description: "Use these filters to narrow the student list to the course and assignment you want to review.", selector: "[data-instructor-guide-target='assignment-select']", reveal: GRADING_TAB },
    { title: "Find a student", description: "Search by student name or ID, or filter the list by work that needs grading, is already graded, was returned, or is not submitted yet.", selector: "[data-instructor-guide-target='assignment-student-list']", reveal: GRADING_TAB },
    { title: "Read the submission", description: "Review the student's written response and open any attached file before deciding how to grade the work.", selector: "[data-instructor-guide-target='assignment-response']", reveal: [GRADING_TAB, FIRST_STUDENT], hint: GRADING_HINT },
    { title: "Enter a score", description: "Enter a score within the maximum shown beside the field. A score is required when marking a scored assignment reviewed.", selector: "[data-instructor-guide-target='grade-score']", reveal: [GRADING_TAB, FIRST_STUDENT], hint: GRADING_HINT },
    { title: "Write student feedback", description: "Explain what the student did well and what to improve. Feedback is required when you return work for revision.", selector: "[data-instructor-guide-target='grade-feedback']", reveal: [GRADING_TAB, FIRST_STUDENT], hint: GRADING_HINT },
    { title: "Choose a grading decision", description: "Mark reviewed to save the grade, or return for revision to send the work back with your feedback.", selector: "[data-instructor-guide-target='grade-decision']", reveal: [GRADING_TAB, FIRST_STUDENT], hint: GRADING_HINT },
    { title: "Add an audit reason", description: "Record a short reason for this grading action. It is required so the decision has a clear review history.", selector: "[data-instructor-guide-target='grade-reason']", reveal: [GRADING_TAB, FIRST_STUDENT], hint: GRADING_HINT },
    { title: "Save and continue", description: "Save review records the grade and feedback. With Move to next student enabled, the next submission needing a grade is selected automatically.", selector: "[data-instructor-guide-target='grade-submit']", reveal: [GRADING_TAB, FIRST_STUDENT], hint: GRADING_HINT },
  ] },
  { matches: path => path === "/admin/instructor/assessments", id: "assessments", steps: [
    { title: "Choose the assessment type", description: "Start with a quiz or exam. This determines how the assessment is labeled for your course.", selector: "[data-instructor-guide-target='assessment-type']" },
    { title: "Choose a mapped course", description: "Pick one of your assigned courses so the right students receive this assessment.", selector: "[data-instructor-guide-target='assessment-course']" },
    { title: "Name the assessment", description: "Enter a clear title that tells students what the quiz or exam covers.", selector: "[data-instructor-guide-target='assessment-title']" },
    { title: "Create a draft", description: "Create draft saves the assessment privately so you can configure it and add questions before publishing.", selector: "[data-instructor-guide-target='assessment-create']" },
    { title: "Select an assessment", description: "Choose an item in the library to open its settings, question editor, and attempt summaries.", selector: ".admin-v2__workgrid .admin-v2__table-card" },
    { title: "Set timing and attempts", description: "Configure when the assessment opens and closes, how many attempts students get, and an optional time limit. Save details to keep your settings.", selector: ".admin-v2__inspector-section:first-of-type", reveal: FIRST_ASSESSMENT, hint: ASSESSMENT_HINT },
    { title: "Write your questions", description: "Use the question editor to define prompts, answer options, answer keys, points, and order. Add question template inserts a starter question.", selector: ".admin-v2__assessment-question-editor", reveal: FIRST_ASSESSMENT, hint: ASSESSMENT_HINT },
    { title: "Add another question", description: "Use Add question template to insert a starter single-choice question, then edit its prompt, choices, answer key, points, and order in the question editor.", selector: ".admin-v2__inspector-content:has(.admin-v2__assessment-question-editor) .admin-v2__actions button:first-child", reveal: FIRST_ASSESSMENT, hint: ASSESSMENT_HINT },
    { title: "Save your questions", description: "Save questions to keep your latest draft on the server. Check the question list before publishing.", selector: ".admin-v2__inspector-content:has(.admin-v2__assessment-question-editor) .admin-v2__actions button:last-child", reveal: FIRST_ASSESSMENT, hint: ASSESSMENT_HINT },
    { title: "Publish the assessment", description: "Publish makes a complete assessment available to students. Add and save at least one question first.", selector: ".admin-v2__subscription-actions", reveal: FIRST_ASSESSMENT, hint: ASSESSMENT_HINT },
    { title: "Review attempt summaries", description: "After students complete the assessment, open Attempts to inspect their status and score summaries.", selector: ".admin-v2__inspector-section:last-of-type .admin-v2__inspector-content", reveal: FIRST_ASSESSMENT, hint: ASSESSMENT_HINT },
  ] },
];

const STORAGE_PREFIX = "instructor";
export const resetInstructorGuideSession = (userId: string) => resetWorkspaceGuideSession(STORAGE_PREFIX, userId);
export function InstructorGuide({ userId, pathname, courseCount }: { userId: string; pathname: string; courseCount: number }) {
  return <WorkspaceGuide userId={userId} pathname={pathname} courseCount={courseCount} guides={routeGuides} storagePrefix={STORAGE_PREFIX} label="INSTRUCTOR FIELD GUIDE" />;
}
