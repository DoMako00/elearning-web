# Platform vs Brand Scope Correction

## 1. Purpose

This document corrects the terminology used by the admin architecture and contracts. The product is one e-learning platform/application. Medway and Elite are branded educational identities and business scopes inside that platform, not separate technical platforms or deployments.

The correction is terminology and boundary design only. It does not create SQL, migrations, persistence changes, provider integrations, HTTP runtime, or new authorization behavior.

## 2. Previous ambiguity

Existing architecture documents and early contract names used `platform`, `platformId`, and `platformCode` for the Medway/Elite separation. That vocabulary can imply two separate technical applications or deployment platforms.

The intended business model is one application with multiple isolated brands. Existing platform-named fields remain compatibility terminology until a later schema/domain refactor.

## 3. Correct model

- **Platform:** the single e-learning product/application/system.
- **Brand:** a branded educational identity inside the platform. Valid brand codes are `medway` and `elite`.
- **Brand identity:** frontend presentation configuration such as logo, colors, theme tokens, display name, UI tone, course-card style, and brand experience.
- **Brand scope:** the business, content, access, and admin boundary associated with one brand.
- **Platform scope:** reserved for future deployment, runtime, and global application concerns; it must not be used as the name for the Medway/Elite separation in new code.

## 4. Brand identity

Medway and Elite may feel separate to students through their own logo, theme, colors, display name, layout tone, course-card style, and frontend configuration. The same application shell can support both identities without creating separate technical applications.

Brand identity is presentation configuration. It is not authorization.

## 5. Brand scope

Each brand has isolated records and workflows for:

- course catalog and content hierarchy;
- instructors and educational ownership;
- offers, plans, pricing, and commercial terms;
- subscriptions and seats;
- explicit access grants and entitlement sources;
- content releases and publication state;
- protected media and delivery policies;
- quizzes, assessments, attempts, and review state;
- admin operations, roles, permissions, commands, and evidence.

A record belonging to one brand must not be used to authorize or affect another brand.

## 6. Security invariants

- Medway brand records must never authorize Elite access.
- Elite brand records must never authorize Medway access.
- Backend authorization is authoritative; frontend visibility and route guards are presentation only.
- Payment confirmation, subscription state, seat assignment, enrollment, session, device state, and media references are not authorization by themselves.
- Protected access requires explicit backend evaluation of the brand-scoped grant, source eligibility, session/device state, release state, and resource policy.
- Admin commands require permission, brand scope, target relationship, lifecycle/policy checks, reason, idempotency, correlation, and append-only evidence.

The isolation boundary is a brand-scope boundary inside one platform, not a multi-platform deployment boundary.

## 7. Migration and compatibility

No database migration or physical schema change is created by this correction. Existing docs and code that say `platform` for Medway/Elite should be interpreted as compatibility terminology for brand scope until a future schema/domain refactor.

Existing `AdminPlatformCode`, `AdminPlatformContext`, `platformId`, `platformCode`, `targetPlatformId`, and related error names may remain where changing them would create unnecessary compatibility risk. New admin code should prefer `AdminBrandCode`, `AdminBrandContext`, `AdminBrandScoped`, `brandId`, `brandCode`, and brand-target terminology.

Future persistence and authentication integration must use brand terminology as the canonical business scope. Transitional platform-named aliases may remain only for compatibility while callers and physical schema decisions are migrated deliberately. See [Persistence and Auth Integration Boundary](persistence-auth-integration-boundary.md).

The [Postgres/Supabase Schema Alignment Review](postgres-supabase-schema-alignment-review.md) maps these legacy platform fields to canonical brand fields for future migrations; it does not create a migration or remove any compatibility alias.

## 8. Future schema direction

A future schema pass may rename a physical `platforms` concept to `brands`, or introduce `brands` under one application/platform record. That physical decision is deferred and must not be silently applied here.

## 9. Future self-test

Prompt 07 should be implemented later as the **Backend Admin Brand-Scope Self-Test Harness**. It must verify Medway/Elite brand isolation, permission denial, missing reason, missing idempotency, successful evidence, and brand-scoped overview results. It is intentionally not implemented by this correction task.
