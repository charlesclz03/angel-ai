---
name: load-context
description: Load Angel AI repository context for a new session by reading the current source-of-truth docs, active architecture and runbooks, product and roadmap docs, and archive material in the correct order. Use when starting a fresh Angel AI session, when context feels stale, or before substantial implementation work.
---

# Load Angel AI Context

Use this skill to rebuild full working context for a fresh Angel AI session without confusing active execution docs with archive-only material.

## Core Rules

- Read `AGENTS.md` first.
- Treat `docs/angel-ai-next-session-handoff-2026-03-24.md` as the execution source of truth.
- Treat `prisma/schema.prisma` as the data-model source of truth.
- Treat archive docs as historical or tone context, not current implementation truth.
- Do not use the repo's markdown corpus as a single runtime prompt blob for live OpenClaw work.

## Phase 1. Mandatory Bootstrap

Read these in order every time:

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/angel-ai-next-session-handoff-2026-03-24.md`
4. `docs/angel-ai-progress-log.md`
5. `docs/angel-ai-next-steps.md`
6. `docs/angel-ai-next-phases.md`

## Phase 2. System Map

Read these next to understand ownership and execution flow:

1. `docs/architecture/system-map.md`
2. `docs/architecture/runtime-flows.md`
3. `docs/architecture/data-model.md`
4. `docs/architecture/testing-map.md`

## Phase 3. Active Runbooks And References

For a full-context session reset, read all active runbooks and references:

1. `docs/runbooks/local-development.md`
2. `docs/runbooks/verification.md`
3. `docs/runbooks/openclaw-handoff.md`
4. `docs/runbooks/auth-google-oauth.md`
5. `docs/runbooks/social-connectors.md`
6. `docs/runbooks/stripe-checkout-webhooks.md`
7. `docs/runbooks/media-and-voice.md`
8. `docs/runbooks/chat-turn-debugging.md`
9. `docs/runbooks/humanization-workflow.md`
10. `docs/runbooks/deploy.md`
11. `docs/reference/commands.md`
12. `docs/reference/env-vars.md`
13. `docs/reference/glossary.md`
14. `docs/reference/PATCH_NOTES_MASTER.md`

## Phase 4. Product, Roadmap, And Design Context

Read these after the operational docs so product intent stays aligned with implementation reality:

1. `README.md`
2. `docs/angel-ai-v1-product-spec.md`
3. `docs/angel-ai-v1-experience-blueprint.md`
4. `docs/angel-ai-v2-product-spec.md`
5. `docs/angel-ai-v3-product-spec.md`
6. `docs/angel-ai-v4-product-spec.md`
7. `docs/angel-ai-v5-product-spec.md`
8. `docs/angel-ai-memory-prompt-architecture.md`
9. `docs/angel-ai-onboarding-script-v1.md`
10. `docs/angel-ai-tooling-audit.md`
11. `docs/architecture/feature-matrix.md`
12. `docs/architecture/heartbeat-engine.md`
13. `docs/architecture/soul-document.md`
14. `docs/design/design.md`
15. `docs/design/Angel AI Design from Stich/design.md`
16. `docs/design/Angel AI Design from Stich/stitch/obsidian_angel/DESIGN.md`

## Phase 5. Decisions And Archive Boundary

Read these to understand why the current system is shaped the way it is:

1. `docs/decisions/0001-session-primer-over-raw-markdown.md`
2. `docs/decisions/0002-continuity-gating-model.md`
3. `docs/decisions/0003-memory-governance-model.md`
4. `docs/decisions/0004-relationship-stage-guardrails.md`
5. `docs/archive/README.md`
6. `docs/angel-ai-recordings-index-2026-03-24.md`
7. `docs/archive/research/angel-ai-improvement-report-2026-03-24.md`
8. `docs/archive/research/github-ai-companion-research.md`
9. `docs/archive/superseded/angel-ai-prisma-schema-proposal.md`

## Phase 6. Optional Historical And Strategy Sweep

Read these only when they are relevant to the task:

- `docs/archive/recordings/angel-ai-first-conversation-for-context.md`
- `docs/archive/recordings/_Jensen Huang_ NVIDIA - The $4 Trillion Company & the AI Revolution _ Lex Fridman Podcas.md`
- `docs/AI Creator Platform Business Strategy.md`
- `docs/Strategic Decoupling and Monetization Blueprint.md`
- `docs/architecture/TOP_SECRET.md`
- `BOILERPLATE_SETUP.md`
- `prompt-plan.md`
- `docs/templates/DOCUMENTATION_OPERATING_SYSTEM_PLAYBOOK.md`

Use these for:

- emotional tone
- longer-term strategy
- historical rationale
- documentation-system reuse

Do not use these to override the current handoff or short-term backlog.

## Task-Specific Deepening

After the full sweep, keep these files open based on the task:

- onboarding work: `app/onboarding/page.tsx`, `app/onboarding/actions.ts`, `lib/angel/onboarding-service.ts`
- chat behavior: `components/organisms/AngelChat.tsx`, `app/chat/actions.ts`, `lib/angel/chat-service.ts`
- runtime handoff: `lib/angel/chat-runtime.ts`, `lib/angel/session-primer.ts`
- memory and relationship systems: `lib/angel/memory-service.ts`, `lib/angel/summary-service.ts`, `lib/angel/relationship-service.ts`
- social connectors: `app/social/actions.ts`, `lib/social/service.ts`, `lib/social/connectors.ts`
- billing: `app/chat/actions.ts`, `lib/billing/stripe.ts`, `app/api/stripe/webhook/route.ts`
- schema changes: `prisma/schema.prisma`

## Required Output

After loading context, produce a concise session brief covering:

1. current verified product state
2. active implementation target
3. critical rules and guardrails
4. primary code entry points for the task
5. env or integration blockers
6. verification commands to run
7. docs that must be updated if behavior changes

## Completion Check

Before you move into implementation, confirm internally that you can answer:

- What is the next active build target?
- Which docs are active versus archival?
- Which files own the behavior you are touching?
- Which verification commands are required?
- Which handoff and status docs must be updated if the change is substantial?
