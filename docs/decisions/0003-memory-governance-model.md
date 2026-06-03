# ADR 0003: Memory Governance Model

Status:

- accepted

Date:

- 2026-03-24

## Context

Angel needs durable memory without turning markdown into the real database.
The user also needs visibility and control over what is remembered.

## Decision

- structured records remain the source of truth
- `MemoryEntry` is the durable memory layer
- `summaryMarkdown` is derived
- summaries regenerate from profiles plus ranked memory
- users can pin, edit, hide, and delete memory

## Consequences

- memory is explainable and governable
- summaries remain compact derived artifacts
- prompt quality improves without losing data control
