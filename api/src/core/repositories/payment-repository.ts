import type { Order, Payment, Refund } from "../../domain";
import type { BrandScopedLookup, OrderId, PaymentId, RefundId } from "../persistence";
import type { RepositoryResult } from "../persistence";

export interface CommercialStateSnapshot {
  readonly orderId: OrderId;
  readonly paymentStatus: Payment["status"] | null;
  readonly subscriptionStateReference?: string;
}

export interface PaymentRepository {
  findOrderById(input: BrandScopedLookup<OrderId>): Promise<RepositoryResult<Order>>;
  findPaymentsForOrder(input: BrandScopedLookup<OrderId>): Promise<RepositoryResult<readonly Payment[]>>;
  findPaymentReviewState(input: BrandScopedLookup<PaymentId>): Promise<RepositoryResult<Payment["status"]>>;
  findRefundById(input: BrandScopedLookup<RefundId>): Promise<RepositoryResult<Refund>>;
  findCommercialStateSnapshot(input: BrandScopedLookup<OrderId>): Promise<RepositoryResult<CommercialStateSnapshot>>;
}

