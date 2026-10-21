import type { CSSProperties } from "react";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import learningScene from "../../../../Assets/dashboard/learning-scene.png";
import mintBackground from "../../../../Assets/dashboard/mint-background.svg";
import bookIcon from "../../../../Assets/dashboard/book-icon.svg";
import calendarIcon from "../../../../Assets/dashboard/calendar-icon.svg";
import "./LearningSpaceCard.css";

const bookMask: CSSProperties = {
  maskImage: `url("${bookIcon}")`,
  WebkitMaskImage: `url("${bookIcon}")`,
};

const calendarMask: CSSProperties = {
  maskImage: `url("${calendarIcon}")`,
  WebkitMaskImage: `url("${calendarIcon}")`,
};

export function LearningSpaceCard({ onOpenLegacyGuide }: { onOpenLegacyGuide: () => void }) {
  return (
    <article className="learning-space-card" aria-labelledby="learning-space-title">
      <img className="learning-space-card__background" src={mintBackground} alt="" aria-hidden="true" />

      <div className="learning-space-card__content">
        <header className="learning-space-card__header">
          <span className="learning-space-card__book-icon" style={bookMask} aria-hidden="true" />
          <h2 id="learning-space-title">Your Learning Space</h2>
          <button type="button" className="learning-space-card__ai-link" onClick={onOpenLegacyGuide}>
            <Sparkles aria-hidden="true" />
            <span>AI Guide</span>
          </button>
        </header>

        <div className="learning-space-card__copy">
          <h3>
            <span>A little focus.</span>
            <span>A new possibility.</span>
          </h3>
          <p>Find your courses and make room for learning.</p>
        </div>

        <nav className="learning-space-card__actions" aria-label="Learning space">
          <Link className="learning-space-card__action learning-space-card__action--primary" to="/my-courses">
            <span className="learning-space-card__action-icon" style={bookMask} aria-hidden="true" />
            <span>My Courses</span>
          </Link>
          <Link className="learning-space-card__action learning-space-card__action--secondary" to="/calendar">
            <span className="learning-space-card__action-icon" style={calendarMask} aria-hidden="true" />
            <span>Calendar</span>
          </Link>
        </nav>
      </div>

      <div className="learning-space-card__art" aria-hidden="true">
        <img src={learningScene} alt="" decoding="async" />
      </div>
    </article>
  );
}
