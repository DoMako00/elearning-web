import React, { useState } from "react";
import { X, UploadCloud, AlertCircle, Paperclip } from "lucide-react";
import type { SupportTicket } from "../../../types/help";
import { HELP_CATEGORIES } from "../data/helpCenterData";

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitTicket: (ticket: Omit<SupportTicket, "id" | "ticketNumber" | "createdAt" | "status">) => void;
}

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  isOpen,
  onClose,
  onSubmitTicket,
}) => {
  const [subject, setSubject] = useState("");
  const [categoryId, setCategoryId] = useState(HELP_CATEGORIES[0]?.title || "Technical Issues");
  const [description, setDescription] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      setErrorMsg("Please provide a ticket subject.");
      return;
    }
    if (!description.trim()) {
      setErrorMsg("Please describe your issue in detail.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    setTimeout(() => {
      let iconType: SupportTicket["iconType"] = "file-text";
      if (categoryId.toLowerCase().includes("video") || categoryId.toLowerCase().includes("technical")) {
        iconType = "video";
      } else if (categoryId.toLowerCase().includes("payment") || categoryId.toLowerCase().includes("subscription")) {
        iconType = "credit-card";
      } else if (categoryId.toLowerCase().includes("account") || categoryId.toLowerCase().includes("device")) {
        iconType = "smartphone";
      }

      onSubmitTicket({
        title: subject,
        category: categoryId,
        description,
        iconType,
      });

      setIsSubmitting(false);
      setSubject("");
      setDescription("");
      setAttachedFiles([]);
      onClose();
    }, 600);
  };

  const handleSimulateUpload = () => {
    const mockFileName = `screenshot_issue_${Math.floor(Math.random() * 900 + 100)}.png`;
    setAttachedFiles((prev) => [...prev, mockFileName]);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-ticket-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/45 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 bg-linear-to-r from-emerald-50/40 to-white">
          <div>
            <h2 id="create-ticket-title" className="text-base sm:text-lg font-bold text-gray-900">
              Submit a support ticket
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Our support team usually responds within 2-4 business hours.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Subject Field */}
          <div>
            <label htmlFor="ticket-subject" className="block text-xs font-bold text-gray-700 mb-1">
              Issue Subject <span className="text-rose-500">*</span>
            </label>
            <input
              id="ticket-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Video player error on Lesson 4"
              className="w-full h-10 px-3 text-xs sm:text-sm bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <label htmlFor="ticket-category" className="block text-xs font-bold text-gray-700 mb-1">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              id="ticket-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-10 px-3 text-xs sm:text-sm bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
            >
              {HELP_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.title}>
                  {cat.title}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="ticket-description" className="block text-xs font-bold text-gray-700 mb-1">
              Issue Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="ticket-description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide steps to reproduce, what you expected, and what happened..."
              className="w-full p-3 text-xs sm:text-sm bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
            />
          </div>

          {/* Attachment Dropzone */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Attachments (Optional)
            </label>
            <div
              onClick={handleSimulateUpload}
              className="border-2 border-dashed border-gray-200 hover:border-emerald-400 rounded-xl p-4 text-center cursor-pointer bg-gray-50/50 hover:bg-emerald-50/30 transition-all group"
            >
              <UploadCloud className="w-6 h-6 text-gray-400 group-hover:text-emerald-600 mx-auto mb-1 transition-colors" />
              <p className="text-xs font-medium text-gray-700">
                Click to upload screenshots or logs
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">PNG, JPG, PDF up to 10MB</p>
            </div>

            {attachedFiles.length > 0 && (
              <div className="mt-2 space-y-1">
                {attachedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs py-1 px-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                      {file}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAttachedFiles(attachedFiles.filter((_, i) => i !== idx))}
                      className="text-gray-400 hover:text-rose-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200/80 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Submitting..." : "Submit ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
