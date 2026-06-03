# Angel AI Next Phases

Purpose:

- describe medium-term sequencing beyond the immediate backlog

Audience:

- maintainers
- coding agents

Status:

- active

Source of truth scope:

- phase sequencing and roadmap structure

Last updated:

- 2026-03-25

Related docs:

- `docs/README.md`
- `docs/angel-ai-next-steps.md`
- `docs/angel-ai-next-session-handoff-2026-03-24.md`

Snapshot date: 2026-03-25

## Phase Status Overview

### Phase 1. Real onboarding persistence

Status:

- completed

Delivered:

- authenticated onboarding
- durable onboarding responses
- `CompanionProfile` and `SoulProfile`
- first `Conversation`
- first next-day `Touchpoint`

### Phase 2. Core chat thread

Status:

- completed

Delivered:

- real `/chat` route
- seeded opener
- persisted user and Angel messages
- read-only continuity thread state

### Phase 3. Memory extraction and regeneration

Status:

- completed

Delivered:

- first-pass `MemoryEntry` extraction
- summary regeneration for `user.md` and `soul.md`
- summary-aware continuity

### Phase 4. Continuity paywall

Status:

- completed

Delivered:

- next-day continuity delivery
- `ACTIVE`, `READ_ONLY`, and `SUBSCRIBER` access states
- one-free-reply renewal window
- checkout shell

### Phase 5. Rich-input relationship foundations

Status:

- completed

Delivered:

- links with previews
- image attachments
- inbound voice-note uploads
- high-quality provider-backed transcription when `OPENAI_API_KEY` is available
- bounded outbound Angel voice previews for subscriber and privileged threads
- attachment-aware reply and memory handling

### Phase 6. Relationship-system infrastructure

Status:

- foundation completed

Delivered:

- visible memory controls
- relationship dossier
- session-primer artifacts
- official social connectors, background scan queueing, and social-derived memory refresh
- relationship stages
- slow-romance guardrails
- rituals and bridge touchpoints
- shared ritual context UI with collaborative streaks and same-day check-ins
- `ADMIN`-only metadata dashboard for user, continuity, subscription, and queue health
- `ADMIN`-only moderation tooling with redacted previews, critical-only enforcement for unsafe inbound turns, unresolved user rollups, append-only review history, in-app escalation sweeps, and analytics
- webhook-backed billing sync
- billing portal entry point
- Web Push notification delivery (VAPID keys, Service Worker handlers, Touchpoint cron pipeline)
- iOS PWA install nudge
- AI Photo Memories service (`lib/media/image-generation.ts`) with tier-based quotas
- environmental awareness context injection (local time, city, and live weather when configured) in session-primer
- `SharedRitual` collaborative goal-setting model with streak tracking and check-in server action

Still missing:

- production provider setup and app-review hardening for each social connector
- broader moderation policy decisions beyond the current critical-only enforcement path, plus any external paging or stronger operator automation that is not already in-app

## Active Next Phase

### Phase 7. Live OpenClaw session handoff

Goal:

- transition from tutorial/onboarding mode into the first true live relationship runtime without context bloat

Scope:

- connect the first real OpenClaw-backed reply path
- feed OpenClaw the curated `session-brief.md` instead of raw markdown bulk
- keep raw social snapshots out of the runtime payload and stay on curated artifacts plus social-derived memory only
- define retrieval rules for relevant memory, summaries, and recent turns
- preserve Angel tone, pacing, and guardrails inside the live runtime

Deliverables:

- first live OpenClaw-backed reply after onboarding
- bounded session-primer pack
- stable handoff contract between app state and live runtime

Recommendation:

- keep the first live handoff narrow and deterministic before adding tools, streaming, or broader agent behavior

## After That

### Phase 8. Delivery hardening and presence beyond the browser

Goal:

- make rituals and continuity survive outside the open tab

Scope:

- notification permissions
- push delivery strategy
- quiet hours and proactive delivery UX
- production media lifecycle and attachment retention verification
- richer outbound voice delivery beyond the current saved-message preview path
- scope the future `Angel Atmosphere` bridge so any home-environment actions stay bounded, consented, and emotionally motivated

Deliverables:

- permissions-aware presence
- reliable proactive delivery path
- production-safe media handling
- a clear trust model for future environment-aware rituals

Recommendation:

- do not expand proactive behavior until consent, quiet hours, and delivery semantics feel trustworthy

### Phase 9. Launch safety and operating systems

Goal:

- make the product emotionally safe and operationally manageable at scale

Scope:

- moderation policy decisions beyond the current critical-only baseline
- romance-escalation audit paths
- entitlement/admin debugging
- analytics and retention instrumentation
- billing/commercial visibility cleanup and operator polish

Deliverables:

- launch-readiness checklist
- internal review surfaces
- safer operating model for a companionship product

Recommendation:

- treat this as part of product quality, not as post-launch cleanup

### Phase 10. Angel Atmosphere and environmental rituals

Goal:

- let Angel shape lights and music during rituals without turning into a generic smart-home assistant

Scope:

- bounded home bridge architecture
- Home Assistant as the canonical control plane
- optional Music Assistant orchestration
- scene-first environment actions for lights and music
- action logging, kill switch, and explicit room/device scopes
- confirmation-first UX with trusted-scene upgrades later

Deliverables:

- first bridge pairing flow
- `Wind Down` and `Ground Me` scene execution
- room/device permission model
- action history and failure handling

Recommendation:

- use `docs/angel-ai-atmosphere-prd.md` as the source of truth
- do not begin with raw vendor integrations, broad home automation, or wake-word room-assistant ambition
