# Quiz, Assessment, Question, Attempt, Scoring, and Exam-Period Architecture

## Scope and invariants

This is backend design only. It aligns with the platform, authorization/RLS, auth/session/device, subscription/seat/access, payment/refund, learning-content, and protected-media architectures. It does not create SQL, migrations, executable RLS policies, API runtime code, quiz UI, grading engine, timer engine, certificate engine, or frontend changes.

All quizzes, assessments, question-bank content, answer options, attempts, scores, reviews, analytics, and audit records resolve one `platform_id`. A Medway quiz or assessment cannot be requested, loaded, attempted, reviewed, scored, or reported through Elite identity, session, device, grant, subscription, or seat state, and vice versa.

Authentication, enrollment, a payment, a subscription, a seat, an app session, or a device are individually insufficient to access an assessment. Every learner attempt belongs to one real, active platform-scoped user and, where commercially applicable, that user’s assigned seat/eligible entitlement source. Shared credentials are prohibited by the identity and seat model.

## Quiz and assessment domain overview

`quizzes` define learner-facing quiz identity and placement. `assessments` define an attemptable assessment configuration and composition. A quiz can be one lesson resource among video, document, link, and file resources; an assessment can also be an independently scheduled exam-period activity with no single lesson-resource placement.

| Concept | Lesson Quiz | Scheduled Assessment / Exam |
|---|---|---|
| Primary purpose | Formative lesson/chapter learning check | Scheduled summative or instructor-administered assessment |
| Placement | Attached to a lesson, chapter, or learning resource | May be independently attached to a program, year, semester, subject, module, cohort, or approved academic scope |
| Availability | Follows resource/release and assessment policy | Uses an explicit exam/availability window in addition to entitlement and policy checks |
| Attempt behavior | Policy-configured practice/graded behavior | Policy-configured timed, reviewed, graded, proctored/future monitored behavior |
| Learning effect | May contribute evidence to progress | May contribute to progress, completion, or certificate eligibility only through separate policy evaluation |

Both use the same platform isolation, access evaluation, attempt retention, policy versioning, and audit rules. Neither is an implicit entitlement or certificate decision.

## Question bank, question, and answer model

Before final schema freeze, model reusable question-bank content separately from an assessment composition. A platform-scoped question-bank item has ownership, lifecycle, subject/taxonomy references, question type, version, author/reviewer provenance, and scoring/answer definition references. An assessment selects a versioned set or policy-defined draw of items; it does not rely on mutable current question text after a learner starts.

`questions` represents an assessment-composed question or immutable question-version snapshot. It supports current and future types without schema redesign through a controlled `question_type` plus versioned definition payload/reference. Initial examples may include single-choice, multiple-choice, true/false, short answer, matching, ordering, numeric, and clinical-scenario types; the architecture does not restrict future types.

Answer options are a normalized logical child model for question types that need options. Each option has stable identity, display order, content/version, and scoring/evaluation reference. Free-text, numeric, matching, ordering, file/future media, and manually reviewed responses use an answer-definition/evaluation reference rather than forcing fake option rows. Correct answers, grading keys, rationales, and internal reviewer notes are private assessment-authoring data and must not be directly returned to learners before policy allows it.

## Assessment composition and versioning

An `assessments` record defines assessment purpose, platform scope, academic/resource placement, lifecycle, availability reference, timing reference, scoring reference, attempt policy reference, review/feedback policy reference, and policy/version snapshot. It may be created by a platform-authorized instructor, content owner, or assessment admin.

The future logical composition model records ordered fixed questions and/or configured randomized question-bank selections, section rules, question/answer randomization rules, presentation constraints, and an immutable published version. A learner attempt snapshots the assessment version, selected question versions, option ordering, scoring-policy version, timing-policy version, and review/feedback rules presented. Later edits, withdrawn items, or new scoring rules must not make historical attempts uninterpretable.

The existing schema tables `quizzes`, `assessments`, `questions`, `attempts`, and `attempt_answers` remain the baseline. Question-bank, option, assessment-composition, section, version, and exam-audience structures are future logical schema refinements only; no physical schema change is made here.

## Availability, timing, retake, and feedback policies

Assessment access evaluates all of the following: platform; active user; app session/device state; resource/assessment platform match; eligible entitlement source; explicit active `access_grant`; release/availability window; assessment lifecycle; and the effective assessment policy. Lesson quizzes also honor their lesson/resource release state. Independently scheduled assessments additionally honor their exam-period audience and explicit availability window.

The policy set controls, without code constants:

- absolute, weekly, manual, or future relative availability/release behavior and explicit timezone;
- time limit, grace/late-submission behavior, autosave/heartbeat requirements, and expiry handling;
- attempt limit, retake/cooldown behavior, resume/restart rules, and allowed attempt state transitions;
- fixed versus randomized question selection, question-bank sampling, answer order, and randomization seed handling;
- scoring weights, partial credit, pass threshold, manual review, moderation, result calculation, and score release;
- learner review, correct-answer, rationale, feedback, score, and solution visibility timing;
- whether a result contributes to progress, prerequisite completion, or future certificate eligibility.

No attempt count, pass mark, timer, question count, scoring weight, review period, or retake rule is hard-coded. Exam-period audience semantics, cohorts, and institutional eligibility remain policy/schema decisions before implementation.

## Attempt model and lifecycle

`attempts` represents one learner’s versioned attempt for one assessment. It references the platform user, enrollment when participation context is required, assessment/quiz version, and platform-scoped authorization context/reference. It records lifecycle state, initiated/started/submitted/expired/finalized timestamps, timing snapshot, policy snapshot, selected-question/option-order snapshot reference, provisional/final score reference, result state, and correlation/idempotency identifiers.

`attempt_answers` stores a learner answer bound to the attempt’s immutable question snapshot. It records response payload/reference, answer version, answer sequence/revision metadata, system/manual evaluation status, awarded score, evaluator reference, evaluation timestamp, and feedback visibility reference. Sensitive free-text or attachment payloads require appropriate privacy controls and retention policy.

An attempt lifecycle may include `created`, `started`, `in_progress`, `submitted`, `expired`, `awaiting_review`, `scored`, `moderated`, `invalidated`, and `cancelled`. Exact labels are final schema work, but valid state transitions are explicit, idempotent, and auditable. An expired subscription blocks a new attempt unless an explicit grant/policy allows it; existing attempt, answer, score, and review evidence remains preserved.

## Student access, submission, and grading flow

1. The backend resolves a trusted platform context, authenticated subject, active platform user, app session, and required device state.
2. It resolves the requested quiz/assessment and resource/academic placement; platform mismatch is denied before loading enrollment or commercial data.
3. It evaluates eligible subscription/seat/promotion/administrative-exception source, explicit active grant, lesson/resource release or assessment exam-period availability, assessment lifecycle, and effective policy.
4. It evaluates attempt eligibility: current attempt state, configured limit/retake rules, timing, audience, and any prerequisite policy.
5. On allow, it creates or resumes an attempt with an immutable assessment/question/order/policy snapshot and returns only learner-safe presentation data. Answer keys and restricted feedback are excluded.
6. The backend accepts idempotent answer save/submit commands only for the owning platform learner, valid active attempt, allowed timing state, and expected assessment snapshot.
7. Submission transitions the attempt to policy-appropriate evaluation. A future grading adapter may auto-score objective evidence, queue manual review, apply moderation, and publish results according to policy.
8. A separate progress/completion/certificate-policy evaluation consumes the finalized result only where configured. It does not alter access grants or commercial state.

Timer display in a future frontend is only a usability aid; the backend owns timing and submission eligibility. Client clock, browser storage, UI state, or a direct attempt identifier cannot decide eligibility, expiration, score, or result visibility.

## Instructor/admin creation and review flow

1. An instructor/content owner/admin resolves one platform and an active assessment-authoring permission scoped to the target academic content.
2. The backend creates/drafts question-bank items, question versions/options, assessment composition, policy references, release/exam-period configuration, and audience definition.
3. Required review/approval, publication, and withdrawal actions occur through platform-scoped backend commands with immutable audit/admin evidence.
4. During marking, an authorized reviewer evaluates only platform-matching submitted attempts, records grading/review rationale in protected references, and follows moderation/result-release policy.
5. Editing a question, answer key, policy, or assessment creates a new version or governed correction path; it does not silently rewrite learner-visible historical attempt evidence.

## Enrollment, progress, and certificates

Enrollment supplies participation context and may be required by policy, but it does not grant assessment access. Access grants authorize the assessment/resource scope; scheduled availability and assessment policy still gate each attempt. Progress can record that an assessment was started, completed, or satisfied a configured learning rule, but it remains independent from answer history and scoring evidence.

Certificate eligibility is a future policy evaluation using final approved learning evidence, such as progress, completion, and assessment outcomes. It is not an attribute of subscription payment, a raw score, an enrollment, or an attempt. Subscription expiry/refund may remove future access but must not delete attempts, answers, scores, progress, certificate history, or audit evidence.

## Related schema tables

| Concern | Existing tables / future logical refinement |
|---|---|
| Academic/resource placement | `programs`, `academic_years`, `semesters`, `subjects`, `modules`, `chapters`, `lessons`, `lesson_resources`, `content_releases` |
| Assessment core | `quizzes`, `assessments`, `questions`, `attempts`, `attempt_answers`; future question banks/options/compositions/versions/sections/audiences |
| Access and participation | `users`, `enrollments`, `subscriptions`, `seats`, `promotions`, `access_grants`, `policy_sets` |
| Identity and security inputs | `app_sessions`, `devices`, `access_decisions`, `security_events` |
| Evidence and reporting | `progress`, `audit_logs`, `analytics_events`, `admin_actions` |

## API route map (contracts only)

| Route | Purpose |
|---|---|
| `GET /v1/quizzes/{id}`; `GET /v1/assessments/{id}/access-status` | Backend-filtered learner-safe metadata and eligibility status. |
| `POST /v1/assessments/{id}/attempts`; `GET /v1/attempts/{id}` | Start/resume an authorized attempt and retrieve only learner-safe snapshot state. |
| `PUT /v1/attempts/{id}/answers/{questionId}`; `POST /v1/attempts/{id}/submit` | Idempotent answer save and policy-controlled submission. |
| `GET /v1/attempts/{id}/result`; `GET /v1/assessments/{id}/attempts/mine` | Policy-controlled result/review and learner attempt history. |
| `POST /v1/admin/question-banks`; `POST /v1/admin/questions`; `POST /v1/admin/assessments` | Platform-authorized authoring contracts. |
| `POST /v1/admin/assessments/{id}/publish`; `POST /v1/admin/assessments/{id}/release-rules` | Publication and scheduled exam/release management. |
| `POST /v1/admin/attempts/{id}/review`; `POST /v1/admin/attempts/{id}/moderate`; `POST /v1/admin/attempts/{id}/release-result` | Manual grading, moderation, and result-release commands. |
| `POST /v1/admin/assessments/{id}/invalidate`; `POST /v1/admin/assessments/{id}/incident-decision` | Controlled integrity and incident-response actions. |

## Validation, audit, fraud controls, and edge cases

Validate platform-safe composite relationships; active user/session/device; grant recipient/scope/validity/revocation; assessment/resource lifecycle; release/exam window/timezone; enrollment when required; audience eligibility; active real seat user where applicable; policy/version snapshot; valid question/option type definitions; randomized selection reproducibility; attempt-limit/timing state; answer ownership/snapshot match; idempotency/correlation key; and reviewer/moderator authority.

Append immutable, redacted audit/security evidence for authoring/versioning/publishing/withdrawal; question-key and policy changes; assessment/release-window changes; attempt start/save/submit/expiry; auto/manual score/review/moderation/result release; denied/invalidated attempts; suspected integrity incidents; and admin actions. Store actor, platform, target, reason, policy/version, correlation ID, outcome, and protected references. Do not expose answer keys, learner sensitive responses, provider/session secrets, or internal grading notes through normal learner APIs or logs.

Defend against cross-platform identifiers, shared-login attempts, stale/replayed attempt tokens, forged client timer state, question/answer scraping, answer leakage, direct answer-key requests, duplicate/out-of-order save/submit messages, concurrent attempts beyond policy, network loss near expiry, client clock manipulation, tampered randomized order, instructor unauthorized access, score tampering, reviewer conflict, and bulk export of learner responses.

Handle an assessment withdrawn after an attempt starts; policy/version changes during an active attempt; scheduled-window boundary and timezone transitions; subscription expiry/refund during an active attempt; device/session revocation; duplicate submit; late-arriving autosave; question invalidation after use; manual-review backlog; partial grading; result correction/moderation; disabled instructor/reviewer; learner account disablement; and privacy/retention/anonymization requests while retaining legally governed academic evidence.

## Open decisions before implementation

- Final question type taxonomy, authoring format, media/attachment support, question-bank taxonomy, and version/approval workflow.
- Exam-period audience/cohort/institution model, registration requirement, accommodation policy, and release/availability timezone governance.
- Objective versus manual grading rules, partial credit, scoring normalization, moderation/appeal process, pass/certificate policy, and feedback visibility rules.
- Timer, pause/resume, autosave, late submission, offline behavior, proctoring/integrity posture, and anti-cheating response.
- Randomization algorithm, reproducibility/audit requirements, question exposure limits, and item-analysis/analytics privacy controls.
- Attempt/answer/score retention, export/erasure requirements, accessibility accommodations, regional hosting, and regulatory requirements.
