import { X, Search, Wifi } from "lucide-react";
import { useState, useMemo } from "react";
import type { ALLCommunityMember } from "../types/community";
import { ALL_COMMUNITY_MEMBERSs } from "../data/communityMockData";

interface AllMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Optional override — defaults to ALL_COMMUNITY_MEMBERSs */
  members?: ALLCommunityMember[];
}

export function AllMembersModal({
  isOpen,
  onClose,
  members: membersProp,
}: AllMembersModalProps) {
  const members = membersProp ?? ALL_COMMUNITY_MEMBERSs;
  const onlineCount = useMemo(
    () => members.filter((m) => m.isOnline).length,
    [members]
  );
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen) return null;

  const filteredMembers = members.filter((m) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      m.name.toLowerCase().includes(q) ||
      (m.role && m.role.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-bold text-slate-900 leading-tight">
              Community Members
            </h3>
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70">
              <Wifi className="size-2.5" />
              {onlineCount} active
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="size-8 grid place-items-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Search inside members modal */}
        <div className="p-3.5 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search member by name or role..."
              className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200/90 rounded-xl placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Scrollable Members List */}
        <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-1.5 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
          {filteredMembers.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No members found matching "{searchTerm}"
            </div>
          ) : (
            filteredMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={member.avatarUrl}
                      alt={member.name}
                      className="size-9 rounded-full object-cover shadow-2xs"
                    />
                    <span
                      className={`absolute bottom-0 right-0 size-2.5 rounded-full ring-2 ring-white ${
                        member.isOnline ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                      title={member.isOnline ? "Online" : "Offline"}
                    />
                  </div>

                  <div className="min-w-0">
                    <h5 className="text-[13px] font-bold text-slate-900 truncate leading-snug">
                      {member.name}
                    </h5>
                    <p className="text-[11px] text-slate-400 font-medium truncate">
                      {member.role || "Student"}
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold shrink-0 ${
                    member.isOnline
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {member.isOnline ? "Online" : "Away"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
