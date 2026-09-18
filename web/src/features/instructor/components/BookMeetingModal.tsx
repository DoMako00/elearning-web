import React, { useState } from "react";
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  CheckCircle2,
  Send,
} from "lucide-react";
import type { InstructorProfile } from "../../../types/instructor";

interface BookMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  instructor: InstructorProfile;
  onConfirmBooking?: (booking: {
    day: string;
    time: string;
    type: string;
    notes: string;
  }) => void;
}

export const BookMeetingModal: React.FC<BookMeetingModalProps> = ({
  isOpen,
  onClose,
  instructor,
  onConfirmBooking,
}) => {
  const [selectedDay, setSelectedDay] = useState<string>(
    instructor.schedule[0]?.day || "Sunday"
  );
  const [selectedTime, setSelectedTime] = useState<string>("10:30 AM");
  const [selectedType, setSelectedType] = useState<string>("Office Hours");
  const [notes, setNotes] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const currentSchedule = instructor.schedule.find((s) => s.day === selectedDay);

  const availableSlots: Record<string, string[]> = {
    Sunday: ["10:00 AM", "10:30 AM", "11:00 AM", "1:00 PM", "1:30 PM"],
    Monday: ["10:00 AM", "10:30 AM", "11:15 AM"],
    Tuesday: ["12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM"],
    Wednesday: ["10:00 AM", "10:30 AM", "11:00 AM", "1:00 PM"],
    Thursday: ["10:00 AM", "10:30 AM", "11:00 AM"],
  };

  const timesForSelectedDay = availableSlots[selectedDay] || [
    "10:00 AM",
    "11:00 AM",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    onConfirmBooking?.({
      day: selectedDay,
      time: selectedTime,
      type: selectedType,
      notes,
    });
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 2200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-meeting-title"
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="book-meeting-title"
                className="text-base font-bold text-slate-900"
              >
                Book a Meeting with {instructor.name}
              </h3>
              <p className="text-xs text-slate-500">
                Official office hours & clinical academic advising
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="py-8 text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-1">
              Meeting Confirmed!
            </h4>
            <p className="text-sm text-slate-600 max-w-sm mx-auto">
              Your appointment with {instructor.name} on{" "}
              <strong>
                {selectedDay} at {selectedTime}
              </strong>{" "}
              has been scheduled. Calendar invitation sent to your email.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Instructor Location Info */}
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 border border-slate-100">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Location:</strong> {currentSchedule?.location || instructor.officeLocation}
              </span>
            </div>

            {/* Day Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                1. Select Available Day
              </label>
              <div className="grid grid-cols-5 gap-2">
                {instructor.schedule.map((slot) => {
                  const isSelected = selectedDay === slot.day;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => {
                        setSelectedDay(slot.day);
                        setSelectedType(slot.type);
                      }}
                      className={`rounded-xl border p-2.5 text-center transition-all cursor-pointer ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50/80 text-emerald-900 font-bold shadow-xs"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 text-xs"
                      }`}
                    >
                      <span className="block text-[13px] font-semibold">
                        {slot.day.slice(0, 3)}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">
                        {slot.time.split("–")[0]?.trim()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slot Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                2. Select Time Slot
              </label>
              <div className="grid grid-cols-3 gap-2">
                {timesForSelectedDay.map((time) => {
                  const isSelected = selectedTime === time;
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedTime(time)}
                      className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 px-3 text-xs font-medium transition-all cursor-pointer ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-600 text-white font-semibold shadow-xs"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{time}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Meeting Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                3. Consultation Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
              >
                <option value="Office Hours">Academic Office Hours (Course Topics)</option>
                <option value="Student Consultations">1-on-1 Clinical Anatomy Advising</option>
                <option value="Research Supervision">Research & Dissertation Supervision</option>
                <option value="Course Meetings">Exam & Practical Review</option>
              </select>
            </div>

            {/* Student Note */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                4. Topic / Notes for the Instructor (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Questions regarding Upper Limb brachial plexus clinical correlations..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 resize-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-800 shadow-sm transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Confirm Appointment</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
