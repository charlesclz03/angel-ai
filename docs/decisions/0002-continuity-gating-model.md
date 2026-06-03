# ADR 0002: Continuity Gating Model

Status:

- accepted

Date:

- 2026-03-24

## Context

The product is monetized around continuity, not minutes.
The day-one follow-up needs to feel relational while still creating a clear renewal moment.

## Decision

Use this gating model:

- due `FOLLOWUP` message is free to read
- free users get exactly one reply after that message
- the responding Angel turn closes the free continuation window
- the thread becomes `READ_ONLY`
- subscribers bypass this gate

## Consequences

- monetization stays attached to relationship continuation
- gating logic is simple enough to test and reason about
- billing sync must stay reliable because entitlements affect `/chat`
