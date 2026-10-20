import { describe, expect, it } from "vitest";
import { nextSession } from "./useNextSessions";
import { canViewCourseDetails, type StudentCourseDetail } from "../api/studentCoursesApi";

const detail = (statuses: string[], playable = true) => ({chapters: [{sortOrder: 1, lessons: statuses.map((status,index) => ({lessonId: `lesson-${index+1}`,sortOrder:index+1,progressStatus:status,playbackAvailable:playable}))}]} as unknown as StudentCourseDetail);
describe("next session per module", () => {
  it("starts at session one without recorded progress", () => expect(nextSession(detail(["not_started","not_started"])).number).toBe(1));
  it("advances from completed session one to session two", () => expect(nextSession(detail(["completed","not_started"])).lesson?.lessonId).toBe("lesson-2"));
  it("keeps the first incomplete session even when its media is unavailable", () => expect(nextSession(detail(["not_started","not_started"],false)).number).toBe(1));
  it("resumes an in-progress session instead of skipping it", () => expect(nextSession(detail(["completed","in_progress"])).number).toBe(2));
  it("reports completion and unpublished modules without inventing a session", () => {
    expect(nextSession(detail(["completed"])).allCompleted).toBe(true);
    expect(nextSession({chapters:[]} as unknown as StudentCourseDetail)).toEqual({lesson:null,number:0,allCompleted:false});
  });
  it("allows assigned course metadata while playback stays locked", () => {
    expect(canViewCourseDetails({access:{isEnrolled:true,canOpen:false,enrollmentStatus:"active"}})).toBe(true);
    expect(canViewCourseDetails({access:{isEnrolled:false,canOpen:false,enrollmentStatus:null}})).toBe(false);
    expect(canViewCourseDetails({access:{isEnrolled:true,canViewDetails:false,canOpen:false,enrollmentStatus:"active"}})).toBe(false);
  });
});
