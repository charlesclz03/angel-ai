# Angel AI Testing Map

Purpose:

- map test coverage to subsystems and make verification faster

Audience:

- coding agents
- maintainers

Status:

- active

Source of truth scope:

- test ownership and verification guidance

Last updated:

- 2026-03-24

Related docs:

- `docs/runbooks/verification.md`
- `docs/architecture/system-map.md`
- `package.json`

## Verification Commands

- `npm run type-check`
- `npm test`
- `npm run lint`
- `npm run build`
- `npm run test:e2e`

## Test Coverage By Area

| Area | Coverage files |
| --- | --- |
| chat route behavior | `__tests__/app/chat/page.test.tsx` |
| chat UI | `__tests__/components/organisms/AngelChat.test.tsx` |
| onboarding UI | `__tests__/components/organisms/AngelOnboardingFlow.test.tsx` |
| chat services | `__tests__/lib/angel/chat-service.test.ts` |
| onboarding services | `__tests__/lib/angel/onboarding-service.test.ts` |
| social services | `__tests__/lib/social/service.test.ts` |
| social crypto | `__tests__/lib/social/crypto.test.ts` |
| chat state helpers | `__tests__/lib/angel/chat-state.test.ts` |
| summary regeneration | `__tests__/lib/angel/summary-service.test.ts` |
| memory helpers | `__tests__/lib/angel/memory.test.ts` |
| onboarding-state helpers | `__tests__/lib/angel/onboarding-state.test.ts` |

## Fast Focused Loops

Use these when changing one subsystem:

- chat service:
  - `npm test -- __tests__/lib/angel/chat-service.test.ts`
- onboarding service:
  - `npm test -- __tests__/lib/angel/onboarding-service.test.ts`
- chat UI:
  - `npm test -- __tests__/components/organisms/AngelChat.test.tsx`
- onboarding UI:
  - `npm test -- __tests__/components/organisms/AngelOnboardingFlow.test.tsx`
- social service:
  - `npm test -- __tests__/lib/social/service.test.ts`
- social crypto:
  - `npm test -- __tests__/lib/social/crypto.test.ts`

## Practical Guidance

- if you touch `prisma/schema.prisma`, run `npx prisma generate` before type-checking
- if you touch chat routing, actions, or service logic, run the full verification chain
- if you touch `.next`-dependent type outputs, avoid running `type-check` in parallel with `build`
- if you change docs only, tests are optional but note that explicitly in the handoff

## Current Gaps

Still worth expanding later:

- Playwright coverage for full onboarding -> chat happy path
- local Stripe webhook smoke guidance
- richer media upload edge-case E2E coverage
- social OAuth callback and worker-route smoke coverage with real provider sandboxes
- future OpenClaw handoff tests once the live runtime is connected
