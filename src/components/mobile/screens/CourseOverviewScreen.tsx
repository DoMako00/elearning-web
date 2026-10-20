import React, { useMemo, useState } from "react";
import { useToast } from "../../../hooks/useToast";
import { useNavigate, useParams } from "react-router-dom";
import {
  FileText,
  Lock,
  PlusCircle,
  MessageSquare,
  BookOpen,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  Send,
  MoreVertical,
} from "lucide-react";
import { TopAppBar } from "../TopAppBar";
import { DocumentListRow } from "../shared/DocumentListRow";
import { MobileToast } from "../shared/MobileToast";
import type { DocumentItem } from "../shared";
import { useStudentCourseDetail } from "../../../features/student/api/useStudentCourses";
import { useStudentProgress } from "../../../features/student/api/useStudentLearning";

export const CourseOverviewScreen: React.FC = () => {
  const navigate = useNavigate();
  const { slug: courseId = "" } = useParams<{ slug?: string }>();
  const courseQuery = useStudentCourseDetail(courseId);
  const progressQuery = useStudentProgress();
  const course = courseQuery.data;
  const progress = progressQuery.data?.courses.find((item) => item.courseId === courseId);
  const modules = useMemo(() => course?.chapters.map((chapter, chapterIndex) => ({
    id: chapter.chapterId,
    number: chapterIndex + 1,
    title: chapter.title,
    lessons: chapter.lessons.map((lesson, lessonIndex) => ({
      id: lesson.lessonId,
      number: lessonIndex + 1,
      title: lesson.title,
      isCompleted: lesson.progressStatus === "completed",
      resourceTitle: lesson.resourceTitle,
      resourceType: lesson.resourceType,
      resourceId: lesson.resourceId,
      playbackAvailable: lesson.playbackAvailable,
    })),
  })) ?? [], [course]);
  const resources = useMemo<DocumentItem[]>(() => course?.chapters.flatMap((chapter) => chapter.lessons
    .filter((lesson) => lesson.resourceId)
    .map((lesson) => ({ id: lesson.lessonId, filename: lesson.resourceTitle ?? lesson.title, extension: lesson.resourceType ?? "resource", courseTitle: course.title, fileSize: lesson.playbackAvailable ? "Available through protected delivery" : "Not currently released", timestamp: "" }))) ?? [], [course]);
  const isEnrolled = course?.access.isEnrolled ?? false;

  // Local state for tabs, accordion, discussion, toast
  const [activeTab, setActiveTab] = useState<"syllabus" | "resources" | "discussion">("syllabus");
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  const { toastMessage, toastTone, showToast } = useToast(2500);

  const toggleModule = (modId: string) => {
    setExpandedModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  const percentage = isEnrolled
    ? (progress?.completionPercent ?? 0)
    : 0;

  if (courseQuery.isLoading) {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex flex-col text-slate-900 antialiased">
        <TopAppBar variant="detail" title="Course" backLabel="My Courses" onBack={() => navigate("/my-courses")} />
        <div className="flex-1 p-8 text-center text-sm text-slate-500" role="status">Loading course details…</div>
      </div>
    );
  }
  if (courseQuery.isError || !course) {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex flex-col text-slate-900 antialiased">
        <TopAppBar variant="detail" title="Course" backLabel="My Courses" onBack={() => navigate("/my-courses")} />
        <div className="flex-1 p-8 text-center text-sm text-rose-700" role="alert">{courseQuery.error instanceof Error ? courseQuery.error.message : "Course details could not be loaded."}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col text-slate-900 antialiased">
      <MobileToast message={toastMessage} tone={toastTone} />

      {/* 1. Detail TopAppBar */}
      <TopAppBar
        variant="detail"
        title={course.title}
        backLabel={isEnrolled ? "My Courses" : "Explore"}
        onBack={() => navigate(isEnrolled ? "/my-courses" : "/explore")}
        rightSlot={
          <button
            type="button"
            disabled
            title="Course options are not available."
            aria-label="Course options"
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-xl transition-colors cursor-not-allowed opacity-50"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        }
      />

      {/* Main scrollable body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-lg mx-auto w-full pb-16">

        {/* 2. Course Hero Banner */}
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-2xs">
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              {isEnrolled ? (
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold tracking-wider uppercase border border-emerald-200/50">
                  ENROLLED
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-extrabold tracking-wider uppercase border border-amber-200/60">
                  <Lock className="w-3 h-3" />
                  NOT ENROLLED
                </span>
              )}
              <span className="text-[11px] font-semibold text-slate-400">
                {course.lessonCount} lessons
              </span>
            </div>

            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
                {course.title}
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {course.academicUnit.label} · {course.academicInstitution.name} · {course.academicLevel.title} · {course.academicSemester.title}
              </p>
            </div>

            {/* Progress bar if enrolled */}
            {isEnrolled ? (
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    {progress?.completedLessons ?? 0} of {course.lessonCount} lessons completed
                  </span>
                  <span className="text-emerald-600 font-bold">{percentage}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled
                  className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed border border-slate-200"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Enroll to access document library</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 3. Instructor Row */}
        <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center ring-2 ring-emerald-200 shrink-0">
              <BookOpen className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                Course teaching team
              </h3>
              <p className="text-[10.5px] text-slate-500 truncate font-medium">
                Instructor details are not included in the current course data.
              </p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                Course structure and access are provided by the learning API.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/messages")}
            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center gap-1.5 border border-emerald-200/80 transition-colors shrink-0 cursor-pointer shadow-2xs"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Message</span>
          </button>
        </div>

        {/* 4. Course Workspace Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab("syllabus")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
              activeTab === "syllabus"
                ? "bg-white text-emerald-800 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Syllabus
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("resources")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
              activeTab === "resources"
                ? "bg-white text-emerald-800 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Resources ({resources.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("discussion")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
              activeTab === "discussion"
                ? "bg-white text-emerald-800 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Discussion
          </button>
        </div>

        {/* Tab 1: Syllabus / Modules List */}
        {activeTab === "syllabus" && (
          <div className="space-y-3">
            {modules.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 text-xs text-slate-400 font-medium">
                Syllabus reading modules will be published shortly.
              </div>
            ) : (
              modules.map((mod) => {
                const isExpanded = Boolean(expandedModules[mod.id]);
                return (
                  <div
                    key={mod.id}
                    className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-2xs"
                  >
                    {/* Accordion Header */}
                    <button
                      type="button"
                      onClick={() => toggleModule(mod.id)}
                      className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
                            Chapter {mod.number}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {mod.lessons.length} lessons
                          </span>
                        </div>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 mt-1 truncate">
                          {mod.title}
                        </h3>
                      </div>

                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </button>

                    {/* Accordion Lesson List */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 divide-y divide-slate-100 bg-slate-50/50">
                        {mod.lessons.map((lesson) => (
                          <button
                            key={lesson.id}
                            type="button"
                            onClick={() => {
                              if (!course.access.canOpen) {
                                showToast("This course is not currently available to your account.", "info");
                                return;
                              }
                              if (!lesson.playbackAvailable) {
                                showToast("This lesson hasn't been released yet.", "info");
                                return;
                              }
                              navigate(`/my-courses/${course.courseId}/lessons/${lesson.id}`);
                            }}
                            className={`w-full p-3.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                              isEnrolled ? "hover:bg-emerald-50/40" : "opacity-75"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {lesson.isCompleted ? (
                                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                              ) : (
                                <Circle className="w-4.5 h-4.5 text-slate-300 shrink-0" />
                              )}
                              <div className="min-w-0 flex-1">
                                <h4 className="text-xs font-bold text-slate-800 truncate leading-snug">
                                  {lesson.title}
                                </h4>
                                <p className="text-[10.5px] text-slate-400 mt-0.5 flex items-center gap-2">
                                  <span className="flex items-center gap-1">
                                    Lesson {lesson.number}
                                  </span>
                                  <span>·</span>
                                  <span className="text-emerald-700 font-semibold truncate">
                                    {lesson.resourceTitle ?? "No resource attached"}
                                  </span>
                                </p>
                              </div>
                            </div>

                            <span className="text-[10.5px] font-bold text-emerald-700 hover:text-emerald-800 shrink-0">
                              Open lesson →
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Course Resources List */}
        {activeTab === "resources" && (
          <div className="space-y-3">
            {resources.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 text-xs text-slate-400 font-medium">
                No supplementary resources uploaded yet.
              </div>
            ) : (
              resources.map((res) => (
                <DocumentListRow
                  key={res.id}
                  document={res}
                  onClick={() => {
                    if (!course.access.canOpen) {
                      showToast("This course is not currently available to your account.", "info");
                      return;
                    }
                    navigate(`/my-courses/${course.courseId}/lessons/${res.id}`);
                  }}
                />
              ))
            )}
          </div>
        )}

        {/* Tab 3: Course Discussion Workspace */}
        {activeTab === "discussion" && (
          <div className="space-y-3">
            {/* New post composer */}
            <form
              onSubmit={(event) => event.preventDefault()}
              className="bg-white rounded-3xl border border-slate-100 p-3.5 shadow-2xs space-y-2.5"
            >
              <h4 className="text-xs font-bold text-slate-900">Course discussion</h4>
              <p className="text-xs text-slate-500">Discussion is not enabled for this course.</p>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled
                  className="px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 bg-slate-100 text-slate-400 cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Unavailable</span>
                </button>
              </div>
            </form>

            {/* Posts feed */}
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 text-xs text-slate-400 font-medium">
              Course discussion is not available for this course yet.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
