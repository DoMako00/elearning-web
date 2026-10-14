import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BookOpenCheck,
  Bot,
  CalendarCheck2,
  ChartNoAxesCombined,
  Clock3,
  Compass,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";
import { useSetWeeklyLessonGoal, useStudentLearningPreferences } from "../../../features/student/api/useStudentLearning";
import robotAsset from "../../../Assets/ai-learning-robot.webp";
import journeyIllustration from "../../../Assets/empty-learning-journey.webp";
import "./EmptyLearningState.css";

const benefits = [
  { title: "Learn at your pace", description: "Study anytime, anywhere that fits you.", icon: BookOpenCheck },
  { title: "Expert instructors", description: "Learn from industry professionals.", icon: UserRoundCheck },
  { title: "Track progress", description: "Monitor your growth and achievements.", icon: ChartNoAxesCombined },
  { title: "Get certified", description: "Earn certificates and boost your career.", icon: Award },
] as const;


const weeklyLessonGoalOptions = [4, 6, 8] as const;

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
  const preferences = useStudentLearningPreferences();
  const saveGoal = useSetWeeklyLessonGoal();
  const [weeklyLessons, setWeeklyLessons] = useState(4);

  useEffect(() => {
    if (preferences.data?.weeklyLessonGoal != null) setWeeklyLessons(preferences.data.weeklyLessonGoal);
  }, [preferences.data?.weeklyLessonGoal]);

  const saveStudyGoal = () => {
    saveGoal.mutate({ weeklyLessonGoal: weeklyLessons, expectedVersion: preferences.data?.version ?? null });
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
      <p>Set a weekly lesson-completion goal that works with your semester.</p>
      <div className="empty-study-plan-card__value" aria-live="polite">
        <output>{weeklyLessons}</output>
        <span>lessons<br />per week</span>
      </div>
      <div
        className="empty-study-plan-card__meter"
        role="progressbar"
        aria-label={`${weeklyLessons} lessons per week selected`}
        aria-valuemin={4}
        aria-valuemax={8}
        aria-valuenow={weeklyLessons}
      >
        {Array.from({ length: 8 }, (_, index) => (
          <span className={index < weeklyLessons ? "is-active" : undefined} key={index} />
        ))}
      </div>
      <div className="empty-study-plan-card__options" aria-label="Weekly lesson goal">
        {weeklyLessonGoalOptions.map((lessons) => (
          <button
            key={lessons}
            type="button"
            className="empty-study-plan-card__option"
            aria-pressed={weeklyLessons === lessons}
            onClick={() => setWeeklyLessons(lessons)}
          >
            {lessons}
          </button>
        ))}
      </div>
      <footer className="empty-study-plan-card__footer">
        <span className="empty-study-plan-card__availability"><Clock3 aria-hidden="true" /><span>{preferences.isLoading ? "Loading saved goal" : preferences.data?.weeklyLessonGoal == null ? "No saved goal" : "Saved to your account"}</span></span>
        <button type="button" className="empty-study-plan-card__save" disabled={preferences.isLoading || saveGoal.isPending || preferences.isError} onClick={saveStudyGoal}>
          <ArrowRight aria-hidden="true" />
          <span>{saveGoal.isPending ? "Saving…" : saveGoal.isSuccess ? "Goal saved" : "Save goal"}</span>
        </button>
      </footer>
      {preferences.isError || saveGoal.isError ? <p role="alert">Your weekly goal could not be saved. Please try again.</p> : null}
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
