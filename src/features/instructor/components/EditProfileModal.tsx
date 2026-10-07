import React, { useState } from "react";
import { X, Save, User } from "lucide-react";
import type { InstructorProfile } from "../../../types/instructor";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  instructor: InstructorProfile;
  onSave: (updated: Partial<InstructorProfile>) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  instructor,
  onSave,
}) => {
  const [name, setName] = useState(instructor.name);
  const [title, setTitle] = useState(instructor.title);
  const [department, setDepartment] = useState(instructor.department);
  const [officeHours, setOfficeHours] = useState(instructor.officeHours);
  const [phone, setPhone] = useState(instructor.phone);
  const [detailedBio, setDetailedBio] = useState(instructor.detailedBio);
  const [specialtiesText, setSpecialtiesText] = useState(
    instructor.specialties.join(", ")
  );

  if (!isOpen) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedSpecialties = specialtiesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    onSave({
      name,
      title,
      department,
      officeHours,
      phone,
      detailedBio,
      specialties: parsedSpecialties.length > 0 ? parsedSpecialties : instructor.specialties,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Edit Instructor Profile
              </h3>
              <p className="text-xs text-slate-500">
                Update faculty details, clinical specialties, and availability
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="mt-4 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Academic Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Office Hours
              </label>
              <input
                type="text"
                value={officeHours}
                onChange={(e) => setOfficeHours(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Contact Phone
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Biography & Teaching Philosophy
            </label>
            <textarea
              rows={4}
              value={detailedBio}
              onChange={(e) => setDetailedBio(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Medical Specialties (Comma separated)
            </label>
            <input
              type="text"
              value={specialtiesText}
              onChange={(e) => setSpecialtiesText(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
