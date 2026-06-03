---
name: admin-dossier-review
description: Review Angel AI internal admin, memory dossier, relationship dossier, moderation, and operator-facing flows. Use when building or auditing admin tools, memory controls, relationship records, or support/operator dashboards.
---

# Admin Dossier Review

Use this skill when work touches Angel's internal admin surfaces or operator-facing relationship data.

## Focus

- memory entry visibility and editability
- relationship dossier integrity
- touchpoint visibility and controls
- subscription and billing support views
- moderation and review surfaces
- privacy boundaries for sensitive user data

## Workflow

1. Read the active handoff and next-steps docs first.
2. Identify which operator flow is being added or changed.
3. Trace the backing models and services before touching UI.
4. Prefer redacted or minimized views of sensitive content.
5. Verify operators can understand state without exposing unnecessary raw personal data.
6. Update operational docs if admin behavior changes.

## Guardrails

- never expose raw secrets, tokens, or service-role material
- default to summary views before raw payload views
- treat memory, relationship dossiers, uploads, and social context as sensitive
- require explicit role gating for any admin surface

## Typical Files

- `lib/angel/memory-service.ts`
- `lib/angel/relationship-service.ts`
- `lib/angel/chat-service.ts`
- `lib/billing/stripe.ts`
- `app/chat/actions.ts`
- `components/organisms/*`

