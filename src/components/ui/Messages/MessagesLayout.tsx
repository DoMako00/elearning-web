import React, { useState, useEffect } from "react";
import type { ConversationFilter } from "../../../types/chat";
import { ConversationList } from "./ConversationList";
import { ChatWindow } from "./ChatWindow";
import { ChatContextSidebar } from "./ChatContextSidebar";
import { useMessages } from "../../../app/providers/MessagesProvider";
import { useStudentMessageContacts, useStudentConversationMessages, useStudentMessageMutations } from "../../../features/student/api/useStudentMessages";
import { mapStudentMessage } from "../../../features/student/api/studentMessagesMapper";
import { MEDIA_QUERIES } from "../../../styles/breakpoints";
import "./Messages.css";

export const MessagesLayout: React.FC = () => {
  const { conversations, currentUserId, isPending: conversationsPending, isError: conversationsError } = useMessages();
  const contactsQuery = useStudentMessageContacts();
  const mutations = useStudentMessageMutations();
  
  // Track tablet & mobile screen width (<= 1399px) dynamically via canonical breakpoint
  const [isSmallScreen, setIsSmallScreen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia(MEDIA_QUERIES.tabletAndBelow).matches;
    }
    return false;
  });

  // On compact/tablet screens, start with no selected chat if user hasn't selected one
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MEDIA_QUERIES.tabletAndBelow);
    const handler = (e: MediaQueryListEvent) => {
      setIsSmallScreen(e.matches);
    };

    setIsSmallScreen(mediaQuery.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentFilter, setCurrentFilter] = useState<ConversationFilter>("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [recipientProfileId, setRecipientProfileId] = useState("");
  const [isSupportRequest, setIsSupportRequest] = useState(false);
  const [supportSubject, setSupportSubject] = useState("");
  const [supportBody, setSupportBody] = useState("");

  const activeConversation = activeConversationId
    ? conversations.find((c) => c.id === activeConversationId) || null
    : null;
  const activeMessagesQuery = useStudentConversationMessages(activeConversationId);
  const messages = (activeMessagesQuery.data ?? []).map((message) => mapStudentMessage(message, activeConversationId ?? ""));

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    if (activeConversationId) void mutations.markRead.mutateAsync(activeConversationId).catch(() => undefined);
  }, [activeConversationId]);

  useEffect(() => {
    if (!isSmallScreen && !activeConversationId && conversations.length > 0) setActiveConversationId(conversations[0]!.id);
  }, [activeConversationId, conversations, isSmallScreen]);

  const handleSendMessage = (text: string) => {
    if (!activeConversationId || !text.trim()) return;
    void mutations.send.mutateAsync({ conversationId: activeConversationId, body: text.trim() }).catch((error: unknown) => showToast(error instanceof Error ? error.message : "Message could not be sent."));
  };

  const handleNewMessageClick = () => {
    setIsNewMessageOpen(true);
  };

  const handleStartConversation = async () => {
    try {
      const result = isSupportRequest
        ? await mutations.startSupport.mutateAsync({ subject: supportSubject, body: supportBody })
        : await mutations.startPeer.mutateAsync(recipientProfileId);
      setActiveConversationId(result.id);
      setIsNewMessageOpen(false);
      setSupportSubject("");
      setSupportBody("");
      setRecipientProfileId("");
    } catch (error) { showToast(error instanceof Error ? error.message : "Conversation could not be started."); }
  };

  const handleBackToConversations = () => {
    setActiveConversationId(null);
  };

  const hasSelectedChat = Boolean(activeConversation);

  return (
    <div className="messages-module h-full w-full flex overflow-hidden bg-white relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 right-6 z-50 bg-[#174b35] text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg border border-[#20a862]/30 animate-fade-in">
          {toastMessage}
        </div>
      )}

      {isNewMessageOpen && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/20 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsNewMessageOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="new-message-title" className="w-full max-w-md rounded-2xl border border-[#e5ebe7] bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div><h2 id="new-message-title" className="text-base font-bold text-slate-900">New message</h2><p className="mt-1 text-xs text-slate-500">Start a Student conversation or contact Admin Support.</p></div>
              <button type="button" onClick={() => setIsNewMessageOpen(false)} className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-50" aria-label="Close">×</button>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setIsSupportRequest(false)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${!isSupportRequest ? "bg-[#20a862]/10 text-[#16894e]" : "text-slate-500"}`}>Student</button>
              <button type="button" onClick={() => setIsSupportRequest(true)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${isSupportRequest ? "bg-[#20a862]/10 text-[#16894e]" : "text-slate-500"}`}>Admin Support</button>
            </div>
            {isSupportRequest ? <div className="mt-3 space-y-3">
              <input value={supportSubject} onChange={(event) => setSupportSubject(event.target.value)} maxLength={240} placeholder="Subject" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#20a862]" />
              <textarea value={supportBody} onChange={(event) => setSupportBody(event.target.value)} maxLength={10000} rows={4} placeholder="How can we help?" className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#20a862]" />
            </div> : <div className="mt-3">
              {contactsQuery.isPending ? <p role="status" className="text-xs text-slate-500">Loading eligible Student contacts…</p> : contactsQuery.isError ? <p role="alert" className="text-xs text-rose-600">Student contacts could not be loaded.</p> : <select value={recipientProfileId} onChange={(event) => setRecipientProfileId(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#20a862]"><option value="">Choose a Student</option>{(contactsQuery.data ?? []).map((contact) => <option key={contact.studentProfileId} value={contact.studentProfileId}>{contact.fullName}</option>)}</select>}
              {!contactsQuery.isPending && !contactsQuery.isError && contactsQuery.data?.length === 0 && <p className="mt-2 text-xs text-slate-500">No other active Students are available in this Institution yet.</p>}
            </div>}
            <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setIsNewMessageOpen(false)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">Cancel</button><button type="button" onClick={() => void handleStartConversation()} disabled={mutations.startPeer.isPending || mutations.startSupport.isPending || (isSupportRequest ? !supportSubject.trim() || !supportBody.trim() : !recipientProfileId || contactsQuery.isPending || contactsQuery.isError)} className="rounded-xl bg-[#20a862] px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{mutations.startPeer.isPending || mutations.startSupport.isPending ? "Starting…" : "Start conversation"}</button></div>
          </section>
        </div>
      )}

      {/* Column 1: Conversations Sidebar (~320px on desktop, full-width on <=820px when no chat is selected) */}
      <div
        className={`messages-sidebar-column ${
          isSmallScreen
            ? hasSelectedChat
              ? "hidden"
              : "flex w-full h-full"
            : "w-[320px] shrink-0 h-full flex flex-col"
        }`}
      >
        <ConversationList
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={(conv) => setActiveConversationId(conv.id)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          currentFilter={currentFilter}
          onFilterChange={setCurrentFilter}
          onNewMessageClick={handleNewMessageClick}
          isLoading={conversationsPending}
          hasError={conversationsError}
        />
      </div>

      {/* Column 2: Active Chat Window (Flex-1 on desktop, full-width on <=820px when a chat is selected) */}
      <div
        className={`messages-chat-column ${
          isSmallScreen
            ? !hasSelectedChat
              ? "hidden"
              : "flex w-full h-full"
            : "flex-1 min-w-0 h-full flex flex-col"
        }`}
      >
        {activeConversation ? (
          <ChatWindow
            conversation={activeConversation}
            messages={messages}
            currentUserId={currentUserId}
            onSendMessage={handleSendMessage}
            activeTypers={[]}
            isLoading={activeMessagesQuery.isPending}
            hasError={activeMessagesQuery.isError}
            isSending={mutations.send.isPending}
            onVideoCall={() => showToast("Calls are not available in the current messaging service.")}
            onAudioCall={() => showToast("Calls are not available in the current messaging service.")}
            onMoreActions={() => showToast("Conversation settings are not available yet.")}
            onBack={isSmallScreen ? handleBackToConversations : undefined}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            {conversationsPending ? "Loading your conversations…" : conversationsError ? "Conversations could not be loaded." : "Select a conversation to start chatting"}
          </div>
        )}
      </div>

      {/* Column 3: Context & Info Sidebar (~280px) */}
      {activeConversation && (
        <div className="w-70 shrink-0 h-full hidden lg:flex flex-col">
          <ChatContextSidebar
            conversation={activeConversation}
            onViewProfile={() => showToast(`Opening ${activeConversation.recipient.name}'s profile...`)}
            onSearchInChat={() => showToast("Search within this conversation")}
            onMute={() => showToast(`Muted notifications for ${activeConversation.title}`)}
            onArchive={() => showToast(`Archived conversation with ${activeConversation.title}`)}
            onBlock={() => showToast(`Blocked ${activeConversation.title}`)}
            onFileClick={(file) => showToast(`Opening file: ${file.name}`)}
          />
        </div>
      )}
    </div>
  );
};
