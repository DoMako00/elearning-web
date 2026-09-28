import React from "react";
import {
  Send,
  Video,
  CreditCard,
  Smartphone,
  FileText,
  MessageSquare,
  ArrowRight,
  PlayCircle,
  Megaphone,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import type { SupportTicket, HelpResourceLink } from "../../../types/help";

const TICKET_ICON_MAP: Record<string, LucideIcon> = {
  video: Video,
  "credit-card": CreditCard,
  smartphone: Smartphone,
  "file-text": FileText,
};

const RESOURCE_ICON_MAP: Record<string, LucideIcon> = {
  FileText: FileText,
  PlayCircle: PlayCircle,
  Megaphone: Megaphone,
};

interface SupportSidebarProps {
  tickets: SupportTicket[];
  resources: HelpResourceLink[];
  onCreateTicketClick: () => void;
  onStartLiveChatClick: () => void;
  onViewAllTicketsClick: () => void;
  onSelectTicket?: (ticket: SupportTicket) => void;
  onSelectResource?: (resource: HelpResourceLink) => void;
}

export const SupportSidebar: React.FC<SupportSidebarProps> = ({
  tickets,
  resources,
  onCreateTicketClick,
  onStartLiveChatClick,
  onViewAllTicketsClick,
  onSelectTicket,
  onSelectResource,
}) => {
  const getStatusBadge = (status: SupportTicket["status"]) => {
    switch (status) {
      case "Open":
        return (
          <span className="px-2 py-0.5 text-[10.5px] font-semibold text-blue-600 bg-blue-50 border border-blue-200/80 rounded-full">
            Open
          </span>
        );
      case "In review":
        return (
          <span className="px-2 py-0.5 text-[10.5px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 rounded-full">
            In review
          </span>
        );
      case "Resolved":
        return (
          <span className="px-2 py-0.5 text-[10.5px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-full">
            Resolved
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <aside
      aria-label="Support sidebar"
      className="flex flex-col gap-2.5 sm:gap-3 w-full lg:w-77.5 xl:w-82.5 shrink-0 min-h-0"
    >
      {/* 1. Dark Emerald CTA: Submit a support ticket */}
      <div className="relative rounded-2xl bg-[#095837] text-white p-3.5 sm:p-4 shadow-sm overflow-hidden flex flex-col justify-between shrink-0">
        {/* Subtle decorative glow */}
        <div className="absolute -top-6 -right-6 w-28 h-28 bg-emerald-400/15 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-start gap-3 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-white/12 border border-white/10 flex items-center justify-center text-emerald-200 shrink-0">
            <Send className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-white tracking-tight leading-snug">
              Submit a support ticket
            </h3>
            <p className="mt-1 text-xs text-emerald-100/80 leading-relaxed">
              Can't find what you're looking for? Our support team will help you.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCreateTicketClick}
          className="mt-3.5 w-full py-2 px-3.5 rounded-xl bg-white text-emerald-950 font-semibold text-xs inline-flex items-center justify-center gap-1.5 hover:bg-emerald-50 active:scale-[0.99] transition-all shadow-xs group cursor-pointer"
        >
          <span>Create a new ticket</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* 2. Your Recent Tickets Widget */}
      <div className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-3.5 shadow-2xs shrink-0 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs sm:text-[13px] font-bold text-gray-900 tracking-tight flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Your recent tickets
          </h3>
          <button
            type="button"
            onClick={onViewAllTicketsClick}
            className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer group"
          >
            <span>View all</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Tickets List */}
        <div className="divide-y divide-gray-50 flex flex-col">
          {tickets.slice(0, 3).map((ticket) => {
            const IconComp = TICKET_ICON_MAP[ticket.iconType] || FileText;
            return (
              <button
                key={ticket.id}
                type="button"
                onClick={() => onSelectTicket?.(ticket)}
                className="py-2 first:pt-1 last:pb-1 flex items-center justify-between text-left hover:bg-gray-50/60 -mx-1.5 px-1.5 rounded-lg transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <IconComp className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-semibold text-gray-900 truncate group-hover:text-emerald-700 transition-colors">
                      {ticket.title}
                    </h4>
                    <p className="text-[10.5px] text-gray-400 truncate">
                      {ticket.ticketNumber} • {ticket.createdAt}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">{getStatusBadge(ticket.status)}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Need Immediate Help Widget */}
      <div className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-3.5 shadow-2xs shrink-0 flex flex-col">
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-[13px] font-bold text-gray-900 tracking-tight leading-snug">
              Need immediate help?
            </h3>
            <p className="text-[11px] text-gray-500 truncate">Chat with our support team.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onStartLiveChatClick}
          className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 font-semibold text-xs inline-flex items-center justify-center gap-2 border border-emerald-200/80 transition-all cursor-pointer group shadow-2xs"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
          </span>
          <span>Start live chat</span>
        </button>

        <p className="mt-2 text-center text-[10px] text-gray-400 font-medium">
          Available daily 9:00 AM – 9:00 PM (GMT+3)
        </p>
      </div>

      {/* 4. Help Resources List */}
      <div className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-3.5 shadow-2xs shrink-0 flex flex-col">
        <h3 className="text-xs sm:text-[13px] font-bold text-gray-900 tracking-tight flex items-center gap-1.5 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Help resources
        </h3>

        <div className="divide-y divide-gray-50 flex flex-col">
          {resources.map((res) => {
            const IconComp = RESOURCE_ICON_MAP[res.iconName] || FileText;
            return (
              <button
                key={res.id}
                type="button"
                onClick={() => onSelectResource?.(res)}
                className="py-1.5 first:pt-0.5 last:pb-0.5 flex items-center justify-between text-left hover:bg-gray-50/60 -mx-1.5 px-1.5 rounded-lg transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50/70 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <IconComp className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-semibold text-gray-800 truncate group-hover:text-emerald-700 transition-colors">
                      {res.title}
                    </h4>
                    <p className="text-[10.5px] text-gray-400 truncate">{res.subtitle}</p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
