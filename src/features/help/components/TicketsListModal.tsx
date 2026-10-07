import React, { useState } from "react";
import { X, Search, Ticket, ArrowRight, Clock } from "lucide-react";
import type { SupportTicket } from "../../../types/help";

interface TicketsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: SupportTicket[];
  onCreateTicketClick: () => void;
}

export const TicketsListModal: React.FC<TicketsListModalProps> = ({
  isOpen,
  onClose,
  tickets,
  onCreateTicketClick,
}) => {
  const [filter, setFilter] = useState<"all" | "Open" | "In review" | "Resolved">("all");
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const filteredTickets = tickets.filter((t) => {
    const matchesFilter = filter === "all" || t.status === filter;
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/45 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[85vh] overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 bg-linear-to-r from-emerald-50/40 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Your Support Tickets</h2>
              <p className="text-xs text-gray-500">Track and manage your requests</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="p-3 sm:px-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="relative flex items-center w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tickets..."
              className="w-full h-8 pl-9 pr-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            {(["all", "Open", "In review", "Resolved"] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilter(status)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  filter === status
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-emerald-200"
                }`}
              >
                {status === "all" ? "All Tickets" : status}
              </button>
            ))}
          </div>
        </div>

        {/* Tickets List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-gray-100">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-10">
              <Ticket className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-700">No tickets found</p>
              <p className="text-xs text-gray-400 mt-1">Need help? Open a new support ticket below.</p>
            </div>
          ) : (
            filteredTickets.map((t) => (
              <div
                key={t.id}
                className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {t.ticketNumber}
                    </span>
                    <span className="text-xs text-gray-400">• {t.category}</span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 mt-1">{t.title}</h4>
                  {t.description && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{t.description}</p>
                  )}
                  <div className="mt-1.5 flex items-center gap-1 text-[11px] text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>Created {t.createdAt}</span>
                  </div>
                </div>

                <div className="shrink-0">
                  <span
                    className={`px-2 py-0.5 text-[10.5px] font-semibold rounded-full border ${
                      t.status === "Open"
                        ? "text-blue-600 bg-blue-50 border-blue-200"
                        : t.status === "In review"
                        ? "text-amber-700 bg-amber-50 border-amber-200"
                        : "text-emerald-700 bg-emerald-50 border-emerald-200"
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:px-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium">
            Showing {filteredTickets.length} of {tickets.length} tickets
          </span>
          <button
            type="button"
            onClick={() => {
              onClose();
              onCreateTicketClick();
            }}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <span>Create new ticket</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
