import React, { useState, useRef } from "react";
import { X, UploadCloud, Check } from "lucide-react";

interface ChangePhotoModalProps {
  isOpen: boolean;
  currentAvatar: string;
  onClose: () => void;
  onSavePhoto: (newUrl: string) => void;
}

const PRESET_AVATARS = [
  "https://i.pravatar.cc/160?img=47",
  "https://i.pravatar.cc/160?img=32",
  "https://i.pravatar.cc/160?img=49",
  "https://i.pravatar.cc/160?img=26",
  "https://i.pravatar.cc/160?img=65",
  "https://i.pravatar.cc/160?img=68",
];

export const ChangePhotoModal: React.FC<ChangePhotoModalProps> = ({
  isOpen,
  currentAvatar,
  onClose,
  onSavePhoto,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState(currentAvatar);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setSelectedPhoto(objectUrl);
    }
  };

  const handleSave = () => {
    onSavePhoto(selectedPhoto);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Change Profile Photo</h3>
            <p className="text-xs text-gray-500">Upload a new picture or choose an avatar</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center justify-center">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-emerald-500 shadow-md">
              <img
                src={selectedPhoto}
                alt="Selected preview"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 hover:border-emerald-400 rounded-xl p-4 text-center cursor-pointer bg-gray-50/60 hover:bg-emerald-50/30 transition-all group"
          >
            <UploadCloud className="w-6 h-6 text-gray-400 group-hover:text-emerald-600 mx-auto mb-1 transition-colors" />
            <p className="text-xs font-semibold text-gray-700">Click to upload photo</p>
            <p className="text-[11px] text-gray-400">JPG, PNG up to 5MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div>
            <span className="block text-xs font-semibold text-gray-600 mb-2">
              Or pick an avatar
            </span>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_AVATARS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedPhoto(url)}
                  className={`relative rounded-full overflow-hidden aspect-square border-2 transition-transform hover:scale-105 cursor-pointer ${
                    selectedPhoto === url
                      ? "border-emerald-500 ring-2 ring-emerald-500/20"
                      : "border-transparent"
                  }`}
                >
                  <img src={url} alt={`Avatar option ${idx + 1}`} className="w-full h-full object-cover" />
                  {selectedPhoto === url && (
                    <div className="absolute inset-0 bg-emerald-600/30 flex items-center justify-center text-white">
                      <Check className="w-3.5 h-3.5 stroke-3" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-3.5 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-all cursor-pointer"
          >
            Apply Photo
          </button>
        </div>
      </div>
    </div>
  );
};
