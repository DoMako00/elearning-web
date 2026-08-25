import {
  ArrowRight,
  Bookmark,
  CalendarDays,
  ChevronDown,
  CirclePlay,
  Clock3,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from "recharts";
import { CourseLibrary } from "../../../components/ui/CourseLibrary";
import { SearchBar } from "../../../components/ui/SearchBar";
import heroBackground from "../../../Assets/dashboard/my-courses-hero-background.png";
import anatomyOverlay from "../../../Assets/dashboard/my-courses-anatomy-overlay.png";
import { useNavigate } from "react-router-dom";

const PACE_CHART_DATA = [10, 18, 14, 22, 19, 28, 24, 30, 27, 30, 32, 40, 70, 78, 60, 32, 55, 56, 60, 50, 63, 65, 67, 72, 70, 80];

function buildPacePoints(values: number[]) {
  return values.map((value, index) => ({ index, value }));
}

interface PaceCustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
}

function PaceCustomTooltip({ active, payload }: PaceCustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="pace-tooltip">
      {payload[0].value}%
    </div>
  );
}

export function MyCoursesPage() {
  const navigate = useNavigate();
  const pacePoints = buildPacePoints(PACE_CHART_DATA);

  return (
    <section className="student-page student-page--courses" aria-labelledby="my-courses-title">
      <div className="my-courses-workspace">
        <header className="my-courses-heading">
          <div className="my-courses-heading__controls" aria-label="Course status controls">
            <div className="course-status-tabs" role="tablist" aria-label="Course status">
              <button type="button" className="course-status-tabs__tab is-active" role="tab" aria-selected="true">In progress <b>4</b></button>
              <button type="button" className="course-status-tabs__tab" role="tab" aria-selected="false">Completed <b>2</b></button>
              <button type="button" className="course-status-tabs__tab" role="tab" aria-selected="false">Saved <b>3</b></button>
            </div>
            <button type="button" className="course-sort" aria-label="Sort courses by last opened">
              <Clock3 aria-hidden="true" /> Last opened <ChevronDown aria-hidden="true" />
            </button>
            <div className="my-courses-heading__search">
              <SearchBar />
            </div>
          </div>
        </header>

        <div className="my-courses-overview">
          <article
            className="course-focus-card"
            aria-label="Continue Human Anatomy I"
            style={{ backgroundImage: `url(${heroBackground})` }}
          >
            <div className="course-focus-card__art" aria-hidden="true">
              <img src={anatomyOverlay} alt="" />
              <svg viewBox="0 0 520 320" preserveAspectRatio="xMidYMid meet">
                <g className="course-focus-card__grid"><path d="M17 70H170M17 103H170M17 136H170M17 169H170M17 202H170M17 235H170M17 268H170M206 28V295M258 28V295M310 28V295M362 28V295M414 28V295M466 28V295" /></g>
                <g className="course-focus-card__labels"><path d="M31 77H160M31 132H160M31 187H160" /><text x="34" y="68">SKELETAL SYSTEM</text><text x="34" y="123">MUSCULAR SYSTEM</text><text x="34" y="178">BODY STRUCTURE</text></g>
                <g className="course-focus-card__skeleton"><circle cx="350" cy="71" r="36" /><path d="M325 69h50M350 37v67M332 95l-23 35 18 15 23-20 23 20 18-15-23-35M350 107v59M327 136l-13 66M373 136l13 66M350 166l-28 85M350 166l28 85M317 205l-13 65M383 205l13 65" /><path d="M322 117q28 33 56 0M323 128q27 34 54 0M328 140q22 26 44 0" /><path d="M340 61h20M342 82h16" /></g>
                <g className="course-focus-card__molecules"><circle cx="455" cy="77" r="8" /><circle cx="477" cy="96" r="5" /><circle cx="449" cy="116" r="6" /><path d="M460 83 473 92M472 100 454 112" /><circle cx="431" cy="181" r="6" /><circle cx="462" cy="190" r="9" /><path d="M437 183 453 188" /></g>
              </svg>
            </div>
            <div className="course-focus-card__content">
              <span className="course-focus-card__status">In progress</span>
              <h2>Human Anatomy I</h2>
              <p className="course-focus-card__subtitle">Structure &amp; Organization</p>
              <p className="course-focus-card__lesson">Lesson 6 of 12</p>
              <div className="course-focus-card__progress"><i><b /></i><strong>60%</strong></div>
              <div className="course-focus-card__instructor"><span>AH</span><div><b>Dr. Ahmed Hassan</b><small>Professor of Anatomy</small></div></div>
            </div>
            <button type="button" className="course-focus-card__play" aria-label="Play Human Anatomy I"><CirclePlay aria-hidden="true" /></button>
            <footer className="course-focus-card__footer"><div><small>Course overview</small><b>Foundations of the human body</b></div><div className="course-focus-card__actions"><button type="button" className="course-focus-card__bookmark" aria-label="Save Human Anatomy I"><Bookmark aria-hidden="true" /></button><button type="button" onClick={() => navigate("/my-courses/human-anatomy-i")}>Continue Lesson <ArrowRight aria-hidden="true" /></button></div></footer>
          </article>
          <div className="my-courses-overview__summaries">
            <article className="course-summary course-summary--week">
              <header>
                <h2>This week</h2>
                <CalendarDays aria-hidden="true" />
              </header>
              <div className="week-days">
                <span>Mon<b>12</b><small>2h planned</small></span>
                <span className="is-current">Wed<b>14</b><small>2h planned</small></span>
                <span>Fri<b>16</b><small>2h planned</small></span>
              </div>
              <footer>
                <Clock3 aria-hidden="true" />
                <b>6h planned</b><span>Focus. Learn. Grow.</span>
              </footer>
            </article>
            <article className="course-summary course-summary--pace">
              <header>
                <div>
                  <h2>Your pace</h2>
                  <strong>68%</strong>
                  <small>Course completion</small>
                </div>
                <TrendingUp aria-hidden="true" />
              </header>
              <div className="pace-chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={pacePoints}
                    margin={{ top: 8, right: 4, bottom: 0, left: 4 }}
                  >
                    <defs>
                      <linearGradient id="paceFillGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#24ad68" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#24ad68" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <YAxis domain={[0, 100]} hide width={0} />
                    <Tooltip content={<PaceCustomTooltip />} cursor={false} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#24ad68"
                      strokeWidth={2.5}
                      fill="url(#paceFillGradient)"
                      dot={false}
                      activeDot={{
                        r: 5,
                        fill: "#24ad68",
                        stroke: "#fff",
                        strokeWidth: 2,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p>
                <Sparkles aria-hidden="true" />
                +12% this month
              </p>
            </article>
          </div>
        </div>
        <CourseLibrary />
      </div>
    </section>
  );
}
