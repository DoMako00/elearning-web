import React, { useState } from "react";
import { Clock, BookOpen, Tag, AlignLeft, Calendar } from "lucide-react";
import { BottomSheet } from "./BottomSheet";
import type { CalendarEvent, EventType } from "../../ui/Calendar/calendar.types";

export interface AddEventSheetProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate: string; // YYYY-MM-DD
  onAddEvent: (event: CalendarEvent) => void;
}

const EVENT_TYPE_OPTIONS: { type: EventType; label: string; colorClass: string }[] = [
  { type: "study_block", label: "Study Block", colorClass: "bg-amber-50 text-amber-800 border-amber-200" },
  { type: "live_session", label: "Live Session", colorClass: "bg-blue-50 text-blue-800 border-blue-200" },
  { type: "quiz", label: "Quiz", colorClass: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { type: "assignment", label: "Assignment", colorClass: "bg-indigo-50 text-indigo-800 border-indigo-200" },
  { type: "office_hours", label: "Office Hours", colorClass: "bg-purple-50 text-purple-800 border-purple-200" },
];

export const AddEventSheet: React.FC<AddEventSheetProps> = ({
  isOpen,
  onClose,
  defaultDate,
  onAddEvent,
}) => {
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState<EventType>("study_block");
  const [courseTitle, setCourseTitle] = useState("");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Format display time
    const formatHourDisplay = (time24: string) => {
      const [hStr, mStr] = time24.split(":");
      let h = parseInt(hStr, 10);
      const ampm = h >= 12 ? "PM" : "AM";
      if (h === 0) h = 12;
      else if (h > 12) h -= 12;
      return `${h}:${mStr} ${ampm}`;
    };

    const startDisplay = formatHourDisplay(startTime);
    const endDisplay = formatHourDisplay(endTime);

    const newEvent: CalendarEvent = {
      id: `evt-${Date.now()}`,
      title: title.trim(),
      type: eventType,
      date,
      startTime: startDisplay,
      endTime: endDisplay,
      displayTime: `${startDisplay} - ${endDisplay}`,
      courseTitle: courseTitle.trim() || undefined,
      description: description.trim() || undefined,
      status: "upcoming",
    };

    onAddEvent(newEvent);
    // Reset fields
    setTitle("");
    setCourseTitle("");
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

        {/* Type Selector Pills */}
        <div>
          <label className=" text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
            <Tag className="size-3.5 text-slate-400" />
            <span>Event Type</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {EVENT_TYPE_OPTIONS.map((opt) => {
              const isSelected = opt.type === eventType;
              return (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setEventType(opt.type)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none ${
                    isSelected
                      ? `${opt.colorClass} ring-2 ring-emerald-500/30 font-black shadow-xs scale-102`
                      : "bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Course / Module */}
        <div>
          <label className=" text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
            <BookOpen className="size-3.5 text-slate-400" />
            <span>Course / Module (Optional)</span>
          </label>
          <input
            type="text"
            value={courseTitle}
            onChange={(e) => setCourseTitle(e.target.value)}
            placeholder="e.g. Medical Physiology or Anatomy"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
          />
        </div>

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
