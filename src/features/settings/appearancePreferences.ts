import type { AppearancePreferences } from "../../types/settings";

const STORAGE_KEY = "nexus.student.appearance.v1";

const DEFAULT_PREFERENCES: AppearancePreferences = {
  theme: "light",
  reduceMotion: false,
  fontSize: "standard",
};

export function loadAppearancePreferences(): AppearancePreferences {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return DEFAULT_PREFERENCES;
    const saved = value as Partial<AppearancePreferences>;
    return {
      theme: "light",
      reduceMotion: false,
      fontSize: saved.fontSize === "large" || saved.fontSize === "extraLarge" ? saved.fontSize : "standard",
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function applyAppearancePreferences(preferences: AppearancePreferences): void {
  if (typeof document === "undefined") return;
  if (preferences.fontSize === "standard") {
    delete document.documentElement.dataset.appFontSize;
  } else {
    document.documentElement.dataset.appFontSize = preferences.fontSize;
  }
}

export function saveAppearancePreferences(preferences: AppearancePreferences): void {
  const supportedPreferences: AppearancePreferences = {
    theme: "light",
    reduceMotion: false,
    fontSize: preferences.fontSize,
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(supportedPreferences));
  } catch {
    // The current selection still applies for this session when storage is unavailable.
  }
  applyAppearancePreferences(supportedPreferences);
}
