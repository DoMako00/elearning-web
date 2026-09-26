import { X } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { DiscussionPost } from "../types/community";

interface CreateThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (post: {
    title: string;
    categoryKey: string;
    categoryLabel: string;
    topicIcon: DiscussionPost["topicIcon"];
  }) => void;
}

export function CreateThreadModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateThreadModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("react");

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let topicIcon: DiscussionPost["topicIcon"] = "atom";
    let categoryLabel = "React";

    if (category === "design") {
      topicIcon = "palette";
      categoryLabel = "Design";
    } else if (category === "datascience") {
      topicIcon = "chart";
      categoryLabel = "Data Science";
    } else if (category === "backend") {
      topicIcon = "cubes";
      categoryLabel = "Backend";
    }

    onSubmit({
      title: title.trim(),
      categoryKey: category,
      categoryLabel,
      topicIcon,
    });

    setTitle("");
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
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Topic / Question Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., How do you organize custom hooks in large React apps?"
              className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="react">React & Next.js</option>
              <option value="design">UI/UX Design</option>
              <option value="datascience">Data Science & AI</option>
              <option value="backend">Backend & Architecture</option>
            </select>
          </div>

          <div className="mt-4 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Publish thread
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
