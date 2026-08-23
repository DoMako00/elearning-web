# Admin M2 Transactional Write Execution

## Status and boundary

Prompt 53 implements the provider-neutral, programmatic execution boundary for the ten Prompt 52 Admin M2 commands. It is disabled by default and is not mounted as HTTP. No command was executed against staging or production in this phase.

`ADMIN_COMMAND_SOURCE=mock` remains the default. It constructs no write pool and exposes no executable M2 command service. `ADMIN_COMMAND_SOURCE=postgres` requires `PERSISTENCE_PROVIDER=supabase`; it constructs a lazy dedicated write pool and the command executor without opening a connection or issuing a query. The existing Admin Overview and Admin M2 read selectors remain independent.

The current HTTP Admin boundary is intentionally unsuitable for writes: it is a mock, unauthenticated skeleton and does not resolve a durable `app.admin_profiles.id`. Trusted authenticated request-context construction and HTTP JSON command routes require a later approval. No POST, PUT, PATCH, or DELETE route was added.

## Command catalogue

| Command | Permission | Target |
|---|---|---|
| Create instructor | `admin.instructors.create` | global instructor |
| Update instructor | `admin.instructors.update` | global instructor |
| Set instructor status | `admin.instructors.update` | global instructor |
| Assign instructor to brand | `admin.brand_instructors.assign` | brand association |
| Set brand-instructor status | `admin.brand_instructors.update` | brand association |
| Create brand course | `admin.brand_courses.create` | brand-owned course |
| Update brand course | `admin.brand_courses.update` | brand-owned course |
| Set brand-course status | `admin.brand_courses.update` | brand-owned course |
| Assign instructor to course | `admin.course_instructors.assign` | same-brand teaching assignment |
| Set course-instructor status | `admin.course_instructors.update` | same-brand teaching assignment |

The trusted Admin context now names `adminProfileId` explicitly. The older `adminUserId` remains a deprecated compatibility alias and must contain the same value. Actor identity, active brand, permission snapshot, correlation/request identifiers, and server time are never accepted from a command body. Prompt 54 provides the reusable [Trusted Admin HTTP Context](trusted-admin-auth-http-context.md) resolver for a future authenticated route boundary; it does not mount M2 write routes.

## Transaction and lock model

Each actual mutation uses one checked-out PostgreSQL client:

1. begin one transaction;
2. lock and revalidate the active educational brand and Admin profile pair;
3. check the durable M4 receipt identity;
4. lock only the domain rows required by the command;
5. evaluate the resulting state and Prompt 52 policy;
6. perform one constrained M2 insert or update;
7. insert one `app.admin_actions` success receipt;
8. insert one matching `app.audit_logs` record;
9. commit once, or roll everything back;
10. release the client exactly once.

The provider-neutral transaction interface exposes only named domain operations. Raw clients, arbitrary SQL, environment values, and generic execution methods stay in infrastructure. Statements are static, schema-qualified, parameterized `SELECT`, narrow `SELECT ... FOR UPDATE`, `INSERT`, or `UPDATE` statements. There is no delete or academic-reference write method.

Lock ordering starts with the trusted brand/profile pair, then the required module or course, global instructor, brand-instructor association, and course-instructor assignment. Brand predicates remain mandatory for courses and associations. A scoped miss returns the same safe not-found result whether the identifier is absent or belongs to another brand.

## Idempotency and concurrency

The durable identity is:

`(brand_id, admin_profile_id, command_name, idempotency_key)`

The versioned fingerprint is `v1:sha256:<lowercase-hex>`. Its canonical UTF-8 JSON recursively sorts keys and includes the command name, trusted brand, semantic target/business fields, applicable lifecycle/module values, optional expected version, and audit-significant reason. It excludes request/correlation IDs, timestamps, actor display data, permission snapshots, transport details, and secrets.

- No receipt: evaluate and execute once.
- Same identity and fingerprint: return the stored safe result and evidence identifiers without another mutation or audit record.
- Same identity with another fingerprint: return `idempotency_key_reused`.
- Unique-key race: roll back the complete attempted transaction, release the client, and perform one read-only lookup of the committed winner. The mutation is never retried.

Known database uniqueness and composite-FK constraints remain the authoritative race backstop. They map to sanitized conflict or not-found results. Provider SQL, values, connection details, and raw errors are never returned.

When supplied on an update/status command, `expectedVersion` is compared with the locked row's normalized `updated_at` value. A mismatch returns `conflict`. Creates do not use an expected version. A request whose resulting business state is unchanged returns success with `mutated: false`, performs no update, and creates no new M4 evidence.

## Evidence and redaction

Every new successful mutation creates exactly one action receipt and one audit record in its transaction. Create/assign operations use a null before-summary; update/status operations use allowlisted before/after business fields. Result, before, after, and metadata objects are capped at 16 KiB each before persistence.

Evidence includes only entity/relation identifiers, lifecycle values, safe names/titles/codes, brand context, command identity, required reason, and policy/version references. It excludes raw commands, credentials, authentication material, headers, provider payloads, connection data, payment secrets, protected-media URLs, and stack traces. Failed or denied attempt telemetry remains outside the M4 success-only model.

## Domain behavior

- Instructors are global. The brand in the receipt is the trusted authorization context, not ownership.
- Inactivation never deletes an instructor or historical relationship.
- Brand-instructor and course-instructor relationships use explicit active/inactive transitions. Inactive relationships require explicit reactivation.
- An active course assignment requires an active instructor and active same-brand brand-instructor association.
- Courses belong to exactly one brand. Course codes are trim-normalized, case-preserving, immutable after creation, and unique only within that brand.
- Curriculum courses require an existing shared academic module. Standalone courses may have a null or valid shared module.
- Multiple courses in one brand may reference the same module.
- The first lifecycle permits draft to published/archived and published to archived. Archived is terminal.
- Publication adds no instructor, content, commerce, enrollment, access, media, or student prerequisite.
- Academic levels, semesters, and modules have no runtime write command in this phase.

## Error and lifecycle behavior

Malformed commands fail before pool checkout. Authority and permission failures also precede transaction construction. Scoped missing targets return `target_not_found`; invalid relationships and inactive prerequisites return `policy_validation_failed`; forbidden course transitions return `lifecycle_transition_denied`; uniqueness and optimistic-version failures return `conflict`; reused idempotency keys return `idempotency_key_reused`; provider failures return `persistence_failed`; and evidence failures return `audit_write_failed` after rollback.

Application shutdown closes the read transport and optional write pool idempotently. Default mock runtime and container smoke require no database URL or write provider.

## Next boundary

A future phase may add authenticated Admin HTTP command routes only after the HTTP boundary can resolve a trusted active Admin profile, brand, permissions, request metadata, and JSON body without relying on the current mock context. Live staging command verification also requires separate explicit authorization and disposable, owner-approved data. This implementation alone does not authorize a database mutation.
