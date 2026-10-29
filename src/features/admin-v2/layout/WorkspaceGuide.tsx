import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, MousePointer2, X } from "lucide-react";
import "./instructor-guide.css";

/* `reveal` is clicked once (when the target is missing) to bring the target on screen, e.g. a tab or the first list row.
   `hint` is shown when the target still isn't there, so the step explains what to do instead of an endless loading note. */
export type GuideStep = { title: string; description: string; selector: string; reveal?: string | string[]; hint?: string };
export type RouteGuide = { matches: (path: string) => boolean; id: string; steps: GuideStep[] };

const safeGet = (storage: Storage, key: string) => { try { return storage.getItem(key); } catch { return null; } };
const safeSet = (storage: Storage, key: string, value: string) => { try { storage.setItem(key, value); } catch { /* Continue with this page's in-memory guide state. */ } };
export function resetWorkspaceGuideSession(storagePrefix: string, userId: string) {
  try {
    sessionStorage.removeItem(`greenlearn.${storagePrefix}-guide.session.${userId}`);
    sessionStorage.removeItem(`greenlearn.${storagePrefix}-guide.dismissed.${userId}`);
    sessionStorage.removeItem(`greenlearn.${storagePrefix}-guide.done.${userId}`);
  } catch { /* The next authenticated browser session will still initialize the guide. */ }
}

export function WorkspaceGuide({ userId, pathname, courseCount, guides, storagePrefix, label }: { userId: string; pathname: string; courseCount: number; guides: RouteGuide[]; storagePrefix: string; label: string }) {
  const guide = useMemo(() => guides.find(item => item.matches(pathname)), [guides, pathname]);
  const [enabled, setEnabled] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [confirmPermanentOptOut, setConfirmPermanentOptOut] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const revealed = useRef(new Set<string>());
  const [panelPosition, setPanelPosition] = useState({ top: 24, left: 24 });

  useEffect(() => {
    if (!guide || !userId) { setEnabled(false); return; }
    const sessionKey = `greenlearn.${storagePrefix}-guide.session.${userId}`;
    const priorSession = safeGet(sessionStorage, sessionKey);
    if (priorSession !== "active") {
      const countKey = `greenlearn.${storagePrefix}-guide.logins.${userId}`;
      const count = Number(safeGet(localStorage, countKey) ?? "0") + 1;
      safeSet(localStorage, countKey, String(count));
      safeSet(sessionStorage, sessionKey, "active");
      safeSet(sessionStorage, `greenlearn.${storagePrefix}-guide.dismissed.${userId}`, "");
      safeSet(sessionStorage, `greenlearn.${storagePrefix}-guide.done.${userId}`, "[]");
    }
    const count = Number(safeGet(localStorage, `greenlearn.${storagePrefix}-guide.logins.${userId}`) ?? "1");
    const dismissed = safeGet(sessionStorage, `greenlearn.${storagePrefix}-guide.dismissed.${userId}`) === "true";
    const permanentlyDisabled = safeGet(localStorage, `greenlearn.${storagePrefix}-guide.disabled.${userId}`) === "true";
    let done: string[] = [];
    try { done = JSON.parse(safeGet(sessionStorage, `greenlearn.${storagePrefix}-guide.done.${userId}`) ?? "[]") as string[]; } catch { done = []; }
    setEnabled(!permanentlyDisabled && (count <= 3 || courseCount <= 2) && !dismissed && !done.includes(guide.id));
    setStepIndex(0);
    revealed.current.clear();
  }, [courseCount, guide, storagePrefix, userId]);

  const currentStep = guide?.steps[stepIndex];
  useEffect(() => {
    if (!enabled || !currentStep) { setTargetRect(null); return; }
    let frame = 0;
    revealed.current.clear();
    const findTarget = () => {
      const target = document.querySelector<HTMLElement>(currentStep.selector);
      if (target) {
        const rect = target.getBoundingClientRect();
        if (rect.width > 0 && (rect.bottom < 40 || rect.top > window.innerHeight - 40)) target.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
        target.dataset.instructorGuideSpotlight = "true";
        const visibleRect = target.getBoundingClientRect();
        setTargetRect(visibleRect.width > 0 && visibleRect.height > 0 ? visibleRect : null);
      } else {
        setTargetRect(null);
        // Bring hidden targets on screen (switch a tab, open the first lesson) once per reveal selector.
        for (const selector of [currentStep.reveal ?? []].flat()) {
          const key = `${currentStep.selector}|${selector}`;
          if (revealed.current.has(key)) continue;
          const trigger = document.querySelector<HTMLElement>(selector);
          if (!trigger) break;
          revealed.current.add(key);
          trigger.click();
          break;
        }
      }
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

  useLayoutEffect(() => {
    if (!enabled || !currentStep || !panelRef.current) return;
    const panel = panelRef.current;
    const frame = requestAnimationFrame(() => {
      const panelRect = panel.getBoundingClientRect();
      const margin = 20;
      const width = panelRect.width;
      const height = panelRect.height;
      const maxLeft = Math.max(margin, window.innerWidth - width - margin);
      const maxTop = Math.max(margin, window.innerHeight - height - margin);
      const clampLeft = (value: number) => Math.min(maxLeft, Math.max(margin, value));
      const clampTop = (value: number) => Math.min(maxTop, Math.max(margin, value));
      const target = targetRect ?? new DOMRect(window.innerWidth / 2, window.innerHeight / 2, 0, 0);
      const candidates = [
        { left: clampLeft(window.innerWidth - width - margin), top: target.bottom + margin },
        { left: margin, top: target.bottom + margin },
        { left: clampLeft(window.innerWidth - width - margin), top: target.top - height - margin },
        { left: margin, top: target.top - height - margin },
        { left: target.right + margin, top: clampTop(target.top) },
        { left: target.left - width - margin, top: clampTop(target.top) },
        { left: clampLeft(window.innerWidth - width - margin), top: clampTop(window.innerHeight - height - margin) },
        { left: margin, top: margin },
      ].map(position => ({ left: clampLeft(position.left), top: clampTop(position.top) }));
      const overlap = (position: { left: number; top: number }) => {
        if (!targetRect) return 0;
        const overlapWidth = Math.max(0, Math.min(position.left + width, targetRect.right) - Math.max(position.left, targetRect.left));
        const overlapHeight = Math.max(0, Math.min(position.top + height, targetRect.bottom) - Math.max(position.top, targetRect.top));
        return overlapWidth * overlapHeight;
      };
      const best = candidates.find(position => overlap(position) === 0) ?? candidates.reduce((bestPosition, position) => overlap(position) < overlap(bestPosition) ? position : bestPosition);
      setPanelPosition(best);
    });
    return () => cancelAnimationFrame(frame);
  }, [currentStep, enabled, targetRect]);

  if (!enabled || !guide || !currentStep) return null;
  const dismiss = () => {
    safeSet(sessionStorage, `greenlearn.${storagePrefix}-guide.dismissed.${userId}`, "true");
    setEnabled(false);
  };
  const permanentlyDisable = () => {
    safeSet(localStorage, `greenlearn.${storagePrefix}-guide.disabled.${userId}`, "true");
    setConfirmPermanentOptOut(false);
    setEnabled(false);
  };
  const finishRoute = () => {
    const key = `greenlearn.${storagePrefix}-guide.done.${userId}`;
    let done: string[] = [];
    try { done = JSON.parse(safeGet(sessionStorage, key) ?? "[]") as string[]; } catch { done = []; }
    safeSet(sessionStorage, key, JSON.stringify([...new Set([...done, guide.id])]));
    setEnabled(false);
  };
  const next = () => stepIndex + 1 >= guide.steps.length ? finishRoute() : setStepIndex(value => value + 1);
  const pointerLeft = targetRect ? Math.min(window.innerWidth - 36, Math.max(36, targetRect.left + targetRect.width / 2)) : 36;
  const pointerTop = targetRect ? targetRect.top > 82 ? targetRect.top - 48 : targetRect.bottom + 8 : 90;

  return <>
    <div className="instructor-guide__scrim" aria-hidden="true" />
    {targetRect && <div className="instructor-guide__spotlight" style={{ left: targetRect.left - 6, top: targetRect.top - 6, width: targetRect.width + 12, height: targetRect.height + 12 }} aria-hidden="true" />}
    {targetRect && <div className="instructor-guide__pointer" style={{ left: pointerLeft, top: pointerTop }} aria-hidden="true"><MousePointer2 size={21} /><span>THIS WAY</span></div>}
    <section ref={panelRef} className="instructor-guide__panel" style={{ top: panelPosition.top, left: panelPosition.left, right: "auto", bottom: "auto" }} role="dialog" aria-modal="false" aria-labelledby="instructor-guide-title">
      <div className="instructor-guide__panel-top"><span>{label}</span><span className="instructor-guide__counter">{String(stepIndex + 1).padStart(2, "0")} / {String(guide.steps.length).padStart(2, "0")}</span><button type="button" onClick={dismiss} aria-label="Close guide"><X size={17} /></button></div>
      <div className="instructor-guide__progress" aria-hidden="true"><span style={{ width: `${((stepIndex + 1) / guide.steps.length) * 100}%` }} /></div>
      <h2 id="instructor-guide-title">{currentStep.title}</h2>
      <p>{currentStep.description}</p>
      {!targetRect && <small>{currentStep.hint ?? "Loading this part of your workspace…"}</small>}
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
        <h2 id="instructor-guide-confirm-title">Turn off this guide?</h2>
        <p id="instructor-guide-confirm-copy">If you continue, this guide will never appear again for your account, even if you have fewer than three courses. This can’t be undone here.</p>
        <div><button type="button" className="instructor-guide__confirm-cancel" onClick={() => setConfirmPermanentOptOut(false)}>Keep the guide</button><button type="button" className="instructor-guide__confirm-disable" onClick={permanentlyDisable}>Yes, turn it off</button></div>
      </section>
    </div>}
  </>;
}
