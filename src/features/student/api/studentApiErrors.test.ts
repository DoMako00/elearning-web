import { describe, expect, it } from "vitest";
import { classifyStudentApiError } from "./studentApiErrors";
import { StudentCoursesApiError } from "./studentCoursesApi";
import { StudentLearningApiError } from "./studentLearningApi";

describe("classifyStudentApiError", () => {
  it("treats the backend 400 'select a commercial brand' response as brand selection, not a connection error", () => {
    // Message emitted by the backend course route for an ambiguous membership.
    const error = new StudentCoursesApiError("Select a commercial brand for this student membership.", 400, "bad_request");
    const classified = classifyStudentApiError(error);
    expect(classified.kind).toBe("brand_selection_required");
    expect(classified.message).not.toMatch(/connection/i);
  });

  it("treats 403 forbidden as a missing membership/placement", () => {
    const classified = classifyStudentApiError(new StudentLearningApiError("An active student academic placement is required.", 403, "forbidden"));
    expect(classified.kind).toBe("no_membership");
    expect(classified.message).not.toMatch(/connection/i);
  });

  it("treats 401 as an ended session", () => {
    expect(classifyStudentApiError(new StudentCoursesApiError("Sign in", 401, "unauthenticated")).kind).toBe("unauthenticated");
  });

  it("only calls transport failures and 5xx 'unavailable'", () => {
    expect(classifyStudentApiError(new StudentCoursesApiError("x", 0, "network_error")).kind).toBe("unavailable");
    expect(classifyStudentApiError(new StudentCoursesApiError("x", 503, "service_unavailable")).kind).toBe("unavailable");
    expect(classifyStudentApiError(new StudentCoursesApiError("x", 404, "not_found")).kind).toBe("not_found");
    expect(classifyStudentApiError(new Error("boom")).kind).toBe("unknown");
  });
});
