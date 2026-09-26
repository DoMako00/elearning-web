import React from "react";
import { Palette, Sun, Moon, Laptop, Eye, ChevronDown } from "lucide-react";
import type { AppearancePreferences } from "../../../../types/settings";
import { SettingsCard } from "../common/SettingsCard";
import { ToggleSwitch } from "../common/ToggleSwitch";

interface AppearanceTabProps {
  appearance: AppearancePreferences;
  onUpdate: <K extends keyof AppearancePreferences>(
    key: K,
    value: AppearancePreferences[K]
  ) => void;
}

export const AppearanceTab: React.FC<AppearanceTabProps> = ({
  appearance,
  onUpdate,
}) => {
  const themeCards: {
    id: AppearancePreferences["theme"];
    title: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: "system",
      title: "System Default",
      description: "Match your operating system's light or dark appearance.",
      icon: <Laptop className="w-5 h-5 stroke-[1.8]" />,
    },
    {
      id: "light",
      title: "Light Mode",
      description: "Clean emerald-tinted crisp contrast for well-lit rooms.",
      icon: <Sun className="w-5 h-5 stroke-[1.8]" />,
    },
    {
      id: "dark",
      title: "Dark Mode",
      description: "Calm, slate-dark tones designed for late-night study sessions.",
      icon: <Moon className="w-5 h-5 stroke-[1.8]" />,
    },
  ];

  return (
    <div className="flex flex-col gap-4 max-w-4xl">
      {/* 1. Theme Selection Cards */}
      <SettingsCard
        title="Theme Selection"
        subtitle="Choose how GreenLearn appears on this browser session."
        icon={<Palette className="w-4 h-4 stroke-2" />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {themeCards.map((card) => {
            const isSelected = appearance.theme === card.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => onUpdate("theme", card.id)}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-xs"
                    : "border-gray-200/80 bg-white hover:border-gray-300 hover:bg-gray-50/50"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
                    isSelected
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {card.icon}
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                    {card.title}
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </SettingsCard>

      {/* 2. Motion Preferences */}
      <SettingsCard
        title="Motion & Transitions"
        subtitle="Fine-tune animations and visual effects."
      >
        <div className="pt-1">
          <ToggleSwitch
            checked={appearance.reduceMotion}
            onChange={(checked) => onUpdate("reduceMotion", checked)}
            label="Reduce UI Animations"
            description="Disables gamification confetti and page transitions."
          />
        </div>
      </SettingsCard>

      {/* 3. Accessibility & Scaling */}
      <SettingsCard
        title="Accessibility & Typography"
        subtitle="Configure the standard reading font size and interface scale."
        icon={<Eye className="w-4 h-4 stroke-2" />}
      >
        <div className="pt-1 max-w-sm">
          <label className="block text-[11px] font-semibold text-gray-700 mb-1">
            UI Scale / Font Size
          </label>
          <div className="relative">
            <select
              value={appearance.fontSize}
              onChange={(e) =>
                onUpdate(
                  "fontSize",
                  e.target.value as AppearancePreferences["fontSize"]
                )
              }
              className="w-full h-9 pl-3 pr-8 text-xs bg-gray-50/80 border border-gray-200/90 rounded-xl text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white cursor-pointer appearance-none transition-all shadow-2xs"
            >
              <option value="standard">Standard (Default 100%)</option>
              <option value="large">Large (Comfortable 115%)</option>
              <option value="extraLarge">Extra Large (High Legibility 125%)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <p className="text-[10.5px] text-gray-400 mt-1.5 leading-normal">
            Applies to lecture notes, flashcards, transcript summaries, and system headers.
          </p>
        </div>
      </SettingsCard>
    </div>
  );
};
