import { BookOpen, BrainCircuit, Route, Sparkles } from "lucide-react";
import robotAsset from "../../../Assets/dashboard/doctor-robot.webp";
import "./AILearningGuide.css";

const suggestions = [
  { label: "Recommend a study path for me", icon: Route },
  { label: "Explain the function of cranial nerves", icon: BrainCircuit },
  { label: "Best resources for learning anatomy", icon: BookOpen },
] as const;

export function AILearningGuide() {
  return (
    <article className="ai-guide-card" aria-labelledby="ai-guide-title">
      <header className="ai-guide-header">
        <Sparkles aria-hidden="true" />
        <h2 id="ai-guide-title">AI Learning Guide</h2>
        <span className="ai-guide-beta">BETA</span>
      </header>
      <div className="ai-guide-content">
        <div className="ai-guide-copy">
          <div className="ai-guide-intro">
            <h3>Hi Juliana! <span aria-hidden="true">👋</span></h3>
            <p>I&apos;m your AI learning guide.</p>
            <p>What would you like to learn today?</p>
          </div>
          <div className="ai-guide-suggestions" aria-label="Learning guide suggestions">
            {suggestions.map(({ label, icon: Icon }) => (
              <button type="button" key={label}>
                <Icon aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="ai-guide-art">
          <img
            className="ai-guide-robot"
            src={robotAsset}
            alt="Friendly GreenLearn doctor robot with a stethoscope"
            decoding="async"
          />
        </div>
      </div>
    </article>
  );
}
