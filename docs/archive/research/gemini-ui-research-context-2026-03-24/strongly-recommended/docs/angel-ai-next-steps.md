# Angel AI Next Steps

Purpose:

- track the immediate actionable backlog

Audience:

- maintainers
- coding agents

Status:

- active

Source of truth scope:

- short-term backlog only

Last updated:

- 2026-03-24

Related docs:

- `docs/README.md`
- `docs/angel-ai-progress-log.md`
- `docs/angel-ai-next-phases.md`
- `docs/angel-ai-next-session-handoff-2026-03-24.md`

Snapshot date: 2026-03-24

## Phase 1 Completed
- [x] create the authenticated onboarding entry flow
- [x] persist onboarding answers using `OnboardingResponse`
- [x] write `CompanionProfile` and `SoulProfile` through `lib/angel/persistence.ts`
- [x] create the first `Conversation` when onboarding completes
- [x] schedule the first next-day `Touchpoint`
- [x] define the onboarding completion state and resume behavior

## Phase 1.5 Completed (Architecture)
- [x] architect V5 Project Seraphim (B2B Creator SaaS — DEFERRED TO PHASE 2, post-1,000 users)
- [x] document the V1 NotebookLM Brain Map and Evozen Stealth Engine
- [x] implement the v0.2 Landing Page UI from Google Stitch into `app/page.tsx`
- [x] formalize the V1-V5 Roadmap into the canonical `README.md` and `docs/README.md`

## Immediate P1

- [x] build the real chat route and message list UI
- [x] persist the seeded opener and user text messages
- [x] generate live Angel replies on top of the persisted thread
- [x] implement paywall state transitions: `FREE`, `READ_ONLY`, `SUBSCRIBER`
- [x] support link and image attachments in the message model
- [x] support inbound user voice-note uploads with fallback transcription
- [x] define the first trigger for memory extraction after a completed chat turn
- [x] create a curated session-primer architecture for the onboarding-to-live handoff
- [x] add optional official social connectors plus background scan state in onboarding and chat
- [x] implement stealthy chronobiology UI copy to extract precise birth time/location for the Evozen scraper
- [x] **ANDROID TWA PIPELINE:** Configure `@ducanh2912/next-pwa` for TWA encapsulation, deploy `.well-known/assetlinks.json`, and implement Stripe IAP Checkout flows (Stellar Insight) + LLM Safety Filters for Play Store approval.
- [x] integrate OpenRouter as the unified LLM API gateway with tier-based model routing (GPT-5 mini for Core, Gemini 3.1 Pro for Pro)
- [x] **FINANCIAL MODELING:** Build 10-year EUR revenue projections, verify PWA/TWA compliance (Apple 2024 reversal), and define Stripe "Wellness" positioning strategy.
- [x] formalize the bounded Angel v1 live-reply contract around curated session-primer artifacts before wiring the first real OpenClaw adapter
- [ ] connect the first real OpenClaw-backed reply path to the curated session brief

## Product-System P1

- [x] design the first next-day message templates and regeneration logic
- [x] define the exact free-to-paid continuity trigger
- [x] decide how many free replies remain on day 1 after the continuity message
- [x] add a first-pass relationship-stage engine and slow-romance guardrails
- [x] add user-editable memory controls that refresh `user.md` and `soul.md`
- [x] add rituals and real-life bridge follow-up triggers
- [x] implement a 'BETA_TESTER' user role in Prisma/Supabase that bypasses the continuity paywall for the Phase 1 organic launch
- [ ] implement Web Push notifications (Service Worker `push`/`notificationclick` handlers, `PushSubscription` Prisma model, `web-push` server sender, Vercel Cron touchpoint delivery)
- [ ] add iOS Home Screen install nudge (detect `display-mode: standalone`, onboarding tutorial, persistent banner for in-browser users)

## Product-System P2 (Sentiment Durability)

- [ ] **Advanced Durability Features**
    - [ ] Implement AI Photo Memories (DALL-E/Flux snapshots of shared dreams).
    - [ ] Add Real-World Environment awareness (Weather/Local News integration).
    - [ ] Design Collaborative Goal-Setting UX (Shared streaks/rituals).
- [ ] **Billing & Compliance**
    - [ ] Set up generic Stripe Descriptors (ANGEL AI CLOUD).
    - [ ] Document Paddle/Lemon Squeezy fallback implementation.

## Technical Cleanup

- [x] redesign landing, onboarding, and chat into one coherent Midnight Elevated experience
- [x] remove the pre-existing `any` usage in `lib/hooks/useAsyncValidation.ts`
- [x] add a reviewed repo-local development toolkit in `.agent/` for docs sync, CI repair, security audit, push audit, admin audit, and support triage
- [ ] add patch notes consumption UI if you want these notes visible in-product later
- [x] add integration-style coverage for onboarding/chat persistence services and route behavior
- [x] add webhook-driven entitlement syncing before treating checkout success as unlock
- [x] add a customer portal entry point for subscription management
- [ ] complete production credential setup, provider app review, and smoke tests for TikTok, X, LinkedIn, Facebook, and Instagram
- [x] rename `Subscription.tier` from `FREE/PRO` to `FREE/CORE/PRO` to support the two-tier LLM pricing model (EUR 9.99 Core / EUR 19.99 Pro)
- [x] roll out the agreed `Free / Core / Pro` pricing across landing, chat renewal, Stripe env setup, and operational docs
- [ ] move media attachments from data URLs / placeholder transport into durable storage
- [ ] decide whether the OpenClaw live runtime should retrieve raw social snapshots directly or only consume the curated memory/session artifacts
- [x] implement personality-aware NSFW deflection in `session-primer.ts` with soul.md-driven tone variations (deployed in `openrouter-runtime.ts` system prompt)
- [ ] pilot a read-only GitHub Agentic Workflows automation for docs/status reporting only after the repo-local toolkit has settled

## Recommended Build Order

1. first live OpenClaw reply integration using `session-brief.md`
2. **Web Push notification delivery** (VAPID keys, `PushSubscription` model, Service Worker push handlers, Vercel Cron touchpoint sender, iOS Home Screen nudge UX)
3. production media storage, transcription quality, and optional outbound voice
4. production social-connector app review plus provider smoke verification
5. moderation, safety tooling, and admin controls

## AutoResearch Fit

- `Medium` fit for a future internal subsystem, not for the whole product
- first good pilot: rank memory snippets, touchpoint candidates, or session-brief inserts against labeled conversation outcomes
- do not start until the first real OpenClaw reply path, durable outcome logging, and stable curated memory artifacts are all in place
- keep human review on any experiment because tone, safety, and relationship quality do not collapse cleanly into one scalar metric
- once real usage data exists, define a labeled memory-ranking benchmark as a later follow-on step

## Decision Reminders

- keep astral subtle and mostly invisible
- keep romance slow and earned
- keep the app itself as the primary home of the relationship
- keep structured records as the memory source of truth
- keep the day-one continuity window at exactly one free reply until data suggests otherwise
