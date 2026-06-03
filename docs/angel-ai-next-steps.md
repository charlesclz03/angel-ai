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

- 2026-03-28

Related docs:

- `docs/README.md`
- `docs/angel-ai-progress-log.md`
- `docs/angel-ai-next-phases.md`
- `docs/angel-ai-next-session-handoff-2026-03-24.md`

Snapshot date: 2026-03-28

## Phase 1 Completed

- [x] create the authenticated onboarding entry flow
- [x] persist onboarding answers using `OnboardingResponse`
- [x] write `CompanionProfile` and `SoulProfile` through `lib/angel/persistence.ts`
- [x] create the first `Conversation` when onboarding completes
- [x] schedule the first next-day `Touchpoint`
- [x] define the onboarding completion state and resume behavior

## Phase 1.5 Completed (Architecture)

- [x] architect V5 Project Seraphim (B2B Creator SaaS - DEFERRED TO PHASE 2, post-1,000 users)
- [x] document the V1 NotebookLM Brain Map and stealth astral engine
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
- [x] implement stealthy chronobiology UI copy to extract precise birth time/location for the offline ephemeris engine
- [x] **ANDROID TWA PIPELINE:** Configure `@ducanh2912/next-pwa` for TWA encapsulation, deploy `.well-known/assetlinks.json`, and implement Stripe IAP Checkout flows (Stellar Insight) + LLM Safety Filters for Play Store approval.
- [x] integrate OpenRouter as the unified LLM API gateway with tier-based model routing (GPT-5 mini for Core, Gemini 3.1 Pro for Pro)
- [x] harden the live runtime seam so OpenClaw receives bounded context and OpenRouter can execute real fetch-based replies with deterministic fallback
- [x] **FINANCIAL MODELING:** Build 10-year EUR revenue projections, verify PWA/TWA compliance (Apple 2024 reversal), and define Stripe "Wellness" positioning strategy.
- [x] formalize the bounded Angel v1 live-reply contract around curated session-primer artifacts before wiring the first real OpenClaw adapter
- [ ] externally verify the first real OpenClaw-backed reply path to the curated session brief with live gateway/provider credentials

## Product-System P1

- [x] design the first next-day message templates and regeneration logic
- [x] define the exact free-to-paid continuity trigger
- [x] decide how many free replies remain on day 1 after the continuity message
- [x] add a first-pass relationship-stage engine and slow-romance guardrails
- [x] add user-editable memory controls that refresh `user.md` and `soul.md`
- [x] add rituals and real-life bridge follow-up triggers
- [x] implement a 'BETA_TESTER' user role in Prisma/Supabase that bypasses the continuity paywall for the Phase 1 organic launch
- [x] implement Web Push notifications (Service Worker `push`/`notificationclick` handlers, `PushSubscription` Prisma model, `web-push` server sender, Vercel Cron touchpoint delivery)
- [x] add subscriber-facing push controls with app-level enable or pause, quiet hours, and device unsubscribe while keeping due touchpoints scheduled until delivery is eligible
- [x] add iOS Home Screen install nudge (detect `display-mode: standalone`, onboarding tutorial, persistent banner for in-browser users)

## Product-System P2 (Sentiment Durability)

- [ ] **Advanced Durability Features**
  - [x] Surface collaborative ritual streaks in chat context — active `SharedRitual` rows now backfill from enabled ritual preferences and render inside `Our rituals` with same-day check-ins.
  - [x] Implement AI Photo Memories — `lib/media/image-generation.ts` with DALL-E 3 integration, tier quotas (Core: 2/mo, Pro: 15/mo), and safety prompt wrapping.
  - [x] Add Real-World Environment awareness — `buildEnvironmentalContext()` in `session-primer.ts` injects the user's local time and city, and `buildWeatherContext()` adds live weather when configured.
  - [x] Design Collaborative Goal-Setting UX — `SharedRitual` Prisma model with streak tracking, `logRitualCheckIn` server action in `app/chat/actions.ts`.
  - [x] Ship thread-first AI Photo Memories - saved Angel replies can now generate durable in-thread `IMAGE` attachments, with structured `PhotoMemory` records for quota tracking and admin metrics.
  - [ ] Review and stage `docs/angel-ai-atmosphere-prd.md` after the live OpenClaw path and early presence hardening settle.
  - [ ] Build the first `Angel Atmosphere` spike through a bounded Home Assistant bridge with scene-first lights and music control only.
- [x] **Billing & Compliance**
  - [x] Set up generic Stripe Descriptors (ANGEL AI CLOUD).
  - [x] Document Paddle/Lemon Squeezy fallback implementation.

## Technical Cleanup

- [x] redesign landing, onboarding, and chat into one coherent Midnight Elevated experience
- [x] remove the pre-existing `any` usage in `lib/hooks/useAsyncValidation.ts`
- [x] add a reviewed repo-local development toolkit in `.agent/` for docs sync, CI repair, security audit, push audit, admin audit, and support triage
- [x] add patch notes consumption UI so release history is visible in-product through `/updates`
- [x] add an `ADMIN`-only metadata-first operations dashboard for users, subscriptions, touchpoints, and social scan health
- [x] extend `/admin` with metadata-first funnel and continuity-health analytics for onboarding, active threads, continuity exposure, push coverage, and photo-memory adoption
- [x] ship an audit-only moderation queue with redacted previews, deterministic incident logging, and admin review actions
- [x] deepen audit-only moderation tooling with unresolved user rollups, drill-in filtering, and moderation alerts on `/admin`
- [x] ship Moderation V3 with critical-only live enforcement, append-only review history, in-app escalation sweep automation, and redacted analytics
- [x] upgrade media and voice with storage-aware transcription, bounded Angel voice previews, and OpenWeatherMap-backed session context
- [x] add launch-operations references for provider verification, TWA store readiness, and the current moderation policy matrix
- [x] add a repo-side TWA validation script plus local manifest icon assets so `npm run twa:check` can verify installability prerequisites before Bubblewrap
- [x] add integration-style coverage for onboarding/chat persistence services and route behavior
- [x] add webhook-driven entitlement syncing before treating checkout success as unlock
- [x] add a customer portal entry point for subscription management
- [ ] complete production credential setup, provider app review, and smoke tests for TikTok, X, LinkedIn, Facebook, and Instagram
- [x] rename `Subscription.tier` from `FREE/PRO` to `FREE/CORE/PRO` to support the two-tier LLM pricing model (EUR 9.99 Core / EUR 19.99 Pro)
- [x] roll out the agreed `Free / Core / Pro` pricing across landing, chat renewal, Stripe env setup, and operational docs
- [x] move media attachments from data URLs / placeholder transport into durable storage (Supabase integration complete)
- [x] lock the OpenClaw live runtime to curated memory/session artifacts instead of raw social snapshot payloads
- [ ] validate the curated social-derived memory path during the first live OpenClaw smoke and only widen bounded context if that contract proves insufficient
- [x] implement personality-aware NSFW deflection in `session-primer.ts` with soul.md-driven tone variations (deployed in `openrouter-runtime.ts` system prompt)
- [x] pilot a read-only GitHub Actions status-report workflow for docs and verification visibility
- [x] extract the first low-risk chat UI subcomponents from `components/organisms/AngelChat.tsx` into `components/organisms/chat/`
- [x] redesign `/chat` into a thread-first surface with a compressed page shell, secondary desktop context rail, and mobile context drawer
- [x] continue decomposing `components/organisms/AngelChat.tsx` into thread-shell, composer, and context-rail components before the visual redesign pass
- [x] restore a repo-wide green verification baseline by fixing the current unrelated `type-check` blockers in `app/api/push/subscribe/route.ts` and `openclaw_repo/**`

## Recommended Build Order

1. attach live credentials and smoke-test the bounded OpenClaw/OpenRouter reply path using `session-brief.md`
2. production social-connector app review plus provider smoke verification
3. compile final TWA target locally and push to Google Play dashboard
4. decide whether moderation expands beyond critical-only enforcement and deepen operator automation beyond the current review timeline, sweep automation, and analytics
5. review `docs/angel-ai-atmosphere-prd.md` and only start the Home Assistant bridge spike once the presence/permissions baseline feels trustworthy

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
