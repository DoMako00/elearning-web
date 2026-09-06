import type { M2bEntity, M2bFields, M2bRecord, M2bScope } from '../../contracts/admin/m2b-course-delivery';

/** Runs exclusively inside the existing Admin write transaction. */
export interface M2bCourseDeliveryRepository {
  authorize(adminProfileId: string, permission: string): Promise<boolean>;
  list<E extends M2bEntity>(entity: E, scope: M2bScope): Promise<readonly M2bRecord<E>[]>;
  lock<E extends M2bEntity>(entity: E, scope: M2bScope, id: string): Promise<M2bRecord<E> | null>;
  create<E extends M2bEntity>(entity: E, scope: M2bScope, fields: M2bFields[E]): Promise<M2bRecord<E>>;
  update<E extends M2bEntity>(entity: E, scope: M2bScope, id: string, fields: M2bFields[E]): Promise<M2bRecord<E>>;
}
