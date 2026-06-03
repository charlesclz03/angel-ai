# Angel AI System Map

Purpose:

- map the runtime surface, code ownership, and integration boundaries of the app

Audience:

- coding agents
- maintainers

Status:

- active

Source of truth scope:

- technical execution map

Last updated:

- 2026-03-24

Related docs:

- `docs/README.md`
- `docs/architecture/runtime-flows.md`
- `docs/architecture/data-model.md`
- `docs/runbooks/local-development.md`

## Route Map

| Surface | Purpose | Primary files |
| --- | --- | --- |
| `/` | marketing / story-led landing page | `app/page.tsx`, `app/layout.tsx`, `app/globals.css` |
| `/onboarding` | tutorial phase, profile and memory seeding | `app/onboarding/page.tsx`, `app/onboarding/actions.ts`, `components/organisms/AngelOnboardingFlow.tsx` |
| `/chat` | persistent relationship thread | `app/chat/page.tsx`, `app/chat/actions.ts`, `components/organisms/AngelChat.tsx` |
| `/api/auth/[...nextauth]` | NextAuth route handler | `app/api/auth/[...nextauth]/route.ts`, `lib/auth.ts` |
| `/api/social/[platform]/callback` | official social OAuth callback ingestion | `app/api/social/[platform]/callback/route.ts`, `app/social/actions.ts`, `lib/social/service.ts` |
| `/api/internal/social-scan` | protected DB-backed background scan worker | `app/api/internal/social-scan/route.ts`, `lib/social/service.ts` |
| `/api/stripe/webhook` | Stripe event ingestion and subscription sync | `app/api/stripe/webhook/route.ts`, `lib/billing/stripe.ts`, `lib/billing/subscription-sync.ts` |

## Core Service Map

| Domain | Responsibility | Primary files |
| --- | --- | --- |
| Auth | session lookup, route protection, NextAuth options | `lib/auth.ts` |
| Onboarding | step persistence, completion transaction, resume state | `lib/angel/onboarding-service.ts`, `lib/angel/onboarding-state.ts`, `lib/angel/onboarding.ts` |
| Chat state | response shaping, continuity text, seeded opener | `lib/angel/chat-state.ts` |
| Chat execution | thread loading, send flow, continuity gating, presence delivery | `lib/angel/chat-service.ts` |
| Runtime adapter | fallback reply generation and memory extraction | `lib/angel/chat-runtime.ts` |
| Media | link previews, voice-note transcription, attachment summaries | `lib/angel/media.ts` |
| Social connectors | official OAuth start/callback, token encryption, background scans, normalized snapshots, social-derived memory | `lib/social/service.ts`, `lib/social/connectors.ts`, `lib/social/crypto.ts`, `lib/social/memory.ts`, `app/social/actions.ts` |
| Memory | memory loading, edit/hide/pin/delete behavior, dossier | `lib/angel/memory-service.ts`, `lib/angel/memory.ts` |
| Summaries | regenerate `user.md` and `soul.md` from structured state | `lib/angel/summary-service.ts` |
| Relationship systems | stage logic, rituals, bridge prompts, guardrails | `lib/angel/relationship-service.ts` |
| Session primer | `relationship_seed.md` and `session-brief.md` generation | `lib/angel/session-primer.ts` |
| Billing | checkout, portal, reconciliation, webhook handling | `lib/billing/stripe.ts`, `lib/billing/subscription-sync.ts`, `lib/billing/types.ts` |
| Persistence helpers | canonical create payload builders | `lib/angel/persistence.ts` |

## UI Ownership Map

| UI area | Files |
| --- | --- |
| Shared app shell | `app/layout.tsx`, `app/globals.css` |
| Landing page | `app/page.tsx` |
| Onboarding UI | `components/organisms/AngelOnboardingFlow.tsx` |
| Chat UI | `components/organisms/AngelChat.tsx` |
| Shared button + cards | `components/atoms/Button.tsx`, `components/ui/Card.tsx` |

## Data Ownership Map

Treat `prisma/schema.prisma` as the data-model source of truth.

| Model | Owned by |
| --- | --- |
| `CompanionProfile` | onboarding, summaries, relationship systems |
| `SoulProfile` | onboarding, summaries, relationship systems |
| `Conversation` | onboarding completion, chat service |
| `Message` | chat service |
| `MessageAttachment` | chat service, media helpers |
| `MemoryEntry` | runtime extraction, memory service, summary regeneration |
| `ConnectedSocialAccount` | social service, connector lifecycle |
| `SocialScanJob` | background scan worker |
| `SocialProfileSnapshot` | normalized social profile persistence |
| `SocialContentSnapshot` | normalized social recent-content persistence |
| `Touchpoint` | onboarding completion, continuity, rituals, bridge prompts |
| `Subscription` | billing sync and gating |
| `OnboardingResponse` | onboarding state and session-primer artifacts |

## External Integration Map

| Integration | Current role | Boundary files |
| --- | --- | --- |
| Google OAuth | sign-in during onboarding and chat access | `lib/auth.ts`, `app/api/auth/[...nextauth]/route.ts` |
| Meta Graph / Facebook Login | official Facebook and Instagram profile/content import | `lib/social/connectors.ts`, `app/api/social/[platform]/callback/route.ts` |
| X OAuth + APIs | official X profile and recent-post import | `lib/social/connectors.ts`, `app/api/social/[platform]/callback/route.ts` |
| LinkedIn OAuth | official LinkedIn profile import with capability-based post limits | `lib/social/connectors.ts`, `app/api/social/[platform]/callback/route.ts` |
| TikTok Login Kit + APIs | official TikTok profile and recent-video import | `lib/social/connectors.ts`, `app/api/social/[platform]/callback/route.ts` |
| Stripe | continuity unlock, billing portal, webhook sync | `app/chat/actions.ts`, `lib/billing/stripe.ts`, `app/api/stripe/webhook/route.ts` |
| OpenAI Audio API | optional real transcription for voice notes | `lib/angel/media.ts` |
| OpenClaw | not live yet; next runtime target | `lib/angel/session-primer.ts`, future adapter layer |

## Current Architectural Seam

The next major seam is the OpenClaw handoff.

The app should not push raw markdown bulk directly into the first live turn.
The intended contract is:

1. onboarding and summaries generate durable structured memory
2. social scans enrich structured memory and regenerate summaries/session artifacts
3. session-primer code builds curated artifacts
4. the first live runtime consumes bounded context from those artifacts

## Safe Starting Points By Task

| Task | Open first |
| --- | --- |
| onboarding changes | `app/onboarding/page.tsx`, `app/onboarding/actions.ts`, `lib/angel/onboarding-service.ts` |
| chat behavior | `components/organisms/AngelChat.tsx`, `app/chat/actions.ts`, `lib/angel/chat-service.ts` |
| social connectors | `app/social/actions.ts`, `lib/social/service.ts`, `lib/social/connectors.ts`, `app/api/internal/social-scan/route.ts` |
| memory behavior | `lib/angel/memory-service.ts`, `lib/angel/summary-service.ts`, `lib/angel/relationship-service.ts` |
| billing behavior | `app/chat/actions.ts`, `lib/billing/stripe.ts`, `app/api/stripe/webhook/route.ts` |
| runtime behavior | `lib/angel/chat-runtime.ts`, `lib/angel/session-primer.ts` |
| schema changes | `prisma/schema.prisma`, then affected services/tests |
