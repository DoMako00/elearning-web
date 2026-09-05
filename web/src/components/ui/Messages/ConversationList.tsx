import React, { useMemo } from "react";
import { Search, Plus, Users } from "lucide-react";
import type { Conversation, ConversationFilter } from "../../../types/chat";

interface ConversationListProps {
  conversations: Conversation[];
  activeId?: string | null;
  onSelect: (conversation: Conversation) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentFilter: ConversationFilter;
  onFilterChange: (filter: ConversationFilter) => void;
  onNewMessageClick: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeId,
  onSelect,
  searchQuery,
  onSearchChange,
  currentFilter,
  onFilterChange,
  onNewMessageClick,
}) => {
  // Compute counts
  // Count how many *chats* have unread messages (not total unread message count)
  const unreadChatsCount = useMemo(() => {
    return conversations.filter((c) => c.unreadCount > 0).length;
  }, [conversations]);

  // Filter list
  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      // Filter tab
      if (currentFilter === "unread" && conv.unreadCount === 0) return false;
      if (currentFilter === "instructors" && conv.type !== "instructor") return false;
      if (currentFilter === "groups" && conv.type !== "group") return false;

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = conv.title.toLowerCase().includes(q);
        const matchMsg = conv.lastMessage?.text?.toLowerCase().includes(q);
        return matchTitle || matchMsg;
      }
      return true;
    });
  }, [conversations, currentFilter, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-white border-r border-[#e8ecef] select-none">
      {/* Top Search & Action Bar */}
      <div className="p-3.5 pb-2.5 flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
            <input
              type="text"
              placeholder="Search conversations.."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#f8faf9] border border-[#e5ebe7] text-[13px] text-slate-800 placeholder-[#94a3b8] focus:outline-none focus:border-[#20a862] focus:bg-white transition-all"
            />
          </div>
          <button
            type="button"
            onClick={onNewMessageClick}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#e5ebe7] text-[#64748b] hover:text-[#20a862] hover:border-[#20a862] hover:bg-[#f0f9f4] transition-all shrink-0"
            title="Start new message"
            aria-label="Start new message"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => onFilterChange("all")}
            className={`px-3 py-1 rounded-full text-[12px] font-medium transition-all ${
              currentFilter === "all"
                ? "bg-[#20a862]/10 border border-[#20a862] text-[#20a862] font-semibold"
                : "border border-[#e5ebe7] text-[#64748b] hover:bg-[#f8faf9]"
            }`}
          >
            All
          </button>

          <button
            type="button"
            onClick={() => onFilterChange("unread")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium transition-all ${
              currentFilter === "unread"
                ? "bg-[#20a862]/10 border border-[#20a862] text-[#20a862] font-semibold"
                : "border border-[#e5ebe7] text-[#64748b] hover:bg-[#f8faf9]"
            }`}
          >
            <span>Unread</span>
            {unreadChatsCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  currentFilter === "unread"
                    ? "bg-[#20a862] text-white"
                    : "bg-[#e2e8f0] text-slate-700"
                }`}
              >
                {unreadChatsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onFilterChange("instructors")}
            className={`px-3 py-1 rounded-full text-[12px] font-medium transition-all ${
              currentFilter === "instructors"
                ? "bg-[#20a862]/10 border border-[#20a862] text-[#20a862] font-semibold"
                : "border border-[#e5ebe7] text-[#64748b] hover:bg-[#f8faf9]"
            }`}
          >
            Instructors
          </button>

          <button
            type="button"
            onClick={() => onFilterChange("groups")}
            className={`px-3 py-1 rounded-full text-[12px] font-medium transition-all ${
              currentFilter === "groups"
                ? "bg-[#20a862]/10 border border-[#20a862] text-[#20a862] font-semibold"
                : "border border-[#e5ebe7] text-[#64748b] hover:bg-[#f8faf9]"
            }`}
          >
            Groups
          </button>
        </div>
      </div>

      {/* Conversation Cards List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#f1f5f3] px-1.5 py-1">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-[#94a3b8] text-xs">
            No conversations found
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isActive = conv.id === activeId;
            const hasUnread = conv.unreadCount > 0;

            return (
              <div
                key={conv.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(conv)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(conv);
                  }
                }}
                className={`relative flex items-center gap-3 p-3 my-0.5 rounded-xl cursor-pointer transition-all ${
                  isActive
                    ? "bg-[#f2f8f4] border-l-4 border-l-[#20a862] pl-2.5"
                    : "hover:bg-[#f8faf9] border-l-4 border-l-transparent"
                }`}
              >
                {/* Avatar with Status indicator */}
                <div className="relative shrink-0">
                  {conv.avatarUrl ? (
                    <img
                      src={conv.avatarUrl}
                      alt={conv.title}
                      className="w-11 h-11 rounded-full object-cover shadow-2xs"
                    />
                  ) : (
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs shadow-2xs"
                      style={{
                        backgroundColor: conv.avatarBg || "#e2e8f0",
                        color: conv.type === "group" ? "#6366f1" : "#1e293b",
                      }}
                    >
                      {conv.type === "group" ? (
                        <Users className="w-5 h-5 text-indigo-500" />
                      ) : (
                        conv.initials || conv.title.substring(0, 2).toUpperCase()
                      )}
                    </div>
                  )}

                  {/* Online Dot */}
                  {conv.isOnline && (
                    <span
                      className="absolute bottom-0 right-0 w-3 h-3 bg-[#20a862] border-2 border-white rounded-full ring-1 ring-white"
                      title="Online"
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <h2
                      className={`text-[13.5px] truncate ${
                        hasUnread ? "font-bold text-slate-900" : "font-medium text-slate-800"
                      }`}
                    >
                      {conv.title}
                    </h2>
                    <span
                      className={`text-[11px] shrink-0 ${
                        hasUnread ? "text-[#20a862] font-semibold" : "text-[#94a3b8]"
                      }`}
                    >
                      {conv.lastMessage?.timestamp}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-[12px] truncate leading-normal ${
                        hasUnread ? "text-slate-900 font-medium" : "text-[#64748b]"
                      }`}
                    >
                      {conv.lastMessage?.text || "No messages yet"}
                    </p>

                    {/* Unread badge */}
                    {hasUnread && (
                      <span className="shrink-0 flex items-center justify-center min-w-4.5 h-4.5 px-1.5 rounded-full bg-[#20a862] text-white text-[10px] font-bold">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
