import { useState } from "react";
import { BookOpen, BrainCircuit, Route, Sparkles, X, Clock } from "lucide-react";
import toast from "react-hot-toast";
import robotAsset from "../../../Assets/dashboard/doctor-robot.webp";
import "./AILearningGuide.css";

const suggestions = [
  { label: "Recommend a study path for me", icon: Route },
  { label: "Best resources for learning anatomy", icon: BookOpen },
  { label: "Explain the function of cranial nerves", icon: BrainCircuit },
] as const;

export function AILearningGuide() {
  const [showComingSoon, setShowComingSoon] = useState(false);

  return (
    <>
      <article className="ai-guide-card" aria-labelledby="ai-guide-title">
        <header className="ai-guide-header">
          <Sparkles className="ai-guide-sparkle-icon" aria-hidden="true" />
          <h2 id="ai-guide-title">AI Learning Guide</h2>
          <span className="ai-guide-beta">BETA</span>
        </header>
        <div className="ai-guide-content">
          <div className="ai-guide-copy">
            <div className="ai-guide-intro">
              <h3>
                Hi Juliana! <span className="ai-guide-wave" aria-hidden="true">👋</span>
              </h3>
              <p>I&apos;m your AI learning guide.</p>
              <p>What would you like to learn today?</p>
            </div>
            <div className="ai-guide-suggestions" aria-label="Learning guide suggestions">
              {suggestions.map(({ label, icon: Icon }) => (
                <button
                  type="button"
                  key={label}
                  className="ai-guide-suggestion-btn"
                  onClick={() => {
                    toast('🚀 AI Guide coming soon — stay tuned!', { icon: '✨' });
                    setShowComingSoon(true);
                  }}
                >
                  <Icon className="ai-guide-suggestion-icon" aria-hidden="true" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="ai-guide-art">
            <img
              className="ai-guide-robot"
              src={robotAsset}
              alt="AI learning guide robot"
              decoding="async"
            />
          </div>
        </div>
      </article>

      {/* Coming Soon Modal */}
      {showComingSoon && (
        <div
          className="coming-soon-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="coming-soon-title"
          onClick={() => setShowComingSoon(false)}
        >
          <div
            className="coming-soon-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="coming-soon-close"
              onClick={() => setShowComingSoon(false)}
              aria-label="Close"
            >
              <X aria-hidden="true" />
            </button>

            <div className="coming-soon-icon-wrap" aria-hidden="true">
              <Clock className="coming-soon-icon" />
            </div>

            <h3 id="coming-soon-title" className="coming-soon-title">
              Coming Soon
            </h3>
            <p className="coming-soon-body">
              The AI Learning Guide is currently in development. Stay tuned — it&apos;s going to be something special! 🚀
            </p>

            <button
              type="button"
              className="coming-soon-cta"
              onClick={() => setShowComingSoon(false)}
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
