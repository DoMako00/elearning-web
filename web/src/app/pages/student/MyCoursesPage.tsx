import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  CirclePlay,
  Clock3,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { CourseLibrary } from "../../../components/ui/CourseLibrary";

export function MyCoursesPage() {
  return (
    <section className="student-page student-page--courses" aria-labelledby="my-courses-title">
      <div className="my-courses-workspace">
        <header className="my-courses-heading">
          <div className="student-page-intro">
            <span>Learning space</span>
            <h1 id="my-courses-title">My Courses</h1>
            <p>Pick up where you left off.</p>
          </div>
          <div className="my-courses-heading__controls" aria-label="Course status controls">
            <div className="course-status-tabs" role="tablist" aria-label="Course status">
              <button type="button" className="course-status-tabs__tab is-active" role="tab" aria-selected="true">In progress <b>4</b></button>
              <button type="button" className="course-status-tabs__tab" role="tab" aria-selected="false">Completed <b>2</b></button>
              <button type="button" className="course-status-tabs__tab" role="tab" aria-selected="false">Saved <b>3</b></button>
            </div>
            <button type="button" className="course-sort" aria-label="Sort courses by last opened">
              <Clock3 aria-hidden="true" /> Last opened <ChevronDown aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="my-courses-overview">
          <article className="course-focus-card" aria-label="Continue Advanced UI UX Design">
            <div className="course-focus-card__art" aria-hidden="true">
              <svg viewBox="0 0 520 320" preserveAspectRatio="xMidYMid meet">
                <g className="course-focus-card__grid"><path d="M26 273H188M31 290H204M48 306H221M42 257H169" /><path d="M77 227V45H267V227H77Z" /><path d="M77 77H267M110 45V77M238 45V77" /><circle cx="103" cy="61" r="4" /><circle cx="120" cy="61" r="4" /><circle cx="137" cy="61" r="4" /></g>
                <text x="91" y="174">UI</text><text x="91" y="251">UX</text>
                <g className="course-focus-card__pen"><path d="M355 84 398 44 441 84 399 171Z" /><circle cx="398" cy="102" r="12" /><path d="M398 44V21M355 84 326 69M441 84 470 69M398 171V203" /></g>
                <g className="course-focus-card__shapes"><rect x="310" y="35" width="15" height="15" rx="2" /><rect x="457" y="199" width="48" height="48" rx="7" /><path d="m295 212 30 36-14 7 15 28-22-4-12 14-6-31-20 2 17-16-15-22Z" /><path d="M300 59h100" /><circle cx="300" cy="59" r="7" /><circle cx="400" cy="59" r="7" /><circle cx="450" cy="59" r="7" /><path d="M450 59h24" /></g>
                <g className="course-focus-card__spark"><path d="M36 25v15M28 32h16M284 5v13M277 11h14M478 16v15M470 23h16M292 205v15M284 212h16M493 117v15M485 124h16" /></g>
              </svg>
            </div>
            <div className="course-focus-card__content">
              <span className="course-focus-card__status">In progress</span>
              <h2>Advanced UI/UX Design</h2>
              <p className="course-focus-card__lesson">Lesson 6 of 12</p>
              <div className="course-focus-card__progress"><i><b /></i><strong>60%</strong></div>
              <div className="course-focus-card__instructor"><span>AM</span><div><b>Alex Morgan</b><small>Lead Product Designer</small></div></div>
            </div>
            <button type="button" className="course-focus-card__play" aria-label="Play Advanced UI UX Design"><CirclePlay aria-hidden="true" /></button>
            <footer className="course-focus-card__footer"><div><small>Next lesson</small><b>Design Systems &amp; Components</b></div><button type="button">Resume lesson <ArrowRight aria-hidden="true" /></button></footer>
          </article>
          <div className="my-courses-overview__summaries">
            <article className="course-summary course-summary--week"><header><h2>This week</h2><CalendarDays aria-hidden="true" /></header><div className="week-days"><span>Mon<b>12</b><small>2h planned</small></span><span className="is-current">Wed<b>14</b><small>2h planned</small></span><span>Fri<b>16</b><small>2h planned</small></span></div><footer><Clock3 aria-hidden="true" /><b>6h planned</b><span>Focus. Learn. Grow.</span></footer></article>
            <article className="course-summary course-summary--pace"><header><div><h2>Your pace</h2><strong>68%</strong><small>Course completion</small></div><TrendingUp aria-hidden="true" /></header><svg className="pace-chart" viewBox="0 0 280 82" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="pace-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#38b96f" stopOpacity=".22" /><stop offset="1" stopColor="#38b96f" stopOpacity="0" /></linearGradient></defs><path className="pace-chart__fill" d="M0 64 C20 75 29 44 54 48 S82 29 102 42 S132 67 151 44 S179 19 202 34 S230 52 248 22 S266 23 280 12 V82 H0Z" /><path className="pace-chart__line" d="M0 64 C20 75 29 44 54 48 S82 29 102 42 S132 67 151 44 S179 19 202 34 S230 52 248 22 S266 23 280 12" /><circle cx="280" cy="12" r="5.5" /></svg><p><Sparkles aria-hidden="true" /> +12% this month</p></article>
          </div>
        </div>
        <CourseLibrary />
      </div>
    </section>
  );
}
