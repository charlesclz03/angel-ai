# Angel AI OpenClaw Handoff Runbook

Purpose:

- define the prepared handoff boundary and the next live-runtime implementation target

Audience:

- coding agents
- maintainers

Status:

- active

Source of truth scope:

- OpenClaw handoff rules

Last updated:

- 2026-03-25

Related docs:

- `lib/angel/session-primer.ts`
- `lib/angel/chat-runtime.ts`
- `docs/decisions/0001-session-primer-over-raw-markdown.md`
- `docs/angel-ai-next-session-handoff-2026-03-24.md`

## Current State

The live runtime seam is now wired in code, but it still needs real gateway and provider verification.

What already exists:

- curated `relationship_seed.md`
- curated `session-brief.md`
- summary regeneration
- relationship stages and guardrails
- memory ranking and selection helpers
- bounded OpenClaw gateway payload shaping in `lib/angel/openclaw-client.ts`
- real OpenRouter fetch-based fallback in `lib/angel/openrouter-runtime.ts`
- focused adapter tests for gateway payloads, provider calls, and graceful fallback behavior

## Current Rule

Do not load the first live OpenClaw turn with raw markdown bulk from the repo or from every stored artifact.

Use bounded context only.

Raw `SocialProfileSnapshot` and `SocialContentSnapshot` rows must stay out of the live reply payload.
The runtime contract should keep consuming curated summaries, ranked memory, `relationship_seed.md`, and `session-brief.md` only.

## Intended Context Pack

The first live runtime should receive:

- `relationship_seed.md`
- `session-brief.md`
- current `user.md`
- current `soul.md`
- recent relevant turns
- top relevant durable memory snippets
- attachment summaries when media is present
- environmental context from the session brief, including live weather when configured
- current relationship-stage and safety guidance

## Files To Extend

- `lib/angel/session-primer.ts`
- `lib/angel/chat-runtime.ts`
- `lib/angel/chat-service.ts`
- `lib/angel/openclaw-client.ts`
- `lib/angel/openrouter-runtime.ts`

## Files Not To Abuse

- archival docs in `docs/archive/`
- raw transcript-style context docs
- every markdown file in the repository as a single runtime prompt blob

## Remaining Live Verification Target

The next build should:

1. attach real `OPENROUTER_API_KEY` and, if needed, `OPENCLAW_GATEWAY_URL`
2. smoke-test the bounded gateway payload and OpenRouter fallback against live services
3. preserve Angel tone, continuity, and relationship pacing under real responses
4. keep the first pass bounded and avoid tool sprawl or streaming complexity
