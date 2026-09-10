import React from "react";
import { Palette, Sun, Moon, Monitor } from "lucide-react";
import type { AppearancePreferences } from "../../../../types/settings";

interface AppearanceTabContentProps {
  appearance: AppearancePreferences;
  onUpdate: <K extends keyof AppearancePreferences>(field: K, val: AppearancePreferences[K]) => void;
}

export const AppearanceTabContent: React.FC<AppearanceTabContentProps> = ({
  appearance,
  onUpdate,
}) => {
  return (
    <div className="flex flex-col gap-3.5 max-w-3xl">
      {/* Theme selector */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-2xs">
        <div className="flex items-center gap-2 mb-2">
          <Palette className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs sm:text-sm font-bold text-gray-900">
            Interface Theme
          </h3>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Select how GreenLearn looks on your device.
        </p>

        <div className="grid grid-cols-3 gap-2.5">
          {[
            { id: "light", label: "Light", icon: Sun },
            { id: "dark", label: "Dark", icon: Moon },
            { id: "system", label: "System", icon: Monitor },
          ].map((theme) => {
            const Icon = theme.icon;
            const isSelected = appearance.theme === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => onUpdate("theme", theme.id as any)}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-emerald-50/70 border-emerald-400 text-emerald-900 ring-1 ring-emerald-400"
                    : "bg-gray-50/50 border-gray-200 text-gray-700 hover:bg-gray-100/60"
                }`}
              >
                <Icon className={`w-5 h-5 ${isSelected ? "text-emerald-600" : "text-gray-400"}`} />
                <span className="text-xs font-bold">{theme.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Accessibility: High Contrast & Font Scale */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-2xs space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-gray-900">
              High Contrast Mode
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Enhance contrast on text and borders for improved readability.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onUpdate("highContrast", !appearance.highContrast)}
            className={`w-10 h-5.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
              appearance.highContrast ? "bg-emerald-600" : "bg-gray-200"
            }`}
          >
            <div
              className={`bg-white w-4.5 h-4.5 rounded-full shadow-sm transform transition-transform ${
                appearance.highContrast ? "translate-x-4.5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="pt-3 border-t border-gray-100">
          <label className="block text-xs font-bold text-gray-900 mb-1">
            Display Font Scale
          </label>
          <p className="text-xs text-gray-500 mb-2.5">
            Adjust typography sizing across course players and study workspaces.
          </p>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "compact", label: "Compact (90%)" },
              { id: "normal", label: "Standard (100%)" },
              { id: "large", label: "Large (115%)" },
            ].map((size) => (
              <button
                key={size.id}
                type="button"
                onClick={() => onUpdate("fontSize", size.id as any)}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  appearance.fontSize === size.id
                    ? "bg-emerald-50/70 border-emerald-400 text-emerald-900 ring-1 ring-emerald-400"
                    : "bg-gray-50/50 border-gray-200 text-gray-600 hover:bg-gray-100/60"
                }`}
              >
                {size.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
