import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, MousePointer2, X } from "lucide-react";
import "./instructor-guide.css";

type GuideStep = { title: string; description: string; selector: string };

const routeGuides: Array<{ matches: (path: string) => boolean; id: string; steps: GuideStep[] }> = [
  { matches: path => path === "/admin/instructor", id: "home", steps: [
    { title: "Your teaching snapshot", description: "Start here to check your assigned courses, upcoming grading, published exams, and lesson files waiting for approval.", selector: "[data-instructor-guide-target='home-metrics']" },
    { title: "Follow the teaching flow", description: "The workflow cards show the usual order: open a course, build lessons, create assessments, publish assignments, then review student work.", selector: ".admin-v2__workflow" },
    { title: "Open your course list", description: "Use All courses to see every course assigned to your instructor account.", selector: "[data-instructor-guide-target='home-all-courses']" },
    { title: "Choose a course", description: "Open a course card to start creating its chapters, lessons, and learning materials. If no course is assigned, contact your administrator.", selector: "[data-instructor-guide-target='home-course-card']" },
  ] },
  { matches: path => path === "/admin/instructor/courses", id: "courses", steps: [
    { title: "Your assigned courses", description: "This page shows the teaching spaces that your administrator has assigned to you.", selector: ".admin-v2__page-header" },
    { title: "Check course details", description: "Each card shows the course brand, code, and academic placement so you can confirm you opened the right course.", selector: "[data-instructor-guide-target='course-card']" },
    { title: "Open the course workspace", description: "Select Open course to manage chapters, lessons, and files for this course.", selector: "[data-instructor-guide-target='course-open']" },
  ] },
  { matches: path => /^\/admin\/instructor\/courses\/[^/]+$/.test(path), id: "course-content", steps: [
    { title: "Start with a chapter", description: "Enter a short chapter name and select Add chapter. Chapters keep related lessons organized.", selector: "[data-instructor-guide-target='chapter-form']" },
    { title: "Add a lesson", description: "After creating or selecting a chapter, name a lesson and add an optional summary. Lessons are saved as drafts.", selector: "[data-instructor-guide-target='lesson-form']" },
    { title: "Select a lesson", description: "Choose a lesson from the course outline to see its files and add learning materials.", selector: "[data-instructor-guide-target='lesson-list']" },
    { title: "Enter a resource title", description: "Give the file a clear title students will recognize in the lesson.", selector: "[data-instructor-guide-target='resource-title-input']" },
    { title: "Choose a PDF or video", description: "Upload a PDF document or an MP4 video. For an MP4, enter its duration when prompted.", selector: "[data-instructor-guide-target='resource-file']" },
    { title: "Submit for review", description: "Upload and verify the file. It stays private to students until an administrator approves it.", selector: "[data-instructor-guide-target='resource-submit']" },
  ] },
  { matches: path => path === "/admin/instructor/assignments", id: "assignments", steps: [
    { title: "Choose a course", description: "Assignments are tied to one of your mapped courses. Choose where students should find this work.", selector: "[data-instructor-guide-target='assignment-course']" },
    { title: "Name the assignment", description: "Use a clear title students can recognize. You can set a maximum score if the assignment is graded.", selector: "[data-instructor-guide-target='assignment-details']" },
    { title: "Set a due date", description: "Choose when student submissions are due. Leave this empty if the work has no deadline.", selector: "[data-instructor-guide-target='assignment-due']" },
    { title: "Write student instructions", description: "Explain what students should submit and how to complete the assignment.", selector: "[data-instructor-guide-target='assignment-instructions']" },
    { title: "Save a draft", description: "Create draft saves the assignment for you to review. Drafts are not visible to students yet.", selector: "[data-instructor-guide-target='assignment-create-button']" },
    { title: "Select an assignment", description: "Choose an assignment in the review queue to see its lifecycle and student submissions.", selector: ".admin-v2__workgrid .admin-v2__table-card" },
    { title: "Publish for students", description: "When a draft is ready, use Publish to students in the assignment details panel.", selector: "[data-instructor-guide-target='assignment-publish']" },
    { title: "Review student work", description: "Select a submitted response, enter a score and feedback, and add an audit reason before saving the review.", selector: ".admin-v2__course-inspector" },
    { title: "Score the response", description: "Enter a score within the assignment maximum. To request a revision instead, choose Return for revision in the Decision field.", selector: "[data-instructor-guide-target='grade-score']" },
    { title: "Give useful feedback", description: "Tell the student what went well and what they should improve. Feedback is required when returning work for revision.", selector: "[data-instructor-guide-target='grade-feedback']" },
    { title: "Record the review reason", description: "Add a short audit reason explaining your decision, then save the review or return the work.", selector: "[data-instructor-guide-target='grade-reason']" },
    { title: "Save the grading decision", description: "Save review records the score and feedback. Return submission sends the work back to the student with your comments.", selector: "[data-instructor-guide-target='grade-submit']" },
  ] },
  { matches: path => path === "/admin/instructor/assessments", id: "assessments", steps: [
    { title: "Choose the assessment type", description: "Start with a quiz or exam. This determines how the assessment is labeled for your course.", selector: "[data-instructor-guide-target='assessment-type']" },
    { title: "Choose a mapped course", description: "Pick one of your assigned courses so the right students receive this assessment.", selector: "[data-instructor-guide-target='assessment-course']" },
    { title: "Name the assessment", description: "Enter a clear title that tells students what the quiz or exam covers.", selector: "[data-instructor-guide-target='assessment-title']" },
    { title: "Create a draft", description: "Create draft saves the assessment privately so you can configure it and add questions before publishing.", selector: "[data-instructor-guide-target='assessment-create']" },
    { title: "Select an assessment", description: "Choose an item in the library to open its settings, question editor, and attempt summaries.", selector: ".admin-v2__workgrid .admin-v2__table-card" },
    { title: "Set timing and attempts", description: "Configure when the assessment opens and closes, how many attempts students get, and an optional time limit. Save details to keep your settings.", selector: ".admin-v2__inspector-section:first-of-type" },
    { title: "Write your questions", description: "Use the question editor to define prompts, answer options, answer keys, points, and order. Add question template inserts a starter question.", selector: ".admin-v2__assessment-question-editor" },
    { title: "Add another question", description: "Use Add question template to insert a starter single-choice question, then edit its prompt, choices, answer key, points, and order in the question editor.", selector: ".admin-v2__inspector-content:has(.admin-v2__assessment-question-editor) .admin-v2__actions button:first-child" },
    { title: "Save your questions", description: "Save questions to keep your latest draft on the server. Check the question list before publishing.", selector: ".admin-v2__inspector-content:has(.admin-v2__assessment-question-editor) .admin-v2__actions button:last-child" },
    { title: "Publish the assessment", description: "Publish makes a complete assessment available to students. Add and save at least one question first.", selector: ".admin-v2__subscription-actions" },
    { title: "Review attempt summaries", description: "After students complete the assessment, open Attempts to inspect their status and score summaries.", selector: ".admin-v2__inspector-section:last-of-type .admin-v2__inspector-content" },
  ] },
];

const safeGet = (storage: Storage, key: string) => { try { return storage.getItem(key); } catch { return null; } };
const safeSet = (storage: Storage, key: string, value: string) => { try { storage.setItem(key, value); } catch { /* Continue with this page's in-memory guide state. */ } };
export function resetInstructorGuideSession(userId: string) {
  try {
    sessionStorage.removeItem(`greenlearn.instructor-guide.session.${userId}`);
    sessionStorage.removeItem(`greenlearn.instructor-guide.dismissed.${userId}`);
    sessionStorage.removeItem(`greenlearn.instructor-guide.done.${userId}`);
  } catch { /* The next authenticated browser session will still initialize the guide. */ }
}

export function InstructorGuide({ userId, pathname, courseCount }: { userId: string; pathname: string; courseCount: number }) {
  const guide = useMemo(() => routeGuides.find(item => item.matches(pathname)), [pathname]);
  const [enabled, setEnabled] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [confirmPermanentOptOut, setConfirmPermanentOptOut] = useState(false);

  useEffect(() => {
    if (!guide || !userId) { setEnabled(false); return; }
    const sessionKey = `greenlearn.instructor-guide.session.${userId}`;
    const priorSession = safeGet(sessionStorage, sessionKey);
    if (priorSession !== "active") {
      const countKey = `greenlearn.instructor-guide.logins.${userId}`;
      const count = Number(safeGet(localStorage, countKey) ?? "0") + 1;
      safeSet(localStorage, countKey, String(count));
      safeSet(sessionStorage, sessionKey, "active");
      safeSet(sessionStorage, `greenlearn.instructor-guide.dismissed.${userId}`, "");
      safeSet(sessionStorage, `greenlearn.instructor-guide.done.${userId}`, "[]");
    }
    const count = Number(safeGet(localStorage, `greenlearn.instructor-guide.logins.${userId}`) ?? "1");
    const dismissed = safeGet(sessionStorage, `greenlearn.instructor-guide.dismissed.${userId}`) === "true";
    const permanentlyDisabled = safeGet(localStorage, `greenlearn.instructor-guide.disabled.${userId}`) === "true";
    let done: string[] = [];
    try { done = JSON.parse(safeGet(sessionStorage, `greenlearn.instructor-guide.done.${userId}`) ?? "[]") as string[]; } catch { done = []; }
    setEnabled(!permanentlyDisabled && (count <= 3 || courseCount <= 2) && !dismissed && !done.includes(guide.id));
    setStepIndex(0);
  }, [courseCount, guide, userId]);

  const currentStep = guide?.steps[stepIndex];
  useEffect(() => {
    if (!enabled || !currentStep) { setTargetRect(null); return; }
    let frame = 0;
    const findTarget = () => {
      const target = document.querySelector<HTMLElement>(currentStep.selector);
      if (target) {
        const rect = target.getBoundingClientRect();
        if (rect.width > 0 && (rect.bottom < 40 || rect.top > window.innerHeight - 40)) target.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
        target.dataset.instructorGuideSpotlight = "true";
        const visibleRect = target.getBoundingClientRect();
        setTargetRect(visibleRect.width > 0 && visibleRect.height > 0 ? visibleRect : null);
      } else setTargetRect(null);
    };
    findTarget();
    const update = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(findTarget); };
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    const observer = new MutationObserver(update);
    observer.observe(document.querySelector(".admin-v2__content") ?? document.body, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      observer.disconnect();
      document.querySelectorAll('[data-instructor-guide-spotlight="true"]').forEach(element => { delete (element as HTMLElement).dataset.instructorGuideSpotlight; });
    };
  }, [enabled, currentStep]);

  if (!enabled || !guide || !currentStep) return null;
  const dismiss = () => {
    safeSet(sessionStorage, `greenlearn.instructor-guide.dismissed.${userId}`, "true");
    setEnabled(false);
  };
  const permanentlyDisable = () => {
    safeSet(localStorage, `greenlearn.instructor-guide.disabled.${userId}`, "true");
    setConfirmPermanentOptOut(false);
    setEnabled(false);
  };
  const finishRoute = () => {
    const key = `greenlearn.instructor-guide.done.${userId}`;
    let done: string[] = [];
    try { done = JSON.parse(safeGet(sessionStorage, key) ?? "[]") as string[]; } catch { done = []; }
    safeSet(sessionStorage, key, JSON.stringify([...new Set([...done, guide.id])]));
    setEnabled(false);
  };
  const next = () => stepIndex + 1 >= guide.steps.length ? finishRoute() : setStepIndex(value => value + 1);
  const panelBottom = targetRect ? Math.max(24, window.innerHeight - targetRect.bottom + 16) : 24;
  const pointerLeft = targetRect ? Math.min(window.innerWidth - 36, Math.max(36, targetRect.left + targetRect.width / 2)) : 36;
  const pointerTop = targetRect ? targetRect.top > 82 ? targetRect.top - 48 : targetRect.bottom + 8 : 90;

  return <>
    <div className="instructor-guide__scrim" aria-hidden="true" />
    {targetRect && <div className="instructor-guide__spotlight" style={{ left: targetRect.left - 6, top: targetRect.top - 6, width: targetRect.width + 12, height: targetRect.height + 12 }} aria-hidden="true" />}
    {targetRect && <div className="instructor-guide__pointer" style={{ left: pointerLeft, top: pointerTop }} aria-hidden="true"><MousePointer2 size={21} /><span>THIS WAY</span></div>}
    <section className="instructor-guide__panel" style={{ bottom: panelBottom }} role="dialog" aria-modal="false" aria-labelledby="instructor-guide-title">
      <div className="instructor-guide__panel-top"><span>INSTRUCTOR FIELD GUIDE</span><span className="instructor-guide__counter">{String(stepIndex + 1).padStart(2, "0")} / {String(guide.steps.length).padStart(2, "0")}</span><button type="button" onClick={dismiss} aria-label="Close guide"><X size={17} /></button></div>
      <div className="instructor-guide__progress" aria-hidden="true"><span style={{ width: `${((stepIndex + 1) / guide.steps.length) * 100}%` }} /></div>
      <h2 id="instructor-guide-title">{currentStep.title}</h2>
      <p>{currentStep.description}</p>
      {!targetRect && <small>Loading this part of your workspace…</small>}
      <div className="instructor-guide__actions">
        <button type="button" className="instructor-guide__skip" onClick={dismiss}>Skip guide</button>
        <button type="button" className="instructor-guide__next" onClick={next}>{stepIndex + 1 === guide.steps.length ? "Done" : "Next"}<ArrowRight size={15} /></button>
      </div>
      <button type="button" className="instructor-guide__permanent" onClick={() => setConfirmPermanentOptOut(true)}>Don&apos;t show this guide again</button>
      {stepIndex > 0 && <button type="button" className="instructor-guide__back" onClick={() => setStepIndex(value => Math.max(0, value - 1))}><ArrowLeft size={13} /> Previous</button>}
    </section>
    {confirmPermanentOptOut && <div className="instructor-guide__confirm-backdrop">
      <section className="instructor-guide__confirm" role="alertdialog" aria-modal="true" aria-labelledby="instructor-guide-confirm-title" aria-describedby="instructor-guide-confirm-copy">
        <span className="instructor-guide__confirm-mark" aria-hidden="true">!</span>
        <h2 id="instructor-guide-confirm-title">Turn off the instructor guide?</h2>
        <p id="instructor-guide-confirm-copy">If you continue, this guide will never appear again for your account, even if you have fewer than three courses. This can’t be undone here.</p>
        <div><button type="button" className="instructor-guide__confirm-cancel" onClick={() => setConfirmPermanentOptOut(false)}>Keep the guide</button><button type="button" className="instructor-guide__confirm-disable" onClick={permanentlyDisable}>Yes, turn it off</button></div>
      </section>
    </div>}
  </>;
}
