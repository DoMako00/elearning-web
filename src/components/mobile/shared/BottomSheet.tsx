import React, { ReactNode, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs cursor-pointer"
            aria-hidden="true"
          />

          {/* Sheet Panel */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="relative z-10 w-full bg-white rounded-t-3xl border-t border-slate-200/80 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            style={{
              paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
            }}
            role="dialog"
            aria-modal="true"
          >
            {/* Drag Handle */}
            <div className="pt-3 pb-2 flex justify-center items-center cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1.5 rounded-full bg-slate-300/80" />
            </div>

            {/* Header (optional) */}
            {title && (
              <div className="px-5 pb-3 pt-1 flex items-center justify-between border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  {title}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close sheet"
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            )}

            {/* Sheet content area */}
            <div className="p-4 overflow-y-auto flex-1">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
