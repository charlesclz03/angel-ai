---
name: changelog-generator
description: Sync Angel AI patch notes, progress logs, handoff notes, and backlog docs after substantial work. Use when a slice lands and operational markdown must reflect the code truth.
---

# Changelog Generator

Use this skill after implementation and verification to keep Angel's active docs aligned.

## Always Check

1. `docs/angel-ai-next-session-handoff-2026-03-24.md`
2. `docs/angel-ai-progress-log.md`
3. `docs/angel-ai-next-steps.md`
4. `docs/reference/PATCH_NOTES_MASTER.md`

## Workflow

1. Summarize the actual behavior change.
2. Confirm what verification really ran.
3. Update the handoff with the new truth and next action.
4. Append the shipped slice to the progress log.
5. Mark backlog changes in next steps.
6. Add a concise patch-notes entry.

## Guardrails

- never claim tests you did not run
- keep version labels and dates concrete
- keep archive docs historical, not operational

