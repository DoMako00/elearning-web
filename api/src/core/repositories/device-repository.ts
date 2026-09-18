import type { Device } from "../../domain";
import type { BrandScopedQuery, BrandScopedLookup, AppUserId, DeviceId } from "../persistence";
import type { RepositoryResult } from "../persistence";

export interface DeviceRepository {
  findDeviceById(input: BrandScopedLookup<DeviceId>): Promise<RepositoryResult<Device>>;
  findDevicesForUser(input: BrandScopedLookup<AppUserId>): Promise<RepositoryResult<readonly Device[]>>;
  findActiveDevicesForUser(input: BrandScopedLookup<AppUserId>): Promise<RepositoryResult<readonly Device[]>>;
  recordDeviceSeen(input: { readonly deviceId: DeviceId; readonly userId: AppUserId; readonly brand: BrandScopedQuery["brand"]; readonly seenAt: string }): Promise<RepositoryResult<void>>;
  revokeDevice(input: BrandScopedLookup<DeviceId> & { readonly reason: string; readonly idempotencyKey: string }): Promise<RepositoryResult<void>>;
  recordDeviceEvent(input: { readonly deviceId: DeviceId; readonly brand: BrandScopedQuery["brand"]; readonly eventType: string; readonly correlationId?: string }): Promise<RepositoryResult<void>>;
}

