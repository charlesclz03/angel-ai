# ADR 0004: Relationship Stage Guardrails

Status:

- accepted

Date:

- 2026-03-24

## Context

Angel is friend-first and may deepen slowly over time.
Without explicit pacing rules, a companion product can drift into unsafe or manipulative emotional behavior.

## Decision

Use explicit relationship stages:

- `NEW_CONNECTION`
- `WARM_FRIEND`
- `TRUSTED_COMPANION`
- `TENDER_AMBIGUITY`
- `SOFT_ROMANCE`

Stage progression must depend on repeated evidence, not one-off signals.
Early stages stay clearly friend-first.

## Consequences

- pacing becomes testable and explainable
- continuity and runtime prompts can incorporate guardrails directly
- future live runtime work has a safer behavioral contract
