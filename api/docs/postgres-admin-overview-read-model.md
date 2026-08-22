# PostgreSQL Admin Overview Read Model

## Prompt 42 boundary

Prompt 42 adds the first controlled PostgreSQL-backed Admin Overview source. The public route remains `GET /v1/admin/overview`; `ADMIN_READ_MODEL_SOURCE=mock` remains the default and the current mock response remains unchanged.

The source selector is independent from persistence selection:

| `PERSISTENCE_PROVIDER` | `ADMIN_READ_MODEL_SOURCE` | Result |
|---|---|---|
| `mock` | `mock` or omitted | Valid; existing in-memory overview. |
| `supabase` | `mock` | Valid; PostgreSQL infrastructure exists but the overview stays mock-backed. |
| `supabase` | `postgres` | Valid; the M1 PostgreSQL read model is selected. |
| `mock` | `postgres` | Invalid; application configuration fails without a fallback. |

## M1 coverage and brand isolation

The PostgreSQL read model resolves exactly one active canonical educational brand through the M1 `educational_brands` repository using the requested `brand_code`. It returns the persisted `brand_id`, code, and name, and the compatibility `platform` projection refers to that same brand only. It does not query another brand or aggregate Medway and Elite.

The current overview contract has cards for payment review, refunds, security evidence, subscriptions, access grants, content release, and assessment review. Those domains are outside M1. Therefore the first real source returns all existing count fields as `0` and all recent arrays as empty. It does not treat global `app_users` as brand users, and it does not infer subscription, payment, enrollment, seat, or protected-content access from membership or profile records.

## Runtime and failure behavior

The read model is constructed without querying. A database read occurs only after an Admin Overview request reaches the PostgreSQL source. Repository failures are converted to sanitized Admin Overview failures and never return mock fixture data. The private `app` schema remains direct-server PostgreSQL only; no Data API exposure, RLS, policy, grant, or write path is added.

## Staging verification boundary

Prompt 40 established controlled PostgreSQL connectivity, but the staging M1 tables currently have zero rows. No educational brand exists to support a successful real Admin Overview response. Prompt 42 does not seed data or run an artificial staging query; end-to-end PostgreSQL overview verification is blocked until a separately approved seed/data phase provides an active brand.

Dokploy and frontend defaults remain mock-backed. Prompt 43 or a separately approved phase may verify the endpoint against approved non-empty staging data; it must not create that data implicitly.
