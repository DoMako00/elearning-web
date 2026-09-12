import React from "react";

interface SettingsCardProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  danger?: boolean;
}

export const SettingsCard: React.FC<SettingsCardProps> = ({
  title,
  subtitle,
  icon,
  headerAction,
  children,
  className = "",
  danger = false,
}) => {
  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 shadow-2xs transition-all ${
        danger
          ? "bg-rose-50/20 border border-rose-200"
          : "bg-white border border-gray-100"
      } ${className}`}
    >
      {(title || icon || headerAction) && (
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && (
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  danger
                    ? "bg-rose-100/70 text-rose-600"
                    : "bg-emerald-50 text-emerald-600"
                }`}
              >
                {icon}
              </div>
            )}
            <div className="min-w-0">
              {title && (
                <h3
                  className={`text-sm font-bold tracking-tight leading-snug truncate ${
                    danger ? "text-rose-900" : "text-gray-900"
                  }`}
                >
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-[11px] text-gray-500 truncate mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
