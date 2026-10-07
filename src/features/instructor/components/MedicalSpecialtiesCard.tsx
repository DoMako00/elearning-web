import React from "react";
import { Activity } from "lucide-react";

interface MedicalSpecialtiesCardProps {
  specialties: string[];
  onEditClick?: () => void;
}

export const MedicalSpecialtiesCard: React.FC<MedicalSpecialtiesCardProps> = ({
  specialties,
  onEditClick,
}) => {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-2xs shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-2.5">
        <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
          <Activity className="w-4 h-4 text-emerald-600" />
          <span>Medical Specialties</span>
        </div>

        {onEditClick && (
          <button
            type="button"
            onClick={onEditClick}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
          >
            Edit
          </button>
        )}
      </div>

      {/* Pill tags */}
      <div className="flex flex-wrap gap-2 pt-0.5">
        {specialties.map((specialty, idx) => (
          <span
            key={idx}
            className="inline-flex items-center px-3 py-1.5 rounded-full text-xs sm:text-[13px] font-medium text-slate-700 bg-slate-100/80 hover:bg-emerald-50 hover:text-emerald-800 transition-colors cursor-default"
          >
            {specialty}
          </span>
        ))}
      </div>
    </div>
  );
};
