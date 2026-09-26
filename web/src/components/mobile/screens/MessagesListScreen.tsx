import React, { useState } from "react";
import { TopAppBar } from "../TopAppBar";
import { useScreenStack } from "../ScreenStack";
import { useMobileMessages } from "../data/useMobileMessages";
import { MobileSearchBar } from "../shared/MobileSearchBar";
import { HeroBand } from "../shared/HeroBand";
import { ChatConversationScreen } from "./ChatConversationScreen";

export const MessagesListScreen: React.FC = () => {
  const { push } = useScreenStack();
  const { conversations } = useMobileMessages();
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      (c.recipient?.role && c.recipient.role.toLowerCase().includes(q))
    );
  });

  const handleOpenChat = (conversationId: string) => {
    const conv = conversations.find((c) => c.id === conversationId);
    push({
      id: `chat-${conversationId}`,
      title: conv?.title || "Chat",
      tabRoot: "settings",
      variant: "detail",
      backLabel: "Messages",
      component: (
        <ChatConversationScreen
          conversationId={conversationId}
          backLabel="Messages"
        />
      ),
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
      {/* TopAppBar main variant */}
      <TopAppBar variant="main" />

      <div className="flex-1 overflow-y-auto">
        {/* Header Hero */}
        <HeroBand
          heading="Messages"
          subtitle="Direct chats with professors, advisors, and study groups."
        />

        <div className="px-4 pb-12 space-y-3.5 max-w-lg mx-auto">
          {/* Search bar */}
          <MobileSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search conversations..."
          />

          {/* Conversations list */}
          <div className="bg-white rounded-3xl border border-slate-100 divide-y divide-slate-100 overflow-hidden shadow-2xs">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 font-medium">
                No conversations found.
              </div>
            ) : (
              filtered.map((c) => {
                const initials =
                  c.initials ||
                  c.title
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                const isOnline = c.isOnline ?? true;

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleOpenChat(c.id)}
                    className="w-full p-3.5 flex items-start gap-3 text-left hover:bg-slate-50/80 active:bg-slate-100 transition-colors cursor-pointer"
                  >
                    {/* Avatar & Online dot */}
                    <div className="relative shrink-0">
                      {c.avatarUrl ? (
                        <img
                          src={c.avatarUrl}
                          alt={c.title}
                          className="w-11 h-11 rounded-full object-cover ring-1 ring-slate-200"
                        />
                      ) : (
                        <div
                          className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs text-emerald-800 ring-1 ring-emerald-200"
                          style={{
                            backgroundColor: c.avatarBg || "#d1fae5",
                          }}
                        >
                          {initials}
                        </div>
                      )}
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                      )}
                    </div>

                    {/* Metadata & snippet */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {c.title}
                        </h3>
                        <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                          {c.lastMessage.timestamp}
                        </span>
                      </div>

                      {c.recipient?.role && (
                        <p className="text-[10.5px] text-slate-400 font-medium truncate mt-0.5">
                          {c.recipient.role}
                        </p>
                      )}

                      <p
                        className={`text-xs truncate mt-1 ${
                          c.unreadCount > 0
                            ? "font-bold text-slate-900"
                            : "text-slate-500 font-medium"
                        }`}
                      >
                        {c.lastMessage.text}
                      </p>
                    </div>

                    {/* Unread badge */}
                    {c.unreadCount > 0 && (
                      <span className="self-center min-w-5 h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center shrink-0 shadow-xs">
                        {c.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
