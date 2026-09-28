# Data Model: Prompt 57B Live Supabase Auth-only Verification

## Decision

Prompt 57B has **no data-model change**. It is an authentication and authorization-observation phase, not a persistence feature.

## Explicitly Unchanged

- No schema change, migration, seed, grant, RLS policy, Data API exposure, or database mutation.
- No creation, update, or deletion of `app.app_users`.
- No creation, update, or deletion of Admin profiles, roles, role assignments, role-permission links, brand authority, or permission-catalogue records.
- No new M1, M2, or M4 table; no M2 mutation; no M4 `app.admin_actions` or `app.audit_logs` evidence.
- No curriculum, brand availability, course, subscription, payment, protected-media, or frontend data change.

## Authentication Identity Mapping

The only affected conceptual mapping is transient and provider-neutral:

```text
verified Supabase JWT sub (UUID)
  -> { provider: "supabase", authIdentityId: UUID, subject: UUID, verifiedAt }
  -> existing read-only M1 authorization lookup
```

The principal is not persisted by 57B and carries no role, permission, brand, Admin profile, metadata, raw token, or JWT payload. The expected staging observation is that no `app.app_users` record matches the real token subject. If separately authorized, that can be checked by a parameterized, TLS-validated SELECT-only query with sanitized boolean output. Otherwise it is inferred from the safe denial.

Any future linkage of the real subject belongs exclusively to Prompt 57C under a new authorization.
