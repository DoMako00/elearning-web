import React from "react";
import {
  Edit3,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  FileText,
  Award,
  Video,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import type {
  UserProfileData,
  EnrolledCourseItem,
  GoalItem,
  UpcomingEventItem,
  RecentActivityItem,
} from "../../types/profile.types";
import { ProfileQuoteBanner } from "../ProfileQuoteBanner";

interface OverviewTabProps {
  profile: UserProfileData;
  enrolledCourses: EnrolledCourseItem[];
  goals: GoalItem[];
  onToggleGoal: (id: string) => void;
  upcomingEvents: UpcomingEventItem[];
  recentActivities: RecentActivityItem[];
  onEditProfile: () => void;
  onEditGoals: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  profile,
  enrolledCourses,
  goals,
  onToggleGoal,
  upcomingEvents,
  recentActivities,
  onEditProfile,
  onEditGoals,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 min-h-0 flex flex-col justify-between overflow-y-auto overflow-x-hidden pt-1 pb-1">
      {/* 3-Column Grid Matching Reference UI Image (responsive down to 1 col on mobile, 2 on tablet, 3 on lg desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 lg:gap-4 flex-1 min-h-0 items-stretch">
        
        {/* Card 1: About Me */}
        <section
          className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 lg:p-6 shadow-xs transition-shadow hover:shadow-sm"
          aria-labelledby="about-me-heading"
        >
          <div>
            <h2 id="about-me-heading" className="text-lg lg:text-xl font-extrabold text-gray-900 tracking-tight mb-3">
              About Me
            </h2>
            <p className="text-sm lg:text-[15px] leading-relaxed text-gray-700 font-medium">
              I&apos;m a medical student interested in anatomy, physiology, and clinical applications.
              I love visual learning and aim to become a better, more confident healthcare professional.
            </p>
          </div>

          <div className="pt-4">
            <button
              type="button"
              onClick={onEditProfile}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <Edit3 className="size-4.5" />
              <span>Edit</span>
            </button>
          </div>
        </section>

        {/* Card 2: Enrolled Courses */}
        <section
          className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 lg:p-6 shadow-xs transition-shadow hover:shadow-sm"
          aria-labelledby="enrolled-courses-heading"
        >
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h2 id="enrolled-courses-heading" className="text-lg lg:text-xl font-extrabold text-gray-900 tracking-tight">
                Enrolled Courses
              </h2>
              <Link
                to="/my-courses"
                className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <span>View all</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {enrolledCourses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-gray-50/70 hover:bg-emerald-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <img
                      src={course.image}
                      alt={course.title}
                      className="size-13 rounded-xl object-cover bg-emerald-50 shrink-0 border border-gray-200 shadow-2xs"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm sm:text-[15px] font-extrabold text-gray-900">
                        {course.title}
                      </p>
                      {/* Progress bar */}
                      <div className="mt-2 flex items-center gap-3">
                        <div className="h-2.5 w-full max-w-44 rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${course.progressPercentage}%` }}
                          />
                        </div>
                        <span className="text-xs sm:text-[13px] font-bold text-gray-700">
                          {course.progressPercentage}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(course.route)}
                    className="rounded-xl border border-emerald-600/40 bg-white px-3.5 py-1.5 text-xs sm:text-sm font-bold text-emerald-700 hover:bg-emerald-50 transition-colors shrink-0 shadow-2xs"
                  >
                    Continue
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Card 3: My Goals */}
        <section
          className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 lg:p-6 shadow-xs transition-shadow hover:shadow-sm"
          aria-labelledby="my-goals-heading"
        >
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h2 id="my-goals-heading" className="text-lg lg:text-xl font-extrabold text-gray-900 tracking-tight">
                My Goals
              </h2>
            </div>

            <ul className="space-y-3">
              {goals.slice(0, 4).map((goal) => (
                <li key={goal.id} className="flex items-center gap-3 text-sm sm:text-[14px] text-gray-800 font-semibold">
                  <button
                    type="button"
                    onClick={() => onToggleGoal(goal.id)}
                    className="text-gray-400 hover:text-emerald-600 transition-colors focus-visible:outline-none shrink-0"
                    aria-label={`Toggle goal: ${goal.title}`}
                  >
                    {goal.completed ? (
                      <CheckCircle2 className="size-5 text-emerald-600" />
                    ) : (
                      <Bookmark className="size-5 text-gray-400" />
                    )}
                  </button>
                  <span className={`truncate leading-snug ${goal.completed ? "line-through text-gray-400" : ""}`}>
                    {goal.title}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-4">
            <button
              type="button"
              onClick={onEditGoals}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <Edit3 className="size-4.5" />
              <span>Edit Goals</span>
            </button>
          </div>
        </section>

        {/* Card 4: Upcoming */}
        <section
          className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 lg:p-6 shadow-xs transition-shadow hover:shadow-sm"
          aria-labelledby="upcoming-heading"
        >
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h2 id="upcoming-heading" className="text-lg lg:text-xl font-extrabold text-gray-900 tracking-tight">
                Upcoming
              </h2>
              <Link
                to="/calendar"
                className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <span>View calendar</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {upcomingEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-gray-50/70 hover:bg-blue-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="grid size-11 place-items-center rounded-xl bg-blue-100/70 text-blue-700 shrink-0">
                      {evt.type === "session" ? (
                        <Video className="size-5 text-blue-700" />
                      ) : (
                        <FileText className="size-5 text-blue-700" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm sm:text-[14px] font-extrabold text-gray-900">
                        {evt.title}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 font-semibold">{evt.dateStr}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (evt.actionRoute) navigate(evt.actionRoute);
                      else toast.success(`Action: ${evt.actionLabel}`);
                    }}
                    className={`rounded-xl px-3.5 py-1.5 text-xs sm:text-sm font-bold transition-colors shrink-0 ${
                      evt.actionLabel === "Submit"
                        ? "border border-emerald-600/30 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "border border-emerald-600/40 bg-white text-emerald-700 hover:bg-emerald-50"
                    }`}
                  >
                    {evt.actionLabel}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Card 5: Interests */}
        <section
          className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 lg:p-6 shadow-xs transition-shadow hover:shadow-sm"
          aria-labelledby="interests-heading"
        >
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h2 id="interests-heading" className="text-lg lg:text-xl font-extrabold text-gray-900 tracking-tight">
                Interests
              </h2>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-1">
              {profile.interests.map((interest) => (
                <span
                  key={interest}
                  className="inline-flex items-center rounded-xl bg-gray-100 hover:bg-emerald-100/70 hover:text-emerald-800 px-3.5 py-2 text-xs sm:text-sm font-bold text-gray-700 transition-colors cursor-default"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Card 6: Recent Activity */}
        <section
          className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 lg:p-6 shadow-xs transition-shadow hover:shadow-sm"
          aria-labelledby="recent-activity-heading"
        >
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h2 id="recent-activity-heading" className="text-lg lg:text-xl font-extrabold text-gray-900 tracking-tight">
                Recent Activity
              </h2>
              <Link
                to="/assignments"
                className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <span>View all</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {recentActivities.slice(0, 3).map((act) => (
                <div key={act.id} className="flex items-start justify-between gap-3 text-sm p-1">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 shrink-0">
                      {act.type === "quiz" ? (
                        <CheckCircle2 className="size-5 text-emerald-600" />
                      ) : act.type === "assignment" ? (
                        <FileText className="size-5 text-blue-600" />
                      ) : (
                        <Award className="size-5 text-amber-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-gray-900 truncate text-sm sm:text-[14px]">
                        {act.title}
                      </p>
                      <p className="text-gray-500 truncate text-xs sm:text-sm font-medium">{act.detail}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs sm:text-sm text-gray-400 font-bold">
                    {act.timeAgo}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>

      {/* Motivational Quote Banner matching reference image footer */}
      <ProfileQuoteBanner userName={profile.name.split(" ")[0]} />
    </div>
  );
};
