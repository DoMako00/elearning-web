import React from "react";
import {
  BookOpen,
  Users,
  FileText,
  Star,
  GraduationCap,
  Clock,
  BarChart2,
} from "lucide-react";
import type { InstructorStats } from "../../../types/instructor";

interface InstructorStatsBarProps {
  stats: InstructorStats;
}

export const InstructorStatsBar: React.FC<InstructorStatsBarProps> = ({ stats }) => {
  const statItems = [
    {
      id: "courses",
      icon: BookOpen,
      value: stats.coursesTaught.toString(),
      label: "Courses taught",
    },
    {
      id: "students",
      icon: Users,
      value: stats.studentsMentored.toLocaleString(),
      label: "Students mentored",
    },
    {
      id: "resources",
      icon: FileText,
      value: stats.publishedResources.toString(),
      label: "Resources",
    },
    {
      id: "rating",
      icon: Star,
      value: stats.averageRating.toFixed(1),
      label: "Average rating",
    },
    {
      id: "years",
      icon: GraduationCap,
      value: stats.yearsTeaching,
      label: "Years teaching",
    },
    {
      id: "response",
      icon: Clock,
      value: `${stats.responseRate}%`,
      label: "Response rate",
    },
    {
      id: "completion",
      icon: BarChart2,
      value: `${stats.studentCompletion}%`,
      label: "Completion",
    },
  ];

  return (
    <div className="w-full shrink-0">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {statItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-2xs hover:shadow-xs transition-all hover:border-emerald-100 group"
            >
              {/* Icon */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition-colors group-hover:bg-emerald-100">
                <Icon className="h-4 w-4" />
              </div>

              {/* Value & Label */}
              <div className="min-w-0 flex-1">
                <div className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight leading-tight">
                  {item.value}
                </div>
                <div className="text-xs font-medium text-slate-500 truncate mt-0.5 leading-none">
                  {item.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
