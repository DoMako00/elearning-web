import { X } from "lucide-react";
import { useState, type FormEvent } from "react";

interface CreateThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (post: {
    title: string;
    body: string;
    categoryKey: string;
  }) => void | Promise<void>;
  isSubmitting?: boolean;
  errorMessage?: string | null;
}

export function CreateThreadModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  errorMessage = null,
}: CreateThreadModalProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("general");

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || isSubmitting) return;

    try {
      await onSubmit({
        title: title.trim(),
        body: body.trim(),
        categoryKey: category,
      });
    } catch {
      return;
    }

    setTitle("");
    setBody("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">
            Start a new discussion
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="size-8 grid place-items-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label htmlFor="community-discussion-body" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Your question or discussion
            </label>
            <textarea
              id="community-discussion-body"
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={20000}
              rows={4}
              placeholder="Ask about course content, share a clinical case, or discuss exam preparation."
              className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-y"
            />
          </div>

          <div>
            <label htmlFor="community-discussion-title" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Discussion title
            </label>
            <input
              id="community-discussion-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., How can I distinguish viral from bacterial meningitis?"
              className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div>
            <label htmlFor="community-discussion-category" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <select
              id="community-discussion-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="general">General discussion</option>
              <option value="react">Course question</option>
              <option value="design">Clinical case</option>
              <option value="datascience">Exam preparation</option>
              <option value="backend">Study resources</option>
            </select>
          </div>

          <div className="mt-4 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            {errorMessage && <p role="alert" className="mr-auto text-xs text-rose-700">{errorMessage}</p>}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !body.trim() || isSubmitting}
              className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {isSubmitting ? "Publishing…" : "Publish thread"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
