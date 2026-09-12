import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TopAppBar } from "../TopAppBar";
import { DocsOnlyBanner } from "../shared/DocsOnlyBanner";
import { BookOpen, FileText, ArrowLeft, Lock, PlusCircle } from "lucide-react";
import { SHARED_COURSES_DATA } from "../data/courses.data";

// Fallback registry for explore-only courses (not enrolled)
const EXPLORE_ONLY_COURSES: Record<
  string,
  { title: string; subtitle: string; totalDocs: number; category: string }
> = {
  "clinical-pharmacology": {
    title: "Clinical Pharmacology",
    subtitle: "Drug Mechanisms & Therapy",
    totalDocs: 14,
    category: "Pharmacology",
  },
  "general-pathology": {
    title: "General Pathology",
    subtitle: "Disease & Injury Mechanisms",
    totalDocs: 16,
    category: "Pathology",
  },
};

export const MobileCourseOverviewStubScreen: React.FC = () => {
  const navigate = useNavigate();
  const { slug = "" } = useParams<{ slug?: string }>();

  // Lookup in enrolled courses
  const enrolledCourse = SHARED_COURSES_DATA.find((c) => c.slug === slug);
  const isEnrolled = Boolean(enrolledCourse);

  const exploreCourse = EXPLORE_ONLY_COURSES[slug];

  const title =
    enrolledCourse?.title ||
    exploreCourse?.title ||
    (slug ? slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "Course Overview");

  const subtitle =
    enrolledCourse?.subtitle ||
    exploreCourse?.subtitle ||
    "Medical curriculum study documents";

  const totalDocs = enrolledCourse?.totalDocs || exploreCourse?.totalDocs || 12;
  const completedDocs = enrolledCourse?.completedDocs || 0;
  const percentage = isEnrolled
    ? Math.round((completedDocs / Math.max(1, totalDocs)) * 100)
    : 0;

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col text-slate-900 antialiased">
      <TopAppBar
        variant="detail"
        title={title}
        backLabel={isEnrolled ? "My Courses" : "Explore"}
        onBack={() => navigate(isEnrolled ? "/my-courses" : "/explore")}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-lg mx-auto w-full pb-16">
        <DocsOnlyBanner variant="full" />

        {/* Course Header Summary Card */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            {isEnrolled ? (
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold tracking-wider uppercase border border-emerald-200/40">
                IN PROGRESS
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-extrabold tracking-wider uppercase border border-amber-200/60">
                <Lock className="w-3 h-3" />
                NOT ENROLLED
              </span>
            )}

            <span className="text-[11px] font-semibold text-slate-400">
              {totalDocs} documents
            </span>
          </div>

          <h1 className="text-lg font-bold text-slate-900 leading-tight">
            {title}
          </h1>
          <p className="text-xs text-slate-500 font-medium">{subtitle}</p>

          {isEnrolled ? (
            <>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-semibold">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  {completedDocs} of {totalDocs} documents completed
                </span>
                <span className="text-emerald-600 font-bold">{percentage}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </>
          ) : (
            <div className="pt-2 border-t border-slate-100">
              <p className="text-[11.5px] text-slate-500 font-medium leading-relaxed">
                Enrollment is required to access the document library, study notes, and assignments for this course.
              </p>
            </div>
          )}
        </div>

        {/* Content Placeholder Card */}
        <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">
            {isEnrolled ? "Course Overview & Modules" : "Course Syllabus Preview"}
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 max-w-xs mx-auto leading-relaxed">
            {isEnrolled
              ? "Full mobile course syllabus, reading chapters, document viewer, and study materials will render here."
              : "Full syllabus reading modules and document outlines will be unlocked once enrolled."}
          </p>
          <span className="mt-4 inline-block px-3.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
            Coming soon
          </span>
        </div>

        {/* Primary Action Button */}
        {isEnrolled ? (
          <button
            type="button"
            onClick={() => navigate("/my-courses")}
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Courses</span>
          </button>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              disabled
              className="w-full py-3 rounded-2xl bg-slate-100 text-slate-400 font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed border border-slate-200"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Enroll to access this course</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/explore")}
              className="w-full py-2.5 rounded-2xl bg-transparent text-emerald-700 hover:bg-emerald-50 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Explore</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
