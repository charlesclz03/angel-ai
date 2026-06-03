# Angel AI Runtime Flows

Purpose:

- document the primary runtime flows through the app

Audience:

- coding agents
- maintainers

Status:

- active

Source of truth scope:

- runtime execution sequences

Last updated:

- 2026-03-24

Related docs:

- `docs/architecture/system-map.md`
- `docs/runbooks/openclaw-handoff.md`
- `docs/runbooks/stripe-checkout-webhooks.md`

## Flow 1. Guest To Completed Onboarding

1. guest hits `/onboarding`
2. pre-auth draft lives in the client flow
3. sign-in passes through NextAuth
4. onboarding actions persist step data into `OnboardingResponse`
5. completion transaction:
   - upserts `CompanionProfile`
   - upserts `SoulProfile`
   - creates the first active `Conversation` if needed
   - creates the first next-day `FOLLOWUP` touchpoint if needed
   - enqueues initial social scan jobs for any already connected platforms
   - refreshes session-primer artifacts
6. user is now eligible for `/chat`

Primary files:

- `app/onboarding/actions.ts`
- `lib/angel/onboarding-service.ts`
- `lib/angel/persistence.ts`
- `lib/angel/session-primer.ts`

## Flow 1B. Official Social Connect -> Background Scan

1. user starts a connection from onboarding or chat
2. `startSocialConnect` writes state cookies and a PKCE verifier when the platform needs it
3. provider callback exchanges the code for official tokens and upserts `ConnectedSocialAccount`
4. if onboarding is complete, the callback enqueues a `SocialScanJob`
5. the protected worker route claims queued jobs, marks the account `SCANNING`, and calls the platform adapter
6. normalized profile and recent-content snapshots are upserted idempotently
7. social-derived memory is rebuilt for that platform
8. summaries plus `relationship_seed.md` and `session-brief.md` are refreshed
9. the platform resolves to `READY`, `LIMITED`, or `FAILED` without blocking chat

Primary files:

- `app/social/actions.ts`
- `app/api/social/[platform]/callback/route.ts`
- `app/api/internal/social-scan/route.ts`
- `lib/social/service.ts`
- `lib/social/connectors.ts`
- `lib/social/memory.ts`

## Flow 2. Chat Load

1. `/chat` checks auth
2. `loadChatStateForUser` loads profiles, conversation, touchpoints, messages
3. best-effort billing reconciliation runs
4. best-effort social scan processing may run inline for one queued job in local development
5. best-effort summary, relationship-stage, and session-artifact refresh runs
6. seeded opener is created for an empty completed thread
7. due continuity or presence touchpoints may be delivered
8. chat access state resolves to `ACTIVE`, `READ_ONLY`, or `SUBSCRIBER`
9. memory entries, dossier, rituals, and social scan state are attached to the final `ChatState`

Primary files:

- `app/chat/page.tsx`
- `lib/angel/chat-service.ts`
- `lib/angel/chat-state.ts`
- `lib/angel/memory-service.ts`

## Flow 3. User Send -> Angel Reply

1. user submits via `AngelChat`
2. `app/chat/actions.ts` calls `sendChatMessage`
3. `sendChatMessageForUser` opens a transaction
4. service validates chat access and conversation
5. input is normalized:
   - `TEXT`
   - `LINK`
   - `IMAGE`
   - `VOICE_NOTE`
6. user message is persisted
7. attachments are persisted when present
8. bridge touchpoint may be scheduled from the message content
9. session artifacts are refreshed
10. recent messages + memory + summaries are assembled into reply context
11. runtime adapter generates Angel reply
12. Angel message is persisted
13. conversation timestamps are updated
14. memory extraction runs best-effort
15. summary and relationship refreshes run best-effort
16. rituals/presence scheduling is refreshed
17. if new social-derived memory or session artifacts exist, the next live-runtime handoff sees the refreshed summaries

Primary files:

- `components/organisms/AngelChat.tsx`
- `app/chat/actions.ts`
- `lib/angel/chat-service.ts`
- `lib/angel/chat-runtime.ts`
- `lib/angel/media.ts`

## Flow 4. Day-One Continuity Gate

1. the earliest due `FOLLOWUP` touchpoint is detected on chat load
2. a deterministic Angel continuity message is persisted once
3. the touchpoint is marked `SENT`
4. free users get exactly one reply after that continuity message
5. the reply and resulting Angel response close the free window
6. access mode becomes `READ_ONLY`
7. subscribers bypass this gate

Primary files:

- `lib/angel/chat-service.ts`
- `lib/angel/chat-state.ts`
- `lib/billing/stripe.ts`

## Flow 5. Memory Governance

1. runtime extraction proposes memory candidates
2. candidates are normalized and deduped
3. `MemoryEntry` rows are created
4. summary regeneration rebuilds `user.md` and `soul.md`
5. memory service exposes editable memory records to the UI
6. UI can pin, edit, hide, or delete memory
7. edits trigger summary and session-primer refresh

Primary files:

- `lib/angel/chat-runtime.ts`
- `lib/angel/chat-service.ts`
- `lib/angel/memory-service.ts`
- `lib/angel/summary-service.ts`
- `lib/angel/session-primer.ts`

## Flow 6. Social Disconnect Or Imported-Data Deletion

1. user disconnects a platform or deletes imported data from onboarding or chat
2. normalized snapshots for that platform are deleted
3. social-derived `MemoryEntry` rows for that platform are removed
4. summaries and session-primer artifacts are refreshed
5. disconnect also removes tokens, queue jobs, and the connection row itself

Primary files:

- `app/social/actions.ts`
- `lib/social/service.ts`

## Flow 7. Billing Sync

1. user opens checkout or billing portal from `/chat`
2. Stripe session is created
3. user returns to `/chat`
4. webhook events update `Subscription`
5. chat loads and sends also do best-effort reconciliation
6. gating logic uses subscription tier as source of truth

Primary files:

- `app/chat/actions.ts`
- `lib/billing/stripe.ts`
- `lib/billing/subscription-sync.ts`
- `app/api/stripe/webhook/route.ts`

## Flow 8. Future OpenClaw Handoff

Current state:

- not yet live

Prepared boundary:

1. summaries and relationship systems build durable state
2. social scans optionally enrich durable state through normalized snapshots and social-derived memory
3. session-primer code produces `relationship_seed.md` and `session-brief.md`
4. future live runtime should consume those bounded artifacts plus top relevant context

Primary files:

- `lib/angel/session-primer.ts`
- `lib/angel/chat-runtime.ts`
- `lib/angel/chat-service.ts`
