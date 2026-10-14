import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { TopAppBar } from "../TopAppBar";
import { useScreenStack } from "../ScreenStack";
import {
  HeroBand,
  DocsOnlyBanner,
  SectionHeader,
  QuickActionTile,
  CourseCard,
  DocumentListRow,
  MobileWeeklyStudyGoal,
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
// Reusable screen stubs
import { AssignmentsScreen } from "./AssignmentsScreen";
import { HelpCenterScreen } from "./HelpCenterScreen";
import { listAllStudentCourses } from "../../../features/student/api/studentCoursesApi";
import { useStudentProfile, useStudentProgress, useStudentLearningPreferences } from "../../../features/student/api/useStudentLearning";
import { mapStudentCourseToCard } from "../shared/mapStudentCourse";

export const HomeScreen: React.FC = () => {
  const { push } = useScreenStack();
  const navigate = useNavigate();
  const profileQuery = useStudentProfile();
  const progressQuery = useStudentProgress();
  const preferencesQuery = useStudentLearningPreferences();
  const coursesQuery = useQuery({ queryKey: ["student", "courses", "mine"], queryFn: ({ signal }) => listAllStudentCourses({ view: "mine", signal }) });
  const progress = progressQuery.data;
  const goal = preferencesQuery.data?.weeklyLessonGoal ?? progress?.weeklyGoalLessons ?? null;
  const courses = useMemo(() => (coursesQuery.data ?? []).map((course) => mapStudentCourseToCard(course, progress?.courses.find((item) => item.courseId === course.courseId))), [coursesQuery.data, progress]);
  const recentActivity = progress?.recentActivity ?? [];
  const currentActivity = recentActivity[0];
  const activityCourse = currentActivity ? coursesQuery.data?.find((course) => course.courseId === currentActivity.courseId) : undefined;
  const currentActivityProgress = currentActivity ? progress?.courses.find((course) => course.courseId === currentActivity.courseId) : undefined;
  const handleOpenNotes = () => {
    if (currentActivity && activityCourse?.access.canOpen) {
      navigate(`/my-courses/${currentActivity.courseId}/lessons/${currentActivity.lessonId}`);
      return;
    }
    navigate("/my-courses");
  };
  const recentRows: DocumentItem[] = recentActivity.slice(0, 3).map((activity) => ({
    id: activity.lessonId,
    filename: activity.lessonTitle,
    extension: "lesson",
    courseTitle: activity.courseTitle,
    fileSize: activity.status === "completed" ? "Completed lesson" : "In progress",
    timestamp: new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(activity.occurredAt)),
  }));

  // Navigation handlers
  const handleOpenAssignments = () => {
    push({
      id: "assignments",
      title: "Assignments",
      tabRoot: "home", // Keeps Home tab visually active in BottomNav
      variant: "main",
      component: <AssignmentsScreen />,
    });
  };

  const handleOpenHelp = () => {
    push({
      id: "help-center",
      title: "Help Center",
      tabRoot: "home",
      variant: "main",
      component: <HelpCenterScreen />,
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
      {/* 1. Fixed TopAppBar main variant */}
      <TopAppBar variant="main" />

      {/* Main scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/* 1. HeroBand Section */}
        <HeroBand
          eyebrow="Good morning,"
          heading={profileQuery.data?.fullName ?? (profileQuery.isLoading ? "Loading your profile…" : "Student")}
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
          {/* 2. Continue Reading Card */}
          <div className="relative w-full bg-white rounded-3xl border border-slate-100/80 p-4 sm:p-5 shadow-xs overflow-hidden">
            <div className="flex items-start justify-between gap-2">
              {/* Left Details */}
              <div className="flex-1 min-w-0 pr-1">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold tracking-wider uppercase mb-1 border border-emerald-200/50">
                  {currentActivity?.status === "completed" ? "COMPLETED" : currentActivity ? "IN PROGRESS" : "NO RECENT ACTIVITY"}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  {currentActivity?.lessonTitle ?? (progressQuery.isLoading ? "Loading learning activity…" : "No recent lesson activity")}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {currentActivity?.courseTitle ?? "Completed lessons will appear here when recorded."}
                </p>

                {/* Document Progress */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-slate-600 font-semibold mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-600" />
                      {currentActivityProgress?.completedLessons ?? 0} of {currentActivityProgress?.totalLessons ?? 0} lessons
                    </span>
                    <span className="font-bold text-emerald-600">{currentActivityProgress?.completionPercent ?? 0}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${currentActivityProgress?.completionPercent ?? 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Existing illustration remains decorative; it is not course data. */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-50 overflow-hidden shrink-0 border border-slate-100/80">
                <img src={emptyLearningJourney} alt="" aria-hidden="true" className="w-full h-full object-contain p-2" />
              </div>
            </div>

            {/* Sub-row: Last opened note */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-medium">{currentActivity ? "Last learning activity" : "Activity status"}</p>
                  <p className="text-[10px] font-semibold text-slate-500 truncate">
                    {currentActivity?.lessonTitle ?? "No lesson progress recorded yet"}
                  </p>
                </div>
              </div>

              {/* Continue Reading Button */}
              <button
                type="button"
                onClick={() => currentActivity && activityCourse?.access.canOpen && navigate(`/my-courses/${currentActivity.courseId}/lessons/${currentActivity.lessonId}`)}
                disabled={!currentActivity || !activityCourse?.access.canOpen}
                className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <span>{currentActivity && activityCourse?.access.canOpen ? "Continue Learning" : "No lesson to continue"}</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
              </button>
            </div>
          </div>

          {/* 3. Quick Actions Section */}
          <section aria-label="Quick Actions">
            <SectionHeader
              title="Quick Actions"
              actionLabel="See all"
              onAction={() => handleOpenAssignments()}
            />
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              <QuickActionTile
                icon={<FileText className="w-5 h-5" strokeWidth={2} />}
                title="Recent Lesson"
                subtitle="Open your latest activity"
                onPress={handleOpenNotes}
              />
              <QuickActionTile
                icon={<Download className="w-5 h-5" strokeWidth={2} />}
                title="Resources"
                subtitle="Open course materials"
                onPress={() => navigate("/my-courses")}
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
              onAction={() => navigate("/my-courses")}
            />
            <div className="flex items-stretch gap-3">
              {coursesQuery.isLoading ? <p role="status" className="text-xs text-slate-500">Loading your courses…</p> : coursesQuery.isError ? <p role="alert" className="text-xs text-rose-700">Courses could not be loaded.</p> : courses.slice(0, 2).map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  layout="compact"
                  onClick={() => navigate(`/my-courses/${course.id}`)}
                />
              ))}
              {!coursesQuery.isLoading && !coursesQuery.isError && courses.length === 0 && <p className="text-xs text-slate-500">No enrolled courses yet.</p>}
            </div>
          </section>

          {/* 5. Weekly Study Goal Section */}
          <section aria-label="Weekly Study Goal">
            <SectionHeader
              title="Weekly Study Goal"
              actionLabel="Edit"
              onAction={() => navigate("/settings")}
            />
            <MobileWeeklyStudyGoal completedLessons={progress?.weeklyCompletedLessons ?? 0} targetLessons={goal} weekDays={progress?.weekDays ?? []} currentDate={new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo" }).format(new Date())} />
          </section>

          {/* 6. Recent Documents Section */}
          <section aria-label="Recent Documents">
            <SectionHeader
              title="Recent Learning"
              actionLabel="View courses"
              onAction={() => navigate("/my-courses")}
            />
            <div className="space-y-2.5">
              {recentRows.map((doc) => (
                <DocumentListRow
                  key={doc.id}
                  document={doc}
                  onClick={() => { const activity = recentActivity.find((item) => item.lessonId === doc.id); if (activity) navigate(`/my-courses/${activity.courseId}/lessons/${activity.lessonId}`); }}
                  onMoreClick={() => {
                    const activity = recentActivity.find((item) => item.lessonId === doc.id);
                    if (activity) navigate(`/my-courses/${activity.courseId}/lessons/${activity.lessonId}`);
                  }}
                  moreActionLabel="Open lesson"
                />
              ))}
              {!progressQuery.isLoading && recentRows.length === 0 && <p className="text-xs text-slate-500">No persisted learning activity yet.</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
