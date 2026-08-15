import { useState, type ReactNode } from "react";
import {
  ArrowRight,
  Award,
  BookOpenCheck,
  Bot,
  CalendarCheck2,
  ChartNoAxesCombined,
  Check,
  Clock3,
  Code2,
  Compass,
  Sparkles,
  MonitorSmartphone,
  Palette,
  UserRoundCheck,
} from "lucide-react";
import robotAsset from "../../../Assets/ai-learning-robot.png";
import journeyIllustration from "../../../Assets/empty-learning-journey.png";
import "./EmptyLearningState.css";

const benefits = [
  { title: "Learn at your pace", description: "Study anytime, anywhere that fits you.", icon: BookOpenCheck },
  { title: "Expert instructors", description: "Learn from industry professionals.", icon: UserRoundCheck },
  { title: "Track progress", description: "Monitor your growth and achievements.", icon: ChartNoAxesCombined },
  { title: "Get certified", description: "Earn certificates and boost your career.", icon: Award },
] as const;

const topics = [
  { label: "Web Development", icon: Code2 },
  { label: "UI/UX Design", icon: Palette },
  { label: "Data Science", icon: ChartNoAxesCombined },
  { label: "Mobile Development", icon: MonitorSmartphone },
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

export function PopularTopicsCard() {
  return (
    <article className="empty-side-card empty-topics-card" aria-labelledby="popular-topics-title">
      <header className="empty-topics-card__header">
        <div>
          <h2 id="popular-topics-title">Popular Topics</h2>
          <p>Find your next learning path</p>
        </div>
        <span className="empty-topics-card__count" aria-label={`${topics.length} topics available`}>
          {topics.length} topics
        </span>
      </header>
      <div className="empty-topics-card__grid" aria-label="Popular learning topics">
        {topics.map(({ label, icon: Icon }) => (
          <UnavailableAction className="empty-topic" ariaLabel={`${label} topic`} tooltip={label} key={label}>
            <span className="empty-topic__icon" aria-hidden="true"><Icon /></span>
            <span className="empty-topic__label">{label}</span>
            {label === "Web Development" ? <ArrowRight className="empty-topic__arrow" aria-hidden="true" /> : null}
          </UnavailableAction>
        ))}
      </div>
      <footer className="empty-topics-card__footer">
        <UnavailableAction className="empty-side-link"><span>Explore all topics</span><ArrowRight aria-hidden="true" /></UnavailableAction>
      </footer>
    </article>
  );
}

export function AIRecommendationsCard() {
  return (
    <article className="empty-side-card empty-ai-card" aria-labelledby="ai-recommendations-title">
      <div className="empty-ai-card__copy">
        <span className="empty-ai-card__eyebrow" aria-hidden="true"><Bot /></span>
        <h2 id="ai-recommendations-title">Continue Learning with AI</h2>
        <p>Get personalized course recommendations based on your interests and goals.</p>
        <UnavailableAction className="empty-ai-card__button"><Sparkles aria-hidden="true" /><span>Get Recommendations</span></UnavailableAction>
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

export function EmptyLearningState() {
  return (
    <section className="empty-learning-state" aria-label="Start your learning journey">
      <article className="empty-learning-main-card">
        <div className="empty-learning-main-card__hero">
          <img className="empty-learning-main-card__art" src={journeyIllustration} alt="Green backpack with books and a small plant, ready for a new course" />
          <div className="empty-learning-main-card__copy">
            <h1>Your learning journey is waiting</h1>
            <p>You haven&apos;t subscribed to any courses yet.<br />Let&apos;s find the perfect course to start your growth.</p>
            <UnavailableAction className="empty-learning-main-card__primary-action"><Compass aria-hidden="true" /><span>Explore Courses</span></UnavailableAction>
            <UnavailableAction className="empty-learning-main-card__secondary-action"><span>How learning works</span><ArrowRight aria-hidden="true" /></UnavailableAction>
          </div>
        </div>
        <LearningBenefits />
      </article>
      <aside className="empty-learning-state__aside" aria-label="Learning discovery">
        <PopularTopicsCard />
        <AIRecommendationsCard />
        <StudyPlanCard />
      </aside>
    </section>
  );
}
