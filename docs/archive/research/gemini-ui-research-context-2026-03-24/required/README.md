# Angel AI Documentation Hub

Purpose:

- provide one canonical entry point for humans and future coding sessions

Audience:

- maintainers
- coding agents
- contributors

Status:

- active

Source of truth scope:

- documentation navigation and read order

Last updated:

- 2026-03-24

Related docs:

- `README.md`
- `AGENTS.md`
- `.agent/ARCHITECTURE.md`
- `docs/angel-ai-next-session-handoff-2026-03-24.md`
- `docs/angel-ai-progress-log.md`
- `docs/angel-ai-next-steps.md`
- `docs/revenue_projections.md`
- `docs/risk_mitigation_strategy.md`

## Start Here

If the goal is to execute code quickly, read these in order:

1. `AGENTS.md`
2. `docs/angel-ai-progress-log.md`
3. `docs/angel-ai-next-session-handoff-2026-03-24.md`
4. `docs/architecture/system-map.md`
5. `docs/runbooks/local-development.md`
6. the subsystem runbook that matches the task

## Current State

Angel AI already has:

- authenticated onboarding persistence
- a persistent `/chat` thread
- non-streaming Angel replies
- continuity paywall and read-only renewal
- summary regeneration
- link, image, and inbound voice-note inputs
- official social connectors with background scan status in onboarding and chat
- webhook-backed billing sync and a billing portal entry point
- editable memory controls and a relationship dossier
- relationship stages, rituals, and bridge touchpoints
- curated `relationship_seed.md` and `session-brief.md` artifacts for the future live-runtime handoff
- a reviewed repo-local `.agent` development toolkit for docs sync, CI repair, security audits, push audits, admin audits, and support triage

The next major build target is:

- the first true OpenClaw-backed live reply path using the curated session-primer handoff

## Read By Intent

### I need the exact next coding target

- `docs/angel-ai-next-session-handoff-2026-03-24.md`

### I need to understand what has already shipped

- `docs/angel-ai-progress-log.md`

### I need the immediate backlog

- `docs/angel-ai-next-steps.md`

### I need medium-term sequencing

- `docs/angel-ai-v1-product-spec.md` (The Text & Memory Foundation)
- `docs/angel-ai-v2-product-spec.md` (Ambient WebRTC Voice)
- `docs/angel-ai-v3-product-spec.md` (GraphRAG & The Constellation)
- `docs/angel-ai-v4-product-spec.md` (Telephony & Ubiquity)
- `docs/angel-ai-v5-product-spec.md` (Phase 1 Consumer PWA Spec — LLM tiers, billing, safety, push notifications)
- `docs/angel-ai-next-phases.md`

### I need the codebase map

- `docs/architecture/system-map.md`
- `docs/architecture/runtime-flows.md`
- `docs/architecture/data-model.md`
- `docs/architecture/testing-map.md`

### I need to boot the app locally

- `docs/runbooks/local-development.md`
- `docs/runbooks/verification.md`
- `docs/reference/env-vars.md`
- `docs/reference/commands.md`

### I need repo-local development helpers

- `AGENTS.md`
- `.agent/ARCHITECTURE.md`
- `docs/reference/commands.md`
- `docs/archive/research/angel-ai-safe-oss-skills-workflows-report-2026-03-24.md`

### I need auth, billing, media, or OpenClaw specifics

- `docs/runbooks/auth-google-oauth.md`
- `docs/runbooks/social-connectors.md`
- `docs/runbooks/stripe-checkout-webhooks.md`
- `docs/runbooks/media-and-voice.md`
- `docs/runbooks/chat-turn-debugging.md`
- `docs/runbooks/openclaw-handoff.md`
- `docs/runbooks/deploy.md`

### I need the architectural decisions behind the current design

- `docs/decisions/0001-session-primer-over-raw-markdown.md`
- `docs/decisions/0002-continuity-gating-model.md`
- `docs/decisions/0003-memory-governance-model.md`
- `docs/decisions/0004-relationship-stage-guardrails.md`

### I need historical context only

- `docs/archive/README.md`

### I want to reuse this documentation system in another repo

- `docs/templates/DOCUMENTATION_OPERATING_SYSTEM_PLAYBOOK.md`

## Operating Rules

- treat `prisma/schema.prisma` as the data-model source of truth
- treat `docs/angel-ai-next-session-handoff-2026-03-24.md` as the execution source of truth
- treat `docs/angel-ai-progress-log.md` as shipped-history only
- treat archived docs as context, not as current instruction
- prefer reviewed repo-local skills, workflows, and agents under `.agent/` before adopting external prompt packs
- update the handoff, progress log, next steps, and patch notes when a substantial slice lands

## Core Code Entry Points

- app shell: `app/`
- onboarding route: `app/onboarding/page.tsx`
- chat route: `app/chat/page.tsx`
- chat actions: `app/chat/actions.ts`
- social actions: `app/social/actions.ts`
- onboarding service: `lib/angel/onboarding-service.ts`
- chat service: `lib/angel/chat-service.ts`
- social service: `lib/social/service.ts`
- runtime adapter: `lib/angel/chat-runtime.ts`
- session-primer boundary: `lib/angel/session-primer.ts`
- billing sync: `lib/billing/stripe.ts`
- schema: `prisma/schema.prisma`

## Documentation Structure

```text
docs/
  README.md
  angel-ai-progress-log.md
  angel-ai-next-steps.md
  angel-ai-next-phases.md
  angel-ai-next-session-handoff-2026-03-24.md
  architecture/
  runbooks/
  decisions/
  reference/
  archive/
  templates/
```

## Archive Boundary

If a document is concept-heavy, superseded, or recording-style, it belongs under `docs/archive/`.
If it tells a future coding session what to do right now, it should stay in the active documentation path above.
