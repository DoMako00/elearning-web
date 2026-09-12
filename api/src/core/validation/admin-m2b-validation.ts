import type { M2bDeliveryEntity } from '../../contracts/admin/m2b-course-delivery';
export const M2B_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const deliveryFields = {
  chapters: ['title','sortOrder','status'],
  lessons: ['title','sortOrder','status','courseChapterId'],
  resources: ['title','sortOrder','status','courseLessonId','resourceKind'],
} as const;

export function validDeliveryFields(entity:M2bDeliveryEntity,fields:Readonly<Record<string,unknown>>,partial:boolean):boolean {
  const allowed:readonly string[] = deliveryFields[entity];
  if (!Object.keys(fields).length || Object.keys(fields).some(key=>!allowed.includes(key))) return false;
  if (!partial && allowed.some(key=>fields[key]===undefined)) return false;
  if ('title' in fields && (typeof fields.title!=='string' || !fields.title.trim() || fields.title.trim().length>240)) return false;
  if ('sortOrder' in fields && (!Number.isSafeInteger(fields.sortOrder) || Number(fields.sortOrder)<1 || Number(fields.sortOrder)>2147483647)) return false;
  if ('status' in fields && (typeof fields.status!=='string' || !['draft','published','archived'].includes(fields.status))) return false;
  if ('resourceKind' in fields && (typeof fields.resourceKind!=='string' || !['video','document','quiz','link','file'].includes(fields.resourceKind))) return false;
  for (const key of ['courseChapterId','courseLessonId']) if (key in fields && (typeof fields[key]!=='string' || !M2B_UUID.test(fields[key]))) return false;
  return true;
}
