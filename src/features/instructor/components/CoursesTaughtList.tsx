import React from "react";
import { BookOpen, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { CourseTaught } from "../../../types/instructor";

interface CoursesTaughtListProps {
  courses: CourseTaught[];
}

export const CoursesTaughtList: React.FC<CoursesTaughtListProps> = ({ courses }) => {
  const navigate = useNavigate();

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-2xs overflow-hidden shrink-0 lg:flex-1 lg:min-h-0 lg:flex lg:flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-2 shrink-0">
        <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
          <BookOpen className="w-4 h-4 text-emerald-600" />
          <span>Courses Taught</span>
        </div>

        <button
          type="button"
          onClick={() => navigate("/my-courses")}
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>View all</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Courses List */}
      <div className="space-y-2 lg:flex-1 lg:min-h-0 lg:overflow-y-auto">
        {courses.map((course) => (
          <div
            key={course.id}
            onClick={() => course.route && navigate(course.route)}
            className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group"
          >
            {/* Thumbnail */}
            <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100 shadow-2xs">
              <img
                src={course.imageSrc}
                alt={course.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Title & Metadata */}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                {course.title}
              </h4>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {course.type} • {course.studentsCount.toLocaleString()} students
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-20 shrink-0 text-right">
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${course.progressPercentage}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
