import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TopAppBar } from "../TopAppBar";
import { ArrowLeft, BookOpen, Layers } from "lucide-react";
import { useStudentLearningPath } from "../../../features/student/api/useStudentLearning";

export const MobileLearningPathStubScreen: React.FC = () => {
  const navigate = useNavigate();
  const { slug = "" } = useParams<{ slug?: string }>();
  const pathQuery = useStudentLearningPath(slug);
  const path = pathQuery.data;
  const title = path?.path.title ?? "Learning path";

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col text-slate-900 antialiased">
      <TopAppBar
        variant="detail"
        title={title}
        backLabel="Explore"
        onBack={() => navigate("/explore")}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-lg mx-auto w-full pb-16">
        {pathQuery.isLoading && <p role="status" className="py-8 text-center text-sm text-slate-500">Loading learning path…</p>}
        {pathQuery.isError && <p role="alert" className="py-8 text-center text-sm text-rose-700">{pathQuery.error instanceof Error ? pathQuery.error.message : "Learning path could not be loaded."}</p>}

        {path && <>
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold tracking-wider uppercase border border-emerald-200/40">
              LEARNING PATH
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-extrabold tracking-wider uppercase">
              {path.path.courseCount} COURSES
            </span>
          </div>

          <h1 className="text-lg font-bold text-slate-900 leading-tight">
            {title}
          </h1>

          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            {path.path.description}
          </p>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              {path.path.levelTitle}
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              {path.path.courseCount} included courses
            </span>
          </div>
        </div>

        <section className="bg-white rounded-3xl border border-slate-100 p-5 shadow-2xs space-y-3" aria-labelledby="learning-path-courses-title">
          <h2 id="learning-path-courses-title" className="text-sm font-bold text-slate-900">Included courses</h2>
          {path.courses.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">No courses are currently included in this learning path.</p>
          ) : path.courses.map((course) => (
            <button key={course.courseId} type="button" onClick={() => navigate(`/my-courses/${course.courseId}`)} className="w-full p-3 rounded-2xl border border-slate-100 hover:border-emerald-200 text-left flex items-center gap-3 transition-colors">
              <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center"><BookOpen className="w-4 h-4" /></span>
              <span className="min-w-0 flex-1"><span className="block text-xs font-bold text-slate-900 truncate">{course.title}</span><span className="block text-[10px] text-slate-500 mt-0.5">{course.unitLabel} · {course.semesterTitle}</span></span>
            </button>
          ))}
        </section>
        </>}

        <button
          type="button"
          onClick={() => navigate("/explore")}
          className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Explore</span>
        </button>
      </div>
    </div>
  );
};
