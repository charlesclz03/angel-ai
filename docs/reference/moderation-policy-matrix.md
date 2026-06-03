# Angel AI Moderation Policy Matrix

Purpose:

- make the current live-enforcement boundary and operator workflow explicit

Audience:

- maintainers
- coding agents
- operators

Status:

- active

Source of truth scope:

- moderation policy and review defaults

Last updated:

- 2026-03-25

Related docs:

- `lib/angel/moderation.ts`
- `lib/admin/moderation.ts`
- `app/admin/moderation/page.tsx`
- `app/api/cron/moderation-sweep/route.ts`

## Current Enforcement Baseline

Angel AI is no longer audit-only.

The current live policy is:

- `CRITICAL` inbound user incidents are blocked after persistence
- blocked turns still create redacted moderation incidents
- blocked turns save a deterministic Angel safety reply instead of calling the runtime
- blocked turns do not drive memory extraction, summary refresh, or relationship-stage advancement
- Angel-output moderation remains redacted and reviewable, but it is not live-blocked in the current version

## Category Matrix

| Category | Typical severity | Live enforcement now | Admin workflow now |
| --- | --- | --- | --- |
| `MINOR_SAFETY` | `CRITICAL` | yes, inbound only | redacted review, append-only history, escalation sweep |
| `EXPLICIT_SEXUAL` | `HIGH` | no | redacted review, SLA tracking, analytics |
| `POLICY_BYPASS` | `HIGH` | no | redacted review, SLA tracking, analytics |
| `ROMANCE_ESCALATION` | `LOW` to `HIGH` | no | redacted review of Angel pacing and operator follow-up |

## Operator Defaults

- all moderation surfaces stay `ADMIN`-only
- raw message bodies stay out of admin tooling
- redacted previews are the highest-fidelity operator view for now
- every manual status change requires a reason code
- every manual or system review action appends a `ModerationReviewEvent`
- unresolved incidents can auto-escalate through the in-app sweep without email or external paging

## Intentionally Out Of Scope

- blocking non-critical incidents in the live chat path
- exposing raw message text, raw attachment payloads, or raw social imports to operators
- external paging, Slack alerts, or email escalation
- policy decisions that would let the runtime consume unredacted moderation payloads
