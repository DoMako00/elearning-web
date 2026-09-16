import React, { useState, useMemo } from "react";
import {
  HelpCircle,
  FileText,
  CreditCard,
  User,
  BookOpen,
  Settings2,
  Award,
  Users,
  MoreHorizontal,
  ChevronRight,
  CheckCircle2,
  Clock,
  Smartphone,
  Info,
  ShieldCheck,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { TopAppBar } from "../TopAppBar";
import { useScreenStack } from "../ScreenStack";
import { HeroBand } from "../shared/HeroBand";
import { MobileSearchBar } from "../shared/MobileSearchBar";
import { CategoryChipsRow } from "../shared/CategoryChipsRow";
import { SectionHeader } from "../shared/SectionHeader";
import { ReminderRow } from "../shared/ReminderRow";
import { MobileToast } from "../shared/MobileToast";
import { FileAttachmentPicker, AttachedFile } from "../shared/FileAttachmentPicker";
import { ChatConversationScreen } from "./ChatConversationScreen";
import {
  HELP_CATEGORIES,
  POPULAR_SEARCH_TAGS,
  RECENT_SUPPORT_TICKETS,
  POPULAR_ARTICLES,
  ALL_CATEGORY_ARTICLES,
} from "../../../features/help/data/helpCenterData";
import type { SupportTicket, HelpArticle } from "../../../types/help";
import emptyLearningJourney from "../../../assets/empty-learning-journey.webp";

// Map icon names from data to Lucide icons
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  User: User,
  BookOpen: BookOpen,
  CreditCard: CreditCard,
  Settings2: Settings2,
  FileText: FileText,
  Award: Award,
  Users: Users,
  MoreHorizontal: MoreHorizontal,
};

export const HelpCenterScreen: React.FC = () => {
  const { push } = useScreenStack();
  const [searchQuery, setSearchQuery] = useState("");
  const [activePopularTag, setActivePopularTag] = useState<string>("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [ticketsList, setTicketsList] = useState<SupportTicket[]>(RECENT_SUPPORT_TICKETS);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  // Convert popular tags into CategoryChipsRow format
  const popularChips = useMemo(() => {
    return [
      { key: "all", label: "All Issues" },
      ...POPULAR_SEARCH_TAGS.map((t) => ({ key: t.toLowerCase(), label: t })),
    ];
  }, []);

  // Filtered categories and popular articles based on search or tag selection
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return HELP_CATEGORIES;
    const q = searchQuery.toLowerCase();
    return HELP_CATEGORIES.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Navigate to Submit Ticket
  const handleOpenNewTicket = () => {
    push({
      id: "help-ticket-new",
      title: "Submit Support Ticket",
      tabRoot: "settings",
      variant: "detail",
      backLabel: "Help",
      component: (
        <SubmitTicketSubScreen
          onSubmitTicket={(newTicket) => {
            setTicketsList((prev) => [newTicket, ...prev]);
            showToast("Ticket submitted — we'll get back to you soon.");
            // Deep link / push to the newly created ticket detail
            push({
              id: `help-ticket-${newTicket.id}`,
              title: newTicket.ticketNumber,
              tabRoot: "settings",
              variant: "detail",
              backLabel: "Help",
              component: <TicketDetailSubScreen ticket={newTicket} />,
            });
          }}
        />
      ),
    });
  };

  // Navigate to Ticket Detail
  const handleOpenTicketDetail = (ticket: SupportTicket) => {
    push({
      id: `help-ticket-${ticket.id}`,
      title: ticket.ticketNumber,
      tabRoot: "settings",
      variant: "detail",
      backLabel: "Help",
      component: <TicketDetailSubScreen ticket={ticket} />,
    });
  };

  // Navigate to Category Articles
  const handleOpenCategory = (categoryId: string, categoryTitle: string) => {
    push({
      id: `help-category-${categoryId}`,
      title: categoryTitle,
      tabRoot: "settings",
      variant: "detail",
      backLabel: "Help",
      component: (
        <CategoryArticlesSubScreen
          categoryId={categoryId}
          categoryTitle={categoryTitle}
        />
      ),
    });
  };

  // Navigate to Support Chat (seeded with c6)
  const handleOpenSupportChat = () => {
    push({
      id: "chat-c6",
      title: "GreenLearn Support",
      tabRoot: "settings",
      variant: "detail",
      backLabel: "Help",
      component: (
        <ChatConversationScreen
          conversationId="c6"
          initialName="GreenLearn Support"
          initialRole="Platform Help & Student Success"
          initialInitials="GL"
          backLabel="Help"
        />
      ),
    });
  };

  // Navigate to Device Info (Promo Card)
  const handleOpenDeviceLimitInfo = () => {
    push({
      id: "help-device-limit-info",
      title: "Single-Device Access",
      tabRoot: "settings",
      variant: "detail",
      backLabel: "Help",
      component: <DeviceAccessInfoSubScreen />,
    });
  };

  // Popular tag selection handler
  const handleTagSelect = (key: string) => {
    setActivePopularTag(key);
    if (key === "all") {
      setSearchQuery("");
    } else {
      setSearchQuery(key);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
      <MobileToast message={toastMessage} />

      {/* 1. TopAppBar variant="main" */}
      <TopAppBar variant="main" />

      {/* Main scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/* 2. HeroBand with headset/learning mascot illustration */}
        <HeroBand
          eyebrow="Support Desk"
          heading="Help Center"
          subtitle="We're here to help."
          illustration={
            <div className="relative w-32 h-24 sm:w-36 sm:h-28 flex items-center justify-end">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-emerald-200/40 rounded-full blur-xl pointer-events-none" />
              <img
                src={emptyLearningJourney}
                alt="Help illustration"
                className="w-full h-full object-contain relative z-10 drop-shadow-sm select-none"
              />
            </div>
          }
        />

        <div className="px-4 pb-20 space-y-5 max-w-lg mx-auto">
          {/* 3. MobileSearchBar */}
          <MobileSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search for help (e.g. 'video playback')"
          />

          {/* 4. Popular Issues Pills */}
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
              Popular issues
            </p>
            <CategoryChipsRow
              categories={popularChips}
              activeKey={activePopularTag}
              onChange={handleTagSelect}
            />
          </div>

          {/* 5. Promo Card ("Single-device access by default...") */}
          <div
            onClick={handleOpenDeviceLimitInfo}
            className="p-3.5 bg-linear-to-r from-emerald-50 via-teal-50/70 to-white rounded-2xl border border-emerald-200/80 shadow-2xs flex items-center justify-between gap-3 cursor-pointer hover:border-emerald-300 transition-all select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                  Single-device access by default
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  Learn how session locking and device seats work
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>

          {/* 6. Submit a Support Ticket Button */}
          <button
            type="button"
            onClick={handleOpenNewTicket}
            className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer select-none"
          >
            <FileText className="w-4 h-4" />
            <span>Submit a Support Ticket</span>
          </button>

          {/* 7. Recent Tickets */}
          <div className="space-y-2.5">
            <SectionHeader
              title="Recent Tickets"
              actionLabel="New Ticket"
              onAction={handleOpenNewTicket}
            />
            <div className="space-y-2">
              {ticketsList.slice(0, 3).map((ticket) => {
                const statusColor =
                  ticket.status === "Open"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : ticket.status === "In review"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200";

                return (
                  <ReminderRow
                    key={ticket.id}
                    reminder={{
                      id: ticket.id,
                      title: ticket.title,
                      type: "assignment",
                      dateLabel: `${ticket.ticketNumber} · ${ticket.createdAt}`,
                      unread: ticket.status === "Open",
                      icon: FileText,
                      badgeBg: statusColor,
                      badgeText: ticket.status,
                      iconBg: "bg-emerald-50",
                      iconColor: "text-emerald-600",
                      iconBorder: "border-emerald-200/50",
                    }}
                    onClick={() => handleOpenTicketDetail(ticket)}
                  />
                );
              })}
            </div>
          </div>

          {/* 8. Browse Help Categories - 2-Column Grid */}
          <div className="space-y-2.5">
            <SectionHeader title="Browse Help Categories" />
            <div className="grid grid-cols-2 gap-2.5">
              {filteredCategories.map((category) => {
                const IconComponent =
                  CATEGORY_ICONS[category.iconName] || HelpCircle;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleOpenCategory(category.id, category.title)}
                    className="p-3 bg-white rounded-2xl border border-slate-100 shadow-2xs hover:border-emerald-200 hover:shadow-xs text-left flex flex-col justify-between transition-all cursor-pointer select-none group"
                  >
                    <div>
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:bg-emerald-100/80 transition-colors">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-1">
                        {category.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                        {category.description}
                      </p>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-50 flex items-center justify-between text-[10px] text-emerald-700 font-semibold">
                      <span>{category.articleCount || 10} articles</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 9. "Need more help? Start Chat" card */}
          <div className="p-4 bg-linear-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-3xl text-white shadow-sm flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-emerald-200 text-[11px] font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Support Desk</span>
              </div>
              <h3 className="text-sm font-bold text-white mt-1">
                Need more help? Start Chat
              </h3>
              <p className="text-xs text-emerald-100/80 mt-0.5 leading-relaxed">
                Connect directly with our student support team.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenSupportChat}
              className="px-3.5 py-2 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              Start Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// SUB-SCREENS FOR HELP CENTER
// ==========================================

// Sub-screen 1: Submit Ticket Screen
export const SubmitTicketSubScreen: React.FC<{
  onSubmitTicket: (ticket: SupportTicket) => void;
}> = ({ onSubmitTicket }) => {
  const { pop } = useScreenStack();
  const [category, setCategory] = useState("Technical Issues");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const newTicket: SupportTicket = {
        id: `tick-${Date.now()}`,
        ticketNumber: `#GL-${Math.floor(1000 + Math.random() * 9000)}`,
        title: subject.trim() || `${category} Support Request`,
        status: "Open",
        createdAt: "Just now",
        category,
        description: description.trim(),
        iconType: category === "Technical Issues" ? "video" : "file-text",
      };
      setIsSubmitting(false);
      onSubmitTicket(newTicket);
    }, 400);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
      <TopAppBar
        variant="detail"
        title="Submit Support Ticket"
        backLabel="Help"
        onBack={pop}
      />

      <form
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto p-4 space-y-4 max-w-lg mx-auto w-full pb-20"
      >
        <div className="bg-white rounded-3xl border border-slate-100 p-4 space-y-3.5 shadow-2xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Help Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-emerald-500"
            >
              <option value="Technical Issues">Technical Issues (Video, Browser)</option>
              <option value="Account & Login">Account & Login</option>
              <option value="Payments & Subscriptions">Payments & Subscriptions</option>
              <option value="Devices & Access">Devices & Access Limits</option>
              <option value="Assignments & Exams">Assignments & Exams</option>
              <option value="Certificates">Certificates</option>
              <option value="Other">Other Issues</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Document reader won't load PDF"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Describe your issue
            </label>
            <textarea
              required
              rows={4}
              placeholder="Please provide details about what happened..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-emerald-500 leading-relaxed"
            />
          </div>

          {/* FileAttachmentPicker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Attachments (optional)
            </label>
            <FileAttachmentPicker
              attachments={attachments}
              onAddAttachment={(file) => setAttachments((prev) => [...prev, file])}
              onRemoveAttachment={(id) =>
                setAttachments((prev) => prev.filter((a) => a.id !== id))
              }
              maxFiles={3}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !description.trim()}
          className={`w-full py-3 rounded-2xl text-white font-bold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer select-none ${
            isSubmitting || !description.trim()
              ? "bg-slate-300 text-slate-500 cursor-not-allowed"
              : "bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99]"
          }`}
        >
          {isSubmitting ? "Submitting Ticket..." : "Submit Ticket"}
        </button>
      </form>
    </div>
  );
};

// Sub-screen 2: Ticket Detail Screen
export const TicketDetailSubScreen: React.FC<{
  ticket: SupportTicket;
}> = ({ ticket }) => {
  const { pop } = useScreenStack();

  const statusColor =
    ticket.status === "Open"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : ticket.status === "In review"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
      <TopAppBar
        variant="detail"
        title={ticket.ticketNumber}
        backLabel="Help"
        onBack={pop}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-lg mx-auto w-full pb-20">
        {/* Ticket Header Card */}
        <div className="bg-white rounded-3xl border border-slate-100 p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusColor}`}
            >
              {ticket.status}
            </span>
            <span className="text-[11px] text-slate-400">{ticket.createdAt}</span>
          </div>

          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
              {ticket.title}
            </h2>
            <p className="text-xs text-emerald-700 font-medium mt-0.5">
              Category: {ticket.category}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 text-xs text-slate-700 leading-relaxed bg-slate-50/60 p-3 rounded-2xl">
            {ticket.description}
          </div>
        </div>

        {/* History / Thread timeline */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Status Activity
          </h3>
          <div className="bg-white rounded-3xl border border-slate-100 p-4 divide-y divide-slate-100 shadow-2xs text-xs space-y-3">
            <div className="flex items-start gap-3 pt-1">
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 leading-tight">
                  Ticket received
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Logged into the support queue and assigned to an agent.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-3">
              <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 leading-tight">
                  Typical response time
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Our specialists usually answer within 2-4 hours on active weekdays.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-screen 3: Category Articles SubScreen
export const CategoryArticlesSubScreen: React.FC<{
  categoryId: string;
  categoryTitle: string;
}> = ({ categoryId, categoryTitle }) => {
  const { pop, push } = useScreenStack();

  const articles = ALL_CATEGORY_ARTICLES[categoryId] || POPULAR_ARTICLES.slice(0, 3);

  const handleOpenArticle = (article: HelpArticle) => {
    push({
      id: `help-article-${article.id}`,
      title: "Help Guide",
      tabRoot: "settings",
      variant: "detail",
      backLabel: categoryTitle,
      component: <ArticleDetailSubScreen article={article} backLabel={categoryTitle} />,
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
      <TopAppBar
        variant="detail"
        title={categoryTitle}
        backLabel="Help"
        onBack={pop}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-w-lg mx-auto w-full pb-20">
        <p className="text-xs text-slate-500 px-1 mb-1">
          Articles and document guides for {categoryTitle}.
        </p>

        <div className="bg-white rounded-3xl border border-slate-100 divide-y divide-slate-100 overflow-hidden shadow-2xs">
          {articles.map((art) => (
            <button
              key={art.id}
              type="button"
              onClick={() => handleOpenArticle(art)}
              className="w-full p-4 flex items-start justify-between gap-3 text-left hover:bg-slate-50/80 transition-colors cursor-pointer select-none"
            >
              <div className="min-w-0 flex-1">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                  {art.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                  {art.description}
                </p>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                  <span>{art.readTime || "3 min read"}</span>
                  <span>·</span>
                  <span>{art.lastUpdated || "Recently updated"}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mt-1" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Sub-screen 4: Article Detail (Reading view + Was this helpful?)
export const ArticleDetailSubScreen: React.FC<{
  article: HelpArticle;
  backLabel?: string;
}> = ({ article, backLabel = "Back" }) => {
  const { pop } = useScreenStack();
  const [feedback, setFeedback] = useState<"yes" | "no" | null>(null);

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
      <TopAppBar
        variant="detail"
        title="Article"
        backLabel={backLabel}
        onBack={pop}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-lg mx-auto w-full pb-20">
        <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4 shadow-2xs">
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10.5px] font-bold border border-emerald-200/50 mb-2">
              {article.readTime || "3 min read"}
            </span>
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
              {article.title}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Updated {article.lastUpdated || "2 days ago"} · {article.views || "12.4k"} views
            </p>
          </div>

          {/* Overview text */}
          <div className="text-xs text-slate-700 leading-relaxed border-t border-slate-100 pt-3">
            {article.content?.overview || article.description}
          </div>

          {/* Step-by-step instructions */}
          {article.content?.steps && article.content.steps.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Step-by-Step Instructions
              </h3>
              <div className="space-y-2.5">
                {article.content.steps.map((step) => (
                  <div
                    key={step.stepNumber}
                    className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100"
                  >
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10.5px] flex items-center justify-center shrink-0 mt-0.5">
                      {step.stepNumber}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 leading-snug">
                        {step.title}
                      </p>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Callout / Note */}
          {article.content?.callout && (
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/70 rounded-2xl text-xs text-emerald-900 leading-relaxed flex items-start gap-2.5">
              <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span>{article.content.callout.text}</span>
            </div>
          )}

          {/* Was this helpful? control */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-700">Was this article helpful?</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFeedback("yes")}
                className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                  feedback === "yes"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Yes</span>
              </button>
              <button
                type="button"
                onClick={() => setFeedback("no")}
                className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                  feedback === "no"
                    ? "bg-rose-600 text-white border-rose-600"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
                <span>No</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-screen 5: Device Access Info Screen (Deep-linked from Promo Card)
export const DeviceAccessInfoSubScreen: React.FC = () => {
  const { pop } = useScreenStack();

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
      <TopAppBar
        variant="detail"
        title="Devices & Access Policy"
        backLabel="Help"
        onBack={pop}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-lg mx-auto w-full pb-20">
        <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-3.5 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">
            Single-Device Access by Default
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            To safeguard student learning credentials and protected medical documents, your GreenLearn account is restricted to one active device session at a time on the Free Plan.
          </p>

          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-700">
            <h3 className="font-bold text-slate-900">How session switching works:</h3>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Signing in on a new device will sign you out of previous sessions.</li>
              <li>Offline downloaded documents will remain stored securely on your local device.</li>
              <li>To use multiple simultaneous devices, upgrade to the <strong>Friends & Study Group Plan</strong> in Settings.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
