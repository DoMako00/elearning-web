import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  HelpHeroBanner,
  CategoryGrid,
  PopularArticles,
  SupportSidebar,
  CategoryArticlesModal,
  ArticleDetailModal,
  CreateTicketModal,
  TicketsListModal,
} from "./components";
import {
  HELP_CATEGORIES,
  POPULAR_ARTICLES,
  HELP_RESOURCES,
  ALL_CATEGORY_ARTICLES,
} from "./data/helpCenterData";
import type { HelpCategory, HelpArticle, SupportTicket, HelpResourceLink } from "../../types/help";
import { ToastNotification } from "../../components/ui/ToastNotification";
import { useToast } from "../../hooks/useToast";
import { useStudentConversations, useStudentMessageMutations } from "../student/api/useStudentMessages";

export const HelpCenter: React.FC = () => {
  const navigate = useNavigate();
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const conversationsQuery = useStudentConversations();
  const messages = useStudentMessageMutations();
  const tickets: SupportTicket[] = (conversationsQuery.data ?? []).filter(item => item.type === "admin_support").map(item => ({
    id: item.id,
    ticketNumber: `#${item.id.slice(0, 8).toUpperCase()}`,
    title: item.title,
    category: "Support",
    description: item.lastMessage?.body,
    createdAt: new Date(item.updatedAt).toLocaleString(),
    status: item.status === "open" ? "Open" : "Resolved",
    iconType: "file-text",
  }));

  // Modals state
  const [selectedCategory, setSelectedCategory] = useState<HelpCategory | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);

  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [isTicketsListOpen, setIsTicketsListOpen] = useState(false);

  // Toast notifications
  const { toastMessage, showToast } = useToast();

  // Keyboard shortcut listener: Cmd + K or Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filtered popular articles when searching
  const displayedArticles = useMemo(() => {
    if (!searchQuery.trim()) return POPULAR_ARTICLES;
    const q = searchQuery.toLowerCase();
    // Gather all articles across categories
    const all = Object.values(ALL_CATEGORY_ARTICLES).flat();
    return all.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.content.overview.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Handlers
  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
    searchInputRef.current?.focus();
  };

  const handleCategorySelect = (category: HelpCategory) => {
    setSelectedCategory(category);
    setIsCategoryModalOpen(true);
  };

  const handleArticleSelect = (article: HelpArticle) => {
    setSelectedArticle(article);
    setIsArticleModalOpen(true);
  };

  const handleArticleFromCategory = (article: HelpArticle) => {
    // Keep category context if we want to return
    setSelectedArticle(article);
    setIsArticleModalOpen(true);
  };

  const handleBackToCategory = () => {
    setIsArticleModalOpen(false);
    if (selectedCategory) {
      setIsCategoryModalOpen(true);
    }
  };

  const handleCreateTicketSubmit = async (
    newTicketData: Omit<SupportTicket, "id" | "ticketNumber" | "createdAt" | "status">
  ) => {
    await messages.startSupport.mutateAsync({
      subject: `${newTicketData.category}: ${newTicketData.title}`.slice(0, 240),
      body: newTicketData.description ?? "",
    });
    showToast("Support conversation saved. Replies will appear in Messages.");
  };

  const handleResourceClick = (res: HelpResourceLink) => {
    navigate(res.url);
  };

  return (
    <div className="help-center-root w-full h-full flex flex-col min-h-0">
      <ToastNotification message={toastMessage} />

      {/* Main Responsive Layout:
          Desktop & iPad Landscape: 2 columns side by side, natural gap, no overlapping
          Tablet / Mobile: stacked columns with natural fluid scrolling
      */}
      <div className="help-center-columns flex flex-col lg:flex-row items-stretch lg:items-start gap-4 xl:gap-5 w-full">
        
        {/* Left Main Column: flex-1, contains Hero, Categories, Popular Articles */}
        <div className="help-center-main-col flex-1 overflow-y-auto flex flex-col gap-4 min-w-0">
          {/* 1. Hero Support Banner */}
          <HelpHeroBanner
            inputRef={searchInputRef}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onTagClick={handleTagClick}
          />

          {/* 2. Browse by Category (2x4 Grid) */}
          <CategoryGrid
            categories={HELP_CATEGORIES}
            onSelectCategory={handleCategorySelect}
            onViewAllCategories={() => {
              setSelectedCategory(HELP_CATEGORIES[0]);
              setIsCategoryModalOpen(true);
            }}
          />

          {/* 3. Popular Articles Grid (3x3 or 3x2) */}
          <PopularArticles
            articles={displayedArticles.slice(0, 9)}
            onSelectArticle={handleArticleSelect}
            onViewAllArticles={() => {
              setSelectedCategory(HELP_CATEGORIES[0]);
              setIsCategoryModalOpen(true);
            }}
          />
        </div>

        {/* Right Sidebar Column (~320px): Submit Ticket CTA, Recent Tickets, Live Chat, Help Resources */}
        <SupportSidebar
          tickets={tickets}
          resources={HELP_RESOURCES}
          onCreateTicketClick={() => setIsCreateTicketOpen(true)}
          onStartLiveChatClick={() => navigate("/messages")}
          onViewAllTicketsClick={() => setIsTicketsListOpen(true)}
          onSelectTicket={() => {
            setIsTicketsListOpen(true);
          }}
          onSelectResource={handleResourceClick}
        />
        {conversationsQuery.isLoading && <p role="status" className="px-2 text-xs text-gray-500">Loading saved support conversations…</p>}
        {conversationsQuery.isError && <p role="alert" className="px-2 text-xs text-rose-700">{conversationsQuery.error instanceof Error ? conversationsQuery.error.message : "Saved support conversations could not be loaded."} <button type="button" onClick={() => void conversationsQuery.refetch()}>Retry</button></p>}
      </div>

      {/* Interactive Modals */}
      {/* Category Articles Modal */}
      <CategoryArticlesModal
        isOpen={isCategoryModalOpen}
        category={selectedCategory}
        allCategories={HELP_CATEGORIES}
        onClose={() => setIsCategoryModalOpen(false)}
        onSelectArticle={(article) => {
          handleArticleFromCategory(article);
        }}
        onSwitchCategory={(cat) => setSelectedCategory(cat)}
      />

      {/* Article Detail Reader Modal */}
      <ArticleDetailModal
        isOpen={isArticleModalOpen}
        article={selectedArticle}
        onClose={() => setIsArticleModalOpen(false)}
        onBackToCategory={selectedCategory ? handleBackToCategory : undefined}
        onSelectRelatedArticle={(art) => setSelectedArticle(art)}
      />

      {/* Submit Support Ticket Modal */}
      <CreateTicketModal
        isOpen={isCreateTicketOpen}
        onClose={() => setIsCreateTicketOpen(false)}
        onSubmitTicket={handleCreateTicketSubmit}
      />

      {/* View All Tickets Modal */}
      <TicketsListModal
        isOpen={isTicketsListOpen}
        tickets={tickets}
        onClose={() => setIsTicketsListOpen(false)}
        onCreateTicketClick={() => setIsCreateTicketOpen(true)}
      />

    </div>
  );
};
