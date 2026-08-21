import { ArrowRight, Bookmark, Star } from "lucide-react";
import { useState } from "react";
import { HERO_PATH } from "./exploreData";

export function ExploreHero() {
  const [isSaved, setIsSaved] = useState(false);

  return (
    <article className="explore-hero" aria-label={`Featured: ${HERO_PATH.title}`}>
      <div className="explore-hero__art" aria-hidden="true">
        <svg viewBox="0 0 460 340" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="atomOrbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#43e695" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#1ebd6b" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#0ba355" stopOpacity="0.15" />
            </linearGradient>
            <radialGradient id="nucleusGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6ef6b0" stopOpacity="1" />
              <stop offset="40%" stopColor="#25d37d" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#085430" stopOpacity="0" />

            </radialGradient>
            <filter id="glowBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g className="explore-hero__waves" stroke="#2dd273" strokeWidth="1" strokeOpacity="0.15">
            <path d="M 40,80 Q 180,40 320,120 T 440,240" />
            <path d="M 80,140 Q 220,100 340,180 T 460,280" />
            <path d="M 120,200 Q 260,160 380,240 T 480,320" />
            <path d="M 20,40 Q 140,20 280,80 T 420,180" />
          </g>

          <g transform="translate(260, 165)">
            <ellipse
              cx="0"
              cy="0"
              rx="125"
              ry="46"
              stroke="url(#atomOrbitGrad)"
              strokeWidth="2.4"
              filter="url(#glowBlur)"
              transform="rotate(0)"
            />
            <ellipse
              cx="0"
              cy="0"
              rx="125"
              ry="46"
              stroke="url(#atomOrbitGrad)"
              strokeWidth="2.4"
              filter="url(#glowBlur)"
              transform="rotate(60)"
            />
            <ellipse
              cx="0"
              cy="0"
              rx="125"
              ry="46"
              stroke="url(#atomOrbitGrad)"
              strokeWidth="2.4"
              filter="url(#glowBlur)"
              transform="rotate(120)"
            />

            <circle cx="0" cy="0" r="26" fill="url(#nucleusGlow)" />
            <circle cx="0" cy="0" r="13" fill="#6ef6b0" />
            <circle cx="0" cy="0" r="6" fill="#ffffff" />
          </g>
        </svg>
      </div>

      <div className="explore-hero__content">
        <div className="explore-hero__badges">
          <span className="explore-badge explore-badge--highlight">{HERO_PATH.badge1}</span>
          <span className="explore-badge explore-badge--subtle">{HERO_PATH.badge2}</span>
        </div>
        <h2 className="explore-hero__title">{HERO_PATH.title}</h2>
        <p className="explore-hero__desc">{HERO_PATH.description}</p>
        <div className="explore-hero__meta">
          <span>{HERO_PATH.level}</span>
          <span className="explore-hero__meta-dot">•</span>
          <span className="explore-hero__rating">
            <Star className="explore-hero__star-icon" aria-hidden="true" />
            {HERO_PATH.rating}
          </span>
          <span className="explore-hero__meta-dot">•</span>
          <span>{HERO_PATH.learners}</span>
        </div>

        <div className="explore-hero__instructors">
          <div className="explore-hero__avatars" aria-label="Course instructors">
            {HERO_PATH.avatars.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt=""
                className="explore-hero__avatar"
                loading="lazy"
              />
            ))}
          </div>
          <span className="explore-hero__instructors-count">{HERO_PATH.instructorsCount}</span>
        </div>

        <div className="explore-hero__actions">
          <button type="button" className="explore-hero__cta">
            Explore path <ArrowRight className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`explore-hero__bookmark ${isSaved ? "is-saved" : ""}`}
            onClick={() => setIsSaved(!isSaved)}
            aria-label={isSaved ? "Remove from saved paths" : "Save learning path"}
            aria-pressed={isSaved}
          >
            <Bookmark className={`size-4 ${isSaved ? "fill-current" : ""}`} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}
