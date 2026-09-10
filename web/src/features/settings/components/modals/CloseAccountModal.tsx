import React, { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

interface CloseAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmClose: () => void;
}

export const CloseAccountModal: React.FC<CloseAccountModalProps> = ({
  isOpen,
  onClose,
  onConfirmClose,
}) => {
  const [confirmText, setConfirmText] = useState("");

  if (!isOpen) return null;

  const isConfirmed = confirmText.trim() === "DELETE";

  const handleDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed) return;
    onConfirmClose();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-rose-100 flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-rose-100 bg-rose-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Close Account</h3>
              <p className="text-xs text-rose-600 font-medium">Permanent irreversible action</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleDelete} className="p-5 space-y-3.5">
          <p className="text-xs text-gray-600 leading-relaxed">
            Closing your account will permanently remove your enrolled courses, certificates, streak progress, and learning history. You will immediately lose access to all course materials.
          </p>

          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Type <span className="font-mono text-rose-600 font-bold">DELETE</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full h-9 px-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono uppercase"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isConfirmed}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-xs transition-all cursor-pointer"
            >
              Permanently Close Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
