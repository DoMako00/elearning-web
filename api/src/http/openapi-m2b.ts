const uuid={type:'string',format:'uuid'};
const status={type:'string',enum:['draft','published','archived'],default:'draft'};
const reason={type:'string',minLength:1,maxLength:500,pattern:'\\S'};
const version={type:'integer',minimum:1};
const common={title:{type:'string',minLength:1,maxLength:240,pattern:'\\S'},sortOrder:{type:'integer',minimum:1,maximum:2147483647},status};
const fields={chapters:common,lessons:{...common,courseChapterId:uuid},resources:{...common,courseLessonId:uuid,resourceKind:{type:'string',enum:['video','document','quiz','link','file']}}};
const pathId=(name:string)=>({name,in:'path',required:true,schema:uuid});
const security=[{BearerAuth:[]}];
const json=(schema:unknown)=>({'application/json':{schema}});
const errors=Object.fromEntries([400,401,403,404,409,503].map(code=>[String(code),{description:({400:'Invalid input',401:'Sign in required',403:'Permission denied',404:'Scoped course or parent not found',409:'Version, sort order, or idempotency conflict',503:'Persistence or evidence unavailable'} as Record<number,string>)[code]}]));
const commandResult={type:'object',properties:{ok:{const:true},correlationId:{type:'string'},mutated:{type:'boolean'},replayed:{type:'boolean'},receiptId:uuid,auditEventId:uuid,data:{type:'object',required:['brandId','courseId','entity','recordId'],properties:{brandId:uuid,courseId:uuid,entity:{type:'string',enum:['chapters','lessons','resources']},recordId:uuid}}}};
export const m2bSchemas:Record<string,unknown>={};
export const m2bPaths:Record<string,unknown>={};

for(const entity of ['chapters','lessons','resources'] as const){
  const name=entity==='chapters'?'CourseChapter':entity==='lessons'?'CourseLesson':'LessonResource';
  const entityId=entity==='chapters'?'chapterId':entity==='lessons'?'lessonId':'resourceId';
  const properties=fields[entity];
  const create={type:'object',additionalProperties:false,required:[...Object.keys(properties).filter(key=>key!=='status'),'reason'],properties:{...properties,reason}};
  const update={type:'object',additionalProperties:false,minProperties:3,required:['reason','expectedVersion'],properties:{...properties,reason,expectedVersion:version}};
  const record={type:'object',required:['id','brandCourseId','version','createdAt','updatedAt',...Object.keys(properties)],properties:{...properties,id:uuid,brandCourseId:uuid,version,createdAt:{type:'string',format:'date-time'},updatedAt:{type:'string',format:'date-time'}}};
  const list={type:'object',required:['ok','data'],properties:{ok:{const:true},correlationId:{type:'string'},data:{type:'array',items:record}}};
  m2bSchemas[name]=record;m2bSchemas[name+'Create']=create;m2bSchemas[name+'Update']=update;m2bSchemas[name+'List']=list;
  const base='/v1/admin/brands/{brandId}/courses/{courseId}/'+entity;
  const parameters=[pathId('brandId'),pathId('courseId')];
  const headers=[{name:'Idempotency-Key',in:'header',required:true,schema:{type:'string',maxLength:128,pattern:'^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$'}}];
  const description='Private metadata only; no upload, storage locator, entitlement, or delivery authorization. Video metadata is forced to draft on create and update; no approval endpoint exists. Writes temporarily require admin.platform.admin.write; reads require admin.platform.admin.read. A separate permission migration is deferred. PATCH requires the current expectedVersion; each mutation records M4A receipt and audit evidence.';
  const write=(schema:unknown)=>({tags:['Course delivery'],security,description,requestBody:{required:true,content:json(schema)},responses:{...errors,'200':{description:'Applied, unchanged, or replayed command',content:json(commandResult)},'201':{description:'Created metadata',content:json(commandResult)}}});
  m2bPaths[base]={get:{tags:['Course delivery'],security,description,summary:'List '+entity,parameters,responses:{...errors,'200':{description:'Real course structure; empty array when no records exist',content:json(list)}}},post:{...write(create),summary:'Create '+name,parameters:[...parameters,...headers]}};
  m2bPaths[base+'/{'+entityId+'}']={patch:{...write(update),summary:'Update '+name,parameters:[...parameters,pathId(entityId),...headers]}};
}
