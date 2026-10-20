import { describe, expect, it } from "vitest";
import { clearAllAssessmentDrafts, clearAssessmentDraft, loadAssessmentDraft, saveAssessmentDraft } from "./assessmentDrafts";

describe("assessment answer drafts (sessionStorage only)", () => {
  it("round-trips answers per user and attempt", () => {
    saveAssessmentDraft("user-a", "attempt-1", { q1: "A", q2: [1, 2] });
    expect(loadAssessmentDraft("user-a", "attempt-1")).toEqual({ q1: "A", q2: [1, 2] });
    expect(window.localStorage.length).toBe(0);
  });

  it("does not leak drafts between users or attempts", () => {
    saveAssessmentDraft("user-a", "attempt-1", { q1: "A" });
    expect(loadAssessmentDraft("user-b", "attempt-1")).toEqual({});
    expect(loadAssessmentDraft("user-a", "attempt-2")).toEqual({});
  });

  it("clears one draft or all drafts (sign-out)", () => {
    saveAssessmentDraft("user-a", "attempt-1", { q1: "A" });
    saveAssessmentDraft("user-a", "attempt-2", { q1: "B" });
    window.sessionStorage.setItem("unrelated", "keep");
    clearAssessmentDraft("user-a", "attempt-1");
    expect(loadAssessmentDraft("user-a", "attempt-1")).toEqual({});
    clearAllAssessmentDrafts();
    expect(loadAssessmentDraft("user-a", "attempt-2")).toEqual({});
    expect(window.sessionStorage.getItem("unrelated")).toBe("keep");
  });

  it("ignores corrupt stored values", () => {
    window.sessionStorage.setItem("assessment-draft:user-a:attempt-1", "{not json");
    expect(loadAssessmentDraft("user-a", "attempt-1")).toEqual({});
  });
});
