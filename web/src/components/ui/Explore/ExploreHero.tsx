import { ArrowRight, Bookmark, Star } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import anatomyOverlay from "../../../Assets/dashboard/my-courses-anatomy-overlay.png";
import heroBackground from "../../../Assets/dashboard/my-courses-hero-background.png";
import { HERO_PATH } from "./exploreData";

export function ExploreHero() {
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);

  return (
    <article
      className="explore-hero"
      aria-label={`Featured: ${HERO_PATH.title}`}
      style={{ backgroundImage: `url(${heroBackground})` }}
    >
      <div className="explore-hero__art" aria-hidden="true">
        <img
          src={anatomyOverlay}
          alt=""
          className="explore-hero__art-overlay-img"
        />
        <svg viewBox="0 0 520 320" preserveAspectRatio="xMidYMid meet">
          <g className="explore-hero__grid">
            <path d="M17 70H170M17 103H170M17 136H170M17 169H170M17 202H170M17 235H170M17 268H170M206 28V295M258 28V295M310 28V295M362 28V295M414 28V295M466 28V295" />
          </g>
          <g className="explore-hero__labels">
            <path d="M31 77H160M31 132H160M31 187H160" />
            <text x="34" y="68">SKELETAL SYSTEM</text>
            <text x="34" y="123">MUSCULAR SYSTEM</text>
            <text x="34" y="178">BODY STRUCTURE</text>
          </g>
          <g className="explore-hero__skeleton">
            <circle cx="350" cy="71" r="36" />
            <path d="M325 69h50M350 37v67M332 95l-23 35 18 15 23-20 23 20 18-15-23-35M350 107v59M327 136l-13 66M373 136l13 66M350 166l-28 85M350 166l28 85M317 205l-13 65M383 205l13 65" />
            <path d="M322 117q28 33 56 0M323 128q27 34 54 0M328 140q22 26 44 0" />
            <path d="M340 61h20M342 82h16" />
          </g>
          <g className="explore-hero__molecules">
            <circle cx="455" cy="77" r="8" />
            <circle cx="477" cy="96" r="5" />
            <circle cx="449" cy="116" r="6" />
            <path d="M460 83 473 92M472 100 454 112" />
            <circle cx="431" cy="181" r="6" />
            <circle cx="462" cy="190" r="9" />
            <path d="M437 183 453 188" />
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
          <button
            type="button"
            className="explore-hero__cta"
            onClick={() => navigate("/explore")}
          >
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
