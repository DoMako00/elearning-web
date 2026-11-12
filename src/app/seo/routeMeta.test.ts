import { describe, expect, it } from "vitest";
import { formatTitle, resolveRouteMeta } from "./routeMeta";

describe("resolveRouteMeta", () => {
  it("keeps only the sign-in page indexable", () => {
    expect(resolveRouteMeta("/auth/sign-in").noindex).toBe(false);
    expect(resolveRouteMeta("/auth/sign-in/").noindex).toBe(false);
    for (const path of ["/", "/my-courses", "/my-courses/anatomy/lessons/3", "/admin", "/admin/payments", "/admin/instructor/courses", "/nope"]) {
      expect(resolveRouteMeta(path).noindex, path).toBe(true);
    }
  });

  it("names admin, instructor and student pages", () => {
    expect(resolveRouteMeta("/admin/payments").title).toBe("Payments");
    expect(resolveRouteMeta("/admin/instructors").title).toBe("Instructors");
    expect(resolveRouteMeta("/admin/instructor/courses/abc").title).toBe("Course builder");
    expect(resolveRouteMeta("/my-courses/anatomy").title).toBe("Course");
    expect(resolveRouteMeta("/explore/paths/medicine").title).toBe("Explore");
  });

  it("does not confuse /admin/instructors with the instructor portal", () => {
    expect(resolveRouteMeta("/admin/instructors").title).toBe("Instructors");
    expect(resolveRouteMeta("/admin/instructor").title).toBe("Home");
  });

  it("marks unknown paths as not found", () => {
    const meta = resolveRouteMeta("/does/not/exist");
    expect(meta.title).toBe("Page not found");
    expect(meta.noindex).toBe(true);
  });

  it("adds the product area to the title", () => {
    expect(formatTitle(resolveRouteMeta("/admin/payments"), "GreenLearn")).toBe("Payments | GreenLearn Admin");
    expect(formatTitle(resolveRouteMeta("/my-courses"), "GreenLearn")).toBe("My courses | GreenLearn");
  });
});
