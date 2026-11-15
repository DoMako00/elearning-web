import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks=vi.hoisted(()=>({get:vi.fn(),patch:vi.fn(),post:vi.fn()}));
vi.mock("../../../app/api/client",()=>({requireApiClient:async()=>({GET:mocks.get,PATCH:mocks.patch,POST:mocks.post}),extractApiErrorMessage:()=>"Request failed"}));
import { makeApprovedLessonAvailable } from "./adminAcademicApi";
describe("approved lesson availability",()=>{
  beforeEach(()=>{vi.clearAllMocks(); mocks.get.mockImplementation(async (url:string)=>({data:{data:url.endsWith("/chapters")?[{id:"chapter",status:"draft",version:1}]:url.endsWith("/lessons")?[{id:"lesson",courseChapterId:"chapter",status:"published"}]:url.endsWith("/releases")?{items:[],pagination:{totalItems:0}}:{id:"course",status:"draft",version:1}}})); mocks.patch.mockImplementation(async (url:string)=>({data:{data:url.includes("chapters")?{recordId:"chapter",brandId:"brand",courseId:"course",entity:"chapters"}:{}}})); mocks.post.mockResolvedValue({data:{data:{id:"release"}}});});
  it("publishes only the approved lesson's course and chapter and creates a release",async()=>{await makeApprovedLessonAvailable("brand","course","lesson");expect(mocks.patch).toHaveBeenCalledTimes(2);expect(mocks.post).toHaveBeenCalledOnce();expect(mocks.post.mock.calls[0][1].body.status).toBe("published");});
  it("refuses to publish for a draft lesson",async()=>{mocks.get.mockImplementation(async (url:string)=>({data:{data:url.endsWith("/chapters")?[{id:"chapter",status:"draft"}]:[{id:"lesson",courseChapterId:"chapter",status:"draft"}]}}));await expect(makeApprovedLessonAvailable("brand","course","lesson")).rejects.toThrow(/approved lesson/i);expect(mocks.patch).not.toHaveBeenCalled();expect(mocks.post).not.toHaveBeenCalled();});
});
