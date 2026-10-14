import { extractApiErrorMessage, requireApiClient } from "../../../app/api/client";

export type BrandCode = "medway" | "elite" | "nexus";
export interface AcademicUnit { id: string; code: string; sourceDisplayLabel: string; sourceType: "drive_folder"|"admin"; displayTitle: string|null; description: string; credits: number|string|null; academicInstitutionId?: string; academicSemesterId?: string; sortOrder?: number; reviewStatus?: string; version?: number; }
export interface AcademicSemester { id: string; academicLevelId?: string; semesterNumber: number; displayTitle: string; sortOrder?: number; status: string; version?:number; modules: AcademicUnit[]; }
export interface AcademicLevel { id: string; levelNumber: number; displayTitle: string; sortOrder?: number; status: string; version?:number; semesters: AcademicSemester[]; }
export interface AcademicInstitution { id: string; code: string; displayName: string; status: string; version?:number; levels: AcademicLevel[]; }
export interface BrandAccess { id: string; code: BrandCode; name: string; status: string; allowedAcademicInstitutions: Pick<AcademicInstitution,"id"|"code"|"displayName"|"status">[]; }
export interface BrandCourse { id: string; brandId: string; code: string; title: string; status: "draft"|"published"|"archived"; classification: "academic_module_offering"|"standalone"; cataloguePresentation: "module_based"|"subject_based"; academicInstitutionId: string|null; academicModuleId: string|null; academicInstitution?: {id:string;code:string;displayName:string}|null; academicModule?: {id:string;code:string;sourceDisplayLabel:string}|null; version: number; createdAt?:string; updatedAt: string; instructorAssignments?: {instructorId:string;displayName:string;status:string}[]; }
export interface Instructor { id: string; code: string; instructorCode?:string; displayName: string; status: "active"|"inactive"|"archived"; publicEmail: string|null; specialties: string[]; version: number; createdAt?:string; updatedAt?:string; }
export interface InstructorBrand { id:string;brandId:string;instructorId:string;status:"active"|"inactive";version:number;createdAt?:string;updatedAt?:string; }
export interface CourseInstructor { id:string;brandId:string;courseId:string;instructorId:string;status:"active"|"inactive";version:number;displayName?:string; }
export interface StructureItem { id: string; brandCourseId:string; title: string; sortOrder: number; status: "draft"|"published"|"archived"; version: number; courseChapterId?: string; createdAt?:string;updatedAt?:string; }
export interface AdminApiError extends Error { status?:number; code?:string; correlationId?:string; }

const idempotencyKey=()=>crypto.randomUUID();
function unwrap<T>(result:{data?:unknown;error?:unknown;response?:Response}):T {
  if(result.error){
    const raw=result.error as {error?:{code?:unknown;correlationId?:unknown};correlationId?:unknown};
    const error=new Error(extractApiErrorMessage(result.error,"The Admin request failed.")) as AdminApiError;
    error.status=result.response?.status;
    if(typeof raw?.error?.code==="string")error.code=raw.error.code;
    else if(typeof (result.error as {code?:unknown})?.code==="string")error.code=(result.error as {code:string}).code;
    if(typeof raw?.error?.correlationId==="string")error.correlationId=raw.error.correlationId;
    throw error;
  }
  const envelope=result.data as {data?:T}|T|undefined;
  if(envelope&&typeof envelope==="object"&&"data" in envelope)return (envelope as {data:T}).data;
  if(envelope!==undefined)return envelope as T;
  throw new Error("The server returned an incomplete response.");
}
async function call<T>(make:(api:Awaited<ReturnType<typeof requireApiClient>>)=>Promise<any>):Promise<T>{return unwrap<T>(await make(await requireApiClient()));}
const path=(brandId:string,courseId?:string)=>({params:{path:{brandId,...(courseId?{courseId}:{})}}});
const writeHeaders=()=>({headers:{"Idempotency-Key":idempotencyKey()}});

export const listInstitutions=()=>call<AcademicInstitution[]>((api)=>api.GET("/v1/admin/curriculum/institutions" as never));
export const listBrandAccess=()=>call<BrandAccess[]>((api)=>api.GET("/v1/admin/curriculum/brand-access" as never));
export type AcademicRecordEntity="institutions"|"levels"|"semesters"|"modules";
const unwrapAcademic=(result:Record<string,unknown>)=>{const nested=result.data;if(result.ok===true&&nested&&typeof nested==="object"&&!Array.isArray(nested))return nested as Record<string,unknown>;return result;};
export const getAcademicRecord=async(entity:AcademicRecordEntity,id:string)=>unwrapAcademic(await call<Record<string,unknown>>((api)=>api.GET(`/v1/admin/curriculum/${entity}/{id}` as never,{params:{path:{id}}})));
export const writeAcademicRecord=async(entity:AcademicRecordEntity,id:string|undefined,body:Record<string,unknown>)=>unwrapAcademic(await call<Record<string,unknown>>((api)=>id?api.PATCH(`/v1/admin/curriculum/${entity}/{id}` as never,{params:{path:{id}},...writeHeaders(),body}):api.POST(`/v1/admin/curriculum/${entity}` as never,{...writeHeaders(),body})));
export const listCourses=(brandId:string)=>call<BrandCourse[]>((api)=>api.GET("/v1/admin/brands/{brandId}/courses" as never,path(brandId)));
export const getCourse=(brandId:string,courseId:string)=>call<BrandCourse>((api)=>api.GET("/v1/admin/brands/{brandId}/courses/{courseId}" as never,path(brandId,courseId)));
export const writeCourse=(brandId:string,courseId:string|undefined,body:Record<string,unknown>)=>call<unknown>((api)=>courseId?api.PATCH("/v1/admin/brands/{brandId}/courses/{courseId}" as never,{...path(brandId,courseId),...writeHeaders(),body}):api.POST("/v1/admin/brands/{brandId}/courses" as never,{...path(brandId),...writeHeaders(),body}));
export async function createBrandCourse(brandId:string,body:Record<string,unknown>){const title=String(body.title??"Course"),code=String(body.code??`CRS-${title.normalize("NFKD").replace(/[^a-zA-Z0-9]+/g,"-").replace(/^-|-$/g,"").toUpperCase().slice(0,20)}-${crypto.randomUUID().slice(0,6).toUpperCase()}`);const result=await writeCourse(brandId,undefined,{...body,code}) as {courseId?:string};if(!result.courseId)throw new Error("The server did not return the created Course ID.");return result.courseId;}
export const setCourseStatus=(brandId:string,courseId:string,body:Record<string,unknown>)=>call<unknown>((api)=>api.PATCH("/v1/admin/brands/{brandId}/courses/{courseId}/status" as never,{...path(brandId,courseId),...writeHeaders(),body}));
export const listCourseInstructors=(brandId:string,courseId:string)=>call<CourseInstructor[]>((api)=>api.GET("/v1/admin/brands/{brandId}/courses/{courseId}/instructors" as never,path(brandId,courseId)));
export const assignInstructor= (brandId:string,courseId:string,instructorId:string,reason="Course teaching assignment")=>call<unknown>((api)=>api.POST("/v1/admin/brands/{brandId}/courses/{courseId}/instructors" as never,{...path(brandId,courseId),...writeHeaders(),body:{instructorId,reason}}));
export const setCourseInstructorStatus=(brandId:string,courseId:string,instructorId:string,status:"active"|"inactive",expectedVersion:number,reason="Course teaching assignment update")=>call<unknown>((api)=>api.PATCH("/v1/admin/brands/{brandId}/courses/{courseId}/instructors/{instructorId}/status" as never,{params:{path:{brandId,courseId,instructorId}},...writeHeaders(),body:{status,expectedVersion,reason}}));
export const listInstructors=()=>call<Instructor[]>((api)=>api.GET("/v1/admin/instructors" as never));
export const getInstructor=(id:string)=>call<Instructor>((api)=>api.GET("/v1/admin/instructors/{instructorId}" as never,{params:{path:{instructorId:id}}}));
export const listInstructorBrands=(id:string)=>call<InstructorBrand[]>((api)=>api.GET("/v1/admin/instructors/{instructorId}/brands" as never,{params:{path:{instructorId:id}}}));
export const writeInstructor=(id:string|undefined,body:Record<string,unknown>)=>call<unknown>((api)=>id?api.PATCH("/v1/admin/instructors/{instructorId}" as never,{params:{path:{instructorId:id}},...writeHeaders(),body}):api.POST("/v1/admin/instructors" as never,{...writeHeaders(),body}));
export async function createDirectoryInstructor(body:Record<string,unknown>){const result=await writeInstructor(undefined,body) as {instructorId?:string};if(!result.instructorId)throw new Error("The server did not return the created Instructor ID.");return result.instructorId;}
export const setInstructorStatus=(id:string,body:Record<string,unknown>)=>call<unknown>((api)=>api.PATCH("/v1/admin/instructors/{instructorId}/status" as never,{params:{path:{instructorId:id}},...writeHeaders(),body}));
export const assignInstructorToBrand=(brandId:string,instructorId:string,reason="Instructor brand assignment")=>call<unknown>((api)=>api.POST("/v1/admin/brands/{brandId}/instructors" as never,{params:{path:{brandId}},...writeHeaders(),body:{instructorId,reason}}));
export const setInstructorBrandStatus=(brandId:string,instructorId:string,status:"active"|"inactive",expectedVersion:number,reason="Instructor brand assignment update")=>call<unknown>((api)=>api.PATCH("/v1/admin/brands/{brandId}/instructors/{instructorId}/status" as never,{params:{path:{brandId,instructorId}},...writeHeaders(),body:{status,expectedVersion,reason}}));
export const listStructure=async(brandId:string,courseId:string)=>{const [chapters,lessons]=await Promise.all([call<StructureItem[]>((api)=>api.GET("/v1/admin/brands/{brandId}/courses/{courseId}/chapters" as never,path(brandId,courseId))),call<StructureItem[]>((api)=>api.GET("/v1/admin/brands/{brandId}/courses/{courseId}/lessons" as never,path(brandId,courseId)))]);return{chapters,lessons};};
export const writeStructure=(brandId:string,courseId:string,entity:"chapters"|"lessons",id:string|undefined,body:Record<string,unknown>)=>call<unknown>((api)=>{
  if(entity==="chapters")return id?api.PATCH("/v1/admin/brands/{brandId}/courses/{courseId}/chapters/{chapterId}" as never,{params:{path:{brandId,courseId,chapterId:id}},...writeHeaders(),body}):api.POST("/v1/admin/brands/{brandId}/courses/{courseId}/chapters" as never,{...path(brandId,courseId),...writeHeaders(),body});
  return id?api.PATCH("/v1/admin/brands/{brandId}/courses/{courseId}/lessons/{lessonId}" as never,{params:{path:{brandId,courseId,lessonId:id}},...writeHeaders(),body}):api.POST("/v1/admin/brands/{brandId}/courses/{courseId}/lessons" as never,{...path(brandId,courseId),...writeHeaders(),body});
});
export async function createStructureRecord(brandId:string,courseId:string,entity:"chapters"|"lessons",body:Record<string,unknown>){const result=await writeStructure(brandId,courseId,entity,undefined,body) as {recordId?:string};if(!result.recordId)throw new Error("The server did not return the created Course structure ID.");return result.recordId;}
