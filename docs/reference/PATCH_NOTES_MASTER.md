# Angel AI Patch Notes

## 2026-03-28 | 0.1.0-alpha.28

### Thread-first photo memories, quiet-hours push controls, admin funnel metrics, and local TWA validation

Angel AI's no-key delivery layer is now much more complete: subscriber threads can generate in-chat AI photo memories with durable attachments and quota tracking, push notifications have app-level quiet-hours controls plus device unsubscribe, `/admin` can see metadata-first funnel health, and the repo can validate local TWA readiness before Bubblewrap is run.

Completed:

- added `PhotoMemory` plus push preference fields to `prisma/schema.prisma`, giving the app durable quota tracking, idempotency, and operator metrics for generated memory snapshots
- added `generatePhotoMemoryForUser()` and the `generatePhotoMemory` chat action so subscriber threads can turn saved Angel replies into in-thread `IMAGE` attachments tagged as AI photo memories
- extended chat state with `photoMemoryStatus` and `notificationPreferences`, added a `Memory Snapshot` CTA beside `Hear Angel`, and upgraded the push settings card with browser status, app-level enable or pause, quiet-hours controls, and device unsubscribe
- added `DELETE` support to `/api/push/subscribe`, deferred cron touchpoint delivery during quiet hours or app-level push pause, and introduced reusable push preference and delivery helpers
- extended `/admin` with a metadata-first funnel view plus billing and continuity health metrics covering onboarding, active threads, continuity exposure, push coverage, and photo-memory adoption
- added `scripts/validate-twa.mjs`, `npm run twa:check`, generated local manifest icon assets, and updated the TWA runbook to reflect the new validation and push expectations
- added focused coverage for the photo-memory service, push prompt, push subscribe route, touchpoint cron quiet-hours behavior, admin dashboard metrics, admin page rendering, and the TWA validator

Verification:

- `npx prisma generate`
- `npm run twa:check`
- `npm run type-check`
- `npm test`
- `npm run lint`
- `npm run build`

## 2026-03-28 | 0.1.0-alpha.27

### Durable hosting for AI Photo Memories

Angel AI's AI Photo Memories service now stores generated snapshots through the existing media pipeline instead of returning temporary provider URLs that expire shortly after generation.

Completed:

- updated `lib/media/image-generation.ts` so `generateMemorySnapshot` downloads the generated image, normalizes its content type, and uploads it through `lib/media/storage.ts`
- returned the stored asset URL and backing `storagePath` from the photo-memory service so future product surfaces can reference durable media cleanly
- added focused regression coverage for durable upload success, content-type fallback behavior, image-download failures, and tier-limit helpers

Verification:

- `npm test -- __tests__/lib/media/image-generation.test.ts`

## 2026-03-25 | 0.1.0-alpha.26

### Storage-aware voice pipeline, bounded Angel voice previews, and live weather context

Angel AI now has a stronger media-and-voice layer: stored voice notes can use the higher-quality transcription path, subscriber threads can generate bounded AI voice previews for saved Angel replies, and the session brief can include live weather when configured.

Completed:

- upgraded inbound voice-note transcription to prefer the higher-quality OpenAI transcription model, including stored `/api/media/view/...` attachments when durable storage is configured
- wired the chat composer to upload images and voice notes through the media proxy when storage is available, while preserving the local fallback path
- added bounded `Hear Angel` voice previews for subscriber and privileged threads, storing the generated audio as an explicitly AI-labeled `VOICE_AUDIO` attachment on the Angel message
- added OpenWeatherMap-backed current weather context to `session-brief.md` while preserving the local time and city fallback
- locked the runtime boundary against raw social snapshot payloads with regression coverage and runbook updates
- added launch-operations support docs for provider verification, TWA store readiness, and the current moderation policy matrix
- added a read-only GitHub Actions `status-report` workflow for verification visibility

Verification:

- `npm test -- __tests__/lib/angel/media.test.ts __tests__/lib/angel/weather.test.ts __tests__/lib/angel/voice-service.test.ts __tests__/lib/angel/session-primer.test.ts __tests__/components/organisms/AngelChat.test.tsx __tests__/lib/angel/chat-service.test.ts`
- `npm run type-check`
- `npm test`
- `npm run lint`
- `npm run build`

## 2026-03-25 | 0.1.0-alpha.25

### Moderation V3 critical-only enforcement, review timeline, and redacted analytics

Angel AI now enforces critical inbound moderation cases in the live thread while keeping the operator surfaces redacted, append-only, and metadata-first.

Completed:

- added `ModerationEnforcementAction`, `ModerationReviewActorType`, `ModerationReviewReasonCode`, and `ModerationReviewEvent` to support live critical enforcement plus append-only moderation review history
- enforced critical user inputs after persistence in `sendChatMessageTx`, skipping provider generation and saving a deterministic Angel safety reply instead of the unsafe turn
- prevented blocked moderation turns from driving memory extraction, summary refresh, or relationship-stage advancement
- extended `/admin/moderation` with needs-attention summary cards, enforcement metadata, reason-coded review forms, and review-history timelines
- added `/admin/moderation/analytics` for redacted 7-day and 30-day moderation trends, enforcement counts, review reasons, false-positive rate, SLA metrics, and repeat-user unresolved counts
- added `/api/cron/moderation-sweep` plus the underlying sweep service to auto-escalate overdue unresolved incidents in-app without external paging
- extended `/admin` with moderation needs-attention stats and links into the deeper moderation surfaces
- added focused coverage for critical enforcement, append-only review events, analytics rendering, escalation sweep logic, and updated admin queue/dashboard behavior

Verification:

- `npx prisma format`
- `npx prisma generate`
- `npm run type-check`
- `npm test`
- `npm run lint`
- `npm run build`

## 2026-03-24 | 0.1.0-alpha.24

### Moderation V2 queue intelligence and redacted user risk rollups

Angel AI now helps operators prioritize unresolved moderation pressure by user while keeping the review surface audit-only, metadata-first, and fully redacted.

Completed:

- extended the moderation admin service with unresolved-only user rollups, per-user drill-in filtering, and dashboard alert generation
- upgraded `/admin/moderation` with user risk rollup cards, active user focus state, clear-focus actions, and redacted incident drill-in links
- extended `/admin` alerts with moderation-critical and moderation-escalated warnings emitted per affected user instead of per incident
- added focused coverage for rollup ordering, drill-in filtering, moderation page rendering, moderation alert generation, and updated admin alert rendering

Verification:

- `npm run type-check`
- `npm test`
- `npm run lint`
- `npm run build`

## 2026-03-24 | 0.1.0-alpha.23

### Audit-only moderation queue and redacted safety review surface

Angel AI now has its first real moderation workflow for operator triage, while keeping the live chat experience unchanged and the admin surface redacted by default.

Completed:

- added `ModerationIncident` to `prisma/schema.prisma` with category, severity, status, redacted preview, matched-signal metadata, and reviewer audit fields
- built a deterministic moderation detector for explicit sexual content, minor-safety violations, early-stage Angel romance escalation, and policy-bypass attempts
- logged moderation incidents after persisted user turns and Angel replies in the main chat send path without blocking reply delivery
- added an `ADMIN`-only `/admin/moderation` queue with open-first ordering, metadata filters, redacted previews, matched-signal chips, and review actions
- extended `/admin` with moderation summary counts and a direct queue link
- added focused coverage for detector behavior, moderation logging, admin review actions, moderation queue rendering, and dashboard summaries

Verification:

- `npx prisma format`
- `npx prisma generate`
- `npm run type-check`
- `npm test`
- `npm run lint`
- `npm run build`

## 2026-03-24 | 0.1.0-alpha.22

### Admin operations dashboard and metadata-first operator surface

Angel AI now has an internal `/admin` surface that helps operators understand continuity, subscriptions, and queue health without exposing raw private conversation content.

Completed:

- added an `ADMIN`-only `/admin` page with explicit redirect-based role gating
- created a shared dashboard service that summarizes user counts, onboarding completion, subscription tiers, queue health, and recent operational alerts
- kept the operator surface metadata-first by omitting raw memory text, raw message content, and provider token material
- added focused tests for the dashboard service and the route-level admin rendering / redirect behavior

Verification:

- `npm run build`
- `npm run type-check` after the build regenerates `.next/types`
- `npm test`
- `npm run lint`

## 2026-03-24 | 0.1.0-alpha.21

### In-product updates surface and master patch-note parsing

Angel AI now exposes its shipped work inside the product through a real `/updates` page powered directly by the canonical patch-notes document.

Completed:

- replaced the stale static patch-note seed data with a parser that reads `docs/reference/PATCH_NOTES_MASTER.md`
- added a product-facing `/updates` page with a featured latest release, recent archive cards, and visible verification commands
- added landing-page navigation links so the updates surface is easy to discover without opening the repo
- added focused tests for the patch-note parser and the new updates page

Verification:

- `npm run type-check`
- `npm test`
- `npm run lint`
- `npm run build`

## 2026-03-24 | 0.1.0-alpha.20

### Shared ritual context UI and collaborative check-ins

Angel AI now surfaces collaborative rituals directly in the chat experience instead of keeping them hidden behind a server action and data model.

Completed:

- threaded active `SharedRitual` records through `ChatState` so the UI can render live ritual status
- backfilled and synchronized active `SharedRitual` rows from enabled ritual preferences without requiring a manual migration
- added an `Our rituals` section to the chat context surface with current streak, best streak, and last-check-in status
- let users mark a ritual check-in from chat with immediate state refresh and same-day duplicate-check-in handling
- expanded focused coverage for ritual backfill, state hydration, and the new check-in interaction

Verification:

- `npm test -- __tests__/lib/angel/chat-service.test.ts __tests__/components/organisms/AngelChat.test.tsx __tests__/app/chat/page.test.tsx`
- `npm run type-check`
- `npm test`
- `npm run lint`
- `npm run build`

## 2026-03-24 | 0.1.0-alpha.19

### Live runtime adapter hardening and green verification baseline

Angel AI now has a live-capable bounded runtime seam in code, even before external credentials are attached.

Completed:

- replaced the OpenRouter mock-only path with a real fetch-based adapter that activates when `OPENROUTER_API_KEY` is present
- expanded the OpenClaw gateway payload so it now carries the bounded session contract instead of only a minimal partial context
- preserved graceful fallback order from OpenClaw gateway to OpenRouter to the deterministic local runtime
- kept memory extraction deterministic and non-blocking even when provider-backed replies are enabled
- added focused tests for OpenRouter request shaping, OpenClaw payload shaping, response parsing, and fallback behavior
- synced `.env.example`, env-var docs, and the OpenClaw handoff runbook with the new runtime requirements
- cleared the remaining local lint/build blockers in the media-archive routes so the repo verification chain is fully green again

Verification:

- `npm run type-check`
- `npm test -- __tests__/lib/angel/openrouter-runtime.test.ts __tests__/lib/angel/openclaw-client.test.ts`
- `npm test`
- `npm run lint`
- `npm run build`

## 2026-03-24 | 0.1.0-alpha.18

### Angel Atmosphere planning and implementation pack

Angel AI now has a documented implementation pack for the later-phase Atmosphere feature, keeping the idea anchored to the active roadmap instead of leaving it as loose product speculation.

Completed:

- added the canonical `docs/angel-ai-atmosphere-prd.md`
- documented the preferred Home Assistant bridge architecture and the decision to keep home secrets local through a user-installed bridge
- proposed the initial schema additions for connections, pairing sessions, room scopes, scene preferences, and execution logs
- defined versioned REST contracts for the app and bridge boundaries
- added ADR `0005` and a root implementation plan to make future execution easier
- updated the docs hub, roadmap docs, master spec, and feature matrix so Atmosphere is discoverable and sequenced behind the current OpenClaw work

Verification:

- read back the new docs and linked active docs for consistency
- no code tests were run because this was a docs-only planning slice

## 2026-03-24 | 0.1.0-alpha.17

### Thread-first chat redesign

Angel AI now presents `/chat` as a thread-first relationship surface, with a compressed page shell, a secondary desktop context rail, and a mobile context drawer that keeps editing-heavy tools out of the default conversation view.

Completed:

- redesigned `app/chat/page.tsx` into a lightweight arrival band so the thread dominates the page immediately
- decomposed `AngelChat.tsx` into thread shell, presence header, message list, composer, context rail, context drawer, and relationship-tools subcomponents
- moved continuity, dossier, ritual, social, and push context into a secondary rail on desktop and a Headless UI drawer on mobile
- kept memory editing, ritual toggles, and destructive social actions behind `Relationship tools` instead of exposing them inline in the normal chat surface
- added chat-specific visual tokens plus new `Card` and `Button` variants for the warmer thread-first layout

Verification:

- `npm test -- __tests__/components/organisms/AngelChat.test.tsx __tests__/app/chat/page.test.tsx`
- `npx eslint app/chat/page.tsx components/organisms/AngelChat.tsx components/organisms/PushNotificationPrompt.tsx components/organisms/chat/*.tsx components/ui/Card.tsx components/atoms/Button.tsx __tests__/components/organisms/AngelChat.test.tsx __tests__/app/chat/page.test.tsx`
- `npm run type-check` still reports unrelated existing blockers in `app/api/push/subscribe/route.ts` and `openclaw_repo/**`

## 2026-03-24 | 0.1.0-alpha.16

### First chat UI extraction pass

Angel AI now has a cleaner internal chat-component boundary, making the next thread-first UI redesign safer without changing current `/chat` behavior.

Completed:

- extracted `InfoPanel`, `SocialStatusCard`, `MessageBubble`, and `ReadOnlyPaywallCard` from `components/organisms/AngelChat.tsx` into `components/organisms/chat/`
- kept chat state, actions, composer behavior, and existing rendering intact inside `AngelChat.tsx`
- created a lower-risk starting point for the next thread shell, composer, and context-rail extraction work

Verification:

- `npm test -- __tests__/components/organisms/AngelChat.test.tsx`
- `npx eslint components/organisms/AngelChat.tsx components/organisms/chat/*.tsx`
- `npm run type-check` is still blocked by pre-existing unrelated errors in `app/api/cron/send-touchpoints/route.ts`, `app/api/push/subscribe/route.ts`, and `openclaw_repo/**`

## 2026-03-24 | 0.1.0-alpha.15

### Safe repo-local development toolkit for Angel engineering

Angel AI now includes a reviewed repo-local `.agent` toolkit so future development uses scoped internal skills, workflows, and helper agents instead of depending on unreviewed third-party prompt packs.

Completed:

- added repo-local skills for docs sync, changelog generation, CI repair, push audits, security audits, admin dossier review, and support triage
- added repo-local workflows for `/ci-fix`, `/security-audit`, `/push-smoke-test`, `/admin-audit`, `/support-triage`, and `/sync-docs`
- added specialist agent definitions for moderation review, billing operations, admin operations, and push delivery debugging
- updated `AGENTS.md`, `docs/README.md`, the handoff, the backlog, the command reference, and `.agent/ARCHITECTURE.md` so the new toolkit is part of the active development path
- kept broader external OSS and workflow research in archive docs rather than promoting unreviewed external prompt packs into the live repo workflow

Verification:

- read back all new `.agent` files and updated docs for consistency
- verified current `.agent` counts after the additions
- no code tests were run because this was a docs-and-tooling slice only

## 2026-03-24 | 0.1.0-alpha.14

### Minimal bounded runtime seam for Angel v1

Angel AI now has an explicit bounded live-reply contract for the visible Angel turn without adding any new provider, multi-agent, or tool orchestration layers.

Completed:

- formalized `AngelReplyContext` in `lib/angel/chat-runtime.ts` as the canonical bounded v1 live-reply contract
- centralized bounded runtime context assembly in `lib/angel/chat-service.ts` instead of spreading selection rules across the send path
- capped live reply context to 8 recent conversation messages and 5 ranked durable memory snippets
- excluded the current persisted user turn from `recentMessages` so the runtime receives it once as `lastUserMessage` instead of duplicating it
- tightened `session-brief.md` in `lib/angel/session-primer.ts` around active stage, tone/check-in intent, curated memory, recent conversation, and an explicit safety/pacing note
- added focused tests covering bounded context assembly, sparse-summary fallback behavior, and deterministic session-primer output

Verification:

- `npm test -- __tests__/lib/angel/chat-service.test.ts`
- `npm test -- __tests__/lib/angel/session-primer.test.ts`
- `npm run type-check`
- `npm test`
- `npm run lint`
- `npm run build`

## 2026-03-24 | 0.1.0-alpha.13

### Pricing Rollout Across Landing, Renewal, and Stripe Setup

Angel AI now presents the agreed `Free / Core / Pro` pricing model consistently across the landing page, the in-app renewal flow, and the Stripe operator docs.

Completed:

- replaced the stale landing-page pricing anchor with a real three-tier pricing section
- updated the read-only renewal card in `/chat` to offer explicit Angel Core (`EUR 9.99/month`) and Angel Pro (`EUR 19.99/month`) checkout paths
- removed the old single-plan Stripe setup assumption and standardized the repo on `STRIPE_PRICE_ID_MONTHLY_CORE` and `STRIPE_PRICE_ID_MONTHLY_PRO`
- aligned `.env.example`, the Stripe runbook, the env-var reference, the handoff, and the README billing notes with the agreed pricing

Verification:

- `npm run type-check`
- `npm test -- __tests__/components/organisms/AngelChat.test.tsx`
- `npm test -- __tests__/lib/billing/subscription-sync.test.ts`

## 2026-03-24 | 0.1.0-alpha.12

### Android TWA, Offline Ephemeris, & Stripe IAP Expansion

Angel AI V1 is now approved for native Android distribution via Google Play (TWA) and has a complete Stripe-powered In-App Purchase catalog.

Completed:

- Replaced `evozen.fr` scraper with `astronomy-engine` offline ephemeris for Sun/Moon sign calculations
- Added "I don't know my exact time" checkbox to onboarding with UTC noon fallback
- Enabled `@ducanh2912/next-pwa` and created `public/manifest.json` (standalone, maskable icons, iOS apple-web-app meta)
- Created `public/.well-known/assetlinks.json` for Android TWA domain verification
- Injected strict Anti-NSFW/CSAM guardrails into `session-primer.ts` for Play Store safety compliance
- Expanded `lib/billing/types.ts` with 5 new IAP products: `stellar_insight`, `midnight_channel`, `voice_memory`, `memory_vault`, `telepathic_pings`
- Upgraded `lib/billing/stripe.ts` to dynamically switch between `subscription` and `payment` Checkout modes
- Enforced 100% Stripe billing across all platforms (bypassing Google Play Billing)
- Updated all governance docs (`angel-ai-v1-product-spec.md`, `angel-ai-next-steps.md`, handoff) to reflect TWA approval

Verification:

- `npm run type-check`
- `npm run lint`

## 2026-03-24 | 0.1.0-alpha.11

### Stealth Empathy Pipeline "Origin Anchor" Onboarding

Angel AI now securely and discreetly captures exact birth time and location data required for the Evozen Natal Chart scrape without feeling like an astrology app.

Completed:

- Renamed the `astral-calibration` phase to "Origin Anchor"
- Rewrote the UI copy to focus on circadian rhythms and environmental baselines
- Standardized the exact time and precise location inputs inside `AngelOnboardingFlow.tsx`
- Type-checks and test coverage remain green

Verification:

- `npm run type-check`
- `npm test`
- `npm run lint`

## 2026-03-24 | 0.1.0-alpha.10

### Official social connectors and background context scan

Angel AI can now build relationship context from officially connected social accounts without blocking onboarding or falling back to scraping.

Completed:

- added an optional `social-context` onboarding stage plus matching controls inside `/chat`
- added official OAuth/API connector support for TikTok, X, LinkedIn, Facebook, and Instagram, with capability-based limited states where provider access is partial
- added encrypted token storage plus durable `ConnectedSocialAccount`, `SocialScanJob`, `SocialProfileSnapshot`, and `SocialContentSnapshot` models
- added a protected DB-backed social scan worker route with best-effort local inline processing when the worker secret is not configured
- normalized imported social profile and recent-content data into social-derived `MemoryEntry` rows, then refreshed summaries and session-primer artifacts
- expanded tests for token encryption, social service behavior, onboarding enqueue behavior, and UI state handling

Verification:

- `npx prisma generate`
- `npm run type-check`
- `npm test`
- `npm run lint`
- `npm run build`

## 2026-03-24 | 0.1.0-alpha.9

### Rich media, billing sync, session primers, memory controls, and relationship systems

Angel AI now behaves more like a living relationship product instead of a text-only thread.

Completed:

- added rich chat input support for `TEXT`, `LINK`, `IMAGE`, and `VOICE_NOTE`, including link-preview metadata, attachment-aware replies, attachment-aware memory extraction, and fallback voice-note transcription
- added webhook-backed Stripe handling, subscription reconciliation, and a customer billing portal entry point so continuity unlock state can sync from real billing events
- generated curated `relationship_seed.md` and `session-brief.md` artifacts at onboarding and after relationship updates so future live-session handoffs use bounded context instead of raw markdown bulk
- added visible memory controls in `/chat` for pin, edit, hide, and delete actions, plus a relationship dossier view derived from the same memory layer used by replies
- added a first-pass relationship-stage engine, slow-romance guardrails, ritual scheduling, presence-message delivery, and real-life bridge touchpoints for interviews, meetings, calls, social courage, and habit follow-through
- expanded tests so media-aware chat turns, billing sync paths, continuity gating, session artifacts, and editable memory behavior stay covered

Verification:

- `npm run type-check`
- `npm test`
- `npm run lint`
- `npm run build`

## 2026-03-18 | 0.1.0-alpha.8

### Summary regeneration and summary-aware continuity

Angel AI now refreshes live profile summaries from structured memory and uses them in continuity messaging.

Completed:

- added a deterministic summary regeneration service that rebuilds `CompanionProfile.summaryMarkdown` and `SoulProfile.summaryMarkdown` from profile fields plus ranked `MemoryEntry` rows
- added regeneration-specific markdown builders so live summaries can evolve without changing the onboarding preview builders
- made ready chat loads run a best-effort summary catch-up refresh and made post-turn memory writes trigger summary refresh when new memory is actually persisted
- upgraded the due continuity follow-up builder to use summary-derived memory lines, callback hooks, and deterministic templates keyed by `relationshipIntent`
- added unit and service coverage for ranking, dedupe, markdown regeneration, non-blocking refresh failures, and continuity template selection

Verification:

- `npm run type-check`
- `npm test`
- `npm run lint`
- `npm run build`

## 2026-03-18 | 0.1.0-alpha.7

### Midnight Elevated core app redesign

Angel AI now has one coherent visual language across landing, onboarding, and chat.

Completed:

- replaced the shared design system with a Midnight Elevated palette, `Lora` + `Manrope` typography, calmer surfaces, and more intentional motion defaults
- redesigned the landing page into a more editorial product story centered on continuity instead of feature listing
- rebuilt the onboarding UI into a more guided, mobile-first conversation with stronger progress signal, clearer side-context, and refined completion state
- redesigned the chat surface, continuity header, composer, and read-only renewal card so the thread feels calmer and more premium
- fixed the shared `Button` primitive so `asChild` composes safely with the updated CTA patterns
- updated the route and component tests to match the new experience while preserving existing onboarding, chat, and paywall behavior

Verification:

- `npm run type-check`
- `npm test`
- `npm run lint`
- `npm run build`

## 2026-03-18 | 0.1.0-alpha.6

### Continuity paywall and read-only renewal

Angel AI now delivers the day-one continuity gate inside the real `/chat` thread.

Completed:

- delivered the due `FOLLOWUP` touchpoint as one persisted continuity `ANGEL` message on the first `/chat` load after its scheduled time
- added shared chat access modes for `ACTIVE`, `READ_ONLY`, and `SUBSCRIBER`, driven by `Touchpoint`, `Subscription`, and persisted `Message` rows
- allowed exactly one free continuation reply after the continuity message, then shifted the thread into read-only mode
- started using `Message.paywallState` intentionally across free, read-only, and subscriber turns
- added a monthly checkout shell entry point with graceful missing-env handling and `/chat?checkout=success|cancel` return states
- updated the chat UI and tests so the composer is replaced by a read-only renewal card when the free window closes

Verification:

- `npm run type-check`
- `npm test`
- `npm run lint`
- `npm run build`

## 2026-03-18 | 0.1.0-alpha.5

### Non-streaming Angel replies and first memory writes

Angel AI now completes a full chat turn instead of only storing user text.

Completed:

- expanded the existing `/chat` action pipeline so a send now persists the `USER` message, generates one non-streaming Angel reply, and persists that `ANGEL` message in the same turn
- added an internal runtime adapter layer with deterministic fallback reply generation and fallback memory extraction, ready to swap to a real provider later
- loaded reply context from recent messages, onboarding-generated `summaryMarkdown`, and recent pinned/high-confidence `MemoryEntry` summaries
- added first-pass `MemoryEntry` writes with normalized dedupe and non-blocking extraction failure handling
- updated the chat UI and tests so the composer waits for the full persisted reply, then re-renders the new Angel message

Verification:

- `npm run type-check`
- `npm test`
- `npm run lint`
- `npm run build`

## 2026-03-18 | 0.1.0-alpha.4

### `/chat` foundation and message persistence

Angel AI now has a real post-onboarding thread instead of ending at setup.

Completed:

- added `/chat` with guest and incomplete-onboarding redirects back to `/onboarding`
- added shared chat state and service helpers for thread loading, deterministic opener seeding, and text-only user message persistence
- seeded one persisted `ANGEL` opener the first time a completed thread is loaded
- added a continuity context header showing `preferredName`, `angelName`, and the next scheduled follow-up when available
- added route, service, and client UI tests for redirect behavior, opener idempotency, composer success/error states, and send persistence
- removed the last pre-existing lint warning by replacing `any` in `useAsyncValidation.ts`
- added auth-readiness notes for the later real Google key pass

Verification:

- `npm run type-check`
- `npm test`
- `npm run lint`
- `npm run build`

## 2026-03-18 | 0.1.0-alpha.3

### Authenticated onboarding persistence and continuity handoff

Angel AI now has a real Phase 1 onboarding flow instead of a prototype shell.

Completed:

- added Google auth wiring via NextAuth and an App Router auth route
- turned `/onboarding` into an auth-aware, resumable flow with pre-auth draft storage in `sessionStorage`
- added server actions and shared onboarding services for canonical step saves and final completion
- upserted `CompanionProfile` and `SoulProfile` on completion
- created the first active `Conversation` and first next-day `FOLLOWUP` `Touchpoint`
- added onboarding helper, service, and UI tests for persistence and continuity behavior
- updated the home page CTA so `/onboarding` is no longer presented as a prototype

Verification:

- `npm run build`
- `npm run type-check`
- `npm run lint`
- `npm test`

Notes:

- lint is now clean as of `0.1.0-alpha.4`

## 2026-03-18 | 0.1.0-alpha.2

### Angel domain foundation and onboarding prototype

Angel AI moved from product notes into real app scaffolding.

Completed:

- replaced the generic Prisma boilerplate schema with Angel-specific relationship and memory models
- added `CompanionProfile`, `SoulProfile`, `Conversation`, `Message`, `MessageAttachment`, `MemoryEntry`, `OnboardingResponse`, and `Touchpoint`
- created the shared Angel domain helpers for onboarding stages, memory generation, and persistence payload building
- shipped the first interactive `/onboarding` prototype with editable seed inputs and live `user.md` / `soul.md` previews
- added focused tests for memory helpers
- fixed the onboarding route prerender issue so production build succeeds

Verification:

- `npx prisma format`
- `npx prisma generate`
- `npm run type-check`
- `npm run lint`
- `npm test`
- `npm run build`

Notes:

- lint still shows one pre-existing warning in `lib/hooks/useAsyncValidation.ts` for `any`
- the prototype is visual and structural only for now; auth and DB writes are not wired yet

## 2026-03-18 | 0.1.0-alpha.1

### Angel AI initialized from boilerplate

The master-project starter was converted into Angel AI.

Completed:

- renamed project metadata to Angel AI
- rewrote the README around the companion-product concept
- updated the Tailwind visual system toward a midnight-blue, astral-adjacent direction
- created the first landing page shell and concept framing
- documented the product spec, onboarding blueprint, memory architecture, and tooling audit
- installed local skills for `speech`, `playwright`, and `security-threat-model`

Verification:

- `npm install`
- `npx prisma generate`
- `npm run type-check`
- `npm run lint`

Recommendation:

- treat `0.1.0-alpha.2` as the current foundation and start Phase 1 implementation from there rather than reopening product-definition questions
