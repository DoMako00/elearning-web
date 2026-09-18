import type { M2bDeliveryEntity, M2bFields, M2bRecord, M2bScope } from '../../contracts/admin/m2b-course-delivery';
import type { PgWriteClientLike } from './postgres-admin-m2-write-transaction';
import { requiredPersistenceTimestamp } from '../supabase/repositories/persistence-timestamp';

// Identifiers come exclusively from this source allowlist; values are parameters.
const definitions = {
  chapters: { table: 'course_chapters', fields: { title: 'title', sortOrder: 'sort_order', status: 'status' } },
  lessons: { table: 'course_lessons', fields: { title: 'title', sortOrder: 'sort_order', status: 'status', courseChapterId: 'course_chapter_id' } },
  resources: { table: 'lesson_resources', fields: { title: 'title', sortOrder: 'sort_order', status: 'status', courseLessonId: 'course_lesson_id', resourceKind: 'resource_kind' } },
} as const;

export class PostgresM2bDeliveryRepository {
  constructor(private readonly client: PgWriteClientLike) {}

  private map<E extends M2bDeliveryEntity>(entity:E,row:Record<string,unknown>):M2bRecord<E> {
    const fields = Object.fromEntries(Object.entries(definitions[entity].fields).map(([key,column]) => [key,row[column]]));
    const version = Number(row.version);
    if (!Number.isSafeInteger(version) || version < 1) throw new Error('Invalid delivery record version.');
    return { ...fields, id: row.id, brandId: row.brand_id, brandCourseId: row.brand_course_id, version,
      createdAt: requiredPersistenceTimestamp(row.created_at), updatedAt: requiredPersistenceTimestamp(row.updated_at) } as M2bRecord<E>;
  }

  async lock<E extends M2bDeliveryEntity>(entity:E,scope:M2bScope,id:string):Promise<M2bRecord<E>|null> {
    const result = await this.client.query(`select * from app.${definitions[entity].table} where brand_id=$1 and brand_course_id=$2 and id=$3 for update`,[scope.brandId,scope.brandCourseId,id]);
    return result.rows[0] ? this.map(entity,result.rows[0]) : null;
  }

  async create<E extends M2bDeliveryEntity>(entity:E,scope:M2bScope,fields:M2bFields[E]):Promise<M2bRecord<E>> {
    const entries = Object.entries(definitions[entity].fields);
    const values = entries.map(([key]) => (fields as unknown as Record<string,unknown>)[key]);
    const result = await this.client.query(`insert into app.${definitions[entity].table} (brand_id,brand_course_id,${entries.map(([,column])=>column).join(',')}) values ($1,$2,${entries.map((_,index)=>`$${index+3}`).join(',')}) returning *`,[scope.brandId,scope.brandCourseId,...values]);
    if (!result.rows[0]) throw new Error('Delivery record was not created.');
    return this.map(entity,result.rows[0]);
  }

  async update<E extends M2bDeliveryEntity>(entity:E,scope:M2bScope,id:string,fields:M2bFields[E]):Promise<M2bRecord<E>> {
    const entries = Object.entries(definitions[entity].fields);
    const values = entries.map(([key]) => (fields as unknown as Record<string,unknown>)[key]);
    // The executor holds the scoped row lock and checks expectedVersion first.
    // Migration 000's trigger owns version increments and updated_at.
    const result = await this.client.query(`update app.${definitions[entity].table} set ${entries.map(([,column],index)=>`${column}=$${index+4}`).join(',')} where brand_id=$1 and brand_course_id=$2 and id=$3 returning *`,[scope.brandId,scope.brandCourseId,id,...values]);
    if (!result.rows[0]) throw new Error('Delivery record was not updated.');
    return this.map(entity,result.rows[0]);
  }
}
