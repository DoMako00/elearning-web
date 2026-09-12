import React from "react";
import { TopAppBar } from "../TopAppBar";
import { useScreenStack } from "../ScreenStack";
import { DocsOnlyBanner } from "../common/DocsOnlyBanner";
import {
  Send,
  Users,
  Settings as SettingsIcon,
  HelpCircle,
  Bell,
  Search,
} from "lucide-react";

// Messages List Stub Screen
export const MessagesListStubScreen: React.FC = () => {
  const { pop, push } = useScreenStack();

  const handleOpenConversation = (name: string, subject: string) => {
    push({
      id: "conversation-detail",
      title: name,
      tabRoot: "more",
      variant: "detail",
      backLabel: "Messages",
      component: <ChatConversationStubScreen interlocutorName={name} subject={subject} />,
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
      <TopAppBar
        variant="detail"
        title="Messages"
        backLabel="More"
        onBack={pop}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <DocsOnlyBanner />

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:outline-emerald-500"
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100 overflow-hidden shadow-2xs">
          {[
            {
              name: "Dr. Sarah Jenkins",
              role: "Lead Anatomy Instructor",
              preview: "Please review chapter 4 regarding neurovascular pathways before tomorrow.",
              time: "10:30 AM",
              unread: true,
            },
            {
              name: "Marcus Chen",
              role: "Study Group Partner",
              preview: "Did you finish the assigned reading for cardiology?",
              time: "Yesterday",
              unread: false,
            },
            {
              name: "Academic Advising",
              role: "Support Team",
              preview: "Your elective enrollment documents have been processed.",
              time: "Sep 8",
              unread: false,
            },
          ].map((chat, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleOpenConversation(chat.name, chat.role)}
              className="w-full p-3.5 flex items-start gap-3 text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                {chat.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 truncate">
                    {chat.name}
                  </h3>
                  <span className="text-[10px] text-slate-400">{chat.time}</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium truncate">
                  {chat.role}
                </p>
                <p className="text-[11px] text-slate-600 truncate mt-1">
                  {chat.preview}
                </p>
              </div>
              {chat.unread && (
                <span className="w-2 h-2 rounded-full bg-emerald-600 self-center shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Chat Conversation Stub Screen
export const ChatConversationStubScreen: React.FC<{
  interlocutorName: string;
  subject: string;
}> = ({ interlocutorName, subject }) => {
  const { pop } = useScreenStack();

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
      <TopAppBar
        variant="detail"
        title={interlocutorName}
        backLabel="Messages"
        onBack={pop}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="text-center">
          <span className="text-[10.5px] font-semibold text-slate-400">
            {subject}
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="self-start max-w-[80%] bg-white p-3 rounded-2xl rounded-tl-sm border border-slate-100 shadow-2xs text-xs text-slate-800">
            Hello! Please make sure to check the updated documents uploaded for this week.
          </div>
          <div className="self-end max-w-[80%] bg-emerald-600 p-3 rounded-2xl rounded-tr-sm text-white text-xs shadow-2xs">
            Got it, thank you! I am reading through the clinical case study right now.
          </div>
        </div>
      </div>

      <div className="p-3 bg-white border-t border-slate-200/80 flex items-center gap-2">
        <input
          type="text"
          placeholder="Type a message..."
          className="flex-1 px-3.5 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:outline-emerald-500"
        />
        <button
          type="button"
          aria-label="Send message"
          className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Community Stub Screen
export const CommunityStubScreen: React.FC = () => {
  const { pop } = useScreenStack();

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
      <TopAppBar
        variant="detail"
        title="Community"
        backLabel="More"
        onBack={pop}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <DocsOnlyBanner />

        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-2xs text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">Student Community</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Discussion channels, student study groups, and Q&A boards.
          </p>
          <span className="mt-3 inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
            Coming soon
          </span>
        </div>
      </div>
    </div>
  );
};

// Settings Stub Screen
export const SettingsStubScreen: React.FC = () => {
  const { pop } = useScreenStack();

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
      <TopAppBar
        variant="detail"
        title="Settings"
        backLabel="More"
        onBack={pop}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-2xs text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">Settings & Preferences</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Manage your account, notifications, security, and document viewing preferences.
          </p>
          <span className="mt-3 inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
            Coming soon
          </span>
        </div>
      </div>
    </div>
  );
};

// Help Center Stub Screen
export const HelpCenterStubScreen: React.FC = () => {
  const { pop } = useScreenStack();

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
      <TopAppBar
        variant="detail"
        title="Help Center"
        backLabel="More"
        onBack={pop}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <DocsOnlyBanner />

        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-2xs text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">Help & Support</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Guides, FAQs, and ticket submission for mobile learning assistance.
          </p>
          <span className="mt-3 inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
            Coming soon
          </span>
        </div>
      </div>
    </div>
  );
};

// Notifications Stub Screen
export const NotificationsStubScreen: React.FC = () => {
  const { pop } = useScreenStack();

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
      <TopAppBar
        variant="detail"
        title="Notifications"
        backLabel="More"
        onBack={pop}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-2xs text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <Bell className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">Notifications</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Document releases, reading updates, and course deadlines.
          </p>
          <span className="mt-3 inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
            Coming soon
          </span>
        </div>
      </div>
    </div>
  );
};
