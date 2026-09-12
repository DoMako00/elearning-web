import React from "react";
import { TopAppBar } from "../TopAppBar";
import { useScreenStack } from "../ScreenStack";
import {
  HeroBand,
  DocsOnlyBanner,
  SectionHeader,
  QuickActionTile,
  CourseCard,
  DocumentListRow,
  type CourseCardData,
  type DocumentItem,
} from "../shared";
import {
  FileText,
  Download,
  CalendarCheck,
  HelpCircle,
  ArrowRight,
  BookOpen,
} from "lucide-react";

// Existing illustration and course images from desktop LMS
import emptyLearningJourney from "../../../Assets/empty-learning-journey.webp";
import courseAnatomyImage from "../../../Assets/dashboard/human-anatomy.webp";
import fireAsset from "../../../Assets/fire.webp";

// Reusable screen stubs
import { AssignmentsStubScreen } from "./HomeScreens";
import { HelpCenterStubScreen } from "./MoreDetailScreens";
import { SHARED_COURSES_DATA } from "../data/courses.data";

// Mock courses matching desktop data (first two for Home compact display)
const MOCK_HOME_COURSES: CourseCardData[] = SHARED_COURSES_DATA.slice(0, 2);

// Mock recent documents matching prompt and screenshot
const MOCK_RECENT_DOCS: DocumentItem[] = [
  {
    id: "doc-1",
    filename: "Brachial Plexus Diagram.pdf",
    extension: "pdf",
    courseTitle: "Human Anatomy I",
    fileSize: "1.2 MB",
    timestamp: "10:32 AM",
  },
  {
    id: "doc-2",
    filename: "Upper Limb Anatomy Guide.pptx",
    extension: "pptx",
    courseTitle: "Human Anatomy I",
    fileSize: "5.8 MB",
    timestamp: "Yesterday",
  },
];

// Weekly goal math & days matching desktop's WeeklyGoalCard (2 * PI * r)
const RING_SIZE = 100;
const RING_RADIUS = 40;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

interface DayBarConfig {
  day: string;
  fillPct: number; // 0 to 100 height fill
  isToday?: boolean;
}

const WEEK_DAYS: DayBarConfig[] = [
  { day: "S", fillPct: 60 },
  { day: "M", fillPct: 80 },
  { day: "T", fillPct: 45 },
  { day: "W", fillPct: 100, isToday: true },
  { day: "T", fillPct: 35 },
  { day: "F", fillPct: 85 },
  { day: "S", fillPct: 50 },
];

export const HomeScreen: React.FC = () => {
  const { push } = useScreenStack();

  // Navigation handlers
  const handleOpenAssignments = () => {
    push({
      id: "assignments",
      title: "Assignments",
      tabRoot: "home", // Keeps Home tab visually active in BottomNav
      variant: "main",
      component: <AssignmentsStubScreen />,
    });
  };

  const handleOpenHelp = () => {
    push({
      id: "help-center",
      title: "Help Center",
      tabRoot: "home",
      variant: "detail",
      backLabel: "Home",
      component: <HelpCenterStubScreen />,
    });
  };

  const handleOpenDocumentReader = (docTitle: string) => {
    push({
      id: `doc-${docTitle}`,
      title: docTitle,
      tabRoot: "home",
      variant: "detail",
      backLabel: "Home",
      component: (
        <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
          <TopAppBar
            variant="detail"
            title={docTitle}
            backLabel="Home"
            onBack={() => window.history.back()}
          />
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <DocsOnlyBanner variant="full" />
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 shadow-xs">
              <h2 className="text-base font-bold text-slate-900">{docTitle}</h2>
              <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto">
                Interactive mobile document reader with markdown and PDF annotations will render here.
              </p>
              <span className="mt-4 inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                Document Viewer Stub
              </span>
            </div>
          </div>
        </div>
      ),
    });
  };

  const handleNotesStub = () => {
    handleOpenDocumentReader("My Study Notes");
  };

  const handleDownloadsStub = () => {
    handleOpenDocumentReader("Offline Downloads");
  };

  // Weekly goal calculations
  const completedHours = 9;
  const targetHours = 12;
  const goalPercentage = Math.round((completedHours / targetHours) * 100);
  const progressOffset = RING_CIRCUMFERENCE * (1 - Math.min(goalPercentage, 100) / 100);

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
      {/* 1. Fixed TopAppBar main variant */}
      <TopAppBar variant="main" />

      {/* Main scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/* 1. HeroBand Section */}
        <HeroBand
          eyebrow="Good morning,"
          heading="Juliana"
          subtitle="Keep learning, keep growing."
          banner={<DocsOnlyBanner variant="compact" />}
          illustration={
            <div className="relative w-36 h-28 sm:w-40 sm:h-32 flex items-center justify-end">
              {/* Soft decorative glow behind illustration */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-emerald-200/40 rounded-full blur-xl pointer-events-none" />
              <img
                src={emptyLearningJourney}
                alt="Green backpack and books"
                className="w-full h-full object-contain relative z-10 drop-shadow-sm select-none"
              />
            </div>
          }
        />

        <div className="px-4 pt-2 pb-8 space-y-6 max-w-lg mx-auto">
          {/* 2. Continue Reading Card (Home-specific hero card) */}
          <div className="relative w-full bg-white rounded-3xl border border-slate-100/80 p-4 sm:p-5 shadow-xs overflow-hidden">
            <div className="flex items-start justify-between gap-2">
              {/* Left Details */}
              <div className="flex-1 min-w-0 pr-1">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold tracking-wider uppercase mb-1 border border-emerald-200/50">
                  IN PROGRESS
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  Human Anatomy I
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Structure & Organization
                </p>

                {/* Document Progress */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-slate-600 font-semibold mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-600" />
                      6 of 12 documents
                    </span>
                    <span className="font-bold text-emerald-600">50%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: "50%" }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Skeleton/Anatomy Graphic */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-50 overflow-hidden shrink-0 border border-slate-100/80">
                <img
                  src={courseAnatomyImage}
                  alt="Human Anatomy skeleton and muscular system"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>

            {/* Sub-row: Last opened note */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-medium">Last opened today</p>
                  <p className="text-xs font-semibold text-slate-700 truncate">
                    Chapter 3: Muscular System Notes.pdf
                  </p>
                </div>
              </div>

              {/* Continue Reading Button */}
              <button
                type="button"
                onClick={() => handleOpenDocumentReader("Chapter 3: Muscular System Notes.pdf")}
                className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <span>Continue Reading</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
              </button>
            </div>
          </div>

          {/* 3. Quick Actions Section */}
          <section aria-label="Quick Actions">
            <SectionHeader
              title="Quick Actions"
              actionLabel="See all"
              onAction={() => handleNotesStub()}
            />
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              <QuickActionTile
                icon={<FileText className="w-5 h-5" strokeWidth={2} />}
                title="Notes"
                subtitle="View your study notes"
                onPress={handleNotesStub}
              />
              <QuickActionTile
                icon={<Download className="w-5 h-5" strokeWidth={2} />}
                title="Downloads"
                subtitle="Saved files offline"
                onPress={handleDownloadsStub}
              />
              <QuickActionTile
                icon={<CalendarCheck className="w-5 h-5" strokeWidth={2} />}
                title="Assignments"
                subtitle="View & submit"
                onPress={handleOpenAssignments}
              />
              <QuickActionTile
                icon={<HelpCircle className="w-5 h-5" strokeWidth={2} />}
                title="Help Center"
                subtitle="Get support"
                onPress={handleOpenHelp}
              />
            </div>
          </section>

          {/* 4. My Courses Section */}
          <section aria-label="My Courses">
            <SectionHeader
              title="My Courses"
              actionLabel="View all"
              onAction={() => {}}
            />
            <div className="flex items-stretch gap-3">
              {MOCK_HOME_COURSES.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  layout="compact"
                  onClick={() => handleOpenDocumentReader(`${course.title} Syllabus`)}
                />
              ))}
            </div>
          </section>

          {/* 5. Weekly Study Goal Section */}
          <section aria-label="Weekly Study Goal">
            <SectionHeader
              title="Weekly Study Goal"
              actionLabel="Edit"
              onAction={() => {}}
            />
            <div className="w-full bg-white rounded-3xl border border-slate-100/80 p-4 sm:p-5 shadow-xs flex items-center justify-between gap-4">
              {/* Left: SVG Progress Ring */}
              <div className="relative w-20 h-20 sm:w-22 sm:h-22 shrink-0 flex items-center justify-center">
                <svg
                  className="w-full h-full -rotate-90"
                  viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
                >
                  <circle
                    cx="50"
                    cy="50"
                    r={RING_RADIUS}
                    className="text-slate-100"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r={RING_RADIUS}
                    className="text-emerald-500 transition-all duration-700"
                    strokeWidth="8"
                    strokeDasharray={RING_CIRCUMFERENCE}
                    strokeDashoffset={progressOffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-base sm:text-lg font-black text-slate-900 leading-none">
                    {goalPercentage}%
                  </span>
                  <span className="text-[8.5px] text-slate-400 font-semibold mt-0.5">
                    weekly goal
                  </span>
                </div>
              </div>

              {/* Center: Hours text & Fire encouragement */}
              <div className="flex-1 min-w-0 pl-1">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                  {completedHours} / {targetHours} hours
                </h3>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs font-semibold text-slate-600">Keep it up!</span>
                  <img src={fireAsset} alt="fire icon" className="w-3.5 h-3.5 inline-block" />
                </div>
              </div>

              {/* Right: 7-bar mini chart */}
              <div className="flex items-end gap-1.5 shrink-0 h-14">
                {WEEK_DAYS.map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1.5">
                    <div className="w-2 sm:w-2.5 h-10 bg-slate-100 rounded-full flex flex-col justify-end overflow-hidden">
                      <div
                        className={`w-full rounded-full transition-all duration-300 ${
                          item.isToday ? "bg-emerald-600" : "bg-emerald-500/80"
                        }`}
                        style={{ height: `${item.fillPct}%` }}
                      />
                    </div>
                    <span
                      className={`text-[9.5px] leading-none font-bold ${
                        item.isToday ? "text-slate-900 font-extrabold" : "text-slate-400"
                      }`}
                    >
                      {item.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 6. Recent Documents Section */}
          <section aria-label="Recent Documents">
            <SectionHeader
              title="Recent Documents"
              actionLabel="View all"
              onAction={() => {}}
            />
            <div className="space-y-2.5">
              {MOCK_RECENT_DOCS.map((doc) => (
                <DocumentListRow
                  key={doc.id}
                  document={doc}
                  onClick={() => handleOpenDocumentReader(doc.filename)}
                  onMoreClick={() => {}}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
