import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  HelpHeroBanner,
  CategoryGrid,
  PopularArticles,
  SupportSidebar,
  CategoryArticlesModal,
  ArticleDetailModal,
  CreateTicketModal,
  LiveChatDrawer,
  TicketsListModal,
} from "./components";
import {
  HELP_CATEGORIES,
  POPULAR_ARTICLES,
  RECENT_SUPPORT_TICKETS,
  HELP_RESOURCES,
  ALL_CATEGORY_ARTICLES,
} from "./data/helpCenterData";
import type { HelpCategory, HelpArticle, SupportTicket, HelpResourceLink } from "../../types/help";
import { ToastNotification } from "../../components/ui/ToastNotification";
import { useToast } from "../../hooks/useToast";

export const HelpCenter: React.FC = () => {
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Tickets state
  const [tickets, setTickets] = useState<SupportTicket[]>(RECENT_SUPPORT_TICKETS);

  // Modals state
  const [selectedCategory, setSelectedCategory] = useState<HelpCategory | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);

  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [isTicketsListOpen, setIsTicketsListOpen] = useState(false);
  const [isLiveChatOpen, setIsLiveChatOpen] = useState(false);

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

  const handleCreateTicketSubmit = (
    newTicketData: Omit<SupportTicket, "id" | "ticketNumber" | "createdAt" | "status">
  ) => {
    const newTicket: SupportTicket = {
      ...newTicketData,
      id: `tick-${Date.now()}`,
      ticketNumber: `#GL-${Math.floor(Math.random() * 9000 + 1000)}`,
      createdAt: "Just now",
      status: "Open",
    };
    setTickets((prev) => [newTicket, ...prev]);
    showToast("Support ticket created successfully! We will contact you soon.");
  };

  const handleResourceClick = (res: HelpResourceLink) => {
    if (res.title.toLowerCase().includes("video")) {
      const videoArticle = POPULAR_ARTICLES.find((a) => a.iconName === "PlayCircle");
      if (videoArticle) {
        setSelectedArticle(videoArticle);
        setIsArticleModalOpen(true);
        return;
      }
    }
    showToast(`Opening ${res.title}...`);
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
        <div className="help-center-main-col flex-1 flex flex-col gap-4 min-w-0">
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
          onStartLiveChatClick={() => setIsLiveChatOpen(true)}
          onViewAllTicketsClick={() => setIsTicketsListOpen(true)}
          onSelectTicket={(ticket) => {
            showToast(`Viewing ticket ${ticket.ticketNumber}: ${ticket.title}`);
            setIsTicketsListOpen(true);
          }}
          onSelectResource={handleResourceClick}
        />
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

      {/* Live Chat Floating Drawer */}
      <LiveChatDrawer
        isOpen={isLiveChatOpen}
        onClose={() => setIsLiveChatOpen(false)}
      />
    </div>
  );
};
