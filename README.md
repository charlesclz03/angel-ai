# Angel AI

Angel AI is a PWA-first companion app designed to feel like a thoughtful friend on your phone. The live product direction is a continuity-driven chat experience that blends conversational support, proactive check-ins, lightweight reminders, and a subtle astral-inspired guidance layer without turning into novelty astrology.

## Documentation System

For execution-grade project navigation, start here:

- docs hub: `docs/README.md`
- immediate handoff: `docs/angel-ai-next-session-handoff-2026-03-24.md`
- technical map: `docs/architecture/system-map.md`
- local operator runbook: `docs/runbooks/local-development.md`
- social operator runbook: `docs/runbooks/social-connectors.md`

## Product Vision

Angel AI is meant to feel continuous, not session-based. Instead of only responding when a user opens the app, the companion should learn who they are, remember what matters to them, and show up with the right tone at the right moment.

Core concept directions:

- Chat-first friend companion with a warm, emotionally intelligent tone
- Deep onboarding that builds durable user context and memory
- Structured profile artifacts such as `user.md`, `soul.md`, `relationship_seed.md`, and `session-brief.md`
- Optional official social-context import through OAuth and approved platform APIs
- Optional, permission-based context from device-adjacent signals such as reminders, calendar context, or selected personal data
- Astral-inspired interpretation informed by birth date, time, and location, with a grounded and supportive UX

## Experience Pillars

- Presence: Angel AI should check in, follow up, and feel available through the day
- Memory: onboarding and conversation history should steadily improve personalization
- Guidance: responses should feel reflective, calming, and useful rather than generic
- Consent: every contextual signal must be explicit, permission-based, and easy to disable
- Progression: the product should create enough emotional and practical value that users want continuity, not just one-off chats

## Monetization Direction

Current product thinking:

- Free tier: account creation, full onboarding or profile setup, the first thread, and the first continuity return
- Angel Core (`EUR 9.99/month`): ongoing conversations, richer memory carryover, rituals, and the standard paid companion experience
- Angel Pro (`EUR 19.99/month`): everything in Core plus the deepest live reasoning path via the premium runtime tier
- Optional one-time unlocks: products such as Stellar Insight, Voice Memory, and Memory Vault stay separate from the recurring subscription tiers
- Retention experiments: check-ins, reminders, contextual nudges, and stronger continuity after the first onboarding session

## Tech Foundation

- Next.js 15 with the App Router
- TypeScript and Tailwind CSS
- Prisma with Supabase as the planned database layer
- NextAuth for authentication
- Stripe for subscriptions and tier gating
- `@ducanh2912/next-pwa` for installable PWA support

## Architecture Focus

Near-term architecture questions this repository is expected to answer:

- How far the product can go as a pure PWA on Android before a native bridge is required
- How to model long-term companion memory separately from auth and billing data
- How to represent onboarding-derived identity, preferences, tone, and boundaries safely
- How to support both reactive chat and proactive message delivery
- How to keep the astral layer modular so it can evolve independently from the core companion experience

## Current Roadmap

The active roadmap is tracked in `docs/angel-ai-next-phases.md` and `docs/angel-ai-next-steps.md`.

Current snapshot:

- Phases 1-4 are complete: authenticated onboarding, persistent chat, memory extraction, and the day-one continuity paywall are live
- Phase 5 is complete: rich media inputs, higher-quality provider-backed transcription, and bounded Angel voice previews are shipped
- Phase 6 is foundation-complete: social connectors, editable memory, rituals, admin operations, Moderation V3, AI photo memories, and live weather-aware session context are in place
- Phase 7 is the active execution target: the first true OpenClaw-backed live reply path using the bounded `session-brief.md` handoff
- Phases 8-10 cover presence hardening, launch safety, and the later bounded `Angel Atmosphere` bridge

Historical V1-V5 draft specs are preserved under `docs/archive/specs/` and should not override the active phase docs.

## Local Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template and fill in placeholders:

   ```bash
   cp .env.example .env.local
   ```

3. Add your placeholder or real credentials for:
   - Supabase
   - NextAuth
   - Stripe
   - OpenRouter and OpenClaw if you want the real provider-backed reply path
   - OpenAI if you want higher-quality voice-note transcription and bounded Angel voice previews
   - OpenWeatherMap if you want live weather in the session brief
   - Any future notification or provider integrations

   Auth readiness note:
   - keep `NEXTAUTH_URL` aligned with the exact local origin you run
   - add `http://localhost:3000/api/auth/callback/google` to your Google OAuth client before running real sign-in smoke tests

   Billing readiness note:
   - the continuity paywall now offers explicit Angel Core and Angel Pro renewal paths
   - add `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID_MONTHLY_CORE`, `STRIPE_PRICE_ID_MONTHLY_PRO`, and `STRIPE_WEBHOOK_SECRET` before testing checkout and webhook sync locally
   - successful checkout returns now land back in `/chat`, and entitlement syncing expects the webhook route to be reachable

   Social-context readiness note:
   - add `SOCIAL_TOKEN_ENCRYPTION_KEY` before connecting real social accounts, or the app will fall back to `NEXTAUTH_SECRET`
   - add `META_APP_ID`, `META_APP_SECRET`, `X_CLIENT_ID`, `X_CLIENT_SECRET`, `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `TIKTOK_CLIENT_KEY`, and `TIKTOK_CLIENT_SECRET` for the platforms you want to test
   - register callback URLs for `/api/social/facebook/callback`, `/api/social/instagram/callback`, `/api/social/x/callback`, `/api/social/linkedin/callback`, and `/api/social/tiktok/callback`
   - add `SOCIAL_SCAN_WORKER_SECRET` if you want the protected background worker route to process scans asynchronously; without it, local chat loads can inline-process one queued scan
   - the implementation is official OAuth/API only and will surface unsupported Meta or LinkedIn cases as limited instead of scraping them

   Voice-note readiness note:
   - add `OPENAI_API_KEY` to enable higher-quality voice-note transcription, bounded Angel voice previews, and AI photo memories
   - without it, Angel falls back to a deterministic local transcript placeholder and hides the AI voice-preview action

   Runtime readiness note:
   - add `OPENROUTER_API_KEY` to enable the real provider-backed fallback runtime
   - optionally set `OPENCLAW_GATEWAY_URL` if the default local gateway target is not correct
   - the live runtime stays on curated artifacts and ranked memory only; raw social snapshots stay out of the payload

   Environmental context note:
   - add `OPENWEATHERMAP_API_KEY` to include live current weather in the bounded `session-brief.md`
   - without it, the session brief still carries local time and city awareness only

4. Generate the Prisma client and push the schema when your database is ready:

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Start the app:

   ```bash
   npm run dev
   ```

Operator note:

- for future coding sessions, use `AGENTS.md` first and then the docs hub in `docs/README.md`

## Project Structure

```text
.agent/        Agent workflows, skills, and repo-specific instructions
app/           Next.js App Router routes, layouts, and server actions
components/    UI components following the project design system
docs/          Product context, transcripts, and delivery documentation
lib/           Shared business logic and platform integrations
prisma/        Database schema and future migrations
```

## Near-Term Build Priorities

1. Run the first real OpenClaw/OpenRouter smoke against the bounded `session-brief.md` handoff
2. Complete production provider verification for TikTok, X, LinkedIn, Facebook, and Instagram
3. Compile and validate the Android TWA package, then prepare the Play submission checklist
4. Harden launch operations around moderation policy, billing visibility, and proactive delivery safety
5. Keep later presence and Atmosphere work bounded behind consent, quiet hours, and explicit trust rules

## Status

Angel AI is well past the concept-only stage. The repo has a real authenticated onboarding flow, a persistent `/chat` thread, non-streaming Angel replies, summary regeneration, rich media inputs, higher-quality provider-backed transcription when configured, bounded Angel voice previews, webhook-backed billing sync, curated session-primer artifacts, official social connectors with background scan ingestion, relationship stages, rituals, an `/updates` release surface, an `ADMIN` dashboard, Moderation V3, and live weather-aware session context. The next major step is attaching real credentials and verifying the first true OpenClaw-backed live reply path end to end.
