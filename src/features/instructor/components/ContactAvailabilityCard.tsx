import React from "react";
import {
  PhoneCall,
  Mail,
  Phone,
  Building2,
  Clock,
  Send,
  Calendar,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { InstructorProfile } from "../../../types/instructor";

interface ContactAvailabilityCardProps {
  instructor: InstructorProfile;
  onBookMeetingClick: () => void;
}

export const ContactAvailabilityCard: React.FC<ContactAvailabilityCardProps> = ({
  instructor,
  onBookMeetingClick,
}) => {
  const navigate = useNavigate();

  const handleSendMessage = () => {
    navigate("/messages?user=dr_ahmed_hassan");
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-2xs flex flex-col justify-between shrink-0">
      <div>
        {/* Header */}
        <div className="flex items-center gap-2 font-bold text-sm text-slate-900 pb-2.5 border-b border-slate-100 mb-2.5">
          <PhoneCall className="w-4 h-4 text-emerald-600" />
          <span>Contact & Availability</span>
        </div>

        {/* Details list */}
        <div className="space-y-2 text-xs sm:text-[13px]">
          {/* Email */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 text-slate-700 min-w-0">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{instructor.email}</span>
            </div>
            <span className="text-xs font-medium text-slate-400 shrink-0">
              Primary Email
            </span>
          </div>

          {/* Phone */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 text-slate-700 min-w-0">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{instructor.phone}</span>
            </div>
            <span className="text-xs font-medium text-slate-400 shrink-0">
              Phone
            </span>
          </div>

          {/* Office */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 text-slate-700 min-w-0">
              <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{instructor.officeLocation}</span>
            </div>
            <span className="text-xs font-medium text-slate-400 shrink-0">
              Office
            </span>
          </div>

          {/* Availability */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 text-slate-700 min-w-0">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{instructor.officeHours}</span>
            </div>
            <span className="text-xs font-medium text-slate-400 shrink-0">
              Availability
            </span>
          </div>
        </div>
      </div>

      {/* Two Action Buttons */}
      <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center gap-2.5">
        <button
          type="button"
          onClick={handleSendMessage}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-[0.98]"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send Message</span>
        </button>

        <button
          type="button"
          onClick={onBookMeetingClick}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-emerald-600 bg-white hover:bg-emerald-50 text-emerald-700 text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-[0.98]"
        >
          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
          <span>Book a Meeting</span>
        </button>
      </div>
    </div>
  );
};
