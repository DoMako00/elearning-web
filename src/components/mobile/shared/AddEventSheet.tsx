import React, { useState } from "react";
import { Clock, AlignLeft, Calendar } from "lucide-react";
import { BottomSheet } from "./BottomSheet";

export interface AddEventSheetProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate: string; // YYYY-MM-DD
  onAddEvent: (event: { title: string; type: "study_block"; date: string; startTime: string; endTime: string; description: string | null }) => Promise<boolean>;
}

export const AddEventSheet: React.FC<AddEventSheetProps> = ({
  isOpen,
  onClose,
  defaultDate,
  onAddEvent,
}) => {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:30");
  const [description, setDescription] = useState("");

  // Sync date if defaultDate changes
  React.useEffect(() => {
    if (defaultDate) {
      setDate(defaultDate);
    }
  }, [defaultDate, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newEvent = { title: title.trim(), type: "study_block" as const, date, startTime, endTime, description: description.trim() || null };

    const saved = await onAddEvent(newEvent);
    if (!saved) return;
    // Reset fields
    setTitle("");
    setDescription("");
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Add to Calendar">
      <form onSubmit={handleSubmit} className="space-y-4 pb-2">
        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Event Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Physiology Revision or Live Q&A"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
          />
        </div>

        <p className="text-[11px] text-slate-500">Personal study block. Academic dates are supplied by your institution.</p>

        {/* Date & Time Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label className=" text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="size-3.5 text-slate-400" />
              <span>Date</span>
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="  text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Clock className="size-3.5 text-slate-400" />
              <span>Start</span>
            </label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <div>
            <label className=" text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Clock className="size-3.5 text-slate-400" />
              <span>End</span>
            </label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Notes / Description */}
        <div>
          <label className=" text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
            <AlignLeft className="size-3.5 text-slate-400" />
            <span>Description / Notes (Optional)</span>
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Key concepts to cover or room/link details..."
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim()}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-2xs active:scale-[0.99] transition-all cursor-pointer"
          >
            Add Event
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
