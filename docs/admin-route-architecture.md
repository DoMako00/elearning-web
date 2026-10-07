# Admin route ownership and presentation

## Delivery scope

Frontend-only continuation on `dev`, starting from `5a3a5f9d5e08caa597c323e1d3f4b3caa2991495`.
Existing API adapters, authentication, backend permissions, media transport, and drawer motion remain in place. No backend, Supabase, R2, or Dokploy changes are included.

## Route matrix

| Route | Responsibility | Detail treatment |
| --- | --- | --- |
| `/admin` | Existing operational metrics and summaries; eight cross-domain Quick Links | Overview cards |
| `/admin/curriculum` | Academic year/level, semester accordion, Subject/Module references | Academic item inspector; editor presentation explicitly awaits write integration |
| `/admin/courses` | Course offering creation/editing, curriculum mapping, status/archive, course instructor assignments | Persistent course inspector; action drawers |
| `/admin/instructors` | Instructor directory, identity, brand assignments, course assignments | Persistent instructor inspector; edit/assignment drawer |
| `/admin/students` | Provisioning, profile, placement, account status, access summary | Persistent Profile / Access / Devices / Sessions inspector |
| `/admin/payments` | Manual order creation, review, approval, rejection | Persistent verification inspector; reason confirmation drawer |
| `/admin/subscriptions` | Plans, 1/3/5 capacity, dates, grants, status, cancellation | Persistent subscription inspector; cancellation confirmation |
| `/admin/content` | Course / chapter / lesson / resource structure; upload, verification, publication, withdrawal | Internally scrolling tree, resources, settings panels |
| `/admin/security` | Existing Student device/session inspection and revocation, suspend/restore, security events | Student-scoped inventory and security action inspector |

`/admin/courses/:courseId/builder` remains a compatibility redirect into Content. The `new` bookmark redirects to the Courses creation drawer. Media presentation components now live in `src/features/admin/content`.

## Retained behavior

- Existing command handlers and logical-operation idempotency keys are reused.
- Media uploads still go through the existing direct-upload implementation. No transport or storage configuration changes.
- Brand choices come from the existing authorized context. No email-based role checks were added.
- Shared status tones: active/published/approved green; pending/draft/review amber; rejected/suspended/failed/cancelled red; inactive/revoked/archived neutral.
- Student device/session tabs provide context and navigation to Security, the primary action owner.
- Short-height layout uses the existing responsive system, shared type/spacing tokens, and internal scrolling. Drawer transition definitions were not changed.

## Explicit contract limits for the next integration task

- The current manual order read response does not expose receipt, amount, payment reference, or reviewer identity. The inspector states this rather than generating evidence.
- Curriculum editing is presentation only; saving is visibly unavailable. Existing catalogue reads remain live.
- Release scheduling controls, device transfer/replacement approval/history, and bulk session revocation are unavailable in the current screen contracts. Their UI does not send fabricated API requests.
- Security event data is not labeled as an actor/target audit log.
- The capability vocabulary is ready for a trusted capability read model; no frontend permission claim is inferred from account email or brand selection.
- No new fixture data was added and no API-mode fallback to fixture data was introduced.

## Validation and acceptance evidence

Completed before the owner's request to skip the remaining verification:

- `npm ci`: passed. The existing dependency audit reported one high-severity finding; dependencies were not changed in this task.
- `npm run typecheck`: passed.
- `npm run build`: passed; existing large-chunk warning remains.
- `git diff --check`: passed.
- The repository defines no lint or test script.

Browser control failed before attaching to Chrome with `windows sandbox failed: helper_unknown_error: apply deny-read ACLs`, including after the owner restarted Codex. The owner then explicitly requested finishing, committing, and pushing without further verification.

The nine-route screenshot comparison, browser interaction regression, 1920x880 overflow measurements, and visual correction pass are **not performed**. This source delivery is not evidence of authenticated live acceptance or confirmed visual parity. No deployment was performed.
