# Angel AI Verification Runbook

Purpose:

- define the canonical verification order and failure-handling notes

Audience:

- coding agents
- maintainers

Status:

- active

Source of truth scope:

- verification workflow

Last updated:

- 2026-03-28

Related docs:

- `docs/architecture/testing-map.md`
- `docs/reference/commands.md`

## Canonical Full Verification Order

Run these sequentially:

1. `npm run type-check`
2. `npm test`
3. `npm run lint`
4. `npm run build`

## Why This Order

- type-check fails fastest on contract drift
- unit/integration tests catch logic regressions before formatting/build
- lint enforces repo standards
- build validates the real App Router output and `.next` type generation

## Important Note About `.next/types`

Do not run `npm run type-check` and `npm run build` in parallel.

Reason:

- `tsconfig.json` includes `.next/types/**/*.ts`
- `next build` regenerates that directory
- parallel execution can make `tsc` fail on missing generated files

## Focused Verification

When changing a specific subsystem:

- chat service:
  - `npm test -- __tests__/lib/angel/chat-service.test.ts`
- onboarding service:
  - `npm test -- __tests__/lib/angel/onboarding-service.test.ts`
- media and voice:
  - `npm test -- __tests__/lib/angel/media.test.ts`
  - `npm test -- __tests__/lib/angel/voice-service.test.ts`
  - `npm test -- __tests__/lib/angel/photo-memory-service.test.ts`
  - `npm test -- __tests__/lib/angel/weather.test.ts`
  - `npm test -- __tests__/lib/angel/session-primer.test.ts`
- chat UI:
  - `npm test -- __tests__/components/organisms/AngelChat.test.tsx`
  - `npm test -- __tests__/components/organisms/PushNotificationPrompt.test.tsx`
- onboarding UI:
  - `npm test -- __tests__/components/organisms/AngelOnboardingFlow.test.tsx`
- admin and moderation:
  - `npm test -- __tests__/lib/admin/dashboard.test.ts`
  - `npm test -- __tests__/lib/admin/moderation.test.ts`
  - `npm test -- __tests__/app/admin/page.test.tsx`
  - `npm test -- __tests__/app/admin/moderation/page.test.tsx`
- push routes and touchpoints:
  - `npm test -- __tests__/app/api/push/subscribe/route.test.ts`
  - `npm test -- __tests__/app/api/cron/send-touchpoints/route.test.ts`
- TWA readiness:
  - `npm run twa:check`
  - `npm test -- __tests__/scripts/validate-twa.test.ts`

## Schema Change Verification

If `prisma/schema.prisma` changes:

1. `npx prisma generate`
2. run impacted tests
3. run the full verification order

## Docs-Only Changes

If a change is docs-only:

- code verification is optional
- state explicitly in the session handoff that no tests were run

## Definition Of Done

A substantial implementation slice is not done until:

- code compiles
- tests pass
- lint is clean
- build succeeds
- active status docs are updated
