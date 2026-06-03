# ADR 0001: Session Primer Over Raw Markdown Bulk

Status:

- accepted

Date:

- 2026-03-24

## Context

Angel needs a future live runtime handoff after onboarding and during ongoing chat.
Raw markdown stuffing would bloat context, destabilize tone, and make the first live reply harder to control.

## Decision

Use curated artifacts:

- `relationship_seed.md`
- `session-brief.md`
- current summaries
- top relevant memory
- recent turns

Do not load every markdown file into the live turn.

## Consequences

- faster, cleaner runtime handoff
- better control over tone and safety
- easier future retrieval tuning
- requires explicit session-primer maintenance
