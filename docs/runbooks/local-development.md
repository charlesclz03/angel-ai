# Angel AI Local Development

Purpose:

- provide the fastest reliable way to boot and work on the app locally

Audience:

- coding agents
- maintainers

Status:

- active

Source of truth scope:

- local setup and execution workflow

Last updated:

- 2026-03-25

Related docs:

- `docs/runbooks/verification.md`
- `docs/reference/env-vars.md`
- `docs/reference/commands.md`
- `docs/runbooks/social-connectors.md`
- `docs/runbooks/media-and-voice.md`
- `docs/runbooks/openclaw-handoff.md`
- `docs/runbooks/provider-verification-matrix.md`

## Bootstrap

1. install dependencies:
   - `npm install`
2. create local env:
   - copy `.env.example` to `.env.local`
3. generate Prisma client:
   - `npx prisma generate`
4. push schema if the database is ready:
   - `npx prisma db push`
5. start the app:
   - `npm run dev`

## Read Order Before Coding

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/angel-ai-progress-log.md`
4. `docs/angel-ai-next-session-handoff-2026-03-24.md`
5. `docs/architecture/system-map.md`
6. the relevant subsystem runbook

## Core Working Areas

- landing: `app/page.tsx`
- onboarding: `app/onboarding/page.tsx`, `app/onboarding/actions.ts`, `lib/angel/onboarding-service.ts`
- chat: `app/chat/page.tsx`, `app/chat/actions.ts`, `lib/angel/chat-service.ts`
- runtime: `lib/angel/chat-runtime.ts`, `lib/angel/session-primer.ts`, `lib/angel/voice-service.ts`, `lib/angel/weather.ts`
- social context: `app/social/actions.ts`, `lib/social/service.ts`, `app/api/internal/social-scan/route.ts`
- billing: `lib/billing/stripe.ts`, `app/api/stripe/webhook/route.ts`
- admin/moderation: `app/admin/page.tsx`, `app/admin/moderation/page.tsx`, `lib/admin/dashboard.ts`, `lib/admin/moderation.ts`
- schema: `prisma/schema.prisma`

## Typical Development Loop

1. identify subsystem owner files
2. make code change
3. run targeted tests for that subsystem
4. run full verification before closing the slice
5. update handoff, progress, next steps, and patch notes if the change is substantial

## Common Gotchas

- if `prisma/schema.prisma` changes, run `npx prisma generate`
- if build and type-check both touch `.next/types`, do not run them in parallel
- voice-note transcription uses a fallback if `OPENAI_API_KEY` is missing, and bounded Angel voice previews stay hidden
- live weather in `session-brief.md` only appears when `OPENWEATHERMAP_API_KEY` is configured; otherwise the runtime keeps local time and city context only
- the live runtime should stay on curated summaries, ranked memory, and `session-brief.md`; raw social snapshots are intentionally excluded
- chat media uploads prefer the durable proxy path when storage is configured and fall back locally when it is not
- social token encryption uses `SOCIAL_TOKEN_ENCRYPTION_KEY` when present and falls back to `NEXTAUTH_SECRET` locally if needed
- the protected social worker route only runs when both `SOCIAL_SCAN_WORKER_SECRET` and a public site URL are configured
- without the social worker secret, local chat loads can inline-process one queued social scan for the current user
- unsupported official Meta or LinkedIn cases should surface as `LIMITED`; do not work around them with scraping
- billing unlock behavior depends on webhook-backed subscription sync, not only the checkout return URL

## Recommended Terminal Sequence

For a serious implementation pass:

1. `npm run type-check`
2. targeted `npm test -- <file>`
3. `npm test`
4. `npm run lint`
5. `npm run build`
