import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import "./instructor-guide.css";

type GuideStep = { title: string; description: string; selector: string };

const routeGuides: Array<{ matches: (path: string) => boolean; id: string; steps: GuideStep[] }> = [
  { matches: path => path === "/admin/instructor", id: "home", steps: [
    { title: "Your teaching overview", description: "See your assigned courses, grading queue, published exams, and lesson materials awaiting review here.", selector: ".admin-v2__workflow-metrics" },
    { title: "Follow your teaching flow", description: "Use these links in order: open a course, build lessons, create assessments, publish assignments, then grade student work.", selector: ".admin-v2__workflow-page" },
    { title: "Open an assigned course", description: "Start building content from one of your course cards. If no course is assigned, ask your administrator to grant course access.", selector: ".admin-v2__instructor-courses" },
  ] },
  { matches: path => path === "/admin/instructor/courses", id: "courses", steps: [
    { title: "Your assigned courses", description: "This list contains the courses available to your instructor account.", selector: ".admin-v2__page-header" },
    { title: "Open a course", description: "Choose Open course to add chapters, lessons, and learning files.", selector: ".admin-v2__metrics, .admin-v2__empty" },
  ] },
  { matches: path => /^\/admin\/instructor\/courses\/[^/]+$/.test(path), id: "course-content", steps: [
    { title: "Build the course outline", description: "Add a chapter, then add lessons under it. Select a lesson to manage its learning materials.", selector: ".admin-v2__table-card" },
    { title: "Add lesson materials", description: "Upload a video or PDF to the selected lesson. Submitted files remain private until an administrator approves them.", selector: ".admin-v2__course-inspector" },
  ] },
  { matches: path => path === "/admin/instructor/assignments", id: "assignments", steps: [
    { title: "Create coursework", description: "Choose one of your mapped courses, add assignment instructions and a due date, then save a draft.", selector: ".admin-v2__workgrid" },
    { title: "Publish and grade", description: "Publish a ready assignment for students, then select submitted work to score it or return it with feedback.", selector: ".admin-v2__workgrid" },
  ] },
  { matches: path => path === "/admin/instructor/assessments", id: "assessments", steps: [
    { title: "Create an exam or quiz", description: "Select one of your courses, choose a quiz or exam, and add questions and availability settings.", selector: ".admin-v2__workgrid" },
    { title: "Review results", description: "Select an assessment to inspect its questions and student attempts. Publish it when it is ready.", selector: ".admin-v2__workgrid" },
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

export function InstructorGuide({ userId, pathname }: { userId: string; pathname: string }) {
  const guide = useMemo(() => routeGuides.find(item => item.matches(pathname)), [pathname]);
  const [enabled, setEnabled] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

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
    let done: string[] = [];
    try { done = JSON.parse(safeGet(sessionStorage, `greenlearn.instructor-guide.done.${userId}`) ?? "[]") as string[]; } catch { done = []; }
    setEnabled(count <= 3 && !dismissed && !done.includes(guide.id));
    setStepIndex(0);
  }, [guide, userId]);

  const currentStep = guide?.steps[stepIndex];
  useEffect(() => {
    if (!enabled || !currentStep) { setTargetRect(null); return; }
    let frame = 0;
    const findTarget = () => {
      const target = document.querySelector<HTMLElement>(currentStep.selector);
      if (target) {
        target.dataset.instructorGuideSpotlight = "true";
        const rect = target.getBoundingClientRect();
        setTargetRect(rect.width > 0 && rect.height > 0 ? rect : null);
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
  const finishRoute = () => {
    const key = `greenlearn.instructor-guide.done.${userId}`;
    let done: string[] = [];
    try { done = JSON.parse(safeGet(sessionStorage, key) ?? "[]") as string[]; } catch { done = []; }
    safeSet(sessionStorage, key, JSON.stringify([...new Set([...done, guide.id])]));
    setEnabled(false);
  };
  const next = () => stepIndex + 1 >= guide.steps.length ? finishRoute() : setStepIndex(value => value + 1);
  const panelBottom = targetRect ? Math.max(24, window.innerHeight - targetRect.bottom + 16) : 24;

  return <>
    <div className="instructor-guide__scrim" aria-hidden="true" />
    {targetRect && <div className="instructor-guide__spotlight" style={{ left: targetRect.left - 6, top: targetRect.top - 6, width: targetRect.width + 12, height: targetRect.height + 12 }} aria-hidden="true" />}
    <section className="instructor-guide__panel" style={{ bottom: panelBottom }} role="dialog" aria-modal="false" aria-labelledby="instructor-guide-title">
      <div className="instructor-guide__panel-top"><span>INSTRUCTOR QUICK START · {stepIndex + 1} OF {guide.steps.length}</span><button type="button" onClick={dismiss} aria-label="Close guide"><X size={17} /></button></div>
      <h2 id="instructor-guide-title">{currentStep.title}</h2>
      <p>{currentStep.description}</p>
      {!targetRect && <small>Loading this part of your workspace…</small>}
      <div className="instructor-guide__actions">
        <button type="button" className="instructor-guide__skip" onClick={dismiss}>Skip guide</button>
        <button type="button" className="instructor-guide__next" onClick={next}>{stepIndex + 1 === guide.steps.length ? "Done" : "Next"}<ArrowRight size={15} /></button>
      </div>
      {stepIndex > 0 && <button type="button" className="instructor-guide__back" onClick={() => setStepIndex(value => Math.max(0, value - 1))}><ArrowLeft size={13} /> Previous</button>}
    </section>
  </>;
}
