import type { IncomingMessage } from 'node:http';
import type { AdminHttpRequestContextResolver } from '../../core/context';
import type { M2bDeliveryEntity, M2bDeliveryCommand } from '../../contracts/admin/m2b-course-delivery';
import { M2B_UUID, validDeliveryFields } from '../../core/validation/admin-m2b-validation';
import { requireAdminPermission } from '../../core/permissions';
import { parseStrictBearerToken } from '../strict-bearer';
import type { AdminModule, HttpRequestContext, HttpJsonResponse } from '../http-types';
import { badRequestResponse, conflictResponse, forbiddenResponse, jsonResponse, methodNotAllowedResponse, notFoundResponse, serviceUnavailableResponse, unauthorizedResponse } from '../middleware/json-response';

const pattern=/^\/v1\/admin\/brands\/([^/]+)\/courses\/([^/]+)\/(chapters|lessons|resources)(?:\/([^/]+))?$/;
export const isAdminM2bWritePath=(path:string)=>pattern.test(path);

export async function handleAdminM2bWrite(raw:IncomingMessage,context:HttpRequestContext,admin:AdminModule,resolver:AdminHttpRequestContextResolver|undefined):Promise<HttpJsonResponse> {
  const c=context.correlationId, url=new URL(context.url,'http://localhost'), match=pattern.exec(url.pathname)!;
  const [,brandId,courseId,entityName,recordId]=match;
  const entity=entityName as M2bDeliveryEntity, update=recordId!==undefined;
  if (context.method!==(update?'PATCH':'POST')) return methodNotAllowedResponse(c,update?['PATCH']:['GET','POST']);
  if ([...url.searchParams].length||![brandId,courseId,...(recordId?[recordId]:[])].every(id=>M2B_UUID.test(id))) return badRequestResponse(c,'Invalid delivery route.');
  const bearer=parseStrictBearerToken(raw);
  if (!bearer.ok) return bearer.code==='duplicate'||bearer.code==='oversized'?badRequestResponse(c,'Invalid Authorization header.'):unauthorizedResponse(c);
  const key=raw.headers['idempotency-key'];
  const keyCount=raw.rawHeaders.filter((_,index)=>index%2===0&&raw.rawHeaders[index].toLowerCase()==='idempotency-key').length;
  if (keyCount!==1||typeof key!=='string'||!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(key)) return badRequestResponse(c,'A valid Idempotency-Key is required.');
  let data:Record<string,unknown>;
  try {
    const chunks:Buffer[]=[]; let size=0;
    for await (const chunk of raw) { const buffer=Buffer.from(chunk); size+=buffer.length; if(size>32*1024)return badRequestResponse(c,'The request body is too large.');chunks.push(buffer); }
    const parsed:unknown=JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!parsed||typeof parsed!=='object'||Array.isArray(parsed)) return badRequestResponse(c,'A JSON object is required.');
    data=parsed as Record<string,unknown>;
  } catch { return badRequestResponse(c,'A valid JSON object is required.'); }
  const {reason,expectedVersion,...fields}=data;
  if (!update&&fields.status===undefined) fields.status='draft';
  if (typeof reason!=='string'||!reason.trim()||reason.length>500||!validDeliveryFields(entity,fields,update)
    ||(update?(!Number.isSafeInteger(expectedVersion)||Number(expectedVersion)<1):expectedVersion!==undefined)) return badRequestResponse(c,'Provide valid metadata, a nonblank reason, and expectedVersion for updates.');
  if (!resolver||!admin.commands.m2) return serviceUnavailableResponse(c);
  const resolved=await resolver.resolve({requestId:context.requestId,correlationId:c as never,bearerToken:bearer.token,requestedBrandId:brandId});
  if (!resolved.ok) return ['authentication_required','authentication_invalid'].includes(resolved.error.code)?unauthorizedResponse(c):resolved.error.code==='permission_denied'?forbiddenResponse(c):serviceUnavailableResponse(c);
  const trusted=resolved.value;
  // Same strict M2A permission until a separately approved permission migration.
  if (trusted.brand.brandId!==brandId||!requireAdminPermission(trusted,'admin.platform.admin.write').ok) return forbiddenResponse(c);
  const command:M2bDeliveryCommand={brandId,courseId,...(recordId?{recordId}:{}),fields,metadata:{platform:trusted.platform,correlationId:trusted.correlationId,reason,idempotencyKey:key,...(update?{expectedVersion:expectedVersion as number}:{})}};
  const executor=admin.commands.m2;
  const result=await (entity==='chapters'?(update?executor.updateCourseChapter(trusted,command):executor.createCourseChapter(trusted,command)):entity==='lessons'?(update?executor.updateCourseLesson(trusted,command):executor.createCourseLesson(trusted,command)):(update?executor.updateLessonResource(trusted,command):executor.createLessonResource(trusted,command)));
  if (result.ok) return jsonResponse(!update&&result.value.mutated&&!result.value.replayed?201:200,{ok:true,...result.value},{'x-correlation-id':c});
  const error=result.error;
  if (error.code==='target_not_found') return notFoundResponse(c);
  if (error.code==='conflict'||error.code==='idempotency_key_reused') return conflictResponse(c);
  if (error.code==='permission_denied'||error.code==='admin_user_missing_or_inactive') return forbiddenResponse(c);
  if (error.code==='persistence_failed'||error.code==='audit_write_failed') return serviceUnavailableResponse(c);
  return badRequestResponse(c,'The administrative delivery command is invalid.');
}
