# Angel AI Chat Turn Debugging

Purpose:

- make the end-to-end chat path easy to trace during debugging and feature work

Audience:

- coding agents
- maintainers

Status:

- active

Source of truth scope:

- chat-turn debugging workflow

Last updated:

- 2026-03-24

Related docs:

- `docs/architecture/runtime-flows.md`
- `docs/architecture/system-map.md`
- `docs/runbooks/media-and-voice.md`

## End-To-End Path

1. UI send starts in `components/organisms/AngelChat.tsx`
2. server action boundary is `app/chat/actions.ts`
3. core send orchestration lives in `lib/angel/chat-service.ts`
4. reply generation and memory extraction live in `lib/angel/chat-runtime.ts`
5. media normalization lives in `lib/angel/media.ts`
6. summary and relationship refreshes live in:
   - `lib/angel/summary-service.ts`
   - `lib/angel/relationship-service.ts`
   - `lib/angel/session-primer.ts`

## If The UI Looks Wrong

Open:

- `components/organisms/AngelChat.tsx`
- `lib/angel/chat-state.ts`

Check:

- `ChatState` shape
- access mode
- returned messages and attachments
- memory and ritual payloads

## If A Send Does Not Persist Correctly

Open:

- `app/chat/actions.ts`
- `lib/angel/chat-service.ts`
- `lib/angel/persistence.ts`

Check:

- conversation id validation
- access-state gating
- message creation
- attachment create-many path
- timestamp updates

## If The Reply Feels Wrong

Open:

- `lib/angel/chat-runtime.ts`
- `lib/angel/chat-service.ts`
- `lib/angel/session-primer.ts`

Check:

- reply context assembly
- recent message window
- summary markdown inputs
- relationship stage and guardrail notes
- attachment summary handling

## If Memory Does Not Refresh

Open:

- `lib/angel/chat-runtime.ts`
- `lib/angel/chat-service.ts`
- `lib/angel/memory-service.ts`
- `lib/angel/summary-service.ts`

Check:

- extracted candidates
- normalization and dedupe
- hidden vs visible memory
- summary refresh path
- relationship dossier payload

## If The Thread Is Gated Unexpectedly

Open:

- `lib/angel/chat-service.ts`
- `lib/billing/stripe.ts`
- `app/api/stripe/webhook/route.ts`

Check:

- latest sent `FOLLOWUP`
- number of post-followup user messages
- `Subscription.tier`
- checkout return state vs webhook truth

## Fastest Tests To Run

- `npm test -- __tests__/lib/angel/chat-service.test.ts`
- `npm test -- __tests__/components/organisms/AngelChat.test.tsx`
- `npm test -- __tests__/app/chat/page.test.tsx`
