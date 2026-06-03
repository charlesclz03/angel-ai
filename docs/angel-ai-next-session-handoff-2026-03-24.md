# Angel AI Next Session Handoff

Purpose:

- tell the next coding session exactly where to start and what to do next

Audience:

- coding agents
- maintainers

Status:

- active

Source of truth scope:

- immediate execution brief

Last updated:

- 2026-03-28

Related docs:

- `docs/README.md`
- `docs/angel-ai-progress-log.md`
- `docs/angel-ai-next-steps.md`
- `docs/angel-ai-next-phases.md`
- `docs/archive/research/angel-ai-improvement-report-2026-03-24.md`
- `docs/archive/research/angel-ai-safe-oss-skills-workflows-report-2026-03-24.md`
- `docs/angel-ai-recordings-index-2026-03-24.md`
- `docs/angel-ai-atmosphere-prd.md`

Snapshot date: 2026-03-28

## Start Here

If the next session needs the current truth quickly, read these in order:

1. `docs/angel-ai-progress-log.md`
2. `docs/angel-ai-next-steps.md`
3. `docs/angel-ai-next-phases.md`
4. `docs/archive/research/angel-ai-improvement-report-2026-03-24.md`
5. `docs/angel-ai-recordings-index-2026-03-24.md`

The first four are current planning docs.
The recordings index points to archival context only.

## Current Verified State

Repo-wide verification passed on 2026-03-28 with:

- `npx prisma generate`
- `npm run twa:check`
- `npm run type-check`
- `npm test`
- `npm run lint`
- `npm run build`

Focused runtime-adapter coverage also passed with:

- `npm test -- __tests__/lib/angel/openrouter-runtime.test.ts __tests__/lib/angel/openclaw-client.test.ts`

Current product foundations already shipped:

- authenticated onboarding persistence
- persistent `/chat` thread
- non-streaming Angel replies
- continuity paywall and read-only renewal
- summary regeneration
- link, image, and inbound voice-note inputs
- high-quality provider-backed voice-note transcription when configured
- bounded Angel voice previews for subscriber and privileged threads
- thread-first AI Photo Memories with durable `IMAGE` attachments, structured quota tracking, and graceful local-dev fallback when `OPENAI_API_KEY` is absent
- official social connectors with background scan state, normalized snapshots, and social-derived memory
- webhook-backed billing sync and billing portal entry
- curated `relationship_seed.md` and `session-brief.md`
- editable memory controls and relationship dossier
- relationship stages, rituals, and bridge touchpoints
- shared ritual context UI with collaborative streak check-ins
- subscriber-facing push settings with browser status, app-level enable or pause, quiet hours, and device unsubscribe
- product-facing `/updates` release trail backed by the master patch-notes document
- `ADMIN`-only metadata dashboard for continuity, subscription, queue health, funnel visibility, and billing / continuity health
- `ADMIN`-only moderation system with redacted previews, critical-only live enforcement, unresolved user rollups, append-only review history, in-app escalation sweep automation, and moderation analytics
- read-only GitHub Actions status-report workflow for verification visibility
- offline ephemeris engine (`astronomy-engine`) replacing the `evozen.fr` scraper
- "I don't know my exact time" onboarding fallback (UTC noon default)
- `@ducanh2912/next-pwa` enabled with `public/manifest.json` (standalone, maskable icons, iOS apple-web-app)
- `.well-known/assetlinks.json` for Android TWA domain verification
- `npm run twa:check` local validation covering manifest, icons, service worker presence, and asset-links structure before Bubblewrap
- strict Anti-NSFW/CSAM guardrails in `session-primer.ts`
- 5 Stripe IAP products (`stellar_insight`, `midnight_channel`, `voice_memory`, `memory_vault`, `telepathic_pings`) with dynamic subscription/payment mode routing
- 100% Stripe billing enforced across all platforms

## Most Important Next Build

### OpenClaw Live Handoff & Stealth Empathy Pipeline

This is the next active implementation target. The bounded runtime seam is wired in code, and the next step is verifying the real provider-backed path end to end.

**COMPLETED this session:**

- Durable Media Storage via Supabase (secure upload proxies, 30-day archival touchpoints, and ZIP export).
- Fixed the previous `openclaw_repo/**` TS compilation pollution by excluding it, resulting in a zero-error clean `npm run type-check`.
- Android TWA prep (auth token logic, `assetlinks.json`, `build-twa.md` Bubblewrap manual).
- Injected `<PWAInstallNudge />` targeting iOS users to capture out-of-browser retention before push implementations.
- Created fully covered, offline OpenClaw mock engine (`openrouter-runtime.ts`) capable of validating structured input limits without exhausting token budgets.
- Authored production runbooks for Social scope review URIs and Stripe Billing Statements.
- **Web Push Notifications**: Generated VAPID keys, injected native Service Worker `push/notificationclick` handlers, and verified the server-side Touchpoint cron delivery pipeline.
- **AI Photo Memories**: Created `lib/media/image-generation.ts` with DALL-E 3 integration and tier-based quotas (Core: 2/mo, Pro: 15/mo). Updated Master Spec pricing.
- **AI Photo Memory Durability**: Hardened `lib/media/image-generation.ts` so generated snapshots are downloaded and re-stored through Angel's media pipeline, avoiding expiring provider URLs when the feature is invoked later.
- **Thread-first AI Photo Memories**: Added `PhotoMemory` persistence, a `Memory Snapshot` CTA beside `Hear Angel`, durable in-thread generated image attachments on saved Angel replies, and chat-state quota/status metadata for graceful local-dev and quota-exhausted UI states.
- **Environmental Awareness**: Added `city`/`countryCode` fields to `CompanionProfile` and injected `buildEnvironmentalContext()` into `session-primer.ts` for local time and city awareness.
- **Voice And Weather Hardening**: Upgraded voice-note transcription to the higher-quality OpenAI path, added bounded `Hear Angel` AI voice previews on saved Angel replies, wired storage-aware media uploads in chat, and added OpenWeatherMap-backed current weather to the bounded session brief.
- **Collaborative Rituals**: Added `SharedRitual` Prisma model with streak tracking, `SharedRitualStatus` enum, `logRitualCheckIn` server action, ritual backfill from enabled preferences, and an `Our rituals` chat-context UI with same-day check-in refresh.
- **Push Controls Hardening**: Added app-level push preference persistence, quiet-hours controls, device unsubscribe support, and quiet-hours-aware cron deferral so due touchpoints stay scheduled until delivery is eligible.
- **Patch Notes Surface**: Replaced the stale static patch-note seed with parser-backed data from `docs/reference/PATCH_NOTES_MASTER.md`, added the product-facing `/updates` page, and linked it from the landing page.
- **Admin Operations Surface**: Added an `ADMIN`-only `/admin` page and shared dashboard service for metadata-first user, subscription, continuity, and social-scan health review without exposing raw message or memory content.
- **Admin Funnel Metrics**: Extended `/admin` with metadata-first funnel checkpoints and billing / continuity health cards for onboarding completion, active thread coverage, continuity exposure, push-enabled users, and photo-memory adoption.
- **Moderation V3**: Added critical-only live enforcement for unsafe inbound user turns, append-only `ModerationReviewEvent` history, in-app escalation sweep automation, `/admin/moderation/analytics`, and richer redacted moderation controls across `/admin` and `/admin/moderation`.
- **Documentation Cleanup**: Renamed `angel-ai-v5-product-spec.md` to `angel-ai-product-spec-master.md`, archived V1-V4 specs to `docs/archive/specs/`, and added a critical version clarification header.
- **Atmosphere Planning Pack**: Added `docs/angel-ai-atmosphere-prd.md`, `docs/architecture/atmosphere-bridge-architecture.md`, `docs/architecture/atmosphere-data-model.md`, `docs/architecture/atmosphere-api-contracts.md`, ADR `0005`, and `angel-atmosphere-implementation-plan.md` to formalize the later-phase Home Assistant bridge path for lights-and-music rituals.
- **Live Runtime Adapter Hardening**: Replaced the OpenRouter mock-only path with a real fetch-based adapter, expanded the OpenClaw gateway payload to carry the bounded session contract, added focused adapter tests, and restored a fully green `type-check`/`test`/`lint`/`build` verification chain.
- **TWA Readiness Hardening**: Added `scripts/validate-twa.mjs`, wired `npm run twa:check`, generated the missing manifest icon assets in `public/`, and updated the TWA runbook so local installability issues can be caught before Bubblewrap or Play Console work.

**REMAINING:**

Goal:

- Attach real runtime credentials and smoke-test the now-wired bounded OpenClaw/OpenRouter live-reply path.
- Execute App Review for the 5 selected Meta/X/Link connectors.

Do next:

1. In Vercel or local env, attach the production `OPENROUTER_API_KEY` and, if needed, `OPENCLAW_GATEWAY_URL`, then run a live chat smoke through the bounded adapter path.
2. Compile the TWA APK via Bubblewrap CLI using the prepped `assetlinks.json` and upload to Google Play.
3. Run the production Social Connect verification sweeps.

Atmosphere note:

- the home-atmosphere work is now well documented, but it is intentionally not the next coding target; keep it behind the first live OpenClaw path and presence-hardening work.

## Key Files For The Next Session

Start code reading here:

- `lib/angel/chat-service.ts`
- `lib/angel/chat-runtime.ts`
- `lib/angel/openclaw-client.ts`
- `lib/angel/openrouter-runtime.ts`
- `lib/angel/session-primer.ts`
- `lib/angel/weather.ts`
- `lib/angel/summary-service.ts`
- `lib/angel/moderation.ts`
- `lib/angel/photo-memory-service.ts`
- `lib/angel/voice-service.ts`
- `lib/angel/relationship-service.ts`
- `lib/angel/memory-service.ts`
- `lib/admin/dashboard.ts`
- `lib/admin/moderation.ts`
- `lib/data/patch-notes.ts`
- `lib/push/preferences.ts`
- `lib/push/delivery.ts`
- `lib/social/service.ts`
- `lib/social/connectors.ts`
- `app/admin/actions.ts`
- `app/admin/moderation/page.tsx`
- `app/admin/moderation/analytics/page.tsx`
- `app/api/cron/moderation-sweep/route.ts`
- `app/api/cron/send-touchpoints/route.ts`
- `app/api/push/subscribe/route.ts`
- `app/chat/actions.ts`
- `app/social/actions.ts`
- `app/admin/page.tsx`
- `app/updates/page.tsx`
- `docs/runbooks/provider-verification-matrix.md`
- `docs/runbooks/twa-store-readiness.md`
- `docs/reference/moderation-policy-matrix.md`
- `components/organisms/AngelChat.tsx`
- `components/organisms/PushNotificationPrompt.tsx`
- `components/organisms/chat/ChatThreadShell.tsx`
- `components/organisms/chat/ChatPresenceHeader.tsx`
- `components/organisms/chat/ChatMessageList.tsx`
- `components/organisms/chat/ChatComposer.tsx`
- `components/organisms/chat/ChatContextRail.tsx`
- `components/organisms/chat/ChatContextDrawer.tsx`
- `components/organisms/chat/ChatRelationshipTools.tsx`
- `components/organisms/chat/InfoPanel.tsx`
- `components/organisms/chat/MessageBubble.tsx`
- `components/organisms/chat/ReadOnlyPaywallCard.tsx`
- `components/organisms/chat/SocialStatusCard.tsx`
- `scripts/validate-twa.mjs`
- `app/api/stripe/webhook/route.ts`

If touching onboarding handoff:

- `lib/angel/onboarding-service.ts`
- `lib/angel/onboarding-state.ts`

If the session needs repo-local helper tooling:

- `.agent/ARCHITECTURE.md`
- `.agent/workflows/ci-fix.md`
- `.agent/workflows/security-audit.md`
- `.agent/workflows/push-smoke-test.md`
- `.agent/workflows/admin-audit.md`
- `.agent/workflows/support-triage.md`
- `.agent/workflows/sync-docs.md`

If the session later picks up Atmosphere planning or implementation:

- `docs/angel-ai-atmosphere-prd.md`
- `docs/architecture/atmosphere-bridge-architecture.md`
- `docs/architecture/atmosphere-data-model.md`
- `docs/architecture/atmosphere-api-contracts.md`
- `docs/decisions/0005-atmosphere-bridge-through-home-assistant.md`
- `angel-atmosphere-implementation-plan.md`

## Environment Notes

Still needed for real external verification:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `DATABASE_URL`
- `DIRECT_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID_MONTHLY_CORE`
- `STRIPE_PRICE_ID_MONTHLY_PRO`
- `STRIPE_WEBHOOK_SECRET`
- `OPENROUTER_API_KEY`
- `OPENCLAW_GATEWAY_URL` (only if the default localhost gateway is not the right target)
- `OPENAI_API_KEY`

Also needed for real social-connector verification:

- `SOCIAL_TOKEN_ENCRYPTION_KEY`
- `SOCIAL_SCAN_WORKER_SECRET`
- `META_APP_ID`
- `META_APP_SECRET`
- `X_CLIENT_ID`
- `X_CLIENT_SECRET`
- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`
- `TIKTOK_CLIENT_KEY`
- `TIKTOK_CLIENT_SECRET`

Without `OPENAI_API_KEY`, voice-note transcription falls back to a deterministic local placeholder.
Without `OPENROUTER_API_KEY`, replies fall back to the deterministic local runtime.
Without `OPENCLAW_GATEWAY_URL`, the app defaults to `http://127.0.0.1:18789`.
Without the worker secret, local chat loads can inline-process one queued social scan for the current user.

## Recording / Context Notes

The recordings index in `docs/angel-ai-recordings-index-2026-03-24.md` points to the archival transcript material that is still valuable for:

- emotional tone
- product ambition
- "real friend" behavior expectations

It is not reliable for:

- implementation status
- roadmap ordering
- next coding steps

## Recommended Next Session Flow

1. load the current handoff docs
2. inspect the OpenClaw integration boundary, session-primer artifacts, and the new social-context ingestion path
3. run a real smoke through the bounded live reply path now that the adapters are wired
4. use the repo-local `.agent` workflows that match the task instead of ad-hoc process when CI, security, push, admin, support, or docs sync work appears
5. validate that curated social-derived memory and summaries are sufficient under live provider smoke, while keeping raw social snapshots out of the payload
6. add tests around session-primer handoff and context selection
7. verify that social-derived summaries and memory stay bounded in the live runtime
8. re-run full verification and `/sync-docs` before ending

## Remaining Important Work After OpenClaw

- broader moderation policy decisions beyond the current critical-only enforcement path, plus richer operator automation and escalation controls
- billing instrumentation / commercial analytics cleanup
