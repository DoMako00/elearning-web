import React, { ReactNode } from "react";

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  subtitle,
  action,
  className = "",
}) => {
  return (
    <div
      className={`w-full py-12 px-6 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-slate-100 shadow-2xs ${className}`}
    >
      <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 shadow-2xs">
        {icon}
      </div>
      <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
        {title}
      </h3>
      <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed font-medium">
        {subtitle}
      </p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
