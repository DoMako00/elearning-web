# Data Model: Supabase JWT/JWKS Authentication Adapter

## Data Impact Decision

Prompt 57A introduces no persistent data model changes.

- No schema changes.
- No migration.
- No seed data.
- No database connection or mutation during specification, planning, unit tests, or container smoke.
- No new M1, M2, or M4 tables.
- No changes to `app.app_users`, `app.admin_profiles`, roles, permissions, role assignments,
  `app.admin_actions`, or `app.audit_logs`.

## Affected In-Memory Identity Mapping

The only affected mapping is transient and provider-neutral:

```text
verified Supabase JWT UUID sub
-> AuthIdentityAdapter VerifiedAuthIdentity
-> existing M1 app_users.auth_user_id lookup
-> existing Admin profile, brand, role, and permission resolution
-> existing trusted AdminRequestContext
```

The adapter output is not a persistence record and contains only:

| Field | Source | Validation / Constraint |
|---|---|---|
| `provider` | Adapter constant | Exactly `supabase`; never an authority signal. |
| `authIdentityId` | Verified JWT `sub` | Required UUID; used by existing M1 lookup. |
| `subject` | Verified JWT `sub` | Required UUID; identical to `authIdentityId`. |
| `verifiedAt` | Backend verification time | UTC ISO timestamp; not client input. |
| `email` | Not populated | Avoid widening the identity boundary. |

## Explicitly Excluded JWT Data

The following data is neither persisted nor passed into Admin authorization:

- raw bearer token or Authorization header;
- full JWT payload, refresh token, or provider response;
- `role`, `app_metadata`, `user_metadata`, custom permission claims, or client-supplied authority;
- Admin profile ID, role IDs, permissions, brand authority, subscription state, or access state;
- JWKS key material, provider secret, database URL, or credential.

## Relationships and State

No new relationships or state transitions are introduced. Existing M1 records remain the only
authority relationship after authentication. A valid identity with no matching app user, inactive
Admin profile, missing brand authority, or missing permission remains an authorization denial and
creates no data or audit evidence.
