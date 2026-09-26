import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BookOpenCheck,
  Bot,
  CalendarCheck2,
  ChartNoAxesCombined,
  Check,
  Clock3,
  Compass,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";
import robotAsset from "../../../Assets/ai-learning-robot.webp";
import journeyIllustration from "../../../Assets/empty-learning-journey.webp";
import "./EmptyLearningState.css";

const benefits = [
  { title: "Learn at your pace", description: "Study anytime, anywhere that fits you.", icon: BookOpenCheck },
  { title: "Expert instructors", description: "Learn from industry professionals.", icon: UserRoundCheck },
  { title: "Track progress", description: "Monitor your growth and achievements.", icon: ChartNoAxesCombined },
  { title: "Get certified", description: "Earn certificates and boost your career.", icon: Award },
] as const;


const weeklyStudyHourOptions = [4, 6, 8] as const;
const weeklyStudyGoalStorageKey = "greenlearn-weekly-study-hours";

/** Temporary control until the corresponding product destinations are connected. */
function UnavailableAction({ children, className, ariaLabel, tooltip }: { children: ReactNode; className: string; ariaLabel?: string; tooltip?: string }) {
  return (
    <button
      type="button"
      className={className}
      disabled
      aria-label={ariaLabel}
      aria-description="This destination will be available when course exploration is connected."
      title={tooltip ?? "This destination will be available when course exploration is connected."}
    >
      {children}
    </button>
  );
}

export function LearningBenefits() {
  return (
    <section className="empty-learning-benefits" aria-label="Learning benefits">
      {benefits.map(({ title, description, icon: Icon }) => (
        <article className="empty-learning-benefit" key={title}>
          <span className="empty-learning-benefit__icon" aria-hidden="true"><Icon /></span>
          <h3>{title}</h3>
          <p>{description}</p>
        </article>
      ))}
    </section>
  );
}

export function PopularTopicsCard({ topics }: { topics: readonly string[] }) {
  return (
    <article className="empty-side-card empty-topics-card" aria-labelledby="popular-topics-title">
      <header className="empty-topics-card__header">
        <div>
          <h2 id="popular-topics-title">Popular Topics</h2>
          <p>Elite Year 1 starting point</p>
        </div>
        <span className="empty-topics-card__count" aria-label={`${topics.length} topics available`}>
          {topics.length} topics
        </span>
      </header>
      <div className="empty-topics-card__grid" aria-label="Popular learning topics">
        {topics.map((label) => (
          <span className="empty-topic" key={label}>
            <span className="empty-topic__icon" aria-hidden="true"><BookOpenCheck /></span>
            <span className="empty-topic__label">{label}</span>
          </span>
        ))}
        {topics.length === 0 ? <p>No published subjects are available for this placement yet.</p> : null}
      </div>
      <footer className="empty-topics-card__footer">
        <UnavailableAction className="empty-side-link"><span>Available placement subjects</span><ArrowRight aria-hidden="true" /></UnavailableAction>
      </footer>
    </article>
  );
}

export function AIRecommendationsCard() {
  return (
    <article className="empty-side-card empty-ai-card" aria-labelledby="ai-recommendations-title">
      <div className="empty-ai-card__copy">
        <span className="empty-ai-card__eyebrow" aria-hidden="true"><Bot /></span>
        <h2 id="ai-recommendations-title">Plan your medical study week</h2>
        <p>Start with Biochemistry, then review the rest of your Year 1 subjects as they become available.</p>
        <UnavailableAction className="empty-ai-card__button"><Sparkles aria-hidden="true" /><span>Study plan</span></UnavailableAction>
      </div>
      <img className="empty-ai-card__robot" src={robotAsset} alt="Friendly GreenLearn AI learning guide robot" />
    </article>
  );
}

export function StudyPlanCard() {
  const [weeklyStudyHours, setWeeklyStudyHours] = useState(() => {
    if (typeof window === "undefined") return 6;

    const storedHours = Number(window.localStorage.getItem(weeklyStudyGoalStorageKey));
    return weeklyStudyHourOptions.includes(storedHours as 4 | 6 | 8) ? storedHours : 6;
  });
  const [isSaved, setIsSaved] = useState(false);

  const selectWeeklyStudyHours = (hours: number) => {
    setWeeklyStudyHours(hours);
    setIsSaved(false);
  };

  const saveStudyGoal = () => {
    window.localStorage.setItem(weeklyStudyGoalStorageKey, String(weeklyStudyHours));
    setIsSaved(true);
  };

  return (
    <article className="empty-side-card empty-study-plan-card" aria-labelledby="study-plan-title">
      <header className="empty-study-plan-card__header">
        <div>
          <span className="empty-study-plan-card__eyebrow">Study rhythm</span>
          <h2 id="study-plan-title">Weekly study goal</h2>
        </div>
        <span className="empty-study-plan-card__icon" aria-hidden="true"><CalendarCheck2 /></span>
      </header>
      <p>Choose a pace that works with your semester.</p>
      <div className="empty-study-plan-card__value" aria-live="polite">
        <output>{weeklyStudyHours}</output>
        <span>hours<br />per week</span>
      </div>
      <div
        className="empty-study-plan-card__meter"
        role="progressbar"
        aria-label={`${weeklyStudyHours} hours per week selected`}
        aria-valuemin={4}
        aria-valuemax={8}
        aria-valuenow={weeklyStudyHours}
      >
        {Array.from({ length: 8 }, (_, index) => (
          <span className={index < weeklyStudyHours ? "is-active" : undefined} key={index} />
        ))}
      </div>
      <div className="empty-study-plan-card__options" aria-label="Weekly study hours">
        {weeklyStudyHourOptions.map((hours) => (
          <button
            key={hours}
            type="button"
            className="empty-study-plan-card__option"
            aria-pressed={weeklyStudyHours === hours}
            onClick={() => selectWeeklyStudyHours(hours)}
          >
            {hours}h
          </button>
        ))}
      </div>
      <footer className="empty-study-plan-card__footer">
        <span className="empty-study-plan-card__availability"><Clock3 aria-hidden="true" /><span>Flexible anytime</span></span>
        <button type="button" className="empty-study-plan-card__save" onClick={saveStudyGoal}>
          {isSaved ? <Check aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
          <span>{isSaved ? "Goal saved" : "Save goal"}</span>
        </button>
      </footer>
    </article>
  );
}

export function EmptyLearningState({ topics = [], isAuthenticated = false }: { topics?: readonly string[]; isAuthenticated?: boolean }) {
  return (
    <section className="empty-learning-state" aria-label="Start your learning journey">
      <article className="empty-learning-main-card">
        <div className="empty-learning-main-card__hero">
          <img className="empty-learning-main-card__art" src={journeyIllustration} alt="Green backpack with books and a small plant, ready for a new course" />
          <div className="empty-learning-main-card__copy">
            <h1>{isAuthenticated ? "Your learning journey is waiting" : "Welcome to GreenLearn"}</h1>
            <p>{isAuthenticated ? "You are not enrolled in a course yet. Your available placement subjects are shown below." : "Sign in to view the courses and subjects available to your student account."}</p>
            {!isAuthenticated ? <Link className="empty-learning-main-card__primary-action" to="/auth/sign-in" state={{ from: "/" }}><Compass aria-hidden="true" /><span>Sign in to view courses</span></Link> : null}
            <UnavailableAction className="empty-learning-main-card__secondary-action"><span>How learning works</span><ArrowRight aria-hidden="true" /></UnavailableAction>
          </div>
        </div>
        <LearningBenefits />
      </article>
      <aside className="empty-learning-state__aside" aria-label="Learning discovery">
        <PopularTopicsCard topics={topics} />
        <AIRecommendationsCard />
        <StudyPlanCard />
      </aside>
    </section>
  );
}
