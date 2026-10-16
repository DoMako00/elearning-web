import type { AdminV2Data, CourseChapter, CourseLesson, CourseRecord } from "../types/adminV2.types";
import { assignInstructor, assignInstructorToBrand, getCourse, getInstructor, listBrandAccess, listCourseInstructors, listCourses, listInstructorBrands, listInstitutions, listInstructors, listStructure, setCourseInstructorStatus, setCourseStatus, setInstructorBrandStatus, setInstructorStatus, writeCourse, writeInstructor, writeStructure, type BrandCourse, type InstructorBrand } from "./adminAcademicApi";
import { emptyAdminV2ServerDomainData, mapBrandAssignments, mapChapterDto, mapCourseDtoToAdminCourse, mapInstructorDto, mapInstitutionsToCurriculum, mapLessonDto } from "./adminV2Mappers";

export type ServerDomainData = ReturnType<typeof emptyAdminV2ServerDomainData>;
const reason="Admin V2 catalogue maintenance";
const toStatus=(value:CourseRecord["status"])=>value.toLowerCase() as "draft"|"published"|"archived";
const toCode=(value:string,prefix:string)=>`${prefix}-${value.normalize("NFKD").replace(/[^a-zA-Z0-9]+/g,"-").replace(/^-|-$/g,"").toUpperCase().slice(0,24)}-${crypto.randomUUID().slice(0,6).toUpperCase()}`;
const active=(value:string)=>value.toLowerCase()==="active";

export async function loadAdminV2ServerData(builderCourseId?:string):Promise<ServerDomainData>{
  const empty=emptyAdminV2ServerDomainData();
  const [institutions,brands,instructorDtos]=await Promise.all([listInstitutions(),listBrandAccess(),listInstructors()]);
  const availableBrands=brands.filter((item)=>active(item.status));
  const instructors= instructorDtos.map(mapInstructorDto);
  const brandAssignments=await Promise.all(instructorDtos.map((item)=>listInstructorBrands(item.id)));
  const instructorBrandAssignments=mapBrandAssignments(brandAssignments.flat() as (InstructorBrand&{createdAt?:string})[],availableBrands);
  const courseGroups=await Promise.all(availableBrands.map(async(brand)=>({brand,courses:await listCourses(brand.id)})));
  const brandCourseRows=courseGroups.flatMap(({brand,courses})=>courses.map((course)=>({brand,course})));
  const courseAssignments=await Promise.all(brandCourseRows.map(async({brand,course})=>({courseId:course.id,items:course.instructorAssignments??await listCourseInstructors(brand.id,course.id)})));
  const byCourse=new Map<string,Array<{instructorId:string;displayName:string;status:string}>>(courseAssignments.map((row)=>[row.courseId,row.items.map((item)=>({instructorId:item.instructorId,displayName:item.displayName??"",status:item.status}))]));
  const courses=brandCourseRows.map(({brand,course})=>{
    const assignments=byCourse.get(course.id)??[];
    const dto:BrandCourse={...course,instructorAssignments:assignments.filter((item)=>item.status==="active").map((item)=>({instructorId:item.instructorId,displayName:item.displayName??instructors.find((instructor)=>instructor.id===item.instructorId)?.fullName??"Instructor",status:item.status}))};
    return mapCourseDtoToAdminCourse(dto,brand,instructors);
  });
  let chapters=empty.chapters,lessons=empty.lessons;
  if(builderCourseId){
    const course=courses.find((item)=>item.id===builderCourseId);
    const brand=course&&availableBrands.find((item)=>item.code===course.brand);
    if(course&&brand){const structure=await listStructure(brand.id,course.id);chapters=structure.chapters.map((item)=>mapChapterDto(item,course.id));lessons=structure.lessons.map((item)=>mapLessonDto(item,course.id));}
  }
  return {...empty,...mapInstitutionsToCurriculum(institutions),courses,instructors,instructorBrandAssignments,chapters,lessons};
}

function byId<T extends {id:string}>(items:T[]){return new Map(items.map((item)=>[item.id,item]));}
function academicFields(course:CourseRecord,data:AdminV2Data){
  const unit=course.curriculumUnitId?data.curriculumUnits.find((item)=>item.id===course.curriculumUnitId):undefined;
  return {academicInstitutionId:unit?.institutionId??course.academicInstitutionId??null,academicModuleId:course.scope==="Standalone"?null:unit?.id??null,classification:course.scope==="Standalone"?"standalone":"academic_module_offering",cataloguePresentation:unit?.type==="Subject"?"subject_based":"module_based"};
}
async function currentCourse(course:CourseRecord){if(!course.brandId)throw new Error("Course brand scope is unavailable; refresh the catalogue before editing.");return getCourse(course.brandId,course.id);}
async function persistCourses(before:AdminV2Data,after:AdminV2Data){
  const old=byId(before.courses),next=byId(after.courses),brands=await listBrandAccess();
  for(const course of after.courses){
    const prior=old.get(course.id),brand=brands.find((item)=>item.code===course.brand&&active(item.status));
    if(!brand)throw new Error("The selected commercial brand is unavailable to this Admin account.");
    const fields=academicFields(course,after);
    if(!prior){
      if(!fields.academicInstitutionId)throw new Error("Choose a persisted academic institution before creating a curriculum course.");
      const created=await writeCourse(brand.id,undefined,{code:course.code??toCode(course.title,"CRS"),title:course.title,classification:fields.classification,cataloguePresentation:fields.cataloguePresentation,academicInstitutionId:fields.academicInstitutionId,academicModuleId:fields.academicModuleId,reason});
      const createdId=(created as {data?:{courseId?:string};courseId?:string})?.data?.courseId??(created as {courseId?:string})?.courseId;
      if(course.status!=="Draft"&&createdId){const dto=await getCourse(brand.id,createdId);await setCourseStatus(brand.id,createdId,{status:toStatus(course.status),expectedVersion:dto.version,reason});}
      if(course.instructors.length&&!createdId)throw new Error("The server did not return the created Course ID.");
      for(const assignment of course.instructors){if(assignment.instructorId){const instructorBrands=await listInstructorBrands(assignment.instructorId);if(!instructorBrands.some((item)=>item.brandId===brand.id&&item.status==="active"))throw new Error("Assign this Instructor to the course's Brand before assigning them to the Course.");await assignInstructor(brand.id,createdId!,assignment.instructorId,reason);}}
      continue;
    }
    if(prior.brand!==course.brand)throw new Error("A Course cannot be moved between commercial Brands; create a separate Brand Course instead.");
    if(prior.instructors.some((assignment)=>course.instructors.some((nextAssignment)=>nextAssignment.instructorId===assignment.instructorId&&nextAssignment.role!==assignment.role)))throw new Error("Lead/Co-Instructor role metadata is not available in the current teaching-assignment API.");
    const current=await currentCourse(prior);
    let version=current.version;
    if(prior.title!==course.title||prior.scope!==course.scope||prior.curriculumUnitId!==course.curriculumUnitId||prior.academicInstitutionId!==course.academicInstitutionId){
      await writeCourse(brand.id,course.id,{title:course.title,...fields,expectedVersion:version,reason});
      version=(await getCourse(brand.id,course.id)).version;
    }
    if(prior.status!==course.status){await setCourseStatus(brand.id,course.id,{status:toStatus(course.status),expectedVersion:version,reason});}
    const currentAssignments=await listCourseInstructors(brand.id,course.id);
    const oldIds=new Set(prior.instructors.map((item)=>item.instructorId).filter((item):item is string=>!!item));
    const newIds=new Set(course.instructors.map((item)=>item.instructorId).filter((item):item is string=>!!item));
    for(const instructorId of newIds)if(!oldIds.has(instructorId)){const instructorBrands=await listInstructorBrands(instructorId);if(!instructorBrands.some((item)=>item.brandId===brand.id&&item.status==="active"))throw new Error("Assign this Instructor to the course's Brand before assigning them to the Course.");await assignInstructor(brand.id,course.id,instructorId,reason);}
    for(const instructorId of oldIds)if(!newIds.has(instructorId)){const assignment=currentAssignments.find((item)=>item.instructorId===instructorId&&item.status==="active");if(assignment)await setCourseInstructorStatus(brand.id,course.id,instructorId,"inactive",assignment.version,reason);}
    if([...newIds].some((instructorId)=>!oldIds.has(instructorId)&&course.instructors.some((assignment)=>assignment.instructorId===instructorId&&assignment.role!=="Unspecified")))throw new Error("The teaching assignment was saved, but Lead/Co-Instructor role metadata is not available in the current backend contract.");
  }
  for(const prior of before.courses)if(!next.has(prior.id))throw new Error("Courses are archived, not deleted. Use the course status action to preserve the academic record.");
}

async function persistInstructors(before:AdminV2Data,after:AdminV2Data){
  const old=byId(before.instructors),next=byId(after.instructors),brands=await listBrandAccess();
  for(const instructor of after.instructors){
    const prior=old.get(instructor.id);
    if(!prior){
      if(instructor.email||instructor.phone||instructor.specialties.length)throw new Error("The current Instructor directory API stores name, code, status, Brand, and Course assignments only. Clear the unsupported email, phone, and specialties fields before saving.");
      const result=await writeInstructor(undefined,{code:instructor.code??toCode(instructor.fullName,"INS"),displayName:instructor.fullName,reason});
      const createdId=(result as {data?:{instructorId?:string};instructorId?:string})?.data?.instructorId??(result as {instructorId?:string})?.instructorId;
      if(!createdId)throw new Error("The server did not return the created Instructor ID.");
      if(instructor.status!=="Active"){const createdInstructor=await getInstructor(createdId);await setInstructorStatus(createdId,{status:instructor.status.toLowerCase(),expectedVersion:createdInstructor.version,reason});}
      for(const assignment of after.instructorBrandAssignments.filter((item)=>item.instructorId===instructor.id)){const brand=brands.find((item)=>item.code===assignment.brand);if(brand)await assignInstructorToBrand(brand.id,createdId,reason);}
      continue;
    }
    if(instructor.email!==prior.email||(instructor.phone??"")!==(prior.phone??"")||JSON.stringify(instructor.specialties)!==JSON.stringify(prior.specialties))throw new Error("The current Instructor directory API stores name, code, status, Brand, and Course assignments only. Email, phone, and specialties were not saved.");
    const current=await getInstructor(prior.id);
    if(instructor.fullName!==prior.fullName)await writeInstructor(prior.id,{displayName:instructor.fullName,expectedVersion:current.version,reason});
    const refreshed=await getInstructor(prior.id);
    if(instructor.status!==prior.status)await setInstructorStatus(prior.id,{status:instructor.status.toLowerCase(),expectedVersion:refreshed.version,reason});
    const beforeBrands=before.instructorBrandAssignments.filter((item)=>item.instructorId===prior.id),afterBrands=after.instructorBrandAssignments.filter((item)=>item.instructorId===instructor.id);
    for(const assignment of afterBrands){if(beforeBrands.some((item)=>item.brand===assignment.brand))continue;const brand=brands.find((item)=>item.code===assignment.brand);if(brand)await assignInstructorToBrand(brand.id,instructor.id,reason);}
    for(const assignment of beforeBrands){if(afterBrands.some((item)=>item.brand===assignment.brand))continue;const brand=brands.find((item)=>item.code===assignment.brand);if(!brand)continue;const persisted=await listInstructorBrands(instructor.id);const currentAssignment=persisted.find((item)=>item.brandId===brand.id&&item.status==="active");if(currentAssignment)await setInstructorBrandStatus(brand.id,instructor.id,"inactive",currentAssignment.version,reason);}
  }
  for(const prior of before.instructors)if(!next.has(prior.id))throw new Error("Instructor records are retained; deactivate the directory entry instead of deleting it.");
}

async function persistStructure(before:AdminV2Data,after:AdminV2Data){
  const courses=byId(after.courses);
  const groups:Array<{entity:"chapters"|"lessons";previous:Array<CourseChapter|CourseLesson>;updated:Array<CourseChapter|CourseLesson>}>=[{entity:"chapters",previous:before.chapters,updated:after.chapters},{entity:"lessons",previous:before.lessons,updated:after.lessons}];
  for(const {entity,previous,updated} of groups){
    const old=byId(previous),next=byId(updated);
    for(const item of updated){
      const prior=old.get(item.id),course=courses.get(item.courseId);if(!course||!course.brandId)throw new Error("The course scope is unavailable; reload the course before editing its structure.");
      const isChapter=entity==="chapters";
      const fields={...(isChapter?{}:{courseChapterId:(item as CourseLesson).chapterId,description:(item as CourseLesson).description.trim()||null}),title:item.title,sortOrder:item.order,status:isChapter?(item.status==="Archived"?"archived":(item as CourseChapter).backendStatus??"draft"):item.status.toLowerCase()};
      if(!prior){await writeStructure(course.brandId,course.id,entity,undefined,{...fields,reason});continue;}
      const priorCourse=courses.get(prior.courseId);if(!priorCourse?.brandId)throw new Error("The course scope is unavailable; reload the course before editing its structure.");
      const changed=prior.title!==item.title||prior.order!==item.order||prior.status!==item.status||(entity==="lessons"&&((prior as CourseLesson).chapterId!==(item as CourseLesson).chapterId||(prior as CourseLesson).description!==(item as CourseLesson).description));
      const unsupported=entity==="lessons"&&((prior as CourseLesson).releaseMode!==(item as CourseLesson).releaseMode||(prior as CourseLesson).releaseAt!==(item as CourseLesson).releaseAt||(prior as CourseLesson).visibility!==(item as CourseLesson).visibility);
      if(unsupported)throw new Error("Lesson release/visibility settings are not part of the current Course Builder API; no local change was saved.");
      if(changed)await writeStructure(course.brandId,course.id,entity,item.id,{...fields,expectedVersion:item.version??prior.version??1,reason});
    }
    for(const prior of previous)if(!next.has(prior.id))throw new Error("Course structure is archived, not deleted. Archive the item to preserve teaching history.");
  }
}

export async function persistAdminV2ServerChanges(before:AdminV2Data,after:AdminV2Data){
  const errors:string[]=[];
  if(!same(before.courses,after.courses))try{await persistCourses(before,after);}catch(error){errors.push(message(error));}
  if(!same(before.instructors,after.instructors)||!same(before.instructorBrandAssignments,after.instructorBrandAssignments))try{await persistInstructors(before,after);}catch(error){errors.push(message(error));}
  if(!same(before.chapters,after.chapters)||!same(before.lessons,after.lessons))try{await persistStructure(before,after);}catch(error){errors.push(message(error));}
  if(!same(before.contentResources,after.contentResources))errors.push("Lesson resources must be changed through the protected Content API; local resource edits are not persisted.");
  if(!same(before.students,after.students)||!same(before.devices,after.devices)||!same(before.sessions,after.sessions)||!same(before.payments,after.payments)||!same(before.subscriptions,after.subscriptions)||!same(before.auditEvents,after.auditEvents))errors.push("This domain is server-owned and cannot be changed through the local Admin V2 store.");
  if(!same(before.institutions,after.institutions)||!same(before.curricula,after.curricula)||!same(before.academicYears,after.academicYears)||!same(before.semesters,after.semesters)||!same(before.curriculumUnits,after.curriculumUnits))errors.push("Academic curriculum is provided as a read-only catalogue by the current backend contract.");
  if(!same(before.enrollments,after.enrollments))errors.push("Student access assignments are controlled by subscription Seats and AccessGrants, not by direct Course enrollment edits.");
  return errors;
}
export function adminV2ServerDomainsChanged(before:AdminV2Data,after:AdminV2Data){return !same(before.courses,after.courses)||!same(before.institutions,after.institutions)||!same(before.curricula,after.curricula)||!same(before.academicYears,after.academicYears)||!same(before.semesters,after.semesters)||!same(before.curriculumUnits,after.curriculumUnits)||!same(before.chapters,after.chapters)||!same(before.lessons,after.lessons)||!same(before.contentResources,after.contentResources)||!same(before.instructors,after.instructors)||!same(before.instructorBrandAssignments,after.instructorBrandAssignments)||!same(before.enrollments,after.enrollments)||!same(before.students,after.students)||!same(before.devices,after.devices)||!same(before.sessions,after.sessions)||!same(before.payments,after.payments)||!same(before.subscriptions,after.subscriptions)||!same(before.auditEvents,after.auditEvents);}
function same(a:unknown,b:unknown){return JSON.stringify(a)===JSON.stringify(b);}
function message(error:unknown){return error instanceof Error?error.message:"The Admin update could not be saved.";}
