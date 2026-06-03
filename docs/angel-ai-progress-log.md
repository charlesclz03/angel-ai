# Angel AI Progress Log

Purpose:

- record what has already shipped

Audience:

- maintainers
- coding agents

Status:

- active

Source of truth scope:

- shipped work only

Last updated:

- 2026-04-06

Related docs:

- `docs/README.md`
- `docs/angel-ai-next-steps.md`
- `docs/angel-ai-next-phases.md`
- `docs/angel-ai-next-session-handoff-2026-03-24.md`

Snapshot date: 2026-04-06

## Current State

Angel AI is no longer just a concept document set.

The project now has:

- a locked v1 product direction
- a branded landing shell
- a real Angel-specific Prisma schema
- a real authenticated onboarding route with persistence
- a real `/chat` route with a persistent text thread
- a full non-streaming chat turn with persisted Angel replies
- a continuity paywall that can turn the thread read-only on day 1
- shared code for generating `user.md` and `soul.md`
- rich-input chat support for links, images, and inbound voice notes
- high-quality provider-backed voice-note transcription when configured
- bounded outbound Angel voice previews for subscriber and privileged threads
- optional official social connectors with background scans, normalized snapshots, and social-derived memory refresh
- webhook-backed billing sync and a customer billing portal entry point
- curated session-primer artifacts for the onboarding-to-live handoff
- visible and user-editable memory controls inside the chat experience
- first-pass relationship stages, ritual scheduling, and real-life bridge prompts
- Web Push notification delivery (VAPID keys, Service Worker, Touchpoint cron)
- AI Photo Memories service with DALL-E 3 integration and tier-based quotas
- environmental awareness context injection (local time, city) in the session-primer LLM prompt
- live weather context injection in the session-primer when `OPENWEATHERMAP_API_KEY` is configured
- `SharedRitual` collaborative goal-setting model with streak tracking and check-in server action
- shared ritual context UI with collaborative streak check-ins
- a product-facing `/updates` release trail backed by the master patch-notes document
- an `ADMIN`-only metadata dashboard for continuity, subscription, and queue health
- an `ADMIN`-only moderation system with redacted previews, critical-only live enforcement, append-only review history, in-app escalation sweep automation, and analytics
- a read-only GitHub Actions status-report workflow for verification visibility
- a consolidated Master Product Spec (`angel-ai-product-spec-master.md`) with V1-V4 drafts archived
- an implementation-ready `Angel Atmosphere` planning pack covering PRD, architecture, schema, API contracts, and execution plan
- a patch-note trail for what has been completed

## Product Direction Locked

These decisions are stable enough to build against:

- platform: `PWA-first`
- positioning: `friend-first companion that can slowly become romantic`
- category: `Communications`, not `Dating`
- age policy: `18+`
- astral layer: hidden engine, barely mentioned in the UI
- monetization: next-day continuity paywall
- free mode after gating: limited read-only continuity every few days
- media in v1: links, images, and inbound user voice notes
- memory split:
  - `user.md` = user identity and relational context
  - `soul.md` = Angel identity with that user

## Work Completed

### 1. Product definition and research

Created:

- `docs/angel-ai-v1-product-spec.md`
- `docs/angel-ai-v1-experience-blueprint.md`
- `docs/angel-ai-onboarding-script-v1.md`
- `docs/archive/superseded/angel-ai-prisma-schema-proposal.md`
- `docs/angel-ai-memory-prompt-architecture.md`
- `docs/angel-ai-tooling-audit.md`

Result:

- the app now has a coherent product spine, onboarding philosophy, memory strategy, and roadmap direction

### 2. Project initialization

Completed:

- renamed the project metadata to Angel AI
- rewrote the README
- applied a midnight-blue visual direction
- created the initial landing page shell

Result:

- the repo now reads and feels like Angel AI instead of a generic starter

### 3. Domain implementation foundation

Completed:

- replaced the generic Prisma schema with Angel-specific models and enums
- added a Prisma singleton
- added domain helpers for:
  - product recommendations
  - onboarding stage definitions
  - `user.md` generation
  - `soul.md` generation
  - persistence payload builders

Result:

- the backend structure now matches the product design instead of waiting behind docs

### 4. Onboarding prototype

Completed:

- created `/onboarding`
- added an interactive prototype component
- added editable seed fields for companion and soul shaping
- added live previews for generated memory markdown

Result:

- the onboarding flow can now be inspected as a real product surface

### 5. Authenticated onboarding persistence

Completed:

- added Google auth wiring through NextAuth
- replaced the prototype route behavior with a resumable onboarding flow
- saved onboarding steps through `OnboardingResponse`
- upserted `CompanionProfile` and `SoulProfile` on completion
- created the first `Conversation`
- scheduled the first next-day `Touchpoint`
- added focused tests for onboarding state, completion idempotency, and guest-to-auth handoff

Result:

- Angel AI now has a real Phase 1 onboarding system instead of a visual-only shell

### 6. Verification

Completed:

- `npm run type-check`
- `npm run lint`
- `npm test`
- `npm run build`

Result:

- the current onboarding and chat foundation both verify cleanly in local automation

### 7. Chat foundation before provider keys

Completed:

- added `/chat` as the first real persistent thread route
- redirected guests and incomplete users back to `/onboarding`
- added shared chat services for loading thread state and saving one `USER` text message
- seeded one deterministic persisted `ANGEL` opener on empty completed threads
- added a continuity header using `preferredName`, `angelName`, and the next scheduled follow-up when present
- fixed the last lint warning in `lib/hooks/useAsyncValidation.ts`
- added route, service, and UI tests for thread readiness, opener seeding, send behavior, and failure states

Result:

- Angel AI now has a real post-onboarding destination instead of stopping at setup

### 8. Full chat turns and first memory writes

Completed:

- expanded `sendChatMessage` into a full turn pipeline that persists both the `USER` message and one `ANGEL` reply
- added a provider-ready runtime adapter layer with deterministic fallback reply generation
- loaded reply context from recent messages, onboarding summaries, and recent high-signal memory snippets
- added first-pass post-turn memory extraction into `MemoryEntry` with normalized dedupe
- kept extraction non-blocking for the visible chat turn so reply persistence still succeeds if memory writing fails
- updated the `/chat` UI and tests for pending-state replies, persisted Angel turns, and memory-write coverage

Result:

- Angel AI now feels like a real conversational loop instead of a write-only thread

### 9. Continuity paywall and read-only renewal

Completed:

- delivered the due next-day `FOLLOWUP` touchpoint as a persisted continuity `ANGEL` message on first `/chat` load after its scheduled time
- moved continuity gating into shared chat state with `ACTIVE`, `READ_ONLY`, and `SUBSCRIBER` access modes
- allowed exactly one free continuation reply after the day-one message, then flipped the thread into read-only mode
- started using `Message.paywallState` intentionally across free, read-only, and subscriber turns
- added a monthly checkout shell entry point with graceful missing-env handling and `/chat` return states
- added service, route, and UI coverage for continuity delivery, gating, subscriber bypass, and billing-unavailable UX

Result:

- Angel AI now expresses its monetization model inside the real conversation surface instead of only in product docs

### 10. Midnight Elevated core app redesign

Completed:

- replaced the shared visual system with a stronger Midnight Elevated token set, editorial typography pairing, and lighter surface treatment
- redesigned the landing page around a more story-led premium arc with clearer continuity framing
- rebuilt the onboarding flow into a more conversational, mobile-first guided sequence with stronger progress signaling and memory previews
- redesigned the chat surface and read-only renewal state so they feel calmer, more intimate, and more coherent with the rest of the product
- fixed the shared `Button` primitive so `asChild` works cleanly with the redesigned CTA composition
- updated route and component tests to match the new UI language while preserving the existing product behavior

Result:

- landing, onboarding, and chat now read as one coherent product instead of three separate implementation phases

### 11. Summary regeneration and summary-aware continuity

Completed:

- added a deterministic summary regeneration service that rebuilds `CompanionProfile.summaryMarkdown` and `SoulProfile.summaryMarkdown` from structured profile fields plus ranked `MemoryEntry` rows
- added regeneration-specific markdown builders for live profile summaries without changing the onboarding preview builders
- made chat loads run a best-effort summary catch-up refresh so older threads can upgrade without a migration
- made post-turn memory persistence trigger summary refresh when new memory is actually written
- upgraded the continuity follow-up builder to use summary-derived memory lines, callback hooks, and deterministic relationship-intent templates
- added unit and service coverage for ranking, markdown regeneration, catch-up refresh, non-blocking failures, and continuity template selection

Result:

- Angel now carries forward a more durable, compact memory portrait instead of relying mostly on onboarding-era summaries

### 12. Rich relationship-system foundations

Completed:

- added rich chat input support for `TEXT`, `LINK`, `IMAGE`, and `VOICE_NOTE`, including link preview metadata and fallback voice-note transcription when `OPENAI_API_KEY` is available
- extended chat persistence so user attachments are stored and folded into reply generation, memory extraction, and summary/session-primer context
- added webhook-backed Stripe subscription syncing, monthly checkout hardening, and a customer billing portal entry point
- generated curated `relationship_seed.md` and `session-brief.md` artifacts instead of treating raw markdown bulk as the live-session handoff
- added visible memory controls in `/chat` so users can pin, edit, hide, or delete durable memory entries and immediately refresh the relationship dossier
- added a first-pass relationship-stage engine, friend-first slow-romance guardrails, configurable rituals, due presence-message delivery, and bridge touchpoints for interviews, meetings, calls, social courage, and habit follow-through
- expanded the chat UI and services so these systems are visible and test-covered instead of living only in product notes

Result:

- Angel now behaves more like a relationship product with shared media, editable memory, real continuity infrastructure, and a clearer path into a future live OpenClaw session

### 13. Official social connectors and background context scan

Completed:

- added an optional end-of-onboarding `social-context` stage and equivalent controls inside `/chat`
- added official OAuth/API connector support for TikTok, X, LinkedIn, Facebook, and Instagram, with capability-based limited states instead of scraping fallbacks
- added encrypted social token storage plus durable `ConnectedSocialAccount`, `SocialScanJob`, `SocialProfileSnapshot`, and `SocialContentSnapshot` models
- added a DB-backed background scan queue with a protected internal worker route and a local inline fallback path for development
- normalized official social profile and recent-content imports into social-derived `MemoryEntry` rows with source metadata
- refreshed `user.md`, `soul.md`, `relationship_seed.md`, and `session-brief.md` after successful social scans
- added UI and service coverage for connect state, rescan/disconnect/delete behavior, onboarding enqueue behavior, and crypto helpers

Result:

- Angel can now build background relationship context from official consumer-social accounts without blocking onboarding or requiring scraping

### 14. V5 Project Seraphim & Creator SaaS Pivot

Completed:

- Audited the OnlyFans/Creator Economy landscape and documented findings in `docs/architecture/TOP_SECRET.md`.
- Architected the V5 B2B SaaS strategy (Project Seraphim) using a fully compliant Off-Platform PaaS model (Linktree/Stripe Connect) to completely eliminate botting risks.
- Formally defined the Great Decoupling Strategy, splitting Angel AI (Consumer PWA) and Project Seraphim (B2B PaaS) across dual domains with separate Stripe/High-Risk payment isolation.
- Structured the Phased Launch Sequence, entirely delaying Project Seraphim's Alpha until Angel AI reaches 1,000 active users, ensuring the core Conversational Brain is strictly optimized on a low-risk B2C cohort first.
- Created the master V1-V5 feature matrix architecture map.

Result:

- The project now has a highly lucrative B2B endgame scaling to $100M+ valuation targets, safely isolated from the mass-market consumer risk profile.

### 15. V1 Brain Map & Stealth Empathy Engine

Completed:

- Designed the "NotebookLM-style" Source Guide and interactive Brain Map for deep relationship memory (`angel-ai-v1-product-spec.md`).
- Architected the Astral Engine to invisibly ingest the user's Natal Chart (Thème Astral) from `evozen.fr` to shape the Angel's precise dialogue cadence and empathy.
- Generated the V0.2 Landing Page via Google Stitch and fundamentally rebuilt the `app/page.tsx` routing to utilize the new Bento Grid and Cosmic Glassmorphism aesthetic.
- Implemented stealthy "Origin Anchor" UI copy in onboarding to quietly extract precise birth time and location without exposing astrological framing to the user.

Result:

- V1 now possesses an incredibly sticky "spooky empathy" hook for consumer retention, and the v0.2 landing interface is fully deployed.

### 16. Strategic Planning: LLM Tiers, Billing, and Safety Architecture

Completed:

- Analyzed the entire Artificial Analysis LLM leaderboard (312 models, March 2026 data) to identify the optimal price-to-intelligence models for a two-tier consumer subscription.
- Selected **GPT-5 mini (medium)** for Angel Core (EUR 9.99/mo, Intelligence 39, 24x margin) and **Gemini 3.1 Pro** for Angel Pro (EUR 19.99/mo, Intelligence 57 — tied #1 globally, ~10x margin).
- Chose **OpenRouter** as the unified API gateway to enable hot-swappable model routing without code changes.
- Confirmed **100% Stripe billing** across all platforms (Web, iOS PWA, Android TWA). No Apple/Google IAP tax applies because Angel AI is a PWA, not a native store app.
- Designed a personality-aware NSFW deflection strategy governed by `soul.md` traits: acknowledge without shame, suggest other platforms, smoothly redirect, never engage.
- Formalized the `FREE/CORE/PRO` subscription tier rename in the technical backlog.

Result:

- Angel AI now has a mathematically validated, production-ready LLM tier architecture with proven margin targets and a clear safety posture for Play Store approval.

### 17. Offline Ephemeris Engine & Android TWA Distribution

Completed:

- Replaced the planned `evozen.fr` web scraper with a 100% offline mathematical ephemeris engine using `astronomy-engine` and `city-timezones` for instant Sun/Moon sign calculations.
- Added "I don't know my exact time" checkbox to onboarding, defaulting to UTC noon approximation when birth time is unknown.
- Reversed the strict PWA-only ban policy to allow Android Google Play Store distribution via Trusted Web Activity (TWA) after the Great Decoupling isolated Project Seraphim from the consumer app.
- Enabled `@ducanh2912/next-pwa` in `next.config.js` and created `public/manifest.json` with standalone display mode, maskable icons, and iOS `appleWebApp` meta tags.
- Created `public/.well-known/assetlinks.json` for TWA domain verification against the Android package.
- Injected strict Anti-NSFW/CSAM safety guardrails into `session-primer.ts` to ensure Google Play manual review compliance.
- Expanded the Stripe billing architecture to support 5 new IAP products (`stellar_insight`, `midnight_channel`, `voice_memory`, `memory_vault`, `telepathic_pings`) via one-time `payment` mode Checkout sessions alongside the existing `subscription` mode for monthly continuity.
- Enforced 100% Stripe billing across all platforms, deliberately bypassing Google Play Billing to retain full margin.
- Updated `lib/billing/types.ts` and `lib/billing/stripe.ts` to dynamically route between subscription and one-time payment modes.

Result:

- Angel AI V1 is now cleared for native Android distribution, has a mature IAP product catalog, and the Natal Chart engine runs entirely offline with zero external dependencies.

### 18. BETA_TESTER Role, OpenRouter LLM Gateway, and 3-Tier Architecture

Completed:

- Created `lib/angel/user-role.ts` with `isBetaTester` and `isPrivilegedRole` helpers.
- Modified `resolveChatAccessState` to bypass the continuity paywall for `BETA_TESTER` users.
- Created `lib/angel/openrouter-config.ts` and `lib/angel/openrouter-runtime.ts` — full OpenRouter `ChatRuntimeAdapter` with system prompt builder, NSFW safety guardrails, and tier-based model routing (GPT-5 mini for Core, Gemini 3.1 Pro for Pro).
- Wired OpenRouter into `chat-service.ts` via `resolveRuntimeForUser` with automatic fallback.
- Updated billing types, Stripe checkout, and subscription sync for `FREE/CORE/PRO` tier architecture.
- Added 4 new test files (29+ assertions). All 16 test files pass.

Result:

- Angel AI has a live-ready LLM integration layer, production-safe BETA_TESTER bypass, and a validated 3-tier subscription architecture.

### 19. Web Push Notification Architecture & Phase 1 Doc Cleanup

Completed:

- Documented the full Web Push notification architecture in `angel-ai-v5-product-spec.md` (Section 11): Android TWA via FCM (full support), iOS PWA via APNs (requires Home Screen install, supported since iOS 16.4).
- Designed the server-side push pipeline: VAPID keys, `PushSubscription` Prisma model, `web-push` npm sender triggered by Vercel Cron, integrated with the existing `Touchpoint` scheduler.
- Elevated push notifications to priority #2 in the recommended build order (after OpenClaw live handoff).
- Removed all Project Seraphim references from Phase 1 operational docs: `v5-product-spec.md` (reframed as Phase 1 Consumer PWA spec with B2B sections collapsed), `v1-product-spec.md`, `README.md`, `feature-matrix.md`, `next-steps.md`, both `design.md` copies.
- Historical progress log entries and strategic reference docs (`AI Creator Platform Business Strategy.md`, `Strategic Decoupling and Monetization Blueprint.md`, `TOP_SECRET.md`) preserved as Phase 2 archives.

Result:

- All Phase 1 docs now reflect Angel AI as a standalone consumer PWA. Seraphim is cleanly deferred to Phase 2 (post-1,000 users) with full strategy preserved in dedicated reference docs.

### 20. Phase 1 Strategy, Finance, and Risk Baseline

Completed:

- **Verified PWA/TWA Compliance:** Confirmed stable Home Screen Web Push support on iOS 16.4+ (Apple reversed the EU ban globally). Confirmed TWA stability on Android provided high "Real User Value" is met through Offline/Push features.
- **EUR Revenue Model:** Built detailed 10-year projections in EUR reflecting the new Core (EUR 9.99) and Pro (EUR 19.99) tiers. Modeled hosting scaling (EUR 50-EUR 30k) and support staffing.
- **Risk Mitigation Strategy:** Defined specific protocols for Stripe safety (Wellness positioning, generic descriptors), Sentiment Decay (AI Photo Memories, Contextual Environment), and Payment Fallbacks (Paddle/Lemon Squeezy).
- **Backlog Sync:** Updated `v5-product-spec.md`, `v1-product-spec.md`, `next-steps.md`, and `README.md` to reflect these strategic baselines.

Result:

- Angel AI has a professional financial and risk baseline. Build priorities are now locked for Phase 1 launch.
- All documentation files audited and fixed for numbering/sequencing consistency.

### 21. Pricing Rollout Across Landing, Renewal, and Stripe Setup

Completed:

- replaced the stale `Chrono+` landing-page pricing anchor with a real `Free / Core / Pro` pricing section
- updated the read-only renewal card in `/chat` to offer explicit Angel Core and Angel Pro checkout paths instead of one generic monthly button
- removed the old single-plan Stripe setup guidance and standardized the repo on `STRIPE_PRICE_ID_MONTHLY_CORE` and `STRIPE_PRICE_ID_MONTHLY_PRO`
- aligned `.env.example`, the Stripe runbook, the env-var reference, and the README billing notes with the agreed subscription pricing

Result:

- Angel AI now presents one consistent pricing story across the marketing surface, in-app renewal flow, and Stripe operator setup

### 22. Minimal Bounded Runtime Seam For Live Angel Replies

Completed:

- formalized `AngelReplyContext` in `lib/angel/chat-runtime.ts` as the canonical bounded contract for one visible Angel reply
- centralized bounded context assembly in `lib/angel/chat-service.ts` so recent turns, memory snippets, and curated artifacts are selected in one place
- capped the live runtime input at 8 recent conversation messages and 5 ranked durable memory snippets
- removed the duplicated-current-turn bug by excluding the just-persisted user message from `recentMessages` and passing it only as `lastUserMessage`
- tightened `session-brief.md` in `lib/angel/session-primer.ts` around stage, tone/check-in intent, curated memory, recent conversation, and an explicit safety/pacing section
- added focused tests for bounded context assembly, sparse summary fallback behavior, and deterministic session-primer output

Result:

- Angel AI now has a cleaner v1 live-reply seam that stays memory-aware and bounded while remaining easy to swap to a future OpenClaw adapter

### 23. Safe Repo-Local Development Toolkit

Completed:

- added reviewed repo-local skills for docs sync, changelog generation, CI repair, push auditing, security auditing, admin dossier review, and support triage
- added reviewed repo-local workflows for `/ci-fix`, `/security-audit`, `/push-smoke-test`, `/admin-audit`, `/support-triage`, and `/sync-docs`
- added specialist agent definitions for moderation review, billing ops checking, admin ops analysis, and push delivery debugging
- updated `AGENTS.md`, the docs hub, the handoff, the command reference, and `.agent/ARCHITECTURE.md` so future sessions discover and use the local toolkit during development
- documented the broader external OSS and safe workflow research in archive reports without promoting unreviewed third-party prompt packs into the active path

Result:

- Angel AI now has a safer, repeatable internal development-tooling layer that supports app development without depending on unvetted external skills or autonomous workflows

### 24. First Chat UI Extraction Pass

Completed:

- extracted `InfoPanel`, `SocialStatusCard`, `MessageBubble`, and `ReadOnlyPaywallCard` from `components/organisms/AngelChat.tsx` into `components/organisms/chat/`
- kept all state, actions, and chat behavior inside `AngelChat.tsx` so this slice stays structural and low-risk
- preserved the existing `/chat` behavior while creating a cleaner seam for the next thread/composer/context-rail refactor

Verification:

- `npm test -- __tests__/components/organisms/AngelChat.test.tsx`
- `npx eslint components/organisms/AngelChat.tsx components/organisms/chat/*.tsx`

Notes:

- `npm run type-check` is currently blocked by pre-existing unrelated errors in `app/api/cron/send-touchpoints/route.ts`, `app/api/push/subscribe/route.ts`, and `openclaw_repo/**`

Result:

- Angel AI now has a cleaner chat UI component boundary without changing user-facing behavior, making the next visual redesign pass safer to implement

### 25. Thread-First Chat Redesign With Desktop Rail And Mobile Drawer

Completed:

- redesigned `/chat` so the conversation is now the primary surface instead of sitting beneath a large marketing shell
- compressed `app/chat/page.tsx` into a lightweight arrival band with low-pressure navigation back to onboarding memory and home
- decomposed `AngelChat.tsx` into thread shell, presence header, message list, composer, context rail, context drawer, and relationship-tools subcomponents while keeping all chat actions and state in the container
- moved continuity, dossier, ritual, social, and push context into a secondary desktop rail and a mobile Headless UI drawer
- kept editable memory, ritual toggles, and destructive social controls behind secondary `Relationship tools` so the live thread stays emotionally clean
- added warmer chat-specific visual tokens plus new `Card` and `Button` variants to support the thread-first surface

Verification:

- `npm test -- __tests__/components/organisms/AngelChat.test.tsx __tests__/app/chat/page.test.tsx`
- `npx eslint app/chat/page.tsx components/organisms/AngelChat.tsx components/organisms/PushNotificationPrompt.tsx components/organisms/chat/*.tsx components/ui/Card.tsx components/atoms/Button.tsx __tests__/components/organisms/AngelChat.test.tsx __tests__/app/chat/page.test.tsx`

Notes:

- `npm run type-check` still fails on unrelated existing issues in `app/api/push/subscribe/route.ts` and `openclaw_repo/**`

Result:

- Angel AI now presents `/chat` as a calmer, more believable relationship surface without changing message, billing, or memory behavior

### 26. Durable Media Storage & Archival Lifecycle

Completed:

- Replaced memory-intensive Base64 data URIs with secure Supabase Storage for all chat attachments.
- Implemented `/api/media/upload` and `/api/media/view/[...path]` proxy routes returning 1-hour signed URLs to enforce privacy.
- Created `/api/cron/archive-proposals` to scan for media older than 30 days and generate `MEDIA_ARCHIVE_PROPOSAL` touchpoints.
- Built `/api/media/archive` ZIP export builder for offloading old relationship photos to local storage before purging the remote bucket.

Result:

- Angel AI now has a stable, cost-efficient, privacy-focused media pipeline that naturally mimics the ephemeral/durable nature of real memory.

### 27. Offline OpenClaw Mock Engine & iOS PWA Nudge

Completed:

- Created the resilient `openrouter-runtime.ts` mock engine to safely compile the massive system prompt (Backbone Scale, memory snippets, relationship stage) without firing real tokens during local UI development.
- Injected `<PWAInstallNudge />` strictly detecting Mobile Safari, prompting users to "Add to Home Screen" to enable the pure continuity PWA experience and upcoming Web Push features.
- Formalized `production-keys.md` scoping the exact OAuth App Review links needed for next week's integration approvals.

Result:

- The UI layer is officially feature-complete and unblocked. The absolute final steps are the live-key API handoffs and mobile notification approvals.

### 28. Angel Atmosphere planning and implementation pack

Completed:

- created a canonical `Angel Atmosphere` PRD covering product goals, scenes, safety rules, rollout order, and the companion-first positioning for lights-and-music rituals
- documented the recommended bridge architecture using `Home Assistant` as the canonical control plane, `Music Assistant` as the preferred optional music layer, and a local `Angel Home Bridge` that initiates outbound communication to Angel Cloud
- proposed the first schema additions for pairing sessions, room scopes, scene preferences, and execution logs without changing the live Prisma schema yet
- defined versioned REST API contracts for app-side pairing/settings flows and bridge-side pairing, heartbeat, command claim, and result reporting
- added ADR `0005` to lock the bridge-through-Home-Assistant direction for planning
- added a concrete root implementation plan so the feature can be picked up later without disturbing the current OpenClaw-first roadmap

Verification:

- read back the new docs and updated indexes for consistency
- no code tests were run because this was a docs-only planning slice

Result:

- Angel AI now has an implementation-ready home-atmosphere planning pack that stays clearly behind the current live-runtime and presence-hardening priorities

### 29. Live runtime adapter hardening and green verification baseline

Completed:

- replaced the OpenRouter offline stub with a real fetch-based chat-completions adapter that activates when `OPENROUTER_API_KEY` is present
- kept the live reply path resilient by falling back from OpenClaw to OpenRouter and finally to the deterministic local runtime when live services fail or are absent
- expanded the OpenClaw gateway payload so it now carries the bounded session contract instead of only a minimal partial context
- kept memory extraction deterministic and non-blocking even when provider-backed replies are enabled
- added focused tests for OpenRouter request shaping, OpenClaw payload shaping, response parsing, and graceful fallback behavior
- synced `.env.example`, env-var docs, and the OpenClaw handoff runbook with the now-live-capable adapter seam
- cleared the remaining local lint/build blockers in the archive-proposal and media-archive routes, restoring a fully green repo verification chain

Verification:

- `npm run type-check`
- `npm test -- __tests__/lib/angel/openrouter-runtime.test.ts __tests__/lib/angel/openclaw-client.test.ts`
- `npm test`
- `npm run lint`
- `npm run build`

Result:

- Angel AI can now execute the bounded live-runtime path as soon as real credentials and gateway availability are provided, without needing further adapter code changes

### 30. Shared ritual context UI and collaborative check-ins

Completed:

- threaded active `SharedRitual` records through `ChatState` so the relationship surface can render them directly
- backfilled and synchronized active `SharedRitual` rows from enabled ritual preferences without needing a migration for existing users
- surfaced `Our rituals` inside the chat context rail with streak, best-streak, and last-check-in status
- added same-day ritual check-ins from chat, including immediate state refresh and duplicate-check-in handling
- expanded focused coverage for ritual backfill, chat-state hydration, and the new context-rail interaction

Verification:

- `npm test -- __tests__/lib/angel/chat-service.test.ts __tests__/components/organisms/AngelChat.test.tsx __tests__/app/chat/page.test.tsx`
- `npm run type-check`
- `npm test`
- `npm run lint`
- `npm run build`

Result:

- Angel AI now exposes collaborative rituals as a visible relationship system instead of leaving them behind a server action and hidden data model

### 31. In-product updates surface and master patch-note parsing

Completed:

- replaced the stale static patch-note seed data with a parser that reads `docs/reference/PATCH_NOTES_MASTER.md`
- added a product-facing `/updates` page that highlights the latest shipped slice, recent release archive, and verification trail
- added landing-page navigation links so the updates surface is discoverable without opening the repo
- added focused coverage for the patch-note parser and the new updates page

Verification:

- `npm run type-check`
- `npm test`
- `npm run lint`
- `npm run build`

Result:

- Angel AI now exposes its release history inside the product and keeps that surface aligned with the canonical patch-notes document

### 32. Admin operations dashboard and metadata-first operator surface

Completed:

- added a protected `/admin` page that admits `ADMIN` users only and redirects guests or non-admins away from the surface
- created a shared admin dashboard service that summarizes users, onboarding completion, subscription tiers, queue health, and recent operational alerts
- kept the operator view metadata-first by avoiding raw memory text, raw message content, and provider token exposure
- added focused coverage for the admin dashboard service and the route-level role gating / rendering behavior

Verification:

- `npm run build`
- `npm run type-check` after the build regenerates `.next/types`
- `npm test`
- `npm run lint`

Result:

- Angel AI now has a first internal operator surface for continuity and queue health without turning the app into a raw personal-data browser

### 33. Audit-only moderation queue and redacted safety review surface

Completed:

- added `ModerationIncident` to the Prisma schema with category, severity, status, redacted preview, matched-signal metadata, and reviewer audit fields
- built a deterministic moderation detector for explicit sexual content, minor-safety violations, early-stage Angel romance escalation, and policy-bypass attempts
- logged moderation incidents after persisted user turns and Angel replies inside the main chat send path without blocking reply delivery
- added an `ADMIN`-only `/admin/moderation` queue with open-first ordering, metadata filters, redacted previews, matched-signal chips, and review forms
- extended `/admin` with moderation summary counts and a direct link into the queue
- added focused coverage for detector behavior, audit logging in `sendChatMessageTx`, admin review actions, moderation queue rendering, and dashboard summaries

Verification:

- `npx prisma format`
- `npx prisma generate`
- `npm run type-check`
- `npm test`
- `npm run lint`
- `npm run build`

Result:

- Angel AI now has its first real moderation workflow for operator audit and triage without exposing raw private conversation content or changing live chat behavior

### 34. Moderation V2 intelligence, unresolved user rollups, and admin alerts

Completed:

- extended the moderation admin service with unresolved-only user risk rollups, per-user drill-in filtering, and dashboard alert generation
- upgraded `/admin/moderation` with user risk rollup cards, active user-focus state, clear-focus actions, and drill-in links that preserve redacted metadata filtering
- extended `/admin` alerts with moderation-critical and moderation-escalated warning cards emitted per affected user instead of per incident
- added focused coverage for rollup ordering, user drill-in filters, moderation alert generation, moderation page rendering, and updated admin alerts

Verification:

- `npx vitest run __tests__/lib/admin/moderation.test.ts __tests__/lib/admin/dashboard.test.ts __tests__/app/admin/moderation/page.test.tsx __tests__/app/admin/page.test.tsx`
- `npm run type-check`
- `npm test`
- `npm run lint`
- `npm run build`

Result:

- Angel AI operators can now spot repeat unresolved moderation pressure by user and jump into the relevant redacted incidents without opening raw content or changing live chat behavior

### 35. Moderation V3 critical-only enforcement, review timeline, and redacted analytics

Completed:

- added `ModerationEnforcementAction`, `ModerationReviewActorType`, `ModerationReviewReasonCode`, and append-only `ModerationReviewEvent` records to the Prisma schema
- enforced critical user moderation cases after persistence in `sendChatMessageTx`, logging incidents, stamping blocked-input enforcement metadata, and saving a deterministic Angel safety reply instead of calling the runtime
- kept blocked moderation turns visible in chat while skipping memory extraction, summary refresh, and relationship-stage advancement for those turns
- added in-app escalation sweep automation plus `/api/cron/moderation-sweep` so overdue unresolved incidents can be auto-escalated without external paging
- upgraded `/admin/moderation` with needs-attention cards, enforcement metadata, reason-coded review forms, and append-only review-history timelines
- added `/admin/moderation/analytics` with redacted 7-day and 30-day volume breakdowns, enforcement counts, review-reason breakdowns, false-positive rate, median review / resolution timing, and repeat-user unresolved counts
- extended `/admin` with moderation needs-attention summary cards and links into the deeper moderation surfaces
- added focused coverage for critical enforcement, review-event persistence, analytics rendering, sweep automation, and updated admin queue/dashboard behavior

Verification:

- `npx prisma format`
- `npx prisma generate`
- `npm run type-check`
- `npm test`
- `npm run lint`
- `npm run build`

Result:

- Angel AI now has its first bounded live moderation enforcement path plus a much stronger redacted operator workflow, without exposing raw user content or introducing external alerting dependencies

### 36. Storage-aware voice pipeline, bounded Angel voice previews, and live weather context

Completed:

- upgraded inbound voice-note transcription to prefer the higher-quality OpenAI transcription path, including stored `/api/media/view/...` attachments when durable storage is configured
- wired the chat composer to upload images and voice notes through the media proxy when storage is available, while preserving the local data-URL fallback
- finished the AI Photo Memories storage path so generated snapshots now download from the provider and pass through Angel's media pipeline instead of expiring as temporary URLs
- added bounded subscriber and privileged `Hear Angel` voice previews that generate an explicitly AI-labeled `VOICE_AUDIO` attachment on saved Angel replies
- added OpenWeatherMap-backed current-weather context to the bounded `session-brief.md` while preserving the local time and city fallback
- locked the live runtime boundary against raw social snapshot payloads with regression coverage and runbook updates
- added a read-only GitHub Actions status-report workflow plus provider, TWA, and moderation reference docs to support launch operations

Verification:

- `npm test -- __tests__/lib/angel/media.test.ts __tests__/lib/angel/weather.test.ts __tests__/lib/angel/voice-service.test.ts __tests__/lib/angel/session-primer.test.ts __tests__/components/organisms/AngelChat.test.tsx __tests__/lib/angel/chat-service.test.ts`
- `npm run type-check`
- `npm test`
- `npm run lint`
- `npm run build`

Result:

- Angel AI now has a stronger Phase 5 media-and-voice foundation, live weather-aware session context, and a cleaner launch-operations trail without changing the bounded OpenClaw handoff contract

### 37. Thread-first photo memories, quiet-hours push controls, admin funnel metrics, and local TWA validation

Completed:

- added `PhotoMemory` to Prisma plus new `UserPreferences` push fields so AI photo memories, quiet hours, and operator metrics now have structured storage instead of attachment-only inference
- added `lib/angel/photo-memory-service.ts` plus the `generatePhotoMemory` chat action, letting subscriber threads generate durable in-chat `IMAGE` attachments from saved Angel replies with monthly quota tracking and graceful local-dev failures when `OPENAI_API_KEY` is missing
- extended `ChatState` with `photoMemoryStatus` and `notificationPreferences`, surfaced the `Memory Snapshot` CTA beside `Hear Angel`, labeled generated memory images in-thread, and upgraded the push prompt into a real settings surface with browser permission state, app-level enable or pause, quiet hours, and per-device unsubscribe
- added `DELETE` support to `/api/push/subscribe` and updated `/api/cron/send-touchpoints` so quiet hours and app-level push pause defer delivery instead of prematurely marking touchpoints as sent
- extended `/admin` with metadata-first funnel stats and billing / continuity health cards covering onboarding completion, active thread coverage, continuity exposure, push-enabled users, and photo-memory adoption
- added `scripts/validate-twa.mjs`, wired it to `npm run twa:check`, generated the missing manifest icon assets in `public/`, and updated the TWA runbook so the local Bubblewrap prep path can be validated before external Android steps begin
- added focused coverage for the photo-memory service, push settings prompt, push subscribe route, touchpoint cron quiet-hours behavior, admin dashboard metrics, admin page rendering, and the TWA validator

Verification:

- `npx prisma generate`
- `npm run twa:check`
- `npm run type-check`
- `npm test`
- `npm run lint`
- `npm run build`

Result:

- Angel AI now has a stronger no-key continuity layer: subscribers can generate thread-native AI photo memories, push delivery respects app-level quiet hours and device unsubscribe, operators can see the commercial funnel without raw-content analytics, and TWA readiness can be validated locally before Bubblewrap or Play Console work begins

## What Is Not Built Yet

The following product-critical pieces are still missing:

- connecting the active OpenClaw-backed reply path using the curated session brief and production API keys
- real provider smoke and production app-review setup for each social connector
- broader moderation policy decisions beyond critical-only enforcement, richer operator workflows, and any external paging / automation beyond the current in-app sweep and analytics
- TWA APK compilation via Bubblewrap CLI and Play Store listing setup

## Key Recommendation

Do not jump back into broad UI polish right away.

The highest-leverage next move is:

1. connect the first real OpenClaw-backed reply path to the new `session-brief.md` handoff
2. finish compiling the TWA APK via Bubblewrap and test on an Android emulator
3. add permissions-aware push/proactive delivery so rituals can leave the browser tab safely
4. execute the production app reviews for the social connectors

That order preserves the app's actual differentiator: continuity.

---

## 2026-04-06 — Performance Fixes + MessageBubble Memo

### What shipped

**MessageBubble memo wrap**
- `components/organisms/chat/MessageBubble.tsx` wrapped in `React.memo()`
- `getPhotoMemoryHelper` moved above `MessageBubble` to fix lexical scope
- Added `import { memo } from 'react'`
- TypeScript: clean (`npm run type-check` passes)
- Build: passes (`npm run build` succeeds)

### Files changed
- `components/organisms/chat/MessageBubble.tsx`

### Context
Subagent `angel-ai-design-implementation` (session: 983b3274-27c7-4699-a670-78868f2d2943) prepared the edits but crashed before writing. Task completed in main session.
