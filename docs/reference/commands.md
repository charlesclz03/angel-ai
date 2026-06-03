# Angel AI Command Reference

Purpose:

- keep the working command set easy to scan

Audience:

- coding agents
- maintainers

Status:

- reference

Source of truth scope:

- day-to-day command list

Last updated:

- 2026-03-28

Related docs:

- `package.json`
- `docs/runbooks/local-development.md`
- `docs/runbooks/verification.md`

## Core Commands

| Command | Use |
| --- | --- |
| `npm install` | install dependencies |
| `npm run dev` | run local app |
| `npm run build` | production build validation |
| `npm run start` | run built app |
| `npm run lint` | lint the repo |
| `npm run type-check` | TypeScript verification |
| `npm test` | run Vitest suite |
| `npm run test:watch` | watch-mode unit tests |
| `npm run test:e2e` | Playwright suite |
| `npm run twa:check` | validate local TWA installability prerequisites before Bubblewrap |
| `npx prisma format` | format `prisma/schema.prisma` before generate or schema review |
| `npx prisma generate` | regenerate Prisma client |
| `npx prisma db push` | push schema to database |

## Recommended Full Verification

1. `npm run type-check`
2. `npm test`
3. `npm run lint`
4. `npm run build`

## Fast Focused Test Commands

- `npm test -- __tests__/lib/angel/chat-service.test.ts`
- `npm test -- __tests__/lib/angel/onboarding-service.test.ts`
- `npm test -- __tests__/lib/angel/media.test.ts`
- `npm test -- __tests__/lib/angel/voice-service.test.ts`
- `npm test -- __tests__/lib/angel/photo-memory-service.test.ts`
- `npm test -- __tests__/lib/angel/weather.test.ts`
- `npm test -- __tests__/lib/angel/session-primer.test.ts`
- `npm test -- __tests__/components/organisms/AngelChat.test.tsx`
- `npm test -- __tests__/components/organisms/PushNotificationPrompt.test.tsx`
- `npm test -- __tests__/components/organisms/AngelOnboardingFlow.test.tsx`
- `npm test -- __tests__/lib/admin/moderation.test.ts`
- `npm test -- __tests__/lib/admin/dashboard.test.ts`
- `npm test -- __tests__/app/admin/page.test.tsx`
- `npm test -- __tests__/app/admin/moderation/page.test.tsx`
- `npm test -- __tests__/app/api/push/subscribe/route.test.ts __tests__/app/api/cron/send-touchpoints/route.test.ts`

## Repo-Local Agent Workflows

| Command | Use |
| --- | --- |
| `/load-context` | rebuild the current Angel AI docs and execution context |
| `/ci-fix` | diagnose and repair CI or GitHub Actions failures |
| `/security-audit` | review sensitive app surfaces before shipping |
| `/push-smoke-test` | audit push, service worker, and installability behavior |
| `/admin-audit` | inspect operator/admin, dossier, and moderation surfaces |
| `/support-triage` | convert support issues into scoped engineering work |
| `/sync-docs` | update handoff, backlog, progress, and patch notes after a meaningful slice |

## Repo-Local Agent Files

- `.agent/ARCHITECTURE.md`
- `.agent/skills/`
- `.agent/workflows/`
- `.agent/agents/`
