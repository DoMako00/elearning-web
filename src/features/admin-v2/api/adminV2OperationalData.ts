import type { AdminV2Data, AuditEvent, BrandCode, BrandFilter, ContentResource, CourseRecord, StudentDevice, StudentRecord, StudentSession } from "../types/adminV2.types";
import { mapChapterDto, mapLessonDto } from "./adminV2Mappers";
import { listBrandAccess, listStructure } from "./adminAcademicApi";
import { listLessonResources, listLessonMedia, type LessonResourceDto, type MediaAssetDto } from "./adminContentApi";
import { getAdminOverview, listAdminSecurityEvents, listAllAdminStudents, loadAdminStudentDetails, type AdminOverviewSnapshot, type AdminSecurityEventDto } from "./adminOperationsApi";
import { listSemesterOfferingOrders } from "./adminCommercialApi";
import type { AdminStudentDetail, AdminStudentListItem } from "./adminStudentsApi";

export interface AdminOverviewView {
  counts: AdminOverviewSnapshot["counts"] & { totalStudents: number; activeStudents: number; publishedCourses: number; activeDevices: number; activeSessions: number; approvedRevenueMinor: number | null };
  securityEvents: AuditEvent[];
  paymentCoverage: "listed" | "unavailable";
}
export type OperationalServerData = Partial<Pick<AdminV2Data, "students" | "devices" | "sessions" | "auditEvents" | "chapters" | "lessons" | "contentResources" | "payments">>;

const asBrand=(value:string|null|undefined):BrandCode=>value==="medway"||value==="nexus"?value:"elite";
const statusOfStudent=(value:AdminStudentListItem["status"]):StudentRecord["status"]=>value==="active"?"Active":value==="suspended"?"Suspended":value==="disabled"?"Inactive":"Pending Payment";
const institutionLabel=(value:string|null)=>value?.toLowerCase().includes("delta")?"Delta" as const:"BUC" as const;
const studentRecord=(item:AdminStudentListItem):StudentRecord=>({id:item.id,accountIdentifier:"—",fullName:item.displayName??"Unnamed Student",email:item.emailMasked??"",phone:item.phoneMasked??"",brand:asBrand(item.platform?.platformCode),institution:institutionLabel(item.academicInstitution),academicLevel:item.academicLevel??"—",semester:item.academicSemester??item.academicTermOrYear??"—",program:"",status:statusOfStudent(item.status),createdAt:item.lastSeenAt??"—",lastActivity:item.lastSeenAt??"Never"});
const labelAction=(action:string)=>action.replace(/[._-]+/g," ").replace(/\b\w/g,(char)=>char.toUpperCase());
const eventType=(action:string):string=>/device/i.test(action)?"Device":/session/i.test(action)?"Session":/student|profile|claim/i.test(action)?"Student":/instructor|teaching/i.test(action)?"Instructor":/seat|subscription/i.test(action)?"Subscription":/payment|order/i.test(action)?"Payment":/content|resource/i.test(action)?"Content":/course/i.test(action)?"Course":"System";
export function mapSecurityEvent(event:AdminSecurityEventDto):AuditEvent{return{id:event.id,actor:event.actorName||"System",action:labelAction(event.action),targetType:eventType(event.action),targetId:event.targetId??event.id,targetLabel:event.targetId?`Record ${event.targetId.slice(0,8)}`:"System activity",status:event.result==="denied"?"Warning":/critical|locked|failed/i.test(event.action)?"Critical":"Info",timestamp:event.createdAt,metadata:[event.reason,event.correlationId?`Correlation ${event.correlationId}`:""].filter(Boolean).join(" · ")||undefined};}

async function allSecurityEvents(brand:BrandFilter){const first=await listAdminSecurityEvents(brand,1,100);const pageCount=Math.max(1,Math.ceil(first.pagination.totalItems/first.pagination.pageSize));const rest=await Promise.all(Array.from({length:pageCount-1},(_,index)=>listAdminSecurityEvents(brand,index+2,100)));return[...first.items,...rest.flatMap((page)=>page.items)].map(mapSecurityEvent);}
export async function loadAdminSecurityEvents(brand:BrandFilter):Promise<AuditEvent[]>{return allSecurityEvents(brand);}

function mapDevicesAndSessions(details:AdminStudentDetail[]){
  const devices:StudentDevice[]=[];const sessions:StudentSession[]=[];
  for(const detail of details){
    for(const device of detail.devices??[]){
      const slot=device.slot??null;const mobile=slot==="mobile"||(!slot&&/phone|mobile|android|ios/i.test(device.platform??""));
      devices.push({id:device.id,studentId:detail.id,name:device.platform||"Registered device",category:mobile?"Mobile":"Additional device",type:mobile?"Phone":/tablet|ipad/i.test(device.platform??"")?"Tablet":"PC / laptop",platform:device.platform??"Not reported",browser:device.browser??"Not reported",firstSeen:device.firstSeenAt,lastSeen:device.lastSeenAt,status:device.revokedAt?"Revoked":"Active"});
    }
    const deviceById=new Map((detail.devices??[]).map((device)=>[device.id,device]));
    for(const session of detail.sessions??[]){const linked=session.deviceId?deviceById.get(session.deviceId):undefined;const expired=!!session.expiresAt&&Date.parse(session.expiresAt)<=Date.now();sessions.push({id:session.id,studentId:detail.id,deviceId:session.deviceId??"",device:linked?.platform??"Device not reported",platform:linked?.platform??"Not reported",browser:linked?.browser??"Not reported",created:session.createdAt,lastActivity:session.lastSeenAt,status:session.revokedAt||expired?"Revoked":"Active"});}
  }
  return{devices,sessions};
}

export async function loadAdminSecurityData(brand:BrandFilter):Promise<OperationalServerData>{
  const [students,events]=await Promise.all([listAllAdminStudents(brand),allSecurityEvents(brand)]);
  const details=await loadAdminStudentDetails(students,brand);
  const {devices,sessions}=mapDevicesAndSessions(details);
  return{students:students.map(studentRecord),devices,sessions,auditEvents:events};
}

function mapResource(resource:LessonResourceDto,asset:MediaAssetDto|undefined,course:CourseRecord):ContentResource|null{
  if(resource.resourceKind!=="video"&&resource.resourceKind!=="document")return null;
  const archived=resource.status==="archived"||asset?.status==="withdrawn";
  const published=resource.status==="published"&&asset?.status==="published";
  return{id:resource.id,lessonId:resource.courseLessonId,type:resource.resourceKind==="video"?"Video":"PDF",title:resource.title,description:"",fileName:asset?"File name not exposed by API":"No uploaded file",fileSize:asset?.objectSize??asset?.expectedSize??0,mimeType:asset?.contentType??(resource.resourceKind==="video"?"video/mp4":"application/pdf"),status:archived?"Withdrawn":published?"Published":"Draft",createdAt:resource.createdAt??"",updatedAt:resource.updatedAt??resource.createdAt??"",releaseAt:null,visibility:"Visible",brandId:course.brandId,courseId:course.id,version:resource.version,mediaAssetId:asset?.id??null,uploadStatus:asset?.status??"not_uploaded",backendStatus:resource.status,resourceKind:resource.resourceKind};
}

export async function loadAdminContentData(courses:CourseRecord[]):Promise<OperationalServerData>{
  const brands=await listBrandAccess();
  const activeBrands=brands.filter((brand)=>brand.status.toLowerCase()==="active");
  const structures=await Promise.all(courses.map(async(course)=>{const brand=activeBrands.find((item)=>item.id===course.brandId);return brand&&course.brandId?{course,brand,structure:await listStructure(brand.id,course.id)}:null;}));
  const valid=structures.filter((item):item is NonNullable<typeof item>=>Boolean(item));
  const [resourceGroups,mediaGroups]=await Promise.all([
    Promise.all(valid.map(async({course,brand})=>({course,brand,items:await listLessonResources(brand.id,course.id)}))),
    Promise.all(valid.flatMap(({course,brand,structure})=>structure.lessons.map(async(lesson)=>({course,brand,lesson,inventory:await listLessonMedia({brand,course,lesson})}))))
  ]);
  const chapters=valid.flatMap(({course,structure})=>structure.chapters.map((item)=>mapChapterDto(item,course.id)));
  const lessons=valid.flatMap(({course,structure})=>structure.lessons.map((item)=>mapLessonDto(item,course.id)));
  const lessonById=new Map(lessons.map((lesson)=>[lesson.id,lesson]));const courseById=new Map(courses.map((course)=>[course.id,course]));
  const mediaByResource=new Map<string,MediaAssetDto>();for(const group of mediaGroups)for(const asset of group.inventory.assets)if(asset.resourceId)mediaByResource.set(asset.resourceId,asset);
  const contentResources=resourceGroups.flatMap(({items})=>items.flatMap((resource)=>{const course=courseById.get(resource.brandCourseId);if(!lessonById.has(resource.courseLessonId)||!course)return[];const mapped=mapResource(resource,mediaByResource.get(resource.id),course);return mapped?[mapped]:[];}));
  return{chapters,lessons,contentResources};
}

function countOverview(snapshots:AdminOverviewSnapshot[],students:AdminStudentListItem[],courses:CourseRecord[]):AdminOverviewView{
  const counts=snapshots.reduce((acc,item)=>{for(const key of Object.keys(acc) as (keyof AdminOverviewSnapshot["counts"])[])acc[key]+=item.counts[key];return acc;},{pendingPaymentReviews:0,pendingRefunds:0,suspiciousSecurityEvents:0,activeSubscriptions:0,expiredSubscriptions:0,activeGrants:0,revokedGrants:0,contentAwaitingRelease:0,assessmentsAwaitingReview:0});
  return{counts:{...counts,totalStudents:students.length,activeStudents:students.filter((student)=>student.status==="active").length,publishedCourses:courses.filter((course)=>course.status==="Published").length,activeDevices:students.reduce((sum,item)=>sum+item.activeDeviceCount,0),activeSessions:students.reduce((sum,item)=>sum+item.activeSessionCount,0),approvedRevenueMinor:null},securityEvents:[],paymentCoverage:"unavailable"};
}

export async function loadAdminOverviewData(brand:BrandFilter,courses:CourseRecord[]):Promise<{data:OperationalServerData;overview:AdminOverviewView}>{
  const [students,events,brands]=await Promise.all([listAllAdminStudents(brand),allSecurityEvents(brand),listBrandAccess()]);
  const targetBrands=brand==="all"?(["medway","elite","nexus"] as const):([brand] as const);
  const available=brands.filter((item)=>targetBrands.includes(item.code as never)&&item.status.toLowerCase()==="active");
  const [snapshots,orderPages]=await Promise.all([Promise.all(available.map((item)=>getAdminOverview(item.code))),Promise.all(available.map((item)=>listSemesterOfferingOrders({brand:item.code})))]);
  const orders=orderPages.flatMap((page)=>page.items);
  const overview=countOverview(snapshots,students,courses);
  overview.securityEvents=events;
  const payments=orders.filter((item)=>item.status!=="cancelled").map((item)=>({id:item.orderId,orderId:item.orderId,subscriptionId:item.subscriptionId??"",brand:item.brandCode,studentIds:item.students?.map((student)=>student.studentProfileId)??[],planId:(item.capacity===1?"individual":item.capacity===3?"trio":"group") as "individual"|"trio"|"group",seatCount:item.capacity,amount:item.priceTotalMinor/100,currency:"EGP" as const,method:item.paymentMethod==="instapay"?"Other" as const:item.paymentMethod==="wallet"?"Wallet" as const:item.paymentMethod==="bank_transfer"?"Bank transfer" as const:item.paymentMethod==="cash"?"Cash" as const:"Other" as const,submittedAt:item.createdAt,status:item.status==="pending_review"?"Pending Verification" as const:item.status==="approved"?"Approved" as const:"Rejected" as const}));
  return{data:{students:students.map(studentRecord),auditEvents:events,payments},overview};
}

export function securityBrandCode(student:AdminStudentListItem){return asBrand(student.platform?.platformCode);}
