// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { applyAppearancePreferences, loadAppearancePreferences, saveAppearancePreferences } from "./appearancePreferences";

const key = "nexus.student.appearance.v1";

describe("student appearance preferences", () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.appFontSize;
  });

  it("saves the chosen text scale and applies it globally", () => {
    saveAppearancePreferences({ theme: "dark", reduceMotion: true, fontSize: "large" });

    expect(document.documentElement.dataset.appFontSize).toBe("large");
    expect(loadAppearancePreferences()).toEqual({ theme: "light", reduceMotion: false, fontSize: "large" });
  });

  it("restores the default scale for invalid stored values", () => {
    window.localStorage.setItem(key, JSON.stringify({ fontSize: "huge" }));

    const preferences = loadAppearancePreferences();
    applyAppearancePreferences(preferences);

    expect(preferences.fontSize).toBe("standard");
    expect(document.documentElement.dataset.appFontSize).toBeUndefined();
  });
});
