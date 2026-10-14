import { useEffect, useState } from "react";
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
import { useSetWeeklyLessonGoal, useStudentLearningPreferences } from "../../api/useStudentLearning";
import robotAsset from "../../../../Assets/ai-learning-robot.webp";
import journeyIllustration from "../../../../Assets/empty-learning-journey.webp";
import "./EmptyLearningState.css";

const benefits = [
  { title: "Learn at your pace", description: "Study anytime, anywhere that fits you.", icon: BookOpenCheck },
  { title: "Expert instructors", description: "Learn from industry professionals.", icon: UserRoundCheck },
  { title: "Track progress", description: "Monitor your growth and achievements.", icon: ChartNoAxesCombined },
  { title: "Get certified", description: "Earn certificates and boost your career.", icon: Award },
] as const;


const weeklyLessonGoalOptions = [4, 6, 8] as const;

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
          <h2 id="popular-topics-title">Available Courses</h2>
          <p>Published for your learning space</p>
        </div>
        <span className="empty-topics-card__count" aria-label={`${topics.length} courses available`}>
          {topics.length} courses
        </span>
      </header>
      <div className="empty-topics-card__grid" aria-label="Available courses">
        {topics.map((label) => (
          <span className="empty-topic" key={label}>
            <span className="empty-topic__icon" aria-hidden="true"><BookOpenCheck /></span>
            <span className="empty-topic__label">{label}</span>
          </span>
        ))}
        {topics.length === 0 ? <p>No published courses are available for this account yet.</p> : null}
      </div>
      <footer className="empty-topics-card__footer">
        <Link to="/explore" className="empty-side-link"><span>Explore courses</span><ArrowRight aria-hidden="true" /></Link>
      </footer>
    </article>
  );
}

export function AIRecommendationsCard() {
  return (
    <article className="empty-side-card empty-ai-card" aria-labelledby="ai-recommendations-title">
      <div className="empty-ai-card__copy">
        <span className="empty-ai-card__eyebrow" aria-hidden="true"><Bot /></span>
        <h2 id="ai-recommendations-title">Discover courses</h2>
        <p>Browse courses published for your account and academic placement.</p>
        <Link to="/explore" className="empty-ai-card__button"><Sparkles aria-hidden="true" /><span>Explore courses</span></Link>
      </div>
      <img className="empty-ai-card__robot" src={robotAsset} alt="Friendly GreenLearn AI learning guide robot" />
    </article>
  );
}

export function StudyPlanCard() {
  const preferences = useStudentLearningPreferences();
  const saveGoal = useSetWeeklyLessonGoal();
  const [weeklyLessons, setWeeklyLessons] = useState<number | null>(null);

  useEffect(() => {
    if (preferences.isSuccess) setWeeklyLessons(preferences.data.weeklyLessonGoal);
  }, [preferences.data, preferences.isSuccess]);

  const saveStudyGoal = () => {
    if (weeklyLessons === null || !preferences.data) return;
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
        <output>{weeklyLessons ?? "—"}</output>
        <span>lessons<br />per week</span>
      </div>
      <div
        className="empty-study-plan-card__meter"
        role="progressbar"
        aria-label={weeklyLessons === null ? "No weekly lesson goal selected" : `${weeklyLessons} lessons per week selected`}
        aria-valuemin={4}
        aria-valuemax={8}
          aria-valuenow={weeklyLessons ?? undefined}
      >
        {Array.from({ length: 8 }, (_, index) => (
          <span className={weeklyLessons !== null && index < weeklyLessons ? "is-active" : undefined} key={index} />
        ))}
      </div>
      <div className="empty-study-plan-card__options" aria-label="Weekly lesson goal">
        {weeklyLessonGoalOptions.map((lessons) => (
          <button
            key={lessons}
            type="button"
            className="empty-study-plan-card__option"
            aria-pressed={weeklyLessons === lessons}
            disabled={preferences.isLoading || preferences.isError}
            onClick={() => setWeeklyLessons(lessons)}
          >
            {lessons}
          </button>
        ))}
      </div>
      <footer className="empty-study-plan-card__footer">
        <span className="empty-study-plan-card__availability"><Clock3 aria-hidden="true" /><span>{preferences.isLoading ? "Loading saved goal" : preferences.data?.weeklyLessonGoal == null ? "No saved goal" : "Saved to your account"}</span></span>
        <button type="button" className="empty-study-plan-card__save" disabled={weeklyLessons === null || preferences.isLoading || saveGoal.isPending || preferences.isError} onClick={saveStudyGoal}>
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
            <p>{isAuthenticated ? "You are not enrolled in a course yet. Explore courses published for your account." : "Sign in to view the courses available to your student account."}</p>
            {!isAuthenticated ? <Link className="empty-learning-main-card__primary-action" to="/auth/sign-in" state={{ from: "/" }}><Compass aria-hidden="true" /><span>Sign in to view courses</span></Link> : null}
            <Link className="empty-learning-main-card__secondary-action" to="/help"><span>How learning works</span><ArrowRight aria-hidden="true" /></Link>
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
