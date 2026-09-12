import { env } from '../../../app/config/env';
import { getSupabaseAccessToken } from '../../auth/api/supabaseAuth';

export type DeliveryStatus = 'draft' | 'published' | 'archived';
export type ResourceKind = 'video' | 'document' | 'quiz' | 'file' | 'link';
export interface DeliveryChapter { id:string; brandCourseId:string; title:string; sortOrder:number; status:DeliveryStatus; version:number; }
export interface DeliveryLesson extends DeliveryChapter { courseChapterId:string; }
export interface DeliveryResource extends DeliveryChapter { courseLessonId:string; resourceKind:ResourceKind; }
export interface DeliveryCourse {
 id:string; brandId:string; code:string; title:string; academicInstitutionId:string|null;
 academicInstitution:{id:string;code:string;displayName:string}|null;
 academicModuleId:string|null; academicModule:{id:string;code:string;sourceDisplayLabel:string}|null;
 brand:{id:string;code:string;name:string}; status:DeliveryStatus; classification:'academic_module_offering'|'standalone';
 cataloguePresentation:'module_based'|'subject_based';
 version:number; updatedAt:string; instructorAssignments:{instructorId:string;displayName:string;status:string}[];
}
export interface CatalogueChapter { id:string; code:string; title:string; sortOrder:number; status:'active'|'retired'; }
export interface CatalogueModule extends DeliveryModule { academicInstitutionId:string; reviewStatus:string; resourceCount:number; chapters:CatalogueChapter[]; }
export interface CatalogueSemester { id:string;semesterNumber:number;displayTitle:string;status:string;modules:CatalogueModule[]; }
export interface CatalogueLevel { id:string;levelNumber:number;displayTitle:string;status:string;semesters:CatalogueSemester[]; }
export interface CatalogueInstitution { id:string;code:string;displayName:string;status:string;levels:CatalogueLevel[]; }
export interface CatalogueBrand { id:string;code:string;name:string;status:string;allowedAcademicInstitutions:Pick<CatalogueInstitution,'id'|'code'|'displayName'|'status'>[]; }
export const catalogueInstitutionsPath='/v1/admin/curriculum/institutions';
export const catalogueBrandAccessPath='/v1/admin/curriculum/brand-access';
export interface DeliveryModule { id:string; code:string; sourceDisplayLabel:string; chapters?:CatalogueChapter[]; }

export async function adminDeliveryRequest<T>(path:string,options:{signal?:AbortSignal;body?:Record<string,unknown>;key?:string;method?:'POST'|'PATCH'}={}):Promise<T> {
  if (env.adminDataSource!=='api') throw new Error('Course delivery requires API mode. Demo content is not available in this builder.');
  if (!env.apiBaseUrl) throw new Error('The admin API is not configured.');
  if(options.body&&!options.key)throw new Error("An idempotency key is required. Reload the form before saving.");
  const token=await getSupabaseAccessToken();
  if (!token) throw new Error('Sign in to manage course delivery. Your session is missing or expired.');
  const response=await fetch(`${env.apiBaseUrl}${path}`,{signal:options.signal,method:options.method??'GET',headers:{authorization:`Bearer ${token}`,...(options.body?{'content-type':'application/json','Idempotency-Key':options.key!}:{})},...(options.body?{body:JSON.stringify(options.body)}:{})});
  if (!response.ok) {
    const rejected=await response.json().catch(()=>null) as {error?:{details?:{code?:string};message?:string}}|null;
    const messages:Record<string,string>={brand_not_found:'Select an existing active commercial brand.',academic_institution_required:'Select an academic catalogue.',academic_institution_not_found:'This academic catalogue is unavailable.',brand_catalogue_not_allowed:'This brand is not allowed to use the selected academic catalogue.',academic_module_not_found:'The module was not found or is unavailable.',institution_module_mismatch:'The module does not belong to the selected academic catalogue.',academic_module_required:'Select an academic module.',brandId:'Select a commercial brand.',academicInstitutionId:'Select an academic catalogue.',academicModuleId:'Select a valid academic module.'};
    const code=rejected?.error?.details?.code;
    if(code&&Object.hasOwn(messages,code))throw new Error(messages[code]);
    throw new Error(response.status===401?'Your session has expired. Sign in again.':response.status===403?'You do not have permission to manage this brand.':response.status===404?'This course or its parent structure is no longer available.':response.status===409?'The structure changed or this sort order is already used. Reload before editing.':response.status===400?'The metadata was rejected. Check the title, order, parent, and reason.':'The admin API is unavailable. Retry with the same form to safely replay an uncertain save.');
  }
  const payload=await response.json() as {ok?:boolean;data?:T};
  if (payload.ok!==true||payload.data===undefined) throw new Error('The API returned an invalid response.');
  return payload.data;
}

export const deliveryCoursePath=(brandId:string,courseId:string)=>`/v1/admin/brands/${encodeURIComponent(brandId)}/courses/${encodeURIComponent(courseId)}`;
