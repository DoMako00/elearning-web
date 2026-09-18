import React from "react";
import {
  User,
  Edit2,
  MapPin,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";
import type { InstructorProfile } from "../../../types/instructor";

interface InstructorAboutCardProps {
  instructor: InstructorProfile;
  onEditClick?: () => void;
}

export const InstructorAboutCard: React.FC<InstructorAboutCardProps> = ({
  instructor,
  onEditClick,
}) => {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-2xs flex flex-col overflow-hidden shrink-0 lg:flex-1 lg:min-h-0">
      <div className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
            <User className="w-4 h-4 text-emerald-600" />
            <span>About</span>
          </div>
          {onEditClick && (
            <button
              type="button"
              onClick={onEditClick}
              className="text-slate-400 hover:text-emerald-700 transition-colors p-1 rounded"
              aria-label="Edit about section"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Full Bio Paragraph - Uncut and readable */}
        <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed py-2.5">
          {instructor.detailedBio}
        </p>

        {/* Contact Info List */}
        <div className="space-y-2 text-xs sm:text-[13px] text-slate-700">
          <div className="flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">{instructor.location}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
            <a
              href={`mailto:${instructor.email}`}
              className="hover:text-emerald-700 transition-colors truncate font-medium"
            >
              {instructor.email}
            </a>
          </div>

          <div className="flex items-center gap-2.5">
            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{instructor.phone}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <svg
              className="w-4 h-4 text-slate-400 shrink-0"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
            </svg>
            <a
              href={`https://${instructor.linkedin}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-700 transition-colors truncate font-medium"
            >
              {instructor.linkedin}
            </a>
          </div>
        </div>
      </div>

      {/* Join Date Row */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Joined GreenLearn</span>
        </div>
        <span className="font-semibold text-slate-700">{instructor.joinDate}</span>
      </div>
    </div>
  );
};
