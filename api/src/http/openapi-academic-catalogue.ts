const uuid={type:'string',format:'uuid'};
const text={type:'string'};
const ref=(name:string)=>({$ref:`#/components/schemas/${name}`});
const array=(name:string)=>({type:'array',items:ref(name)});
const object=(properties:Record<string,unknown>)=>({type:'object',required:Object.keys(properties),properties});
const versioned={id:uuid,createdAt:{type:'string',format:'date-time'},updatedAt:{type:'string',format:'date-time'},version:{type:'integer',minimum:1}};
export const academicCatalogueSchemas={
  AcademicLevel:object({...versioned,levelNumber:{type:'integer',minimum:1},displayTitle:text,sortOrder:{type:'integer',minimum:1},status:{type:'string',enum:['active','retired']}}),
  AcademicSemester:object({...versioned,academicLevelId:uuid,semesterNumber:{type:'integer',minimum:1},displayTitle:text,sortOrder:{type:'integer',minimum:1},status:{type:'string',enum:['active','retired']}}),
  Instructor:object({...versioned,code:text,instructorCode:text,displayName:text,status:{type:'string',enum:['active','inactive','archived']}}),
  InstructorBrandAssignment:object({...versioned,brandId:uuid,instructorId:uuid,status:{type:'string',enum:['active','inactive']}}),
  AcademicInstitutionIdentity:object({id:uuid,code:text,displayName:text,status:{enum:['active','retired']}}),
  AcademicCatalogueChapter:object({id:uuid,code:text,title:text,sortOrder:{type:'integer',minimum:1},status:{enum:['active','retired']}}),
  AcademicCatalogueModule:object({id:uuid,academicInstitutionId:uuid,code:text,sourceDisplayLabel:text,reviewStatus:{enum:['unreviewed','approved','blocked','retired']},resourceCount:{type:'integer',minimum:0,description:'Catalogue metadata count; no content delivery rights or storage location.'},chapters:array('AcademicCatalogueChapter')}),
  AcademicModule:object({id:uuid,academicSemesterId:uuid,code:text,normalizedCode:text,sourceDisplayLabel:text,sortOrder:{type:'integer',minimum:1},reviewStatus:{enum:['unreviewed','approved','blocked','retired']},chapters:array('AcademicCatalogueChapter'),createdAt:{type:'string',format:'date-time'},updatedAt:{type:'string',format:'date-time'},version:{type:'integer',minimum:1}}),
  AcademicCatalogueSemester:object({id:uuid,semesterNumber:{type:'integer'},displayTitle:text,status:text,modules:array('AcademicCatalogueModule')}),
  AcademicCatalogueLevel:object({id:uuid,levelNumber:{type:'integer'},displayTitle:text,status:text,semesters:array('AcademicCatalogueSemester')}),
  AcademicCatalogueInstitution:object({id:uuid,code:text,displayName:text,status:{enum:['active','retired']},levels:array('AcademicCatalogueLevel')}),
  CommercialBrandCatalogueAccess:object({id:uuid,code:text,name:text,status:text,allowedAcademicInstitutions:array('AcademicInstitutionIdentity')}),
  CatalogueBrandCourse:object({id:uuid,brandId:uuid,code:text,title:text,cataloguePresentation:{type:'string',enum:['subject_based','module_based']},classification:{enum:['academic_module_offering','standalone']},status:{enum:['draft','published','archived']},academicInstitutionId:{type:['string','null'],format:'uuid'},academicModuleId:{type:['string','null'],format:'uuid'},brand:object({id:uuid,code:text,name:text}),academicInstitution:{anyOf:[object({id:uuid,code:text,displayName:text}),{type:'null'}]},academicModule:{anyOf:[object({id:uuid,code:text,sourceDisplayLabel:text}),{type:'null'}]},instructorAssignments:{type:'array',items:object({instructorId:uuid,displayName:text,status:text})},version:{type:'integer',minimum:1},createdAt:{type:'string',format:'date-time'},updatedAt:{type:'string',format:'date-time'}}),
};
export function catalogueReadResponse(name:string,list=true){return {description:'Real database metadata; empty lists remain empty.',content:{'application/json':{schema:object({ok:{const:true},correlationId:text,data:list?array(name):ref(name)})}}};}
export const academicCataloguePaths=Object.fromEntries([
  ['/v1/admin/curriculum/institutions','AcademicCatalogueInstitution','Read university catalogues grouped by institution, level and semester'],
  ['/v1/admin/curriculum/brand-access','CommercialBrandCatalogueAccess','Read commercial brands and active academic catalogue access'],
].map(([path,schema,summary])=>[path,{get:{operationId:path.endsWith('/institutions')?'listCurriculumInstitutions':'listBrandAcademicAccess',summary,tags:['Academic catalogue'],security:[{AdminBearerAuth:[]}],responses:{200:catalogueReadResponse(schema!),401:{description:'Authentication required'},403:{description:'Permission denied'},503:{description:'Catalogue source unavailable; no fallback'}}}}]));
