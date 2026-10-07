import React from "react";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id,
  className = "",
}) => {
  const switchId = id || (label ? `toggle-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      {(label || description) && (
        <label
          htmlFor={switchId}
          className={`flex-1 select-none ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
        >
          {label && (
            <span className="block text-xs sm:text-[13px] font-semibold text-gray-800 leading-tight">
              {label}
            </span>
          )}
          {description && (
            <span className="block text-[11px] text-gray-500 mt-0.5 leading-relaxed">
              {description}
            </span>
          )}
        </label>
      )}
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        } ${checked ? "bg-emerald-500" : "bg-gray-200"}`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-4.5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
};
