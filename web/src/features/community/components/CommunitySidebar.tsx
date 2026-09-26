import {
  ArrowRight,
  Calendar,
  Trophy,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type {
  CommunityMember,
  CommunityEvent,
  TopContributor,
} from "../types/community";

interface CommunitySidebarProps {
  onlineMembers: CommunityMember[];
  onlineCount: number;
  events: CommunityEvent[];
  contributors: TopContributor[];
  onViewAllMembers?: () => void;
  onViewAllEvents?: () => void;
  onViewLeaderboard?: () => void;
  onEventAction?: (eventId: string, action: "join" | "remind") => void;
}

export function CommunitySidebar({
  onlineMembers,
  onlineCount,
  events,
  contributors,
  onViewAllMembers,
  // onViewAllEvents,
  onViewLeaderboard,
  onEventAction,
}: CommunitySidebarProps) {
  const [eventStates, setEventStates] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  const handleEventClick = (eventId: string, actionType: "join" | "remind") => {
    setEventStates((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
    onEventAction?.(eventId, actionType);
  };

  return (
    <aside
      className="flex flex-col gap-2.5 w-full lg:w-72.25 xl:w-77.5 shrink-0 h-full justify-between min-h-0"
      aria-label="Community Sidebar"
    >
      {/* 1. Members Online Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-2xs transition-all hover:shadow-xs flex flex-col justify-between flex-1 min-h-0">
        <div className="flex items-center justify-between mb-1.5 shrink-0">
          <h4 className="text-[13px] font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
            <Users className="size-3.5 text-emerald-600" />
            <span>Members online</span>
          </h4>
          <span className="text-[10px] font-medium text-slate-400">
            {onlineCount} online
          </span>
        </div>

        {/* Members List - Scrollable through members directly */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 flex flex-col gap-1 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
          {onlineMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-50 transition-colors shrink-0"
            >
              {/* Avatar with Green Online Status Dot */}
              <div className="relative shrink-0">
                <img
                  src={member.avatarUrl}
                  alt={member.name}
                  className="size-6.5 rounded-full object-cover shadow-2xs"
                />
                <span
                  className="absolute bottom-0 right-0 size-2 rounded-full bg-emerald-500 ring-2 ring-white"
                  title="Online"
                />
              </div>

              {/* Name & Role */}
              <div className="min-w-0 flex-1 leading-tight">
                <p className="text-[11.5px] sm:text-[12px] font-bold text-slate-900 truncate">
                  {member.name}
                </p>
                <p className="text-[10px] text-slate-400 font-medium truncate">
                  {member.role}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* View All Members */}
        <div className="mt-1 pt-1.5 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onViewAllMembers}
            className="flex items-center gap-1.5 text-[11.5px] font-semibold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer group w-full justify-between"
          >
            <span>View all members</span>
            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      {/* 2. Upcoming Events Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-2xs transition-all hover:shadow-xs flex flex-col justify-between flex-1 min-h-0">
        <div className="flex items-center justify-between mb-1.5 shrink-0">
          <h4 className="text-[13px] font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
            <span>Upcoming events</span>
          </h4>
          <Calendar className="size-3.5 text-emerald-600" />
        </div>

        {/* Events List */}
        <div className="flex flex-col gap-1.5 min-h-0 overflow-hidden">
          {events.slice(0, 2).map((event) => {
            const isToggled = eventStates[event.id];

            return (
              <div
                key={event.id}
                className="flex items-center justify-between gap-2"
              >
                {/* Left Date Block */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="size-8 rounded-lg bg-slate-100/90 flex flex-col items-center justify-center shrink-0 border border-slate-200/60 leading-none">
                    <span className="text-[7.5px] font-extrabold text-slate-500 uppercase tracking-wide">
                      {event.month}
                    </span>
                    <span className="text-[12.5px] font-extrabold text-slate-900 mt-0.5">
                      {event.day}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <span className="text-[9px] font-semibold uppercase text-slate-400 block tracking-wider truncate leading-tight">
                      {event.type}
                    </span>
                    <p className="text-[11.5px] font-bold text-slate-900 truncate leading-tight mt-0.5">
                      {event.title}
                    </p>
                    <span className="text-[9.5px] text-slate-500 font-medium leading-tight">
                      {event.dateString}, {event.timeString}
                    </span>
                  </div>
                </div>

                {/* Right Action Button */}
                <button
                  type="button"
                  onClick={() => handleEventClick(event.id, event.actionType)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold shrink-0 transition-all cursor-pointer shadow-2xs ${
                    isToggled
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  {isToggled
                    ? event.actionType === "join"
                      ? "Joined"
                      : "Reminded"
                    : event.actionType === "join"
                    ? "Join"
                    : "Remind"}
                </button>
              </div>
            );
          })}
        </div>

        {/* View All Events */}
        <div className="mt-1 pt-1.5 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={() => navigate("/calendar")}
            className="flex items-center gap-1.5 text-[11.5px] font-semibold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer group w-full justify-between"
          >
            <span>View all events</span>
            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      {/* 3. Top Contributors Leaderboard Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-2xs transition-all hover:shadow-xs flex flex-col justify-between flex-1 min-h-0">
        <div className="flex items-center justify-between mb-1.5 shrink-0">
          <h4 className="text-[13px] font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
            <Trophy className="size-3.5 text-emerald-600" />
            <span>Top contributors</span>
          </h4>
        </div>

        {/* Contributors Rank List */}
        <div className="flex flex-col gap-1 min-h-0 overflow-hidden">
          {contributors.slice(0, 3).map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between gap-2 p-0.5 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                {/* Rank Number */}
                <span className="text-[11px] font-bold text-slate-400 w-3 text-center">
                  {user.rank}
                </span>

                {/* Avatar */}
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="size-5.5 rounded-full object-cover shadow-2xs"
                />

                {/* Name */}
                <span className="text-[11.5px] font-bold text-slate-900 truncate">
                  {user.name}
                </span>
              </div>

              {/* Points */}
              <span className="text-[10.5px] font-bold text-emerald-700 shrink-0">
                {user.points.toLocaleString()} pts
              </span>
            </div>
          ))}
        </div>

        {/* View Leaderboard */}
        <div className="mt-1 pt-1.5 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onViewLeaderboard}
            className="flex items-center gap-1.5 text-[11.5px] font-semibold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer group w-full justify-between"
          >
            <span>View leaderboard</span>
            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
