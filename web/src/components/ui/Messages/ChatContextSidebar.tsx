import {
  GraduationCap,
  BookOpen,
  FileText,
  Search,
  BellOff,
  Archive,
  Ban,
} from "lucide-react";
import type { Conversation, Attachment } from "../../../types/chat";

interface ChatContextSidebarProps {
  conversation: Conversation;
  onViewProfile?: () => void;
  onSearchInChat?: () => void;
  onMute?: () => void;
  onArchive?: () => void;
  onBlock?: () => void;
  onFileClick?: (file: Attachment) => void;
}

export const ChatContextSidebar: React.FC<ChatContextSidebarProps> = ({
  conversation,
  onViewProfile,
  onSearchInChat,
  onMute,
  onArchive,
  onBlock,
  onFileClick,
}) => {
  const { recipient, courseContext, sharedFiles = [] } = conversation;

  return (
    <div className="flex flex-col h-full bg-white border-l border-[#e8ecef] overflow-y-auto select-none p-4 space-y-6">
      {/* 1. Recipient Profile Header */}
      <div className="flex flex-col items-center text-center pt-2">
        <div className="relative mb-3">
          {recipient.avatarUrl ? (
            <img
              src={recipient.avatarUrl}
              alt={recipient.name}
              className="w-16 h-16 rounded-full object-cover ring-4 ring-[#eaf7ee] shadow-sm"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#d2ecd9] text-emerald-900 font-bold text-lg flex items-center justify-center ring-4 ring-[#eaf7ee] shadow-sm">
              {recipient.initials || recipient.name.substring(0, 2).toUpperCase()}
            </div>
          )}

          {conversation.isOnline && (
            <span
              className="absolute bottom-0 right-1 w-3.5 h-3.5 bg-[#20a862] border-2 border-white rounded-full ring-1 ring-white"
              title="Online"
            />
          )}
        </div>

        <h3 className="text-[15px] font-bold text-slate-900 leading-snug">
          {recipient.name}
        </h3>
        <p className="text-[12px] text-[#64748b] mt-0.5 font-normal">
          {recipient.role}
        </p>
        {recipient.institution && (
          <p className="text-[11.5px] text-[#94a3b8] mt-0.5">
            {recipient.institution}
          </p>
        )}

        <button
          type="button"
          onClick={onViewProfile}
          className="mt-3.5 px-4 py-1.5 rounded-xl border border-[#e2e8f0] text-[12px] font-medium text-slate-700 hover:bg-[#f8faf9] hover:border-[#20a862] hover:text-[#20a862] transition-all shadow-2xs"
        >
          View profile
        </button>
      </div>

      <hr className="border-[#f1f5f3]" />

      {/* 2. Course Context Widget */}
      {courseContext && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-[12px] font-bold text-slate-900 uppercase tracking-wider">
              Course context
            </h4>
            {courseContext.statusBadge && (
              <span className="text-[10px] font-bold text-[#20a862] bg-[#eff9f2] px-2 py-0.5 rounded-full">
                {courseContext.statusBadge}
              </span>
            )}
          </div>

          <div className="p-3 rounded-2xl bg-[#f8faf9] border border-[#e5ebe7] space-y-2.5">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#20a862]/10 text-[#20a862] flex items-center justify-center shrink-0 mt-0.5">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-semibold text-slate-900 truncate">
                  {courseContext.courseTitle}
                </p>
                {courseContext.courseSubtitle && (
                  <p className="text-[11px] text-[#64748b] truncate">
                    {courseContext.courseSubtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-[#e8ecef]/60 pt-2 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-medium text-slate-800 truncate">
                    {courseContext.currentModule}
                  </p>
                  {courseContext.lessonCountText && (
                    <span className="text-[10px] text-[#94a3b8] shrink-0 font-medium">
                      {courseContext.lessonCountText}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#64748b] truncate">
                  {courseContext.currentLesson}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Shared Files Widget */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="text-[12px] font-bold text-slate-900 uppercase tracking-wider">
            Shared files
          </h4>
          {sharedFiles.length > 0 && (
            <button
              type="button"
              className="text-[11px] font-semibold text-[#20a862] hover:underline"
            >
              View all
            </button>
          )}
        </div>

        {sharedFiles.length === 0 ? (
          <p className="text-[11.5px] text-[#94a3b8] italic">
            No files shared yet
          </p>
        ) : (
          <div className="space-y-1.5">
            {sharedFiles.map((file) => (
              <div
                key={file.id}
                role="button"
                tabIndex={0}
                onClick={() => onFileClick?.(file)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onFileClick?.(file);
                }}
                className="group flex items-center gap-2.5 p-2 rounded-xl hover:bg-[#f8faf9] border border-transparent hover:border-[#e5ebe7] transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-slate-800 truncate group-hover:text-[#20a862] transition-colors">
                    {file.name}
                  </p>
                  <p className="text-[10.5px] text-[#94a3b8]">{file.size}</p>
                </div>
                <span className="text-[10.5px] text-[#94a3b8] shrink-0 font-medium">
                  {file.uploadedAt}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <hr className="border-[#f1f5f3]" />

      {/* 4. Conversation Actions Widget */}
      <div className="space-y-2">
        <h4 className="text-[12px] font-bold text-slate-900 uppercase tracking-wider mb-2">
          Conversation actions
        </h4>

        <button
          type="button"
          onClick={onSearchInChat}
          className="w-full flex items-center gap-3 px-2 py-1.5 text-[12.5px] text-[#475569] hover:text-[#20a862] hover:bg-[#f8faf9] rounded-lg transition-all"
        >
          <Search className="w-4 h-4 text-[#94a3b8]" />
          <span>Search in conversation</span>
        </button>

        <button
          type="button"
          onClick={onMute}
          className="w-full flex items-center gap-3 px-2 py-1.5 text-[12.5px] text-[#475569] hover:text-[#20a862] hover:bg-[#f8faf9] rounded-lg transition-all"
        >
          <BellOff className="w-4 h-4 text-[#94a3b8]" />
          <span>Mute notifications</span>
        </button>

        <button
          type="button"
          onClick={onArchive}
          className="w-full flex items-center gap-3 px-2 py-1.5 text-[12.5px] text-[#475569] hover:text-[#20a862] hover:bg-[#f8faf9] rounded-lg transition-all"
        >
          <Archive className="w-4 h-4 text-[#94a3b8]" />
          <span>Archive conversation</span>
        </button>

        <button
          type="button"
          onClick={onBlock}
          className="w-full flex items-center gap-3 px-2 py-1.5 text-[12.5px] text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
        >
          <Ban className="w-4 h-4 text-rose-500" />
          <span>Block user</span>
        </button>
      </div>
    </div>
  );
};
