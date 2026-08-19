# Payments, Refunds, and Commercial-Access Architecture

## Scope and invariants

This is backend design only. It extends `postgres-schema-v1.md`, `authorization-rls-strategy.md`, `auth-otp-session-device-flow.md`, and `subscription-seats-access-architecture.md`; it does not create SQL, migrations, payment-provider wiring, executable RLS policies, API runtime code, or frontend screens.

There are three independent lifecycles:

1. **Payment** records collection, verification, transaction evidence, and refund value.
2. **Commercial entitlement** evaluates an order, plan, subscription, and (where applicable) a seat.
3. **Authorization** records the explicit `access_grant` that a later protected-content request must validate.

No `is_paid` boolean is authoritative. Payment confirmation alone, an order, an enrollment, a subscription row, a seat, a device, or a session does not authorize protected content. A Medway payment, order, offer, subscription, seat, refund, transaction, or grant never has an Elite effect, and vice versa.

## Commercial record model

### Order

`orders` is the platform-scoped, immutable commercial intent. It selects one versioned `plans` record and stores the accepted terms/policy snapshot, price/currency snapshot, promotion reference when applicable, and exactly one owner (`user_id` xor `organization_id`). An order may be pending, eligible for payment, completed commercially, cancelled, or otherwise transitioned by configured policy; it is not an access decision.

### Payment and transaction

`payments` records a payment obligation or receipt independently from the order, subscription, and grant. It carries its platform-safe `order_id`, method/direction, amount, currency, provider-agnostic reference, lifecycle status, and submission/confirmation/rejection timing. A single order may have more than one payment record where policy supports retries, split settlement, correction, or a later balance.

`payment_transactions` is append-only evidence of a payment event. It records a payment, transaction type, amount/currency, provider/reference, status, processed time, correlation key, and redacted payload reference. It supports manual-review outcomes now and future provider initiation, authorization, capture, confirmation, reversal, settlement, dispute, reconciliation, and webhook events. It never rewrites past financial evidence.

### Manual payment evidence

The future logical `payment_evidence` (also called a manual-payment submission) is a normalized, platform-scoped record linked to one order and payment. It contains a secure evidence/reference pointer, claimed amount/currency, submitted-by platform user, submission and review timestamps, lifecycle/review status, reviewer, reason code, correlation key, and redacted review metadata. It does not store raw credentials, full payment-instrument details, or public file URLs.

Multiple evidence records may be retained for a payment so a rejected submission can be corrected without destroying review history. Accepted evidence supports a finance decision; uploading an image, InstaPay reference, wallet reference, or other proof never confirms payment by itself.

### Refund

`refunds` is a platform-scoped, append-only request and execution record linked to a payment and, when useful for reconciliation, its source order and transaction. It records requested, approved, and processed amounts/currency; reason; policy/terms snapshot; requested/reviewed/processed actor and times; status; provider result reference; and the access-effect decision/reference. A partial refund is a real refund record with its approved amount; it must not overwrite the original payment or transaction.

The future schema must add `payment_evidence` as a separate application table with non-null `platform_id` and composite platform-safe foreign keys to order, payment, submitting user, reviewer, and applicable audit records. This document makes no physical-schema change.

## Lifecycle states

Payment statuses are lifecycle labels, not entitlement flags. A configured transition model may include `created`, `awaiting_submission`, `under_manual_review`, `pending_provider`, `confirmed`, `rejected`, `failed`, `cancelled`, and `reversed`. Manual evidence has its own `submitted`, `under_review`, `accepted`, `rejected`, `superseded`, and `expired` lifecycle. Exact names remain schema-finalization work, but transitions must be explicit, idempotent, and auditable.

Refund statuses may include `requested`, `under_review`, `approved`, `rejected`, `processing`, `completed`, `failed`, and `cancelled`. A completed refund is financial evidence; the resulting subscription/grant action remains a separately recorded commercial and authorization decision.

Refund eligibility periods, payment expiry, settlement timing, partial-refund rules, unpaid grace, approval authority, and access-effect timing are versioned `policy_sets` and accepted terms snapshots. A possible 14-day refund window is not a system constant.

## Flows

### Manual payment submission and finance decision

1. The backend resolves one active platform and loads the platform-scoped order, owner, plan snapshot, and permitted payment direction.
2. It creates or locates a payment in a non-confirmed state and accepts an idempotent manual-evidence submission, such as an InstaPay or wallet reference plus a secure evidence pointer.
3. It appends `payment_evidence` and a `payment_transactions` submission event; it records audit/security evidence with redacted metadata.
4. A finance/admin command validates platform-scoped role permission, evidence integrity, claimed amount/currency, duplicate-reference signals, payment/order lifecycle, and configured policy.
5. Approval appends a confirmation transaction and transitions the payment through its permitted state. Rejection records a reason and leaves prior evidence intact; resubmission creates a new evidence record.

Approval and rejection are admin-mediated, reasoned, platform-scoped, correlated, and immutable. The browser never writes payment confirmation, transactions, refunds, policy, subscriptions, or grants directly.

### Access issuance after commercial approval

After an approved payment, the backend evaluates—not assumes—the commercial terms:

1. Confirm the payment through the approved finance workflow.
2. Validate the order, plan/version, owner, promotion interaction, and configured commercial eligibility.
3. Create or activate the appropriate platform-scoped subscription.
4. Create policy-defined Duo/group seats when applicable and validate required real-user assignments.
5. Evaluate the eligible entitlement source for each intended recipient.
6. Issue a separate explicit `access_grant` only when source, recipient, scope, dates, and policy version match one platform.
7. Create/update enrollment only as a separate participation consequence where policy permits.

Protected-content delivery still uses the full authorization pipeline: platform, app user, app session, device state, eligible source, active grant, release window, and resource policy.

### Future automatic provider and webhook flow

A future adapter may create a backend payment intent/reference and store only provider-agnostic identifiers on the payment/transaction records. A provider webhook is accepted only by a dedicated backend endpoint that verifies the provider signature/authentication, resolves the provider account to one platform, deduplicates by stable event id, preserves event ordering/reconciliation evidence, and appends a transaction before evaluating any payment transition.

Out-of-order, duplicate, replayed, malformed, or platform-mismatched events are denied/quarantined and audited. Provider success does not skip order/plan/subscription/grant evaluation. No provider adapter, secret, webhook route, or integration is implemented here.

### Refund and access effect

1. A requester submits a refund request against a platform-scoped payment; the backend validates authority, amount, reason, policy snapshot, and prior active refund totals.
2. A finance/admin reviewer records a reasoned decision and, if approved, initiates/records processing through a future provider or manual settlement process.
3. On completed or otherwise policy-effective refund state, the backend evaluates the configured commercial effect for the linked subscription and seats.
4. It suspends/revokes future paid-source eligibility and affected access grants only when the configured terms require it, records the decision, and keeps all historical records.

Refunds never delete payments, transactions, subscriptions, historical seats, access grants, enrollments, progress, playback, quiz attempts, certificates, or audit evidence. Historical academic activity is preserved even when future protected access is removed.

## Platform and permission boundaries

Every lookup, join, idempotency key, provider account mapping, and command has one resolved `platform_id`. Composite foreign keys must ensure payment evidence, transactions, refunds, orders, plans, subscriptions, seats, users, organizations, and grants cannot cross platform boundaries. A payment reference is not globally authoritative without its platform context.

Learners and authorized organization representatives may submit permitted payment evidence and view a redacted status for their own platform-scoped commercial records. They cannot approve/reject evidence, confirm payments, write transactions, issue/refund value, activate subscriptions, manage policy, or issue/revoke grants.

Finance/admin commands require active platform-scoped authority through `admin_users`, `admin_user_roles`, `roles`, and `permissions`. They validate the target relationship and workflow state before mutation. Finance, policy, security, transaction reconciliation, refund processing, subscription activation, and grant changes are backend-mediated; RLS is a defense layer, not the workflow engine.

## Related schema tables

| Concern | Tables / future logical record |
|---|---|
| Commercial intent and policy | `orders`, `plans`, `policy_sets`, `offers`, `promotions` |
| Money and verification | `payments`, `payment_transactions`, future `payment_evidence`, `refunds` |
| Commercial/access effect | `subscriptions`, `seats`, `access_grants`, `enrollments` |
| Owners and authority | `users`, `organizations`, `platform_memberships`, `admin_users`, RBAC joins |
| Evidence and protection | `audit_logs`, `security_events`, `admin_actions`, `access_decisions`, `app_sessions`, `devices`, `playback_sessions` |

## API route map (contracts only)

| Route | Purpose |
|---|---|
| `POST /v1/orders`; `GET /v1/orders/{id}`; `GET /v1/orders/mine` | Create and read redacted, platform-scoped commercial intent/status. |
| `POST /v1/orders/{id}/payments`; `GET /v1/payments/{id}` | Create a permitted payment direction/reference and read redacted status. |
| `POST /v1/payments/{id}/evidence`; `POST /v1/payments/{id}/evidence/{evidenceId}/resubmit` | Submit or replace manual evidence through backend validation. |
| `POST /v1/admin/payments/{id}/review`; `POST /v1/admin/payments/{id}/reconcile` | Audited finance approval/rejection and reconciliation commands. |
| `GET /v1/payments/{id}/transactions` | Redacted platform-authorized transaction evidence. |
| `POST /v1/payments/{id}/refund-requests`; `GET /v1/refunds/{id}` | Submit/read a refund request and lifecycle status. |
| `POST /v1/admin/refunds/{id}/decision`; `POST /v1/admin/refunds/{id}/process` | Finance approval/rejection and controlled processing command. |
| `POST /v1/entitlements/check`; `POST /v1/admin/access-grants` | Evaluate entitlement or issue a controlled explicit grant, never directly from a client payment claim. |

Future provider webhook endpoints remain intentionally unspecified until a provider is selected and security-reviewed.

## Validation, audit, and fraud controls

Validate: active platform; composite owner/order/payment/transaction/refund relationships; user XOR organization owner; plan and accepted policy snapshot; positive compatible amounts; currency consistency or approved conversion policy; allowed lifecycle transition; active refund total not exceeding eligible confirmed value; evidence integrity; reviewer authority; scope of subscription/seat impact; idempotency key; and correlation id.

Defend against forged or altered evidence, reused/duplicated transfer references, payment-reference collision, duplicate/replayed/out-of-order webhooks, amount/currency substitution, refund overpayment, double activation, tampered client payment status, cross-platform identifier confusion, unauthorized finance/support action, and sensitive-evidence exposure. Store files/references privately, avoid payment-instrument data in logs, and retain only redacted payload references in operational events.

Audit payment initiated/submitted/reviewed/confirmed/rejected/failed/reversed; transaction appended/reconciled/quarantined; evidence submitted/resubmitted/accepted/rejected; refund requested/approved/rejected/processed/failed/completed; commercial eligibility evaluated; subscription/seat change; grant issued/suspended/revoked; and finance/admin attempts/results. Capture actor, platform, target, reason, policy version, correlation/idempotency key, outcome, and redacted metadata. Logs are append-only evidence, not authorization inputs.

## Open decisions before implementation

- Tax, invoices, legal issuer, multicurrency, exchange-rate, and settlement-account model.
- Exact InstaPay/wallet/manual-proof requirements, evidence retention, reconciliation service-level objectives, and dispute/appeal workflow.
- Automatic provider selection, webhook signature model, event-retry contract, settlement/reconciliation cadence, and chargeback/dispute handling.
- Refund eligibility, partial-refund behavior, refund destination, review authority, and precise access suspension/revocation timing.
- Promotion stacking, discount allocation across refunds, upgrades/downgrades, prorations, credit notes, and unpaid-grace behavior.
- Organization billing delegation, billing-contact verification, ownership migration, and support emergency-access policy.
- Certificate standing after cancellation/refund, privacy/erasure rules, financial-record retention, and regulatory/data-residency obligations.
