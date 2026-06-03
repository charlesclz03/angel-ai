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

- 2026-03-24

Related docs:

- `docs/README.md`
- `docs/angel-ai-progress-log.md`
- `docs/angel-ai-next-steps.md`
- `docs/angel-ai-next-phases.md`
- `docs/archive/research/angel-ai-improvement-report-2026-03-24.md`
- `docs/archive/research/angel-ai-safe-oss-skills-workflows-report-2026-03-24.md`
- `docs/angel-ai-recordings-index-2026-03-24.md`

Snapshot date: 2026-03-24

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

The repo currently verifies cleanly with:

- `npm run type-check`
- `npm test`
- `npm run lint`
- `npm run build`

Current product foundations already shipped:

- authenticated onboarding persistence
- persistent `/chat` thread
- non-streaming Angel replies
- continuity paywall and read-only renewal
- summary regeneration
- link, image, and inbound voice-note inputs
- official social connectors with background scan state, normalized snapshots, and social-derived memory
- webhook-backed billing sync and billing portal entry
- curated `relationship_seed.md` and `session-brief.md`
- editable memory controls and relationship dossier
- relationship stages, rituals, and bridge touchpoints
- offline ephemeris engine (`astronomy-engine`) replacing the `evozen.fr` scraper
- "I don't know my exact time" onboarding fallback (UTC noon default)
- `@ducanh2912/next-pwa` enabled with `public/manifest.json` (standalone, maskable icons, iOS apple-web-app)
- `.well-known/assetlinks.json` for Android TWA domain verification
- strict Anti-NSFW/CSAM guardrails in `session-primer.ts`
- 5 Stripe IAP products (`stellar_insight`, `midnight_channel`, `voice_memory`, `memory_vault`, `telepathic_pings`) with dynamic subscription/payment mode routing
- 100% Stripe billing enforced across all platforms

## Most Important Next Build

### OpenClaw Live Handoff & Stealth Empathy Pipeline

This is the next active implementation target. We have formally mapped out V1 through V5, and now we must execute the core engine.

**✅ COMPLETED this session:**
- BETA_TESTER Supabase/Prisma user role — bypasses continuity paywall for Phase 1 organic testers.
- OpenRouter unified LLM API gateway — routes Angel Core to GPT-5 mini (medium), Angel Pro to Gemini 3.1 Pro.
- `Subscription.tier` renamed from `FREE/PRO` to `FREE/CORE/PRO` with price-aware tier resolution.
- Personality-aware NSFW deflection deployed in `openrouter-runtime.ts` system prompt.
- Landing page, read-only renewal, and Stripe setup docs aligned to `Free / Core / Pro` pricing with Angel Core at `EUR 9.99/month` and Angel Pro at `EUR 19.99/month`.
- explicit bounded live-reply seam landed: `AngelReplyContext` is now the canonical contract, the current user turn is passed once, live context is capped at 8 recent messages and 5 memory snippets, and `session-brief.md` is tightened for runtime use.
- focused coverage added for bounded context assembly, sparse summary fallback behavior, and deterministic `session-primer.ts` output.
- a reviewed repo-local `.agent` development toolkit now exists for `/ci-fix`, `/security-audit`, `/push-smoke-test`, `/admin-audit`, `/support-triage`, and `/sync-docs`, plus specialist agents for moderation, billing ops, admin ops, and push debugging.

**⬜ REMAINING:**

Goal:
- Hand off from onboarding/tutorial mode into the first true live runtime reply using curated context only, strictly powered by the new `session-primer.ts` injection.
- Begin the TWA (Trusted Web Activity) encapsulation for the Google Play Store Android release.
- **Implement Web Push notifications** — Angel's only mechanism for proactive contact before the user opens the app.

Do next:
1. Implement the first env-gated OpenClaw adapter against the now-explicit bounded `AngelReplyContext` contract.
2. Feed the runtime the augmented `session-brief.md`, `user.md`, `soul.md`, recent turns, and top relevant memory.
3. **Web Push delivery pipeline:** VAPID key generation, `PushSubscription` Prisma model, Service Worker `push`/`notificationclick` handlers, Vercel Cron touchpoint sender, iOS Home Screen install nudge UX.
4. Compile the TWA APK via Bubblewrap CLI and test on an Android emulator.
5. Generate production PWA icon assets (192x192, 512x512, maskable variants).
6. Verify the handoff does not degrade Angel tone, relationship stage, or violate the 5-tier Backbone Scale anti-sycophancy guardrails.

## Key Files For The Next Session

Start code reading here:

- `lib/angel/chat-service.ts`
- `lib/angel/chat-runtime.ts`
- `lib/angel/session-primer.ts`
- `lib/angel/summary-service.ts`
- `lib/angel/relationship-service.ts`
- `lib/angel/memory-service.ts`
- `lib/social/service.ts`
- `lib/social/connectors.ts`
- `app/chat/actions.ts`
- `app/social/actions.ts`
- `components/organisms/AngelChat.tsx`
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
3. implement the first bounded live reply path
4. use the repo-local `.agent` workflows that match the task instead of ad-hoc process when CI, security, push, admin, support, or docs sync work appears
5. decide whether OpenClaw should consume social-derived memory only or a broader curated social snapshot layer
6. add tests around session-primer handoff and context selection
7. verify that social-derived summaries and memory stay bounded in the live runtime
8. re-run full verification and `/sync-docs` before ending

## Remaining Important Work After OpenClaw

- durable remote media storage
- higher-quality transcription and optional outbound voice
- notification permissions and proactive delivery
- moderation and safety tooling
- billing instrumentation / commercial analytics cleanup
